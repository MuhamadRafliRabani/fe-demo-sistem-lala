"use client";

import { useAuthStore } from "@/hooks/auth-store";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatDateDb } from "@/lib/date-format-db";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  CalendarCheck,
  CheckSquare,
  Clock,
  MoreHorizontal,
  AlignLeft,
  XCircle,
  ShieldCheck,
  Clock3,
  Paperclip,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { useMemo, useState } from "react";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { usePut } from "@/hooks/use-api-mutation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPut } from "@/services/api";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/to-title-case";
import { EditTaskModal } from "../../work-todos/modal/modal-update-item-todo-v2";

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCompletedAt(completedAt, dueDate) {
  if (!completedAt) return null;
  const completed = new Date(completedAt);
  const due = dueDate ? new Date(dueDate) : null;

  const dateLabel = completed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = completed.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let delta = null;
  if (due) {
    const d1 = new Date(completed);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(due);
    d2.setHours(0, 0, 0, 0);
    delta = Math.round((d1 - d2) / 86400000);
  }

  return { dateLabel, timeLabel, delta };
}

const getLabelColor = (labelName) => {
  if (!labelName) return "bg-transparent hidden";
  const l = String(labelName).toLowerCase();
  if (l === "easy" || l === "ringan") return "bg-success";
  if (l === "medium") return "bg-amber";
  if (l === "hard") return "bg-destructive";
  if (l === "very hard" || l === "very_hard") return "bg-destructive";
  if (l === "mandatory") return "bg-primary";
  return "bg-muted";
};

const AVATAR_BG_COLORS = [
  "var(--success)",
  "var(--amber)",
  "var(--chart-3)",
  "var(--destructive)",
  "var(--violet)",
  "var(--primary)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--accent)",
  "var(--muted-foreground)",
];

const getAvatarBackgroundColor = (name = "") => {
  const source = String(name || "")
    .trim()
    .toLowerCase();
  if (!source) return AVATAR_BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
};

