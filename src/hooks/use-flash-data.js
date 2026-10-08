import { useEffect } from "react";

export function useFlashData(watch, reset, storageKey) {
  // Load saved data (once on mount)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      reset(JSON.parse(saved));
    }
  }, [reset, storageKey]);

  // Save on every change (with debounce)
  useEffect(() => {
    const subscription = watch((data) => {
      const timeout = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(data));
      }, 300);

      return () => clearTimeout(timeout);
    });

    return () => subscription.unsubscribe();
  }, [watch, storageKey]);
}
