"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { usePut } from "@/hooks/use-api-mutation";
import { useEffect } from "react";

const schema = z.object({
  action: z.string(),
  priority_order: z.string().optional(),
});

export function PriorityModal({
  open,
  setOpen,
  id,
  currentPriority,
  refetch,
}) {
  const { mutate, isPending } = usePut(`/tasks/${id}`, {
    invalidate: [["tasks-v2"], ["designer-tasks-dashboard"], ["tasks"]],
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      action: "set_priority",
      priority_order: currentPriority ? String(currentPriority) : "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        action: "set_priority",
        priority_order: currentPriority ? String(currentPriority) : "",
      });
    }
  }, [open, currentPriority, reset]);

  const onSubmit = (data) => {
    const payload = {
      action: "set_priority",
      priority_order:
        data.priority_order && data.priority_order.trim() !== ""
          ? Number(data.priority_order)
          : null,
    };

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(payload, {
          onSuccess: () => {
            setOpen(false);
            resolve();
          },
          onError: (err) => reject(err?.response?.data?.message),
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Priority berhasil disimpan!",
        error: (msg) => msg ?? "Gagal menyimpan data!",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atur Priority</DialogTitle>
          <DialogDescription>
            Isi angka priority. Kosongkan untuk menghapus priority.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 mt-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Controller
              name="priority_order"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  min={1}
                  placeholder="Contoh: 1"
                  className="w-full"
                  {...field}
                />
              )}
            />
            {errors.priority_order && (
              <p className="text-red-500 text-sm">
                {errors.priority_order.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