const getHostname = (url) => {
  if (!url) return "-";
  try {
    return new URL(url, window.location.origin).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
};

// ── Component ────────────────────────────────────────────────────────────────

export const TodoWidget = ({ className = "" }) => {
  const { user } = useAuthStore();
  const isAdmin = [1, 11].includes(Number(user?.role_id));

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // ✅ Flat params langsung, tidak nested filter object
  const filterParams = !user?.id
    ? null
    : {
        page: 1,
        paginate: 200,
        start_date: formatDateDb(weekStart),
        end_date: formatDateDb(weekEnd),
        ...(isAdmin ? { approve_status: "pending" } : { user_id: user.id }),
      };

  const { data, isLoading, refetch } = useApiFetch(
    ["work-tasks-widget", filterParams],
    "/work-tasks", // ✅ endpoint baru
    filterParams,
    !!user?.id,
  );

  // ✅ Flat array langsung, tidak perlu flatMap
  const allTasks = useMemo(() => {
    const resData = data?.data;

    // Jika formatnya langsung array
    if (Array.isArray(resData)) return resData;

    // Jika formatnya pagination (biasanya array ada di dalam resData.data)
    if (resData?.data && Array.isArray(resData.data)) return resData.data;

    // Fallback jika kosong atau format tidak dikenali
    return [];
  }, [data]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return {
      dateStr: format(d, "yyyy-MM-dd"),
      dayName: format(d, "EEE", { locale: localeId }),
      dateNum: format(d, "d"),
    };
  });

  const todayStr = format(now, "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // ✅ Filter: task dibuat hari ini ATAU diselesaikan hari ini
  const dayTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const createdDate = task.cretime
        ? format(new Date(task.cretime), "yyyy-MM-dd")
        : null;
      const completedDate = task.completed_at
        ? format(new Date(task.completed_at), "yyyy-MM-dd")
        : null;
      return createdDate === selectedDate || completedDate === selectedDate;
    });
  }, [allTasks, selectedDate]);

  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedTaskSnapshot, setSelectedTaskSnapshot] = useState(null);

  // ✅ Endpoint benar: /work-tasks
  const { mutate: mutateItem, isPending: isUpdating } = usePut(
    selectedItemId ? `/work-tasks/${selectedItemId}` : null,
  );

  // ✅ Tidak perlu todo_id lagi — task langsung punya id
  const handleEditClick = (taskId) => {
    const task = allTasks.find((t) => Number(t.id) === Number(taskId)) || null;
    setSelectedItemId(taskId);
    setSelectedTaskSnapshot(task);
    setEditSheetOpen(true);
  };

  const [approvalModal, setApprovalModal] = useState({
    open: false,
    item: null,
    status: "pending",
    note: "",
  });
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [failedAvatarIds, setFailedAvatarIds] = useState({});

  const openApprovalModal = (item) => {
    if (!isAdmin) return;
    setApprovalModal({
      open: true,
      item,
      status: item.approve_status || "pending",
      note: item.note || "",
    });
  };

  // ✅ Gunakan PUT /work-tasks/{id} — tidak ada lagi endpoint /status terpisah
  const submitApproval = async () => {
    if (!approvalModal.item?.id) return;
    setIsSubmittingApproval(true);
    try {
      await apiPut(`/work-tasks/${approvalModal.item.id}`, {
        approve_status: approvalModal.status,
        note: approvalModal.note,
      });
      toast.success("Status Task berhasil diperbarui!");
      setApprovalModal({
        open: false,
        item: null,
        status: "pending",
        note: "",
      });
      refetch();
    } catch {
      toast.error("Gagal memperbarui status. Silakan coba lagi.");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleSuccess = (updatedTask) => {
    if (updatedTask?.id) {
      setSelectedTaskSnapshot((prev) =>
        prev && Number(prev.id) === Number(updatedTask.id)
          ? { ...prev, ...updatedTask }
          : prev,
      );
    }
    refetch();
  };

  const renderApprovalBadge = (item) => {
    const status = item.approve_status || "pending";

    let styles = "";
    let label = status;

    switch (status.toLowerCase()) {
      case "pending":
        styles =
          "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20";
        label = item.status === "done" ? "REQ REVIEW" : "REQ APPROVE";
        break;
      case "approved":
        styles =
          "bg-success/10 text-success border-success/20 hover:bg-success/20";
        label = "APPROVED";
        break;
      case "rejected":
        styles =
          "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20";
        label = "REJECTED";
        break;
      default:
        styles = "bg-muted/50 text-muted-foreground border-border";
    }

    return (
      <button
        onClick={(e) => {
          if (isAdmin) {
            e.stopPropagation();
            openApprovalModal(item);
          }
        }}
        className={`border text-[9px] px-2 py-0.5 rounded-[3px] font-bold tracking-widest shrink-0 transition-all ${styles} ${
          isAdmin
            ? "cursor-pointer hover:shadow-sm z-20 relative"
            : "cursor-default"
        }`}
        title={isAdmin ? "Click to change approval status" : `Status: ${label}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className={`flex-1 bg-card rounded-2xl border border-border p-4 lg:p-6 flex flex-col overflow-hidden shadow-sm relative h-full ${className} max-h-[calc(100vh-280px)]`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-5 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <CalendarCheck size={16} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[15px] font-bold text-foreground tracking-wide leading-tight">
              {isAdmin ? "Task Review" : "My Tasks"}
            </h3>
            <span className="text-[11px] text-muted-foreground font-medium">
              {isAdmin ? "Pending Approval — Weekly" : "Weekly Overview"}
            </span>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded bg-muted/50 hover:bg-muted">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* DAY SELECTOR */}
      <div className="flex items-center justify-between mb-4 bg-card p-1.5 rounded-xl border border-border">
        {weekDays.map((day, idx) => {
          const isSelected = selectedDate === day.dateStr;
          const isToday = day.dateStr === todayStr;

          // ✅ Dot: ada task di hari itu (dibuat atau diselesaikan)
          const hasTaskOnDay = allTasks.some((task) => {
            const created = task.cretime
              ? format(new Date(task.cretime), "yyyy-MM-dd")
              : null;
            const completed = task.completed_at
              ? format(new Date(task.completed_at), "yyyy-MM-dd")
              : null;
            return created === day.dateStr || completed === day.dateStr;
          });

          return (
            <div
              key={idx}
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex flex-col items-center justify-center flex-1 h-[48px] rounded-lg cursor-pointer transition-all duration-200 relative
                ${isSelected ? "bg-primary text-primary-foreground shadow-md" : "bg-transparent hover:bg-muted/50"}`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                {day.dayName}
              </span>
              <span
                className={`text-[14px] font-extrabold leading-none ${isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"}`}
              >
                {day.dateNum}
              </span>
              {hasTaskOnDay && (
                <span
                  className={`absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-destructive"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* TASK LIST */}
      <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar relative z-10 bg-card">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
        `,
          }}
        />

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : dayTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-80">
            <CalendarCheck size={36} className="mb-2 opacity-30" />
            <span className="text-[12px] font-medium">
              No tasks for this day
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pb-2">
            {dayTasks.map((task) => {
              const isDone = task.status === "done";
              const isImageAttachment =
                task.file && /\.(jpg|jpeg|png|gif|webp)$/i.test(task.file);
              const imageUrl = task.file
                ? resolveImageUrl(task.file).replace(
                    "/app/storage/",
                    "/app/public/storage/",
                  )
                : null;
              // ✅ Gunakan task.url langsung (bukan task.link_url, sudah dimap di controller)
              const activeUrl = task.url;
              const hasDescription = Boolean(String(task.reason || "").trim());
              const hasChecklist =
                Array.isArray(task.checklists) && task.checklists.length > 0;
              const totalComments = Number(task.comments_count ?? 0);

              const dateObj = task.due_date ? new Date(task.due_date) : null;
              let dueDateText = "";
              let dueDateBadge = "";
              const completedInfo = isDone
                ? formatCompletedAt(task.completed_at, task.due_date)
                : null;

              if (dateObj) {
                dueDateText = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const dueDay = new Date(dateObj);
                dueDay.setHours(0, 0, 0, 0);

                if (isDone && task.completed_at) {
                  const completedDay = new Date(task.completed_at);
                  completedDay.setHours(0, 0, 0, 0);
                  dueDateBadge =
                    completedDay > dueDay
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-success text-success-foreground";
                } else {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  dueDateBadge =
                    dueDay < today
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-success text-success-foreground";
                }
              }

              // ✅ task.user bukan task.todo_user
              const assignee = task.user;

              return (
                <div
                  key={task.id}
                  className="group relative border border-border hover:border-primary/50 rounded-[8px] p-2.5 transition-all duration-200 flex flex-col shadow-sm cursor-pointer bg-card"
                  onClick={() => handleEditClick(task.id)}
                >
                  {isImageAttachment && (
                    <div className="-mx-2.5 -mt-2.5 mb-2 h-[120px] rounded-t-[7px] overflow-hidden bg-muted/40 border-b border-border">
                      <img
                        src={imageUrl}
                        alt="cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {!isImageAttachment && activeUrl && (
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mb-2 block w-full rounded-[6px] border border-border bg-muted/40 p-2 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-card flex items-center justify-center shrink-0">
                          <ExternalLink size={10} className="text-primary" />
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {getHostname(activeUrl)}
                        </span>
                      </div>
                    </a>
                  )}

                  {/* Label + Approval Badge */}
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex flex-wrap gap-1">
                      {task.label && (
                        <span
                          className={`h-[8px] w-[40px] rounded-full ${getLabelColor(task.label)}`}
                          title={task.label.toUpperCase()}
                        />
                      )}
                    </div>
                    {renderApprovalBadge(task)}
                  </div>

                  {/* Task Name */}
                  <h4
                    className={`text-[14px] font-normal leading-snug mb-2 pr-2 ${isDone ? "text-muted-foreground line-through opacity-80" : "text-foreground"}`}
                  >
                    {toTitleCase(task.task_name || "")}
                  </h4>

                  {/* Description */}
                  {hasDescription && (
                    <p
                      className={`text-[12px] leading-snug mb-2 ${isDone ? "text-muted-foreground/80" : "text-muted-foreground"}`}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {String(task.reason || "").trim()}
                    </p>
                  )}

                  {/* Note (rejection reason) */}
                  {task.note && (
                    <div className="mb-2 rounded bg-warning/10 border border-warning/20 p-2 text-[11px] text-warning">
                      <span className="font-bold uppercase mr-1">Note:</span>
                      {toTitleCase(task.note)}
                    </div>
                  )}

                  {/* Bottom Bar */}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      {dateObj && (
                        <div
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[11px] ${dueDateBadge}`}
                        >
                          <Clock size={11} />
                          <span className="font-medium">{dueDateText}</span>
                        </div>
                      )}
                      {hasDescription && (
                        <AlignLeft size={13} title="Has description" />
                      )}
                      {(task.attachments?.length > 0 || activeUrl) &&
                        !isImageAttachment && (
                          <Paperclip size={12} title="Attachments" />
                        )}
                      {hasChecklist && (
                        <CheckSquare
                          size={13}
                          className="opacity-80"
                          title="Checklist"
                        />
                      )}
                      {totalComments > 0 && (
                        <div
                          className="flex items-center gap-1"
                          title={`${totalComments} komentar`}
                        >
                          <MessageSquare size={13} className="opacity-80" />
                          <span className="text-[11px] font-bold">
                            {totalComments}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ✅ Assignee: task.user bukan task.todo_user */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[12px] text-muted-foreground font-medium truncate">
                        {assignee?.name ? toTitleCase(assignee.name) : "User"}
                      </span>
                      {assignee?.avatar && !failedAvatarIds[task.id] ? (
                        <img
                          src={resolveImageUrl(assignee.avatar)}
                          alt={assignee.name}
                          onError={() =>
                            setFailedAvatarIds((prev) => ({
                              ...prev,
                              [task.id]: true,
                            }))
                          }
                          className="size-6 rounded-full object-cover ring-2 ring-border bg-card"
                          title={toTitleCase(assignee.name)}
                        />
                      ) : (
                        <div
                          className="flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-primary-foreground ring-2 ring-border"
                          title={toTitleCase(assignee?.name || "User")}
                          style={{
                            backgroundColor: getAvatarBackgroundColor(
                              assignee?.name,
                            ),
                          }}
                        >
                          {assignee?.name
                            ? assignee.name.substring(0, 2).toUpperCase()
                            : "U"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completion Info */}
                  {completedInfo && (
                    <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5">
                      <CheckSquare
                        size={11}
                        className={
                          completedInfo.delta > 0
                            ? "text-destructive"
                            : "text-success"
                        }
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Selesai{" "}
                        <span className="font-semibold text-foreground">
                          {completedInfo.dateLabel}
                        </span>{" "}
                        pukul{" "}
                        <span className="font-semibold text-foreground">
                          {completedInfo.timeLabel}
                        </span>
                      </span>
                      {completedInfo.delta !== null && (
                        <span
                          className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            completedInfo.delta > 0
                              ? "bg-destructive/10 text-destructive"
                              : completedInfo.delta === 0
                                ? "bg-success/10 text-success"
                                : "bg-primary/10 text-primary"
                          }`}
                        >
                          {completedInfo.delta > 0
                            ? `+${completedInfo.delta}h telat`
                            : completedInfo.delta === 0
                              ? "Tepat waktu"
                              : `${Math.abs(completedInfo.delta)}h lebih awal`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      <EditTaskModal
        isOpen={editSheetOpen}
        onClose={() => {
          setEditSheetOpen(false);
          setSelectedItemId(null);
          setSelectedTaskSnapshot(null);
        }}
        task={
          selectedTaskSnapshot ||
          allTasks.find((t) => Number(t.id) === Number(selectedItemId)) ||
          null
        }
        mutate={mutateItem}
        isPending={isUpdating}
        updateLocalTask={handleSuccess}
        allowStatusOverride
      />

      {/* APPROVAL MODAL */}
      <Dialog
        open={approvalModal.open}
        onOpenChange={(open) => setApprovalModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[420px] shadow-md p-0 overflow-hidden rounded-xl">
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Review Task
              </DialogTitle>
              <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                Set approval status untuk task milik{" "}
                <strong className="text-foreground">
                  {/* ✅ approvalModal.item.user bukan .todo_user */}
                  {approvalModal.item?.user?.name || "Unknown"}
                </strong>
              </p>
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "pending",
                      icon: <Clock3 className="w-5 h-5 mb-1.5" />,
                      label: "Pending",
                      active: "bg-warning/10 border-warning text-warning",
                    },
                    {
                      value: "approved",
                      icon: <ShieldCheck className="w-5 h-5 mb-1.5" />,
                      label: "Approve",
                      active: "bg-success/10 border-success text-success",
                    },
                    {
                      value: "rejected",
                      icon: <XCircle className="w-5 h-5 mb-1.5" />,
                      label: "Reject",
                      active:
                        "bg-destructive/10 border-destructive text-destructive",
                    },
                  ].map(({ value, icon, label, active }) => (
                    <div
                      key={value}
                      onClick={() =>
                        setApprovalModal((prev) => ({ ...prev, status: value }))
                      }
                      className={`flex flex-col items-center justify-center p-3 rounded-[6px] border transition-all cursor-pointer ${
                        approvalModal.status === value
                          ? `${active} shadow-sm`
                          : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {icon}
                      <span className="text-[11px] font-bold uppercase">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
                  Add Note (Optional)
                </label>
                <Textarea
                  value={approvalModal.note}
                  onChange={(e) =>
                    setApprovalModal((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Reason for rejection or extra notes..."
                  className="bg-muted/30 border-border text-foreground min-h-[90px] resize-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary rounded-[6px] placeholder:text-muted-foreground/70 text-[13px]"
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 px-6 py-4 flex items-center justify-end gap-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() =>
                setApprovalModal((prev) => ({ ...prev, open: false }))
              }
              className="bg-transparent border-none text-foreground hover:bg-muted hover:text-foreground rounded-[4px] px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={isSubmittingApproval}
              className="bg-primary text-primary-foreground font-bold hover:opacity-90 rounded-[4px] px-6"
            >
              {isSubmittingApproval ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodoWidget;
