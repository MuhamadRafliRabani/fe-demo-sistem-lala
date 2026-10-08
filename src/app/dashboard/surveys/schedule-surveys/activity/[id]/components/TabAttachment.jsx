"use client";

import { useMemo, useState } from "react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Upload,
  Eye,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  Film,
  File,
  Plus,
} from "lucide-react";
import useSurveyAttachmentUpload from "@/hooks/useSurveyAttachmentUpload";

// --- HELPERS ---

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// UI Helper: Lebih subtle/halus, tidak ada lagi background warna-warni yang mencolok
const getFileTypeConfig = (filename) => {
  if (!filename) return { icon: File, color: "text-muted-foreground" };
  const ext = filename.split(".").pop().toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
      return { icon: ImageIcon, color: "text-success" };
    case "pdf":
      return { icon: FileText, color: "text-destructive" };
    case "xls":
    case "xlsx":
    case "csv":
      return { icon: FileSpreadsheet, color: "text-success" };
    case "doc":
    case "docx":
      return { icon: FileText, color: "text-primary" };
    case "zip":
    case "rar":
    case "7z":
    case "tar":
      return { icon: FileArchive, color: "text-warning" };
    case "mp4":
    case "mov":
    case "avi":
      return { icon: Film, color: "text-violet" };
    default:
      return { icon: File, color: "text-muted-foreground" };
  }
};

// UX Helper: Memaksa browser untuk mendownload file
const forceDownload = async (url, filename) => {
  try {
    toast.info(`Menyiapkan unduhan: ${filename}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed, opening in new tab instead.", error);
    window.open(url, "_blank");
  }
};

// --- MAIN COMPONENT ---

export const TabAttachment = ({ scheduleId }) => {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [optimisticAttachments, setOptimisticAttachments] = useState([]);

  const { upload: uploadFile, state: uploadState } =
    useSurveyAttachmentUpload();

  const {
    data: attachmentsResponse,
    isLoading: isLoadingAttachments,
    refetch: refetchAttachments,
  } = useApiFetch(
    ["attachments", scheduleId],
    `/schedules/${scheduleId}/attachments`,
  );

  const attachments = useMemo(() => {
    const resolvedData = attachmentsResponse?.data ?? attachmentsResponse;
    if (!resolvedData) return [];
    return Array.isArray(resolvedData)
      ? resolvedData
      : resolvedData?.data || [];
  }, [attachmentsResponse]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const MAX_PER_FILE = 100 * 1024 * 1024;

    const invalidFiles = files.filter((file) => file.size > MAX_PER_FILE);
    if (invalidFiles.length) {
      toast.error(`File ${invalidFiles[0].name} melebih batas 100MB.`);
      return;
    }

    setPendingFiles((prev) => [...prev, ...files]);
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (!pendingFiles.length) return;

    const pendingItems = pendingFiles.map((file, index) => ({
      id: `pending-${Date.now()}-${index}`,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      pending: true,
    }));

    setOptimisticAttachments((prev) => [...prev, ...pendingItems]);

    let successCount = 0;
    for (const file of pendingFiles) {
      try {
        await uploadFile(scheduleId, file);
        successCount++;
      } catch (err) {
        toast.error(`Gagal mengunggah ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file berhasil diunggah.`);
      refetchAttachments();
    }

    setPendingFiles([]);
    setOptimisticAttachments([]);
  };

  const visibleAttachments = useMemo(
    () => [...optimisticAttachments, ...(attachments || [])],
    [optimisticAttachments, attachments],
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700 p-8">
      {/* AREA 1: UNIFIED DROPZONE (Sangat Clean)
        Menggabungkan form input dan antrean dalam satu kontainer minimalis.
      */}
      <div className="relative flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-muted/30 px-6 py-16 transition-colors hover:border-primary/50 hover:bg-muted/40">
        <Input
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          title="Tarik file ke sini"
        />

        {pendingFiles.length === 0 ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm border border-border">
              <Plus className="h-6 w-6" />
            </div>
            <p className="text-base font-medium text-foreground">
              Tambah Lampiran
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-[250px]">
              Tarik file ke area ini atau klik untuk memilih dokumen.
            </p>
          </div>
        ) : (
          <div className="z-20 flex flex-col items-center text-center">
            <h4 className="text-lg font-medium text-foreground">
              {pendingFiles.length} file dipilih
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              File siap diunggah ke server.
            </p>
            <Button
              onClick={handleUpload}
              disabled={uploadState.status === "uploading"}
              className="mt-6 rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {uploadState.status === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-foreground" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Unggah Sekarang
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* AREA 2: DAFTAR FILE (Elegan, Monokrom, Aksen Halus)
       */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-medium text-foreground">
            File Tersimpan
          </h3>
          {visibleAttachments.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {visibleAttachments.length} item
            </span>
          )}
        </div>

        {isLoadingAttachments ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          </div>
        ) : visibleAttachments.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Belum ada file yang terlampir.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3  lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {visibleAttachments.map((file) => {
              const fileConfig = getFileTypeConfig(file.original_name);
              const Icon = fileConfig.icon;

              return (
                <div
                  key={file.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex h-32 w-full items-center justify-center bg-muted/40">
                    {file.pending ? (
                      <Loader2 className="h-6 w-6 animate-spin text-warning" />
                    ) : (
                      <Icon
                        className={`h-9 w-9 transition-transform duration-500 group-hover:scale-110 ${fileConfig.color}`}
                      />
                    )}
                  </div>

                  <div className="flex flex-col p-3.5">
                    <p
                      className="truncate text-sm font-medium text-foreground group-hover:text-foreground"
                      title={file.original_name}
                    >
                      {file.original_name}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {file.pending
                          ? "Menyiapkan..."
                          : formatBytes(file.size)}
                      </span>

                      {!file.pending && (
                        <div className="flex items-center gap-0.5">
                          <a
                            href={file.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Lihat"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>

                          <button
                            onClick={() =>
                              forceDownload(
                                file.download_url,
                                file.original_name,
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Unduh"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
