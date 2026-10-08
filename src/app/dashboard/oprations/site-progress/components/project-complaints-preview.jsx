import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Download, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/date-format";
import { formatDateDb, formatDateDbTimestamp } from "@/lib/date-format-db";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import clsx from "clsx";
import React from "react";
import { toast } from "sonner";
import CreateComplaintModal from "./create-complaint-modal";

export default function ProjectComplaintsPreview({
  complaints,
  projectId,
  latestDtId,
  onQuickUpdateComplaint,
  onAddComplaint,
}) {
  const items = Array.isArray(complaints) ? complaints : [];
  const [localItems, setLocalItems] = useState(items);
  const pendingCount = useMemo(
    () => localItems.filter((c) => Number(c?.status) !== 1).length,
    [localItems],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [preview, setPreview] = useState({
    open: false,
    attachments: [],
    selectedIndex: 0,
  });

  useEffect(() => {
    setLocalItems(items);
  }, [complaints]);

  const handleOptimisticAdd = (optimistic) => {
    if (!optimistic?.id) return;
    setIsOpen(true);
    setLocalItems((curr) => [optimistic, ...curr]);
  };

  const handleOptimisticReplace = (tempId, created) => {
    if (!tempId) return;
    if (!created?.id) return;
    setLocalItems((curr) =>
      curr.map((c) => (String(c.id) === String(tempId) ? created : c)),
    );
  };

  const handleOptimisticRemove = (tempId) => {
    if (!tempId) return;
    setLocalItems((curr) =>
      curr.filter((c) => String(c.id) !== String(tempId)),
    );
  };

  const selectedAttachment =
    preview.attachments?.[preview.selectedIndex] ?? null;
  const selectedAttachmentUrl = selectedAttachment
    ? resolveImageUrl(selectedAttachment.file_path)
    : null;
  const selectedAttachmentIsImage = selectedAttachment
    ? String(selectedAttachment.mime_type || "").startsWith("image/")
    : false;

  const startEdit = (complaint) => {
    if (!complaint?.id) return;
    setEditingId(complaint.id);
    setDraftText(String(complaint.complaint || ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftText("");
  };

  const commitEdit = (complaint) => {
    if (!complaint?.id) return cancelEdit();
    const nextText = String(draftText || "").trim();
    const prevText = String(complaint.complaint || "").trim();

    cancelEdit();

    if (nextText === prevText) return;
    if (String(complaint.id).startsWith("tmp-")) return;

    const previous = localItems;
    setLocalItems((curr) =>
      curr.map((c) =>
        String(c.id) === String(complaint.id)
          ? { ...c, complaint: nextText }
          : c,
      ),
    );

    if (!onQuickUpdateComplaint) return;

    setSavingId(complaint.id);
    const complaintAt =
      complaint.complaint_at ||
      complaint.complaint_date ||
      complaint.cretime ||
      formatDateDbTimestamp(new Date());
    const solveAt = complaint.solve_at ?? null;
    const solveDate = complaint.solve_date ?? null;

    const promise = new Promise((resolve, reject) => {
      onQuickUpdateComplaint(
        {
          id: complaint.id,
          status: Number(complaint.status) === 1 ? 1 : 0,
          complaint: nextText,
          complaint_at: complaintAt,
          solve_at: solveAt,
          solve_date: solveDate,
        },
        {
          onSuccess: resolve,
          onError: reject,
          onSettled: () => setSavingId(null),
        },
      );
    });

    toast.promise(promise, {
      loading: "Update keluhan...",
      success: "Keluhan tersimpan",
      error: "Gagal update keluhan",
    });

    promise
      .then((res) => {
        const updated = res?.data ?? null;
        if (updated?.id) {
          setLocalItems((curr) =>
            curr.map((c) => {
              if (String(c.id) !== String(updated.id)) return c;
              const nextAttachments =
                Array.isArray(updated.attachments) &&
                updated.attachments.length > 0
                  ? updated.attachments
                  : Array.isArray(c.attachments)
                    ? c.attachments
                    : [];
              return { ...c, ...updated, attachments: nextAttachments };
            }),
          );
        }
      })
      .catch(() => {
        setLocalItems(previous);
      });
  };

  const toggleSolved = (complaint) => {
    if (!complaint?.id) return;
    if (String(complaint.id).startsWith("tmp-")) return;

    const previous = localItems;
    const nextStatus = Number(complaint.status) === 1 ? 0 : 1;
    const solveAt = nextStatus === 1 ? formatDateDbTimestamp(new Date()) : null;
    const solveDate = nextStatus === 1 ? formatDateDb(new Date()) : null;
    setLocalItems((curr) =>
      curr.map((c) =>
        String(c.id) === String(complaint.id)
          ? {
              ...c,
              status: nextStatus,
              solve_at: solveAt,
              solve_date: solveDate,
            }
          : c,
      ),
    );

    if (!onQuickUpdateComplaint) return;

    setSavingId(complaint.id);
    const complaintAt =
      complaint.complaint_at ||
      complaint.complaint_date ||
      complaint.cretime ||
      formatDateDbTimestamp(new Date());

    const promise = new Promise((resolve, reject) => {
      onQuickUpdateComplaint(
        {
          id: complaint.id,
          status: nextStatus,
          complaint: complaint.complaint,
          complaint_at: complaintAt,
          solve_at: solveAt,
          solve_date: solveDate,
        },
        {
          onSuccess: resolve,
          onError: reject,
          onSettled: () => setSavingId(null),
        },
      );
    });

    toast.promise(promise, {
      loading: "Update status...",
      success: "Status tersimpan",
      error: "Gagal update status",
    });

    promise
      .then((res) => {
        const updated = res?.data ?? null;
        if (updated?.id) {
          setLocalItems((curr) =>
            curr.map((c) => {
              if (String(c.id) !== String(updated.id)) return c;
              const nextAttachments =
                Array.isArray(updated.attachments) &&
                updated.attachments.length > 0
                  ? updated.attachments
                  : Array.isArray(c.attachments)
                    ? c.attachments
                    : [];
              return { ...c, ...updated, attachments: nextAttachments };
            }),
          );
        }
      })
      .catch(() => {
        setLocalItems(previous);
      });
  };

  const onInlineKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) return;
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  return (
    <>
      <div className="border-t border-border/60">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            }
          }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors outline-none group/accordion cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              Issue Register
            </span>
            {pendingCount > 0 ? (
              <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20">
                {pendingCount} PENDING
              </span>
            ) : localItems.length > 0 ? (
              <span className="font-mono text-[10px] text-muted-foreground border border-border px-1.5 py-0.5">
                ALL SOLVED
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground group-hover/accordion:text-foreground transition-colors">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCreateOpen(true);
              }}
              className="p-1 rounded hover:bg-muted/20 transition-colors"
              aria-label="Tambah keluhan"
              disabled={!projectId || !latestDtId || !onAddComplaint}
              title={
                !latestDtId
                  ? "Buat progress dulu sebelum catat keluhan"
                  : "Tambah keluhan"
              }
            >
              <Plus className="w-4 h-4" />
            </button>
            <ChevronDown
              className={clsx(
                "w-4 h-4 transition-transform",
                isOpen ? "rotate-180" : "rotate-0",
              )}
            />
          </div>
        </div>

        <div
          className={clsx(
            "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
            isOpen ? "max-h-[500px]" : "max-h-0",
          )}
        >
          {localItems.length > 0 ? (
            <ScrollArea className="h-[350px]">
              <div className="flex flex-col divide-y divide-border/30 border-t border-border/30">
                {localItems.map((complaint) => {
                  const isSolved = Number(complaint.status) === 1;
                  const complaintDate =
                    complaint.complaint_at ||
                    complaint.complaint_date ||
                    complaint.cretime;
                  const solveDate = complaint.solve_at || complaint.solve_date;
                  const attachments = Array.isArray(complaint.attachments)
                    ? complaint.attachments
                    : [];

                  return (
                    <div
                      key={complaint.id}
                      className="flex flex-col gap-3 px-6 py-4 hover:bg-muted/5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-[10px] font-mono uppercase">
                          <button
                            type="button"
                            onClick={() => toggleSolved(complaint)}
                            className={clsx(
                              "w-4 h-4 border rounded-sm grid place-items-center transition-colors",
                              isSolved
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "bg-background border-border text-transparent hover:border-primary/60",
                            )}
                            aria-pressed={isSolved}
                            aria-label={
                              isSolved
                                ? "Tandai belum selesai"
                                : "Tandai selesai"
                            }
                            disabled={savingId === complaint.id}
                          >
                            <span className="text-[10px] leading-none">✓</span>
                          </button>
                          <span
                            className={
                              isSolved
                                ? "text-emerald-500 font-bold"
                                : "text-amber-500 font-bold"
                            }
                          >
                            {isSolved ? "SOLVED" : "PENDING"}
                          </span>
                          <span className="w-4 h-[1px] bg-border/50" />
                          <span className="text-muted-foreground">
                            ID_ISSUE:{complaint.id}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {complaintDate
                            ? formatDate(complaintDate, true)
                            : "-"}
                        </div>
                      </div>

                      {editingId === complaint.id ? (
                        <textarea
                          autoFocus
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          onKeyDown={onInlineKeyDown}
                          onBlur={() => commitEdit(complaint)}
                          onFocus={(e) => {
                            e.target.select();
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          rows={1}
                          className="w-full bg-transparent text-sm leading-relaxed text-foreground font-medium tracking-tight rounded-sm px-2 py-1 -mx-2 focus:bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/60 resize-none overflow-hidden transition-all"
                        />
                      ) : (
                        <div
                          className={clsx(
                            "text-sm leading-relaxed cursor-pointer hover:bg-muted/10 rounded-sm px-2 py-1 -mx-2 transition-colors",
                            isSolved
                              ? "text-muted-foreground line-through decoration-border/60"
                              : "text-foreground font-medium",
                          )}
                          onClick={() => startEdit(complaint)}
                          title="Klik untuk edit keluhan"
                        >
                          {complaint.complaint}
                        </div>
                      )}

                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {attachments.slice(0, 4).map((att, idx) => {
                            const url = resolveImageUrl(att.file_path);
                            const isImage = String(
                              att.mime_type || "",
                            ).startsWith("image/");
                            return (
                              <button
                                type="button"
                                key={att.id || idx}
                                className="block border border-border/60 rounded-md overflow-hidden hover:border-primary/60 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreview({
                                    open: true,
                                    attachments,
                                    selectedIndex: idx,
                                  });
                                }}
                              >
                                {isImage ? (
                                  <img
                                    src={url}
                                    alt={att.original_name || "attachment"}
                                    className="w-14 h-14 object-cover"
                                  />
                                ) : (
                                  <div className="w-14 h-14 flex items-center justify-center bg-muted text-[10px] font-bold text-muted-foreground">
                                    PDF
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {attachments.length > 4 && (
                            <button
                              type="button"
                              className="w-14 h-14 flex items-center justify-center border border-border/60 rounded-md bg-muted text-[10px] font-bold text-muted-foreground hover:border-primary/60 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreview({
                                  open: true,
                                  attachments,
                                  selectedIndex: 0,
                                });
                              }}
                            >
                              +{attachments.length - 4}
                            </button>
                          )}
                        </div>
                      )}

                      {isSolved && solveDate ? (
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          SELESAI:{" "}
                          <span className="font-mono text-emerald-500">
                            {formatDate(solveDate, true)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="px-6 py-6 text-[11px] font-mono text-muted-foreground uppercase tracking-widest border-t border-border/30">
              No active issues detected
            </div>
          )}
        </div>
      </div>

      <CreateComplaintModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        latestDtId={latestDtId}
        onAddComplaint={onAddComplaint}
        onOptimisticAdd={handleOptimisticAdd}
        onOptimisticReplace={handleOptimisticReplace}
        onOptimisticRemove={handleOptimisticRemove}
      />

      <Dialog
        open={preview.open}
        onOpenChange={(open) => {
          if (!open) {
            setPreview({ open: false, attachments: [], selectedIndex: 0 });
          }
        }}
      >
        <DialogContent
          className="bg-background border-border max-w-5xl p-0 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold truncate">
                  {selectedAttachment?.original_name || "Attachment"}
                </DialogTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Uploaded:{" "}
                  <span className="font-mono text-foreground/90">
                    {selectedAttachment?.cretime
                      ? formatDate(selectedAttachment.cretime, true)
                      : "-"}
                  </span>
                </div>
              </div>
              {selectedAttachmentUrl && (
                <a
                  href={selectedAttachmentUrl}
                  download={selectedAttachment?.original_name || "attachment"}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-2 rounded-sm hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              )}
            </div>
          </DialogHeader>

          <div className="p-6 bg-muted/5">
            {selectedAttachmentUrl ? (
              selectedAttachmentIsImage ? (
                <div className="w-full flex items-center justify-center">
                  <img
                    src={selectedAttachmentUrl}
                    alt={selectedAttachment?.original_name || "attachment"}
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-md border border-border/60 bg-background"
                  />
                </div>
              ) : (
                <div className="w-full h-[70vh] rounded-md border border-border/60 overflow-hidden bg-background">
                  <iframe
                    title={selectedAttachment?.original_name || "attachment"}
                    src={selectedAttachmentUrl}
                    className="w-full h-full"
                  />
                </div>
              )
            ) : (
              <div className="text-sm text-muted-foreground">No preview</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
