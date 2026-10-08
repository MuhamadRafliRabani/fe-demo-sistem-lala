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

import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { usePut } from "@/hooks/use-api-mutation";
import { useEffect } from "react";

const schema = z.object({
  action: z.string(),
  result_file: z.array(z.string()).min(1, "Minimal 1 file"),
});

export function SubmitModal({ open, setOpen, id, refetch }) {
  const { mutate, isPending } = usePut(`/tasks/${id}`, {
    invalidate: [["tasks-v2"], ["designer-tasks-dashboard"], ["tasks"]],
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      action: "submit",
      result_file: [""],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "result_file",
  });

  useEffect(() => {
    if (fields.length === 0) append("");
  }, [fields, append]);

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            setOpen(false);
            resolve();
          },
          onError: (err) => reject(err?.response?.data?.message),
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Berhasil submit result!",
        error: (msg) => msg ?? "Gagal menyimpan data!",
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Result</DialogTitle>
          <DialogDescription>
            Isi satu atau lebih URL file hasil pekerjaan.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 mt-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Controller
                  name={`result_file.${index}`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder={`URL File #${index + 1}`}
                      className="w-full"
                      {...field}
                    />
                  )}
                />

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => remove(index)}
                  >
                    Hapus
                  </Button>
                )}
              </div>
            ))}

            {/* error global */}
            {typeof errors.result_file?.message === "string" && (
              <p className="text-red-500 text-sm">
                {errors.result_file.message}
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => append("")}
            >
              Tambah File
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>

              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
