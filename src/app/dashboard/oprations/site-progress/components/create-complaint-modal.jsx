import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateDbTimestamp } from "@/lib/date-format-db";
import { Paperclip, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function CreateComplaintModal({
  open,
  onOpenChange,
  projectId,
  latestDtId,
  onAddComplaint,
  onOptimisticAdd,
  onOptimisticReplace,
  onOptimisticRemove,
}) {
  const canSubmit = useMemo(() => {
    return (
      Boolean(projectId) &&
      Boolean(latestDtId) &&
      typeof onAddComplaint === "function"
    );
  }, [projectId, latestDtId, onAddComplaint]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [isPending, setIsPending] = useState(false);

  const reset = () => {
    setText("");
    setFiles([]);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleClose = () => {
    reset();
    onOpenChange?.(false);
  };

  const handleSubmit = (mode) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return toast.error("Keluhan tidak boleh kosong!");
    if (!projectId || !latestDtId) {
      return toast.error(
        "Belum ada log progress. Buat progress dulu sebelum catat keluhan.",
      );
    }
    if (!canSubmit) return;

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      status: 0,
      complaint: trimmed,
      complaint_at: formatDateDbTimestamp(new Date()),
      attachments: [],
    };

    onOptimisticAdd?.(optimistic);
    setIsPending(true);

    const fd = new FormData();
    fd.append("ll_op_kpi_site_id", String(projectId));
    fd.append("ll_op_kpi_site_dt_id", String(latestDtId));
    fd.append("complaints[0][text]", trimmed);
    fd.append("complaints[0][date]", formatDateDbTimestamp(new Date()));
    (Array.isArray(files) ? files : []).forEach((f) =>
      fd.append("complaints[0][files][]", f),
    );

    const promise = new Promise((resolve, reject) => {
      onAddComplaint(fd, {
        onSuccess: resolve,
        onError: reject,
        onSettled: () => setIsPending(false),
      });
    });

    toast.promise(promise, {
      loading: "Mencatat keluhan...",
      success: "Keluhan tercatat",
      error: "Gagal mencatat keluhan",
    });

    promise
      .then((res) => {
        const created = Array.isArray(res?.data) ? res.data[0] : null;
        if (created?.id) {
          onOptimisticReplace?.(tempId, created);
        } else {
          onOptimisticRemove?.(tempId);
        }

        if (mode === "createAgain") {
          reset();
          return;
        }
        handleClose();
      })
      .catch(() => {
        onOptimisticRemove?.(tempId);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f1f2a] border border-[#a6c5e229] max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-[#a6c5e229]">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-[#fffdf5]">
              Tambah Keluhan
            </DialogTitle>
            {/* <button
              type="button"
              onClick={handleClose}
              className="p-1 rounded hover:bg-[#1d2b36] text-[#9fadbc] hover:text-[#fffdf5] transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button> */}
          </div>
          <div className="text-[11px] text-[#9fadbc] mt-1">
            Catat issue di site ini, bisa dengan attachment (foto / PDF)
          </div>
        </DialogHeader>

        <div className="p-5 space-y-3">
          <Textarea
            placeholder="Tulis keluhan / issue..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="bg-[#152733] border border-[#a6c5e229] text-[#fffdf5] placeholder:text-[#9fadbc] min-h-[90px] resize-none focus-visible:ring-2 focus-visible:ring-[#135a86]"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-[#9fadbc] hover:text-[#fffdf5] transition-colors px-2 py-1.5 rounded hover:bg-[#1d2b36] flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest border border-[#a6c5e229]">
                <Paperclip className="w-4 h-4" /> Attachment
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
              </label>
              {files.length > 0 && (
                <span className="text-[10px] font-mono text-[#fed818]">
                  {files.length} file
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending || !canSubmit}
                onClick={() => handleSubmit("createAgain")}
                className="text-[10px] uppercase tracking-widest font-bold px-3 py-2 rounded bg-transparent border border-[#a6c5e229] text-[#9fadbc] hover:text-[#fffdf5] hover:bg-[#1d2b36] transition-colors disabled:opacity-60"
              >
                Create Again
              </button>
              <button
                type="button"
                disabled={isPending || !canSubmit}
                onClick={() => handleSubmit("create")}
                className="text-[10px] uppercase tracking-widest font-bold bg-[#135a86] text-[#fffdf5] px-4 py-2 rounded hover:bg-[#135a86]/90 transition-colors disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
