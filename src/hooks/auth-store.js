import { create } from "zustand";

const STORAGE_KEYS = {
  token: "token",
  user: "user",
  resetAt: "auth_reset_at",
};

const RESET_HOUR = 1;
const RESET_MINUTE = 0;

const safeStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

const clearAuthSession = () => {
  safeStorage.removeItem(STORAGE_KEYS.token);
  safeStorage.removeItem(STORAGE_KEYS.user);
  safeStorage.removeItem("auth_error");
  safeStorage.removeItem("validasi_error");
};

const getNextResetAt = (now = new Date()) => {
  const nextReset = new Date(now);
  nextReset.setHours(RESET_HOUR, RESET_MINUTE, 0, 0);

  if (nextReset.getTime() <= now.getTime()) {
    nextReset.setDate(nextReset.getDate() + 1);
  }

  return nextReset.getTime();
};

const ensureDailyReset = () => {
  if (typeof window === "undefined") return false;

  try {
    const savedResetAt = Number(safeStorage.getItem(STORAGE_KEYS.resetAt) || 0);

    if (!savedResetAt || Date.now() >= savedResetAt) {
      clearAuthSession();
      safeStorage.setItem(STORAGE_KEYS.resetAt, String(getNextResetAt()));
      return true;
    }

    return false;
  } catch {
    clearAuthSession();
    safeStorage.setItem(STORAGE_KEYS.resetAt, String(getNextResetAt()));
    return true;
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  isAdmin: false,

  setAuth: (user, token) =>
    set(() => {
      try {
        safeStorage.setItem(STORAGE_KEYS.token, token);
        safeStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
        safeStorage.setItem(STORAGE_KEYS.resetAt, String(getNextResetAt()));
      } catch {
        clearAuthSession();
      }

      return { user, token, isAdmin: Number(user?.role_id) === 1 || false };
    }),

  logout: () =>
    set(() => {
      clearAuthSession();
      return { user: null, token: null, isAdmin: false };
    }),

  loadFromStorage: () =>
    set(() => {
      ensureDailyReset();

      let user = null;
      let token = safeStorage.getItem(STORAGE_KEYS.token);

      try {
        user = JSON.parse(safeStorage.getItem(STORAGE_KEYS.user) || "null");
      } catch {
        user = null;
        clearAuthSession();
        token = null;
      }

      return {
        user,
        token,
        isAdmin: Number(user?.role_id) === 1 || false,
        isHydrated: true,
      };
    }),
}));
