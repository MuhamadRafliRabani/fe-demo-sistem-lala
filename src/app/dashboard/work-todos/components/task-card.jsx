/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
import { useRemove } from "@/hooks/use-api-mutation";
import { getInitials } from "@/lib/get-initial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlignLeft,
  Clock,
  CheckSquare,
  Lock,
  MessageSquare,
  Paperclip,
  ExternalLink,
  Pencil,
  MoreVertical,
} from "lucide-react";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { toTitleCase } from "@/lib/to-title-case";

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

const AVATAR_BG_COLORS = [
  "#4bce97",
  "#f5cd47",
  "#fea362",
  "#f87168",
  "#9f8fef",
  "#579dff",
  "#6cc3e0",
  "#94c748",
  "#e774bb",
  "#8590a2",
];

const getAvatarBackgroundColor = (name = "") => {
  const source = String(name || "")
    .trim()
    .toLowerCase();
  if (!source) return AVATAR_BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_BG_COLORS[Math.abs(hash) % AVATAR_BG_COLORS.length];
};

const getLabelColor = (labelName) => {
  if (!labelName) return "bg-transparent";
  const l = String(labelName).toLowerCase();
  if (l === "easy" || l === "ringan") return "bg-[#4bce97]";
  if (l === "medium") return "bg-[#f5cd47]";
  if (l === "hard") return "bg-[#f87168]";
  if (l === "very hard" || l === "very_hard") return "bg-[#c9372c]";
  if (l === "mandatory") return "bg-[#579dff]";
  return "bg-[#8590a2]";
};

