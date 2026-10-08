"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { FormRow } from "@/components/form-row";

import { usePost, usePut } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { Input } from "./ui/input";
const today = new Date();
today.setHours(0, 0, 0, 0);

const schema = z.object({
  action: z.string(),
  feedback: z.string().min(8, "Masukan Keterangan Revisi"),
});

export function RevisiModal({ open, setOpen, id, refetch, name }) {
  const { mutate, isPending } = usePut(`/tasks/${id}`, {
    invalidate: [["tasks-v2"], ["designer-tasks-dashboard"], ["tasks"]],
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      action: "revise",
      feedback: "",
    },
  });

  // SUBMIT
  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            setOpen();
            resolve();
          },
          onError: (err) => {
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menyimpam...",
        success: "Survey berhasil ditambahkan!",
        error: (msg) => msg ?? "Gagal menyimpan data!",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Revisi</DialogTitle>
          <DialogDescription>
            Cukup kirim link File Feedback user.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 mt-2" onSubmit={handleSubmit(onSubmit)}>
          {/* ======================== */}
          {/* TANGGAL */}
          {/* ======================== */}
          <div>
            <Controller
              name="feedback"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Masukan link feedback"
                  className="w-full"
                  {...field}
                />
              )}
            />
            {errors.feedback && (
              <p className="text-red-500 text-sm">{errors.feedback.message}</p>
            )}
          </div>

          {/* ======================== */}
          {/* ACTION BUTTON */}
          {/* ======================== */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={setOpen}>
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
