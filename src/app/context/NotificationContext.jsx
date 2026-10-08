"use client";

import { useEffect } from "react";
import { useNotificationsStore } from "@/hooks/use-notifications";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { useAuthStore } from "@/hooks/auth-store";
import { createEcho } from "@/lib/echo";
import { toast } from "sonner";

// Audio initialization component
function AudioInitializer() {
  useEffect(() => {
    // Initialize audio context for cross-platform compatibility
    const initAudio = async () => {
      try {
        const audioContext = new (
          window.AudioContext || window.webkitAudioContext
        )();
        // Resume context to enable audio playback
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }
        // Preload notification sound
        const response = await fetch("/asset/sounds/notif-sound.mp3");
        const arrayBuffer = await response.arrayBuffer();
        await audioContext.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.warn("Audio initialization failed:", error);
      }
    };

    initAudio();
  }, []);

  return null;
}

export const NotificationProvider = ({ children }) => {
  const {
    setNotifications,
    setLoading,
    markAsReadLocal,
    markAllAsReadLocal,
    setMarkAsReadAction,
    setMarkAllAsReadAction,
    addNotification,
  } = useNotificationsStore();

  const { token, isHydrated, user } = useAuthStore();
  const seenIdsRef =
    typeof window !== "undefined"
      ? (window.__notif_seen_ids__ = window.__notif_seen_ids__ || new Set())
      : { has: () => true, add: () => {} };

  const { data, isLoading, refetch } = useApiFetch(
    "notifications",
    "/notifications",
    {},
    !!token,
  );

  const { mutate } = usePost((id) => `/notifications/${id}/read`);
  const { mutate: mutateReadAll } = usePost("/notifications/read-all");

  // sync list
  useEffect(() => {
    if (data) setNotifications(data);
  }, [data, setNotifications]);

  // fallback "pseudo-realtime" from polling to RealtimeBell
  useEffect(() => {
    const list = Array.isArray(data) ? data : [];
    list.forEach((rec) => {
      const id = rec?.id;
      if (!id || seenIdsRef.has(id)) return;
      seenIdsRef.add(id);
      const payload = {
        id,
        type: rec?.notification?.type,
        title: rec?.notification?.title || "Notification",
        message: rec?.notification?.message || "-",
        data: rec?.notification?.data || {},
        created_by: rec?.notification?.created_by,
        created_by_name: rec?.notification?.created_by_name || "User",
      };
      try {
        window.dispatchEvent(
          new CustomEvent("realtimeNotification", { detail: payload }),
        );
        window.dispatchEvent(
          new CustomEvent("openNotificationBell", { detail: payload }),
        );
      } catch {}
    });
  }, [data, seenIdsRef]);

  // sync loading
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // polling
  useEffect(() => {
    if (!isHydrated || !token) return;
    const interval = setInterval(refetch, 10000);
    return () => clearInterval(interval);
  }, [isHydrated, token, refetch]);

  // inject markAsRead action
  useEffect(() => {
    if (!isHydrated || !token) {
      setMarkAsReadAction(null);
      setMarkAllAsReadAction(null);
      return;
    }

    setMarkAsReadAction((id) => {
      if (String(id).startsWith("rt-")) {
        markAsReadLocal(id);
        return;
      }
      mutate(id, {
        onSuccess: () => markAsReadLocal(id),
      });
    });

    setMarkAllAsReadAction(() => {
      mutateReadAll(
        {},
        {
          onSuccess: () => markAllAsReadLocal(),
        },
      );
    });
  }, [
    isHydrated,
    token,
    mutate,
    mutateReadAll,
    markAsReadLocal,
    markAllAsReadLocal,
    setMarkAsReadAction,
    setMarkAllAsReadAction,
  ]);

  // realtime
  useEffect(() => {
    if (!isHydrated || !token || !user?.id) return;
    const echo = createEcho(token);
    if (!echo) return;

    const channelName = `App.Domain.Users.Models.User.${user.id}`;
    const channel = echo
      .private(channelName)
      .listen(".notification.created", (event) => {
        refetch();

        try {
          const audio = new Audio("/asset/sounds/notif-sound.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}

        // PERBAIKAN 1: Memisahkan dispatch event agar tidak tertumpuk
        try {
          window.dispatchEvent(
            new CustomEvent("realtimeNotification", { detail: event }),
          );
          window.dispatchEvent(
            new CustomEvent("openNotificationBell", { detail: event }),
          );
        } catch {}

        try {
          const synthetic = {
            id: `rt-${event.id}`,
            read_at: null,
            notification: {
              id: event.id,
              title: event.title || "Notification",
              message: event.message || "-",
              type: event.type,
              data: event.data || {},
              created_by: event.created_by,
              created_by_name: event.created_by_name,
              created_by_avatar: event.created_by_avatar,
              created_at: event.created_at,
            },
          };
          addNotification(synthetic);
        } catch {}

        if (event?.type === "todo_comment" && event?.data?.todo_item_id) {
          const sender = event?.created_by_name || "Pengguna";
          const message = String(event?.message || "").slice(0, 100);
          toast(`${sender}: ${message}`, {
            description: "Komentar baru pada tugas",
            action: {
              label: "Buka",
              onClick: () => {
                try {
                  window.dispatchEvent(
                    new CustomEvent("openTodoComment", {
                      detail: { itemId: event.data.todo_item_id },
                    }),
                  );
                } catch {}
              },
            },
          });
        }
      });

    return () => {
      if (echo && channelName) {
        echo.leave(channelName);
        if (typeof echo.disconnect === "function") {
          echo.disconnect();
        }
      }
    };
  }, [isHydrated, token, user?.id, refetch]);

  return (
    <>
      <AudioInitializer />
      {children}
    </>
  );
};
