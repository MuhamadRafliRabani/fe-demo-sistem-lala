"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ---------------------------------------------------------------------------
// ConfirmDialog
//
// Komponen alert dialog generik untuk aksi yang butuh konfirmasi (delete,
// deactivate, dll). Controlled dari luar via `open` / `onOpenChange`.
//
// PENTING: AlertDialogAction di-style LANGSUNG via buttonVariants (bukan
// dibungkus komponen <Button> terpisah lewat prop `render`). AlertDialogAction
// dari Base UI butuh forward attribute/handler internalnya sendiri supaya
// bisa berfungsi sebagai trigger yang benar — membungkusnya dengan komponen
// lain lewat `render` bikin sebagian handler & class ketimpa/gagal nyambung.
//
// Props:
// - open, onOpenChange       : kontrol buka/tutup
// - title, description       : isi dialog
// - confirmLabel/cancelLabel : teks tombol (default: "Lanjutkan" / "Batal")
// - variant                  : "default" | "destructive" — warna tombol & ikon
// - icon                     : opsional, elemen ikon di AlertDialogMedia
// - isPending                : loading state eksternal (opsional)
// - onConfirm()               : dipanggil saat tombol confirm ditekan. Boleh
//                                async; dialog otomatis nunggu sebelum close
//                                (kalau tidak throw error).
// ---------------------------------------------------------------------------
export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Apakah kamu yakin?",
  description,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batal",
  variant = "default",
  icon,
  isPending = false,
  onConfirm,
}) {
  const [internalPending, setInternalPending] = useState(false);
  const pending = isPending || internalPending;
  const isDestructive = variant === "destructive";

  const handleConfirm = async (e) => {
    e.preventDefault(); // cegah auto-close sebelum async selesai
    if (!onConfirm) return;
    try {
      setInternalPending(true);
      await onConfirm();
      onOpenChange(false);
    } catch {
      // onConfirm reject -> dialog tetap terbuka. Error ditangani di
      // pemanggil (mis. toast.error), di sini cukup jangan close.
    } finally {
      setInternalPending(false);
    }
  };

  const handleOpenChange = (next) => {
    if (!next && pending) return; // jangan bisa ditutup saat sedang proses
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          {icon && (
            <AlertDialogMedia
              className={cn(
                "flex size-11 items-center justify-center rounded-full",
                isDestructive
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              {icon}
            </AlertDialogMedia>
          )}
          <AlertDialogTitle className="text-base font-semibold">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={pending}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={handleConfirm}
            className={cn(
              buttonVariants({
                variant: isDestructive ? "destructive" : "default",
              }),
              "gap-2",
            )}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
