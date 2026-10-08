"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

const ConfirmDialogContext = createContext(null);

export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState(null); // { options, resolve }

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleOpenChange = (open) => {
    if (!open) {
      state?.resolve(false);
      setState(null);
    }
  };

  const handleConfirm = async () => {
    try {
      if (state?.options.onConfirm) {
        await state.options.onConfirm();
      }
      state?.resolve(true);
      setState(null);
    } catch {
      state?.resolve(false);
      // biarkan dialog tetap terbuka agar user bisa retry/lihat error
    }
  };

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!state}
        onOpenChange={handleOpenChange}
        onConfirm={handleConfirm}
        {...state?.options}
      />
    </ConfirmDialogContext.Provider>
  );
}

// Dipakai di komponen mana pun: const confirm = useConfirmDialog();
export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error(
      "useConfirmDialog harus dipakai di dalam <ConfirmDialogProvider>",
    );
  }
  return ctx;
}
