"use client";

import { create } from "zustand";

export const useNotificationsStore = create((set) => ({
  notifications: [],
  loading: false,

  markAsRead: null,
  markAllAsRead: null,

  setNotifications: (notifications) => set({ notifications, loading: false }),

  setLoading: (loading) => set({ loading }),

  setMarkAsReadAction: (fn) => set({ markAsRead: fn }),
  setMarkAllAsReadAction: (fn) => set({ markAllAsRead: fn }),

  addNotification: (item) =>
    set((state) => {
      const exists = state.notifications.some(
        (n) => String(n.id) === String(item?.id),
      );
      if (exists) return {};
      return { notifications: [item, ...state.notifications] };
    }),

  markAsReadLocal: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    })),

  markAllAsReadLocal: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      })),
    })),
}));
