"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

import { usePut } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { useApiFetch } from "@/hooks/use-api-fetch";
import Loader from "@/components/ui/loader";

// ----------------------
// VALIDATION
// ----------------------
const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().optional(),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
});

export default function EditClientSheet({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}) {
  // FETCH CLIENT DATA
  const {
    data: client,
    isLoading: loadingClient,
    refetch: refetchClient,
  } = useApiFetch(
    clientId ? ["clients", clientId] : null,
    clientId ? `/clients/${clientId}` : null
  );

  const { mutate, isPending } = usePut(`/clients/${clientId}`);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
            resolve();
          },
          onError: (err) => {
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Client berhasil diupdate!",
        error: (msg) => (msg ? msg : "Gagal untuk menyimpan!"),
      }
    );
  };

  // Reset form when client data is loaded or sheet opens
  useEffect(() => {
    if (client?.data && open) {
      refetchClient();
      reset({
        name: client.data.name || "",
        phone: client.data.phone || "",
        email: client.data.email || "",
      });
    }
  }, [client, reset, open, refetchClient]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        phone: "",
        email: "",
      });
    }
  }, [open, reset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Edit Client</SheetTitle>
          <SheetDescription>
            Edit data client disini. Pastikan semua field terisi dengan benar.
          </SheetDescription>
        </SheetHeader>

        {loadingClient ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 px-3"
          >
            {/* NAME */}
            <div className="flex flex-col space-y-2 w-full">
              <Label>
                Nama
                <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("name")}
                placeholder="Masukan nama client..."
              />
              {errors.name && (
                <span className="text-red-500 text-sm">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* PHONE */}
            <div className="flex flex-col space-y-2 w-full">
              <Label>Phone</Label>
              <Input
                {...register("phone")}
                placeholder="Masukan nomor telepon..."
              />
              {errors.phone && (
                <span className="text-red-500 text-sm">
                  {errors.phone.message}
                </span>
              )}
            </div>

            {/* EMAIL */}
            <div className="flex flex-col space-y-2 w-full md:col-span-2">
              <Label>Email</Label>
              <Input
                {...register("email")}
                type="email"
                placeholder="Masukan email client..."
              />
              {errors.email && (
                <span className="text-red-500 text-sm">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <SheetFooter className="md:col-span-2 mt-4 px-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