export const TaskCardUI = ({
  task,
  isDragging,
  onEdit,
  onChat,
  placeholderHeight = 0,
  isAdmin = false,
  onOpen,
  updateLocalTask,
  mutate,
}) => {
  const { data: unreadCountData } = useApiFetch(
    ["unread-count"],
    "/notifications/todo-comments/unread-count",
    {},
  );
  const [localUnread, setLocalUnread] = useState(0);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    const countMap = unreadCountData?.data || unreadCountData || {};
    setLocalUnread(Number(countMap[task?.id] || 0));
  }, [unreadCountData, task?.id]);

  useEffect(() => {
    const handleRealtime = (e) => {
      const payload = e.detail;
      if (
        payload?.type === "todo_comment" &&
        String(payload?.data?.todo_item_id) === String(task?.id)
      ) {
        setLocalUnread((prev) => prev + 1);
      }
    };
    window.addEventListener("realtimeNotification", handleRealtime);
    return () =>
      window.removeEventListener("realtimeNotification", handleRealtime);
  }, [task?.id]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [task?.user_avatar, task?.id]);

  const handleStatusChange = (newStatus) => {
    if (!updateLocalTask || !mutate) return;
    updateLocalTask({ ...task, status: newStatus });
    mutate(
      { id: task.id, status: newStatus },
      { onError: () => updateLocalTask(task) },
    );
  };

  const { mutate: deleteTask } = useRemove(
    (payload) => `/work-tasks/${payload.id}`,
    { invalidate: [["work-tasks"]] },
  );

  // ── Drag placeholder ──
  if (isDragging) {
    return (
      <div
        className="w-full rounded-lg bg-secondary/30 border border-primary/30 border-dashed"
        style={{ height: placeholderHeight || 72 }}
      />
    );
  }

  const isDone = task.status === "done";
  const isLocked = false;
  const cardOpacity = isLocked ? "opacity-70" : "opacity-100";
  const cursorStyle = isLocked ? "cursor-not-allowed" : "cursor-pointer";
  const bgClass = isLocked ? "bg-secondary/70" : "bg-card";

  // ── Due date badge ──
  const dateObj = task.due_date ? new Date(task.due_date) : null;
  let dueDateText = "";
  let dueDateBadge = "";
  const completedInfo =
    task.status === "done"
      ? formatCompletedAt(task.completed_at, task.due_date)
      : null;

  if (dateObj) {
    dueDateText = dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const dueDay = new Date(dateObj);
    dueDay.setHours(0, 0, 0, 0);

    if (task.status === "done" && task.completed_at) {
      const completedDay = new Date(task.completed_at);
      completedDay.setHours(0, 0, 0, 0);
      dueDateBadge =
        completedDay > dueDay
          ? "bg-[#c9372c] text-white"
          : "bg-[#1f845a] text-white";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDateBadge =
        dueDay < today ? "bg-[#c9372c] text-white" : "bg-[#1f845a] text-white";
    }
  }

  const activeUrl = task.url || task.link_url;
  const isImageAttachment =
    task.file && /\.(jpg|jpeg|png|gif|webp)$/i.test(task.file);
  const imageUrl = task.file
    ? resolveImageUrl(task.file).replace(
        "/app/storage/",
        "/app/public/storage/",
      )
    : null;
  const hasDescription = Boolean(String(task.reason || "").trim());
  const hasChecklist =
    Array.isArray(task.checklists) && task.checklists.length > 0;
  const totalComments = Number(task?.comments_count ?? 0);
  const hasComments = totalComments > 0 || localUnread > 0;

  const handleDelete = (e) => {
    e.stopPropagation();
    toast.promise(
      new Promise((resolve, reject) => {
        deleteTask(
          { id: task.id },
          {
            onSuccess: () => resolve(),
            onError: (err) => reject(err?.response?.data.message),
          },
        );
      }),
      {
        loading: "Menghapus...",
        success: "Dihapus!",
        error: (err) => err ?? "Gagal hapus!",
      },
    );
  };

  const getHostname = (url) => {
    if (!url) return "-";
    try {
      return new URL(url, window.location.origin).hostname;
    } catch {
      return url.replace(/^https?:\/\//, "").split("/")[0];
    }
  };

  return (
    <div
      onClick={() => {
        if (isLocked) {
          toast.warning("Todo List belum di-Approve. Tugas terkunci.");
          return;
        }
        onEdit && onEdit(task);
      }}
      className={`group relative flex flex-col rounded-lg ${bgClass} border border-border transition-all hover:bg-secondary hover:border-primary/30 ${cardOpacity} ${cursorStyle}`}
    >
      {/* ── Cover image ── */}
      {isImageAttachment && (
        <div className="h-[100px] sm:h-[110px] rounded-t-lg overflow-hidden bg-secondary border-b border-border">
          <img
            src={imageUrl}
            alt="cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── Card body ── */}
      {/* padding lebih kecil di mobile: p-2, sm: p-2.5 */}
      <div className="p-2 sm:p-2.5">
        {/* Edit button (hover only, desktop) */}
        {!isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(task);
            }}
            className="absolute top-2 right-2 p-1 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <Pencil size={11} />
          </button>
        )}

        {/* Link preview */}
        {!isImageAttachment && activeUrl && (
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mb-2 block w-full rounded border border-border bg-secondary px-2 py-1.5 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <ExternalLink size={10} className="text-[#579dff] shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">
                {getHostname(activeUrl)}
              </span>
            </div>
          </a>
        )}

        {/* Label dot */}
        {task.label && (
          <div className="mb-1.5 pr-5">
            <span
              className={`inline-block h-[7px] w-[36px] rounded-full ${getLabelColor(task.label)}`}
              title={task.label.toUpperCase()}
            />
          </div>
        )}

        {/* Task name — sedikit lebih kecil */}
        <h4
          className={`text-[12px] sm:text-[13px] font-medium leading-snug mb-1.5 pr-4 ${
            isDone ? "text-[#9fadbc] line-through" : "text-[#b6c2cf]"
          }`}
        >
          {toTitleCase(task.task_name || "")}
        </h4>

        {/* Description — max 2 lines, hidden jika tak ada */}
        {hasDescription && (
          <p
            className="text-[11px] leading-snug mb-2 text-muted-foreground"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {String(task.reason || "").trim()}
          </p>
        )}

        {/* ── Footer row: meta + avatar ── */}
        <div className="flex items-center justify-between gap-1 mt-1">
          {/* Meta icons kiri */}
          <div className="flex items-center gap-1.5 text-muted-foreground flex-wrap">
            {dateObj && (
              <div
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${dueDateBadge}`}
              >
                <Clock size={9} />
                <span>{dueDateText}</span>
              </div>
            )}
            {hasDescription && (
              <AlignLeft size={11} className="opacity-70" title="Deskripsi" />
            )}
            {(task.attachments?.length > 0 || activeUrl) &&
              !isImageAttachment && (
                <Paperclip size={11} className="opacity-70" title="Lampiran" />
              )}
            {hasChecklist && (
              <CheckSquare size={11} className="opacity-70" title="Checklist" />
            )}
            {hasComments && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChat && onChat(task);
                }}
                className={`flex items-center gap-0.5 transition-colors ${
                  localUnread > 0
                    ? "text-destructive"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={
                  localUnread > 0
                    ? `${localUnread} belum dibaca`
                    : `${totalComments} komentar`
                }
              >
                <MessageSquare size={11} />
                {localUnread > 0 && (
                  <span className="text-[10px] font-bold">{localUnread}</span>
                )}
              </button>
            )}
          </div>

          {/* Avatar + nama kanan */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Nama: sembunyikan di kolom sempit jika terlalu panjang */}
            <span className="text-[10px] sm:text-[11px] text-muted-foreground truncate max-w-[60px] sm:max-w-[80px]">
              {task.user_name ? toTitleCase(task.user_name.split(" ")[0]) : ""}
            </span>

            {task.user_avatar && !avatarLoadFailed ? (
              <Image
                src={resolveImageUrl(task.user_avatar)}
                alt="avatar"
                width={22}
                height={22}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-2 ring-[#22272b]"
                title={toTitleCase(task.user_name)}
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <div
                className="flex w-5 h-5 sm:w-6 sm:h-6 items-center justify-center rounded-full text-[8px] sm:text-[9px] font-bold text-[#1d2125] ring-2 ring-[#22272b]"
                title={toTitleCase(task.user_name)}
                style={{
                  backgroundColor: getAvatarBackgroundColor(task.user_name),
                }}
              >
                {getInitials(task.user_name || "U")}
              </div>
            )}

            {/* Dropdown status — hanya jika ada mutate */}
            {updateLocalTask && mutate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-0.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MoreVertical size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-32 bg-popover border-border text-foreground"
                >
                  {["pending", "on_progress", "done"].map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(s);
                      }}
                      className="hover:bg-secondary hover:text-foreground cursor-pointer text-[12px]"
                    >
                      {s === "pending"
                        ? "Pending"
                        : s === "on_progress"
                          ? "On Progress"
                          : "Done"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* ── Completed info ── */}
        {completedInfo && (
          <div className="mt-2 pt-2 border-t border-[#a6c5e214] flex items-center gap-1.5">
            <CheckSquare
              size={10}
              className={
                completedInfo.delta > 0 ? "text-[#f87168]" : "text-[#4bce97]"
              }
            />
            <span className="text-[10px] text-muted-foreground">
              Selesai{" "}
              <span className="font-semibold text-foreground">
                {completedInfo.dateLabel}
              </span>
            </span>
            {completedInfo.delta !== null && (
              <span
                className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  completedInfo.delta > 0
                    ? "bg-[#c9372c]/20 text-[#f87168]"
                    : completedInfo.delta === 0
                      ? "bg-[#1f845a]/20 text-[#4bce97]"
                      : "bg-[#1d4ed8]/20 text-[#60a5fa]"
                }`}
              >
                {completedInfo.delta > 0
                  ? `+${completedInfo.delta}h telat`
                  : completedInfo.delta === 0
                    ? "Tepat waktu"
                    : `${Math.abs(completedInfo.delta)}h awal`}
              </span>
            )}
          </div>
        )}

        {/* Lock indicator */}
        {isLocked && (
          <div
            className="absolute top-2 right-2 text-destructive bg-secondary p-1 rounded border border-border"
            title="Pending Approval"
          >
            <Lock size={11} />
          </div>
        )}
      </div>
    </div>
  );
};
