"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { usePost } from "@/hooks/use-api-mutation";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Nama client wajib diisi"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
});

export default function ClientCreatePage() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/clients", {
    invalidate: [["clients"]],
  });

  const {
    register,
    handleSubmit,
    reset,
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
            router.push("/dashboard/Masters/clients");
            resolve();
          },
          onError: (err) => {
            reject(err?.response?.data?.message || "Gagal menyimpan client");
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Client berhasil ditambahkan!",
        error: (msg) => msg,
      }
    );
  };

  return (
    <DashboardLayout title="Create Client" desc="Tambah client baru di sini.">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Nama Client <span className="text-red-500">*</span>
          </Label>
          <Input placeholder="Masukkan nama client..." {...register("name")} />
          {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
        </div>

        <div className="flex flex-col space-y-2 w-full">
          <Label>No. HP / WhatsApp</Label>
          <Input placeholder="Masukkan nomor HP atau WhatsApp..." {...register("phone")} />
          {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
        </div>

        <div className="flex flex-col space-y-2 w-full">
          <Label>Email</Label>
          <Input placeholder="Masukkan email client..." {...register("email")} />
          {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
        </div>

        <div className="md:col-span-2 flex items-center gap-3 mt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan Client"}
          </Button>

          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/Masters/clients")}>Batal</Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
