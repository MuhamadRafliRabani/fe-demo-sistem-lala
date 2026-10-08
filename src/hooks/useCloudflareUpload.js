import { useState, useRef, useCallback } from "react";
import axiosInstance from "@/lib/axios";

const initialState = {
  status: "idle", // idle | uploading | done | error
  progress: 0,
  error: null,
  key: null,
};

export default function useCloudflareUpload() {
  const [state, setState] = useState(initialState);
  const abortRef = useRef({ xhr: null, aborted: false });

  const reset = useCallback(() => setState(initialState), []);

  const putToR2 = (url, body) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      abortRef.current.xhr = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setState((s) => ({
            ...s,
            progress: Math.round((e.loaded / e.total) * 100),
          }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(
            new Error(`Gagal upload ke Cloudflare. Status: ${xhr.status}`),
          );
        }
      });

      xhr.addEventListener("error", () =>
        reject(new Error("Koneksi terputus saat mengunggah file")),
      );

      xhr.addEventListener("abort", () =>
        reject(new DOMException("Upload dibatalkan pengguna", "AbortError")),
      );

      xhr.open("PUT", url);
      if (body.type) xhr.setRequestHeader("Content-Type", body.type);
      xhr.send(body);
    });

  const uploadFile = useCallback(async (file) => {
    try {
      abortRef.current.aborted = false;
      setState({ status: "uploading", progress: 0, error: null, key: null });

      // 1) Request presigned URL from backend
      const presignRes = await axiosInstance.post(
        "/work-todos/attachments/presign",
        {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size: file.size,
        },
      );

      const uploadUrl = presignRes.data?.data?.url;
      const fileKey = presignRes.data?.data?.key;

      if (!uploadUrl || !fileKey) {
        throw new Error("Gagal mendapatkan konfigurasi upload dari server");
      }

      // 2) Upload directly to Cloudflare R2
      await putToR2(uploadUrl, file);

      // 3) Confirm upload to backend
      const confirmRes = await axiosInstance.post(
        "/work-todos/attachments/confirm",
        {
          key: fileKey,
          filename: file.name,
          size: file.size,
          mime_type: file.type || "application/octet-stream",
          cloudflare_url: presignRes.data?.data?.cloudflare_url,
        },
      );

      setState({ status: "done", progress: 100, key: fileKey, error: null });

      return {
        key: fileKey,
        filename: file.name,
        size: file.size,
        mime_type: file.type || "application/octet-stream",
        cloudflare_url:
          confirmRes.data?.data?.cloudflare_url ||
          presignRes.data?.data?.cloudflare_url,
      };
    } catch (err) {
      if (err.name === "AbortError") {
        setState({
          status: "idle",
          progress: 0,
          error: "Dibatalkan",
          key: null,
        });
      } else {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Kesalahan tidak diketahui";
        setState({
          status: "error",
          progress: 0,
          error: message,
          key: null,
        });
      }
      throw err;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current.xhr) {
      abortRef.current.xhr.abort();
      abortRef.current.aborted = true;
    }
  }, []);

  return {
    upload: uploadFile,
    abort,
    reset,
    ...state,
  };
}
