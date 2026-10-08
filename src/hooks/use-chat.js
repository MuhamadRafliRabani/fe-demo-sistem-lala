"use client";

import { usePost } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useEffect, useState, useRef, useMemo } from "react";
import { createEcho } from "@/lib/echo";
import { useAuthStore } from "@/hooks/auth-store";

let notificationAudio = null;

const playNotificationSound = () => {
  if (typeof window === "undefined") return;
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio("/asset/sounds/notif-sound.mp3");
      notificationAudio.volume = 0.5;
    }
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {});
  } catch (error) {
    console.warn("Notification sound failed:", error);
  }
};

// Global unread counts management
let unreadCounts = {};
const unreadListeners = new Set();

const updateUnreadCount = (roomId, count) => {
  unreadCounts[roomId] = Math.max(0, Number(count) || 0);
  localStorage.setItem(`chat_unread_${roomId}`, count.toString());
  unreadListeners.forEach(listener => listener({ ...unreadCounts }));
};

const getUnreadCount = (roomId) => {
  return parseInt(localStorage.getItem(`chat_unread_${roomId}`) || '0');
};

const subscribeUnreadCounts = (callback) => {
  unreadListeners.add(callback);
  callback({ ...unreadCounts });
  return () => unreadListeners.delete(callback);
};

// Initialize unread counts from localStorage
if (typeof window !== 'undefined') {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('chat_unread_')) {
      const roomId = key.replace('chat_unread_', '');
      unreadCounts[roomId] = parseInt(localStorage.getItem(key) || '0');
    }
  });
}

/**
 * Hook for managing unread message counts globally
 */
export function useUnreadCounts() {
  const [counts, setCounts] = useState({ ...unreadCounts });

  useEffect(() => {
    const unsubscribe = subscribeUnreadCounts(setCounts);
    return unsubscribe;
  }, []);

  return counts;
}

/**
 * Hook untuk interact dengan chat rooms
 */
export function useChatRooms(selectedRoomId = null) {
  const { data: response = null, isLoading, error, refetch } = useApiFetch(
    ["chats"],
    "/chats"
  );
  const rooms = useMemo(() => response?.data || [], [response?.data]);
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const [localRooms, setLocalRooms] = useState(rooms);
  const echoRef = useRef(null);

  useEffect(() => {
    setLocalRooms(rooms);
  }, [rooms]);

  useEffect(() => {
    if (!rooms.length) return;
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!echoRef.current) {
      echoRef.current = createEcho(token);
    }

    const echo = echoRef.current;
    if (!echo) return;

    rooms.forEach((room) => {
      const channel = echo.private(`chat.${room.id}`);
      channel.listen(".message.sent", (event) => {
        const message = event?.message ? event.message : event;
        if (!message || message.room_id !== room.id) return;

        setLocalRooms((currentRooms) =>
          currentRooms.map((currentRoom) => {
            if (currentRoom.id !== room.id) return currentRoom;

            return {
              ...currentRoom,
              last_message: {
                message: message.message,
                sent_at: message.sent_at,
              },
            };
          })
        );

        if (
          message.user_id !== currentUserId &&
          String(room.id) !== String(selectedRoomId)
        ) {
          const next = (unreadCounts[room.id] || 0) + 1;
          updateUnreadCount(room.id, next);
        }
      });
    });

    return () => {
      rooms.forEach((room) => {
        echo.leave(`chat.${room.id}`);
      });
    };
  }, [rooms, currentUserId, selectedRoomId]);

  const { mutate: createIndividual } = usePost("/chats/individual", {
    invalidate: [["chats"]],
  });
  const { mutate: createGroup } = usePost("/chats/group", {
    invalidate: [["chats"]],
  });

  return {
    rooms: localRooms,
    isLoading,
    error,
    refetch,
    createIndividual,
    createGroup,
  };
}

/**
 * Hook untuk get messages dari room
 */
