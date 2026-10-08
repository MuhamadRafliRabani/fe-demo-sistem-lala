"use client";

import { useEffect } from "react";
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

import { useRouter, useParams } from "next/navigation";
import { usePut } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";
import Loader from "@/components/ui/loader";

// ----------------------
// VALIDATION
// ----------------------
const schema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nama vendor wajib diisi"),
  code: z.string().optional(),
  type: z.string().min(1, "Kategori vendor wajib dipilih"),
  pic_name: z.string().optional().nullable(),
  email: z
    .string()
    .email("Format email tidak valid")
    .or(z.literal(""))
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  npwp: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  status: z.boolean().default(true),
});

export default function VendorEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const { data, isLoading } = useApiFetch(
    ["vendor", id],
    `/master/vendors/${id}`,
  );

  const { mutate, isPending } = usePut(`/master/vendors/${id}`);

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

  useEffect(() => {
    if (data?.data) {
      reset({
        id: data.data.id,
        name: data.data.name || "",
        code: data.data.code || "",
        type: data.data.type || "",
        pic_name: data.data.pic_name || "",
        email: data.data.email || "",
        phone: data.data.phone || "",
        address: data.data.address || "",
        npwp: data.data.npwp || "",
        bank_account: data.data.bank_account || "",
        bank_name: data.data.bank_name || "",
        status: data.data.status ?? true,
      });
    }
  }, [data, reset]);

  const onSubmit = (formData) => {
    // Replace null with empty string or handle properly
    const cleanData = {
      ...formData,
      code: formData.code || "",
      type: formData.type || "",
      pic_name: formData.pic_name || "",
      email: formData.email || "",
      phone: formData.phone || "",
      address: formData.address || "",
      npwp: formData.npwp || "",
      bank_account: formData.bank_account || "",
      bank_name: formData.bank_name || "",
    };

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(cleanData, {
          onSuccess: () => {
            router.push("/dashboard/Masters/vendors");
            resolve();
          },
          onError: (err) => {
            reject(
              err?.response?.data?.message || "Gagal memperbarui data vendor",
            );
          },
        });
      }),
      {
        loading: "Memperbarui...",
        success: "Vendor berhasil diperbarui!",
        error: (msg) => msg,
      },
    );
  };

  if (isLoading) return <Loader />;

  return (
    <DashboardLayout title="Edit Vendor" desc="Perbarui data vendor disini">
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

        {/* CODE */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>Kode Vendor</Label>
          <Input
            {...register("code")}
            placeholder="Masukkan kode unik vendor (opsional)"
          />
          {errors.code && (
            <span className="text-red-500 text-sm">{errors.code.message}</span>
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
              <Select onValueChange={field.onChange} value={field.value || ""}>
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Simpan Perubahan"}
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
