"use client";

import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaqAnswer } from "@/components/faq-answer";

// Props:
// - open, onOpenChange : kontrol buka/tutup
// - faq                 : data FAQ lengkap (dari row table, tidak perlu fetch ulang)
// - onEdit()             : dipanggil saat tombol "Edit" ditekan (buka EditFaqModal)
export default function ViewFaqModal({ open, onOpenChange, faq, onEdit }) {
  if (!faq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="font-mono text-[11px] font-normal"
            >
              {faq.code || "FAQ"}
            </Badge>
          </div>
          <DialogTitle className="text-base leading-6">
            {faq.question}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <FaqAnswer text={faq.answer} />
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            <Pencil className="size-4" />
            Edit FAQ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