export function useChatMessages(roomId, options = {}) {
  const [page, setPage] = useState(1);
  const [pendingMessagesByRoom, setPendingMessagesByRoom] = useState({});
  const { onNewMessage } = options;
  const { data: response = null, isLoading, error, refetch } = useApiFetch(
    ["chat-messages", roomId, page],
    roomId ? `/chats/${roomId}/messages` : "/chats/0/messages",
    { page },
    !!roomId
  );

  const responseMessages = useMemo(() => {
    if (!response?.data) return [];
    return [...response.data].sort(
      (a, b) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );
  }, [response.data]);

  const pendingMessages = useMemo(
    () => (roomId ? pendingMessagesByRoom[roomId] || [] : []),
    [pendingMessagesByRoom, roomId]
  );

  const messages = useMemo(() => {
    const uniqueMessages = new Map();

    responseMessages.forEach((message) => {
      if (message?.id) {
        uniqueMessages.set(message.id, message);
      }
    });

    pendingMessages.forEach((message) => {
      if (message?.id && !uniqueMessages.has(message.id)) {
        uniqueMessages.set(message.id, message);
      }
    });

    return [...uniqueMessages.values()].sort(
      (a, b) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );
  }, [responseMessages, pendingMessages]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const interval = setInterval(() => {
      refetch();
    }, 3000);

    return () => clearInterval(interval);
  }, [roomId, refetch]);

  // Laravel Echo listener for real-time messages
  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const echo = createEcho(token);
    if (!echo) return;

    const channel = echo.private(`chat.${roomId}`)
      .listen(".message.sent", (event) => {
        const incomingMessage = event?.message ? event.message : event;

        if (!incomingMessage) return;
        setPendingMessagesByRoom((prevMessagesByRoom) => {
          const roomMessages = prevMessagesByRoom[roomId] || [];
          if (roomMessages.some((message) => message?.id === incomingMessage.id)) {
            return prevMessagesByRoom;
          }
          return {
            ...prevMessagesByRoom,
            [roomId]: [...roomMessages, incomingMessage],
          };
        });

        if (typeof onNewMessage === "function") {
          onNewMessage(incomingMessage);
        }
      });

    return () => {
      echo.leave(`chat.${roomId}`);
      if (typeof echo.disconnect === "function") {
        echo.disconnect();
      }
    };
  }, [roomId, onNewMessage]);

  const pagination = response?.pagination || null;

  const { mutate: sendMessage } = usePost(`/chats/${roomId}/messages`, {
    invalidate: [[`chat-messages`, roomId, page], ["chats"]],
  });

  const { mutate: deleteMessage } = usePost(
    `/chats/${roomId}/messages/[messageId]`,
    {
      invalidate: [[`chat-messages`, roomId, page], ["chats"]],
    }
  );

  const resetUnreadCount = () => {
    updateUnreadCount(roomId, 0);
  };

  return {
    messages,
    pagination,
    isLoading,
    error,
    refetch,
    sendMessage,
    deleteMessage,
    page,
    setPage,
    resetUnreadCount,
  };
}

/**
 * Hook untuk get single room detail
 */
export function useChatRoom(roomId) {
  const { data: response = null, isLoading, error, refetch } = useApiFetch(
    ["chat-room", roomId],
    roomId ? `/chats/${roomId}` : "/chats/0",
    undefined,
    !!roomId
  );

  const room = response?.data?.room || null;

  const { mutate: addMember } = usePost(`/chats/${roomId}/members`, {
    invalidate: [[`chat-room`, roomId]],
  });

  const { mutate: removeMember } = usePost(`/chats/${roomId}/members/[memberId]`, {
    invalidate: [[`chat-room`, roomId]],
  });

  const { mutate: updateRoom } = usePost(`/chats/${roomId}`, {
    invalidate: [[`chat-room`, roomId]],
  });

  return {
    room,
    isLoading,
    error,
    refetch,
    addMember,
    removeMember,
    updateRoom,
  };
}
