"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  MessageSquare,
  MoreVertical,
  SendHorizontal,
  Clock,
  AlertCircle,
  CornerUpRight,
} from "lucide-react";
import {
  useTodoComments,
  useCommentCounts,
  resetCommentCount,
} from "@/hooks/use-todo-comments";
import { useAuthStore } from "@/hooks/auth-store";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { usePost } from "@/hooks/use-api-mutation";
import { useNotificationsStore } from "@/hooks/use-notifications"; // Pastikan path ini sesuai
// ============================================================================
// 1. HELPER FUNCTIONS
// ============================================================================
function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

function getAvatarStyle(name) {
  const colors = [
    "bg-red-600",
    "bg-blue-600",
    "bg-green-600",
    "bg-yellow-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-indigo-600",
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  const colorClass = colors[charCode % colors.length];
  const initial = (name || "U")[0].toUpperCase();

  return { colorClass, initial };
}

function parseReplyText(message = "") {
  if (!message.startsWith("↪ ")) return { quote: null, body: message };
  const idx = message.indexOf("\n");
  if (idx === -1) return { quote: message.slice(2).trim(), body: "" };
  const quote = message.slice(2, idx).trim();
  const body = message.slice(idx + 1).trim();
  return { quote, body };
}

// ============================================================================
// 2. COMMENT ITEM COMPONENT
// ============================================================================
const CommentItem = memo(({ comment, onReply }) => {
  const { colorClass, initial } = getAvatarStyle(comment.created_by_name);
  const isOptimistic = comment.__optimistic;
  const isError = comment.__error;
  const { quote, body } = parseReplyText(String(comment.message || ""));

  return (
    <div
      className={`flex gap-3.5 group transition-opacity duration-200 ${isOptimistic ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ${colorClass}`}
        >
          {comment.created_by_avatar ? (
            <Image
              src={resolveImageUrl(comment.created_by_avatar)}
              alt="avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#15232d] bg-[#152733]"
            />
          ) : (
            initial
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-sm text-[#e2e8f0] truncate">
              {comment.created_by_name || "Pengguna"}
            </span>
            <span className="text-[11px] text-[#64748b] flex items-center gap-1 flex-shrink-0">
              <Clock size={11} />
              {timeAgo(comment.created_at)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply && onReply(comment);
            }}
            className="text-[#475569] hover:text-[#94a3b8] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 outline-none"
            title="Balas"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        {quote ? (
          <div className="mb-2 rounded-md border border-[#2d4256] bg-[#15212b] px-3 py-2">
            <div className="text-[11px] font-semibold text-[#93c5fd]">
              ↪ {quote}
            </div>
          </div>
        ) : null}

        {body ? (
          <div className="text-[13px] text-[#cbd5e1] leading-relaxed whitespace-pre-wrap break-words">
            {body}
          </div>
        ) : null}

        {isOptimistic && !isError && (
          <div className="text-xs text-[#64748b] mt-1 italic">
            (mengirim...)
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400 font-medium italic">
            <AlertCircle size={12} />
            <span>(gagal terkirim)</span>
          </div>
        )}

        <div className="mt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReply && onReply(comment);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-[#93c5fd] hover:text-[#bfdbfe]"
          >
            <CornerUpRight size={12} />
            Balas
          </button>
        </div>
      </div>
    </div>
  );
});

CommentItem.displayName = "CommentItem";

// ============================================================================
// 3. TODO COMMENT BUTTON COMPONENT
// ============================================================================
export function TodoCommentButton({ task, unreadCountData, onOpen }) {
  const itemId = task?.id;
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const listEndRef = useRef(null);
  const [text, setText] = useState("");
  const [optimistic, setOptimistic] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);

  const me = useAuthStore((s) => s.user);

  // Ambil state notifikasi global
  const { notifications, markAsReadLocal } = useNotificationsStore();

  const { comments, addComment, refetch } = useTodoComments(itemId, {
    enabled: open,
  });
  const { mutate: sendNotification } = usePost("/notifications/send");
  const { mutate: sendMarkAsRead } = usePost(
    (id) => `/notifications/${id}/read`,
  );

  useEffect(() => {
    if (!itemId) return;
    const handler = (e) => {
      if (String(e.detail?.itemId) === String(itemId)) setOpen(true);
    };
    window.addEventListener("openTodoComment", handler);
    return () => window.removeEventListener("openTodoComment", handler);
  }, [itemId]);

  useEffect(() => {
    if (open && itemId) {
      // 1. TAMBAHKAN REFETCH DI SINI:
      // Paksa ambil data terbaru ke server setiap kali popover dibuka
      refetch();

      resetCommentCount(itemId);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Reset Badge UI Secara Instan
      if (typeof onOpen === "function") {
        onOpen();
      }

      // Mark Global Notifications As Read secara Realtime & Background Sync
      if (Array.isArray(notifications)) {
        notifications.forEach((n) => {
          if (n.read_at) return;

          const notif = n.notification;
          if (!notif || notif.type !== "todo_comment") return;

          let notifData = {};
          if (typeof notif.data === "string") {
            try {
              notifData = JSON.parse(notif.data);
            } catch (e) {}
          } else {
            notifData = notif.data || {};
          }

          if (String(notifData.todo_item_id) === String(itemId)) {
            // Update UI State Global secara Optimistik
            if (markAsReadLocal) markAsReadLocal(n.id);
            // Sync dengan Database
            sendMarkAsRead(n.id);
          }
        });
      }
    }
    // 2. Tambahkan 'refetch' ke dalam dependency array
  }, [
    open,
    itemId,
    notifications,
    markAsReadLocal,
    onOpen,
    sendMarkAsRead,
    refetch,
  ]);
  const displayComments = (comments || []).concat(optimistic);

  useEffect(() => {
    if (open) {
      setTimeout(
        () => listEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    }
  }, [open, displayComments.length]);

  const send = useCallback(() => {
    if (!text.trim()) return;

    const quotePrefix = replyingTo
      ? `↪ ${replyingTo.created_by_name || "Pengguna"}: "${String(replyingTo.message || "").slice(0, 100)}"\n`
      : "";
    const composedMessage = `${quotePrefix}${text}`.trim();

    const temp = {
      id: `temp-${Date.now()}`,
      message: composedMessage,
      created_at: new Date().toISOString(),
      created_by_name: me?.name || "Saya",
      created_by_avatar: me?.avatar,
      __optimistic: true,
    };

    setOptimistic((prev) => [...prev, temp]);
    const payload = composedMessage;
    setText("");
    setReplyingTo(null);

    setTimeout(
      () => listEndRef.current?.scrollIntoView({ behavior: "smooth" }),
      0,
    );

    addComment(
      { message: payload, type: "text" },
      {
        onSuccess: async () => {
          // 1. Tunggu refetch selesai menarik data terbaru dari server
          await refetch();

          // 2. Baru hapus komentar optimistik setelah data asli siap
          setOptimistic((prev) => prev.filter((c) => c.id !== temp.id));
        },
        onError: () => {
          refetch().then((res) => {
            const serverList = Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res?.data)
                ? res.data
                : [];

            const matched = serverList.some(
              (c) => String(c?.message ?? "") === String(payload ?? ""),
            );

            if (matched) {
              setOptimistic((prev) => prev.filter((c) => c.id !== temp.id));
            } else {
              setOptimistic((prev) =>
                prev.map((c) =>
                  c.id === temp.id
                    ? { ...c, __optimistic: false, __error: true }
                    : c,
                ),
              );
            }
          });
        },
      },
    );
  }, [
    text,
    replyingTo,
    me,
    addComment,
    refetch,
    // sendNotification hapus dari dependency karena tidak lagi digunakan
  ]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleInputResize = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="group relative flex items-center justify-center p-1.5 text-[#8b9cac] hover:text-[#fed818] hover:bg-[#1a2b38] rounded-md transition-all"
          title="Komentar"
        >
          <MessageSquare
            size={16}
            className="transition-transform group-hover:scale-110"
          />
          {unreadCountData > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#fed818] text-[10px] font-bold text-[#0f1a22] ring-2 ring-[#152733]">
              {unreadCountData > 99 ? "99+" : unreadCountData}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <div onClick={(e) => e.stopPropagation()}>
        <PopoverContent
          align="start"
          side="left"
          sideOffset={24}
          className="w-[380px] p-0 bg-[#121e29] border border-[#233545] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-xl flex flex-col overflow-hidden font-sans"
          onPointerDownOutside={(e) => {
            const el = e.target;
            if (el && inputRef.current && inputRef.current.contains(el))
              e.preventDefault();
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-[#0d161e] border-b border-[#233545]">
            <div>
              <h3 className="font-semibold text-[13px] text-[#e2e8f0]">
                Aktivitas
              </h3>
              <p className="text-[11px] text-[#64748b] font-medium truncate max-w-[220px]">
                {task?.task_name || "Detail Tugas"}
              </p>
            </div>
            <div className="text-[10px] font-medium text-[#94a3b8] bg-[#1a2b38] px-2 py-1 rounded-md border border-[#2d4256]">
              {displayComments.length} Komentar
            </div>
          </div>

          <div className="flex flex-col gap-5 p-4 max-h-[350px] overflow-y-auto bg-[#121e29] custom-scrollbar">
            {displayComments?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageSquare size={28} className="text-[#33475b] mb-3" />
                <p className="text-[13px] font-medium text-[#64748b]">
                  Belum ada komentar.
                </p>
              </div>
            ) : (
              displayComments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  onReply={(cm) => setReplyingTo(cm)}
                />
              ))
            )}
            <div ref={listEndRef} className="h-1" />
          </div>

          <div className="p-3 bg-[#0d161e] border-t border-[#233545]">
            {replyingTo ? (
              <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-[#2d4256] bg-[#15212b] px-3 py-2">
                <div className="text-[11px] text-[#93c5fd]">
                  Balas ke {replyingTo.created_by_name || "Pengguna"}:
                  <div className="mt-1 text-[#cbd5e1]">
                    {String(replyingTo.message || "").slice(0, 120)}
                    {String(replyingTo.message || "").length > 120 ? "…" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-[#94a3b8] hover:text-[#e2e8f0]"
                  aria-label="Batal balas"
                >
                  ×
                </button>
              </div>
            ) : null}
            <div className="relative rounded-lg border border-[#2d4256] bg-[#121e29] focus-within:border-[#3b82f6] focus-within:ring-2 focus-within:ring-[#3b82f6]/20 transition-all duration-200">
              <textarea
                ref={inputRef}
                value={text}
                onChange={handleInputResize}
                onKeyDown={handleKeyDown}
                placeholder="Tulis pembaruan..."
                className="w-full min-h-[44px] max-h-[120px] py-3 px-3.5 pr-12 resize-none outline-none text-[13px] text-[#e2e8f0] bg-transparent placeholder-[#64748b] custom-scrollbar"
              />
              <button
                type="button"
                onClick={send}
                disabled={!text.trim()}
                className="absolute right-2 bottom-2 p-1.5 rounded-md text-[#121e29] bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#1a2b38] disabled:text-[#475569] transition-colors flex items-center justify-center"
              >
                <SendHorizontal
                  size={14}
                  className={text.trim() ? "translate-x-[-1px]" : ""}
                />
              </button>
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-[10px] text-[#64748b] font-medium">
                Tekan{" "}
                <kbd className="px-1 py-[1px] rounded bg-[#1a2b38] border border-[#2d4256] font-sans">
                  Enter
                </kbd>{" "}
                untuk mengirim
              </span>
            </div>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
}
