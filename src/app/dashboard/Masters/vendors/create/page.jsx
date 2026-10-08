"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRouter } from "next/navigation";
import { usePost } from "@/hooks/use-api-mutation";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";

// ----------------------
// VALIDATION
// ----------------------
const schema = z.object({
  name: z.string().min(1, "Nama vendor wajib diisi"),
  code: z.string().optional(),
  type: z.string().min(1, "Kategori vendor wajib dipilih"),
  pic_name: z.string().optional(),
  email: z
    .string()
    .email("Format email tidak valid")
    .or(z.literal(""))
    .optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  npwp: z.string().optional(),
  bank_account: z.string().optional(),
  bank_name: z.string().optional(),
  status: z.boolean().default(true),
});

export default function VendorCreatePage() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/master/vendors");
  const [submitAction, setSubmitAction] = useState("create");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      code: "",
      type: "",
      pic_name: "",
      email: "",
      phone: "",
      address: "",
      npwp: "",
      bank_account: "",
      bank_name: "",
      status: true,
    },
  });

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            if (submitAction === "create") {
              router.push("/dashboard/Masters/vendors");
            } else if (submitAction === "create_another") {
              reset();
            }
            resolve();
          },
          onError: (err) => {
            reject(
              err?.response?.data?.message || "Gagal menyimpan data vendor",
            );
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Vendor berhasil ditambahkan!",
        error: (msg) => msg,
      },
    );
  };

  return (
    <DashboardLayout
      title="Create Vendor"
      desc="Tambah data vendor baru disini"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
      >
        {/* NAME */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Nama Vendor <span className="text-red-500">*</span>
          </Label>
          <Input placeholder="Masukkan nama vendor..." {...register("name")} />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        {/* TYPE / KATEGORI */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Kategori <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sipil">Sipil</SelectItem>
                  <SelectItem value="Interior">Interior</SelectItem>
                  <SelectItem value="Las">Las</SelectItem>
                  <SelectItem value="Pintu Jendela">Pintu Jendela</SelectItem>
                  <SelectItem value="Cat">Cat</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && (
            <span className="text-red-500 text-sm">{errors.type.message}</span>
          )}
        </div>

        {/* PIC NAME */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>Contact Person (PIC)</Label>
          <Input placeholder="Masukkan nama PIC..." {...register("pic_name")} />
          {errors.pic_name && (
            <span className="text-red-500 text-sm">
              {errors.pic_name.message}
            </span>
          )}
        </div>

        {/* EMAIL */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>Email</Label>
          <Input placeholder="vendor@example.com" {...register("email")} />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email.message}</span>
          )}
        </div>

        {/* PHONE */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>No. Telepon / WA</Label>
          <Input placeholder="08123456789" {...register("phone")} />
          {errors.phone && (
            <span className="text-red-500 text-sm">{errors.phone.message}</span>
          )}
        </div>

        {/* NPWP */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>NPWP</Label>
          <Input placeholder="Nomor NPWP..." {...register("npwp")} />
          {errors.npwp && (
            <span className="text-red-500 text-sm">{errors.npwp.message}</span>
          )}
        </div>

        {/* BANK INFO */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>Nama Bank</Label>
          <Input placeholder="BCA / Mandiri / dll" {...register("bank_name")} />
          {errors.bank_name && (
            <span className="text-red-500 text-sm">
              {errors.bank_name.message}
            </span>
          )}
        </div>

        <div className="flex flex-col space-y-2 w-full">
          <Label>Nomor Rekening</Label>
          <Input
            placeholder="Nomor rekening..."
            {...register("bank_account")}
          />
          {errors.bank_account && (
            <span className="text-red-500 text-sm">
              {errors.bank_account.message}
            </span>
          )}
        </div>

        {/* STATUS */}
        <div className="flex flex-col space-y-2 w-full justify-center">
          <Label>Status Aktif</Label>
          <div className="flex items-center gap-2 mt-2">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <span className="text-sm text-muted-foreground">
              Tandai jika vendor ini aktif
            </span>
          </div>
        </div>

        {/* ADDRESS */}
        <div className="flex flex-col space-y-2 md:col-span-2">
          <Label>Alamat</Label>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Textarea
                placeholder="Masukkan alamat lengkap vendor..."
                {...field}
              />
            )}
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="md:col-span-2 flex items-center gap-3 mt-4">
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => setSubmitAction("create")}
          >
            {isPending ? "Saving..." : "Create"}
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            variant="secondary"
            onClick={() => setSubmitAction("create_another")}
          >
            {isPending ? "Saving..." : "Buat & Tambah Lainnya"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/Masters/vendors")}
          >
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
