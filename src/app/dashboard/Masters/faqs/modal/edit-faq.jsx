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
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePut } from "@/hooks/use-api-mutation";

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
// - faqId               : id FAQ yang diedit (wajib — modal ini fetch datanya sendiri)
// - onSuccess()          : dipanggil setelah update berhasil (mis. refetch list)
export default function EditFaqModal({ open, onOpenChange, faqId, onSuccess }) {
  const { data, isLoading: isLoadingData } = useApiFetch(
    faqId ? `faq-${faqId}` : null,
    faqId ? `/master/faqs/${faqId}` : null,
    { enabled: open && !!faqId },
  );

  const { mutate: updateFaq, isPending } = usePut(`/master/faqs/${faqId}`);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Setiap dialog dibuka & data datang, isi ulang form
  useEffect(() => {
    if (open && data?.data) {
      reset({ ...EMPTY_VALUES, ...data.data });
    }
  }, [open, data, reset]);

  const handleClose = (next) => {
    if (!next && isPending) return; // jangan bisa ditutup saat sedang submit
    onOpenChange(next);
  };

  const submit = handleSubmit((values) => {
    toast.promise(
      new Promise((resolve, reject) => {
        updateFaq(values, {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
            resolve();
          },
          onError: (error) => {
            reject(error?.response?.data?.message || "Gagal mengupdate FAQ");
          },
        });
      }),
      {
        loading: "Menyimpan perubahan FAQ...",
        success: "FAQ berhasil diupdate",
        error: (message) => message,
      },
    );
  });

  const isLoading = !!faqId && isLoadingData;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit FAQ</DialogTitle>
          <DialogDescription>
            Perbarui pertanyaan dan jawaban FAQ ini.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            Memuat data FAQ...
          </div>
        ) : (
          <>
            <form
              id="faq-edit-form"
              onSubmit={submit}
              className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="faq-edit-code">Kode</Label>
                  <Input
                    id="faq-edit-code"
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
                  <Label htmlFor="faq-edit-question">Pertanyaan</Label>
                  <Input
                    id="faq-edit-question"
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
                <Label htmlFor="faq-edit-answer">Jawaban</Label>
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
                form="faq-edit-form"
                disabled={isPending || !isDirty}
                className="gap-2"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
