"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RichTextEditor from "@/components/rich-text-editor";
import { usePost } from "@/hooks/use-api-mutation";

const faqSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Kode wajib diisi")
    .max(50, "Kode maksimal 50 karakter"),
  question: z
    .string()
    .trim()
    .min(1, "Pertanyaan wajib diisi")
    .max(300, "Pertanyaan maksimal 300 karakter"),
  answer: z.string().trim().min(1, "Jawaban wajib diisi"),
});

const EMPTY_VALUES = { code: "", question: "", answer: "" };

// Props:
// - open, onOpenChange : kontrol buka/tutup dialog
// - onSuccess()          : dipanggil setelah create berhasil (mis. refetch list)
export default function CreateFaqModal({ open, onOpenChange, onSuccess }) {
  const { mutate: createFaq, isPending } = usePost("/master/faqs");

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Kosongkan form tiap kali dialog dibuka
  useEffect(() => {
    if (open) reset(EMPTY_VALUES);
  }, [open, reset]);

  const handleClose = (next) => {
    if (!next && isPending) return; // jangan bisa ditutup saat sedang submit
    onOpenChange(next);
  };

  const submit = handleSubmit((values) => {
    toast.promise(
      new Promise((resolve, reject) => {
        createFaq(values, {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
            resolve();
          },
          onError: (error) => {
            reject(error?.response?.data?.message || "Gagal menambah FAQ");
          },
        });
      }),
      {
        loading: "Menambah FAQ...",
        success: "FAQ berhasil ditambahkan",
        error: (message) => message,
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Tambah FAQ</DialogTitle>
          <DialogDescription>
            Tambahkan pertanyaan baru beserta jawabannya ke Master FAQ.
          </DialogDescription>
        </DialogHeader>

        <form
          id="faq-create-form"
          onSubmit={submit}
          className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="faq-create-code">Kode</Label>
              <Input
                id="faq-create-code"
                placeholder="FAQ-17"
                disabled={isPending}
                aria-invalid={!!errors.code}
                {...register("code")}
              />
              {errors.code && (
                <p className="text-xs text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="faq-create-question">Pertanyaan</Label>
              <Input
                id="faq-create-question"
                placeholder="Contoh: Berapa lama proses desain 3D?"
                disabled={isPending}
                aria-invalid={!!errors.question}
                {...register("question")}
              />
              {errors.question && (
                <p className="text-xs text-destructive">
                  {errors.question.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faq-create-answer">Jawaban</Label>
            <Controller
              control={control}
              name="answer"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  minHeight={220}
                  placeholder="Tulis jawaban untuk klien di sini..."
                />
              )}
            />
            {errors.answer && (
              <p className="text-xs text-destructive">
                {errors.answer.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="faq-create-form"
            disabled={isPending}
            className="gap-2"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Tambah FAQ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
