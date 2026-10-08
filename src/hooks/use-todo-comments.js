"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { createEcho } from "@/lib/echo";
import { useAuthStore } from "@/hooks/auth-store";

let commentCounts = {};
const commentListeners = new Set();

const notifyCommentListeners = () => {
  const snapshot = { ...commentCounts };
  commentListeners.forEach((fn) => fn(snapshot));
};

const readInitialCounts = () => {
  if (typeof window === "undefined") return;
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("comment_unread_")) {
      const id = k.replace("comment_unread_", "");
      commentCounts[id] = parseInt(localStorage.getItem(k) || "0");
    }
  });
};
if (typeof window !== "undefined") readInitialCounts();

export function useCommentCounts() {
  const [counts, setCounts] = useState({ ...commentCounts });
  useEffect(() => {
    const handler = (snapshot) => setCounts(snapshot);
    commentListeners.add(handler);
    return () => commentListeners.delete(handler);
  }, []);
  return counts;
}

export function incrementCommentCount(itemId) {
  const key = String(itemId);
  commentCounts[key] = Math.max(0, (commentCounts[key] || 0) + 1);
  if (typeof window !== "undefined") {
    localStorage.setItem(`comment_unread_${key}`, String(commentCounts[key]));
  }
  notifyCommentListeners();
}

export function resetCommentCount(itemId) {
  const key = String(itemId);
  commentCounts[key] = 0;
  if (typeof window !== "undefined") {
    localStorage.setItem(`comment_unread_${key}`, "0");
  }
  notifyCommentListeners();
}

export function useTodoComments(itemId, options = {}) {
  const { enabled = true } = options;
  const authState = useAuthStore((state) => state || {});
  const user = authState?.user || null;
  const token = authState?.token || null;
  const userId = user?.id || null;
  const { data, isLoading, refetch } = useApiFetch(
    ["todo-comments", itemId],
    itemId
      ? `/work-todo-items/${itemId}/comments`
      : "/work-todo-items/0/comments",
    undefined,
    !!itemId && enabled,
  );

  const { mutate: addComment } = usePost(
    itemId
      ? `/work-todo-items/${itemId}/comments`
      : "/work-todo-items/0/comments",
    { invalidate: [["todo-comments", itemId]] },
  );

  const echoRef = useRef(null);

  useEffect(() => {
    // HAPUS !enabled dari pengecekan ini agar Echo selalu berjalan di background
    if (!itemId || !token || !userId) return;

    const echo = createEcho(token);
    echoRef.current = echo;
    if (!echo) return;

    const channelName = `App.Domain.Users.Models.User.${userId}`;
    const channel = echo
      .private(channelName)
      .listen(".notification.created", (event) => {
        if (
          event?.type === "todo_comment" &&
          String(event?.data?.todo_item_id) === String(itemId)
        ) {
          if (String(event?.created_by) !== String(userId)) {
            incrementCommentCount(itemId);
          }
          // Otomatis tarik komentar terbaru saat ada notifikasi masuk
          refetch();
        }
      });

    return () => {
      echo.leave(channelName);
      if (typeof echo.disconnect === "function") echo.disconnect();
    };
    // HAPUS enabled dari dependency array di bawah ini
  }, [itemId, token, userId, refetch]);

  useEffect(() => {
    if (!itemId || !enabled) return;
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [itemId, enabled, refetch]);

  const comments = useMemo(() => {
    const raw = data?.data || [];
    const normalized = raw.map((c) => {
      const message =
        c?.message ?? c?.comment ?? c?.content ?? c?.body ?? c?.text ?? "";
      const createdAt =
        c?.created_at ?? c?.createdAt ?? c?.sent_at ?? c?.date ?? null;
      const creatorName =
        c?.created_by_name ??
        c?.user_name ??
        c?.created_by?.name ??
        c?.user?.name ??
        c?.sender?.name ??
        null;
      return {
        ...c,
        message,
        created_at: createdAt,
        created_by_name: creatorName,
      };
    });
    return normalized;
  }, [data?.data]);

  return {
    comments,
    isLoading,
    refetch,
    addComment,
  };
}
