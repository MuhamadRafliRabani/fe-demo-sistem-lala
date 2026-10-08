import { useState, useRef, useCallback } from "react";
import axiosInstance from "@/lib/axios";

const initialState = {
  status: "idle", // idle | uploading | done | error
  progress: 0,
  error: null,
  key: null,
};

export default function useSurveyAttachmentUpload() {
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

      // Event load: terpanggil saat request selesai
      xhr.addEventListener("load", () => {
        // Pastikan status HTTP sukses (200-299)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Gagal upload ke cloud. Status: ${xhr.status}`));
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

  const upload = useCallback(async (scheduleId, file) => {
    try {
      abortRef.current.aborted = false;
      setState({ status: "uploading", progress: 0, error: null, key: null });

      // 1) request presign
      const presignRes = await axiosInstance.post(
        `/schedules/${scheduleId}/attachments/presign`,
        {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size: file.size,
        },
      );

      // Menyesuaikan dengan response ApiResponse backend Laravel Anda
      const uploadUrl = presignRes.data?.data?.url;
      const fileKey = presignRes.data?.data?.key;

      if (!uploadUrl || !fileKey) {
        throw new Error("Gagal mendapatkan konfigurasi upload dari server");
      }

      // 2) upload directly to R2
      await putToR2(uploadUrl, file);

      // 3) confirm to backend
      await axiosInstance.post(`/schedules/${scheduleId}/attachments/confirm`, {
        key: fileKey,
        filename: file.name,
        size: file.size,
        mime_type: file.type || "application/octet-stream",
      });

      setState({ status: "done", progress: 100, key: fileKey, error: null });
      return fileKey;
    } catch (err) {
      if (err.name === "AbortError") {
        setState({
          status: "idle",
          progress: 0,
          error: "Dibatalkan",
          key: null,
        });
      } else {
        // Ambil pesan error dari backend jika ada, fallback ke message umum
        const message =
          err?.response?.data?.message || err?.message || "Upload gagal";
        setState({ status: "error", progress: 0, error: message, key: null });
      }
      // PENTING: Lempar kembali error-nya agar loop di UI (TabAttachment)
      // bisa menangkap catch(err) dan menghentikan atau menampilkan toast error
      throw err;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current.aborted = true;
    if (abortRef.current.xhr) abortRef.current.xhr.abort();
    reset();
  }, [reset]);

  return { upload, cancel, state, reset };
}
