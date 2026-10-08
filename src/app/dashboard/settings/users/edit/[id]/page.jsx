"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreatableSelect from "@/components/CreatableSelect";
import { X } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useApiFetch } from "@/hooks/use-api-fetch";
// PERHATIKAN: Kita ubah hook menggunakan usePost agar file bisa terkirim di Laravel
import { usePost } from "@/hooks/use-api-mutation";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { resolveImageUrl } from "@/lib/resolve-image-url";

// VALIDATION SCHEMA
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().max(20).optional(),
  password: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  role_id: z.string().min(1, "Role is required"),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  sp_level: z.enum(["0", "1", "2", "3"]),
  // PERBAIKAN: Saat edit, file tidak wajib (optional)
  contract_file: z.any().optional(),
});

export default function Page() {
  const pathname = usePathname();
  const router = useRouter();
  const userId = pathname.split("/").pop();

  // FETCH USER
  const { data: user, isLoading: loadingUser } = useApiFetch(
    ["user", userId],
    `/user/${userId}`,
  );

  // FETCH ROLES
  const { data: roles } = useApiFetch("roles", "/roles", { paginate: 15 });
  const rolesList = useMemo(() => {
    if (Array.isArray(roles?.data)) return roles.data;
    return roles?.data?.data || [];
  }, [roles]);

  // PERBAIKAN: Gunakan usePost untuk melewati restriksi PUT multipart di PHP
  const { mutate, isPending } = usePost(`/users/${userId}`, {
    invalidate: [["users"], ["user", userId]],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [userEquipments, setUserEquipments] = useState([]);

  // FORM
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      status: "",
      role_id: "",
      contract_start_date: "",
      contract_end_date: "",
      sp_level: "0",
    },
  });
  console.log("🚀 ~ Page ~ watch:", watch());

  console.log("🚀 ~ Page ~ user:", { user, rolesList });

  // Set form values ketika data user sudah ada
  useEffect(() => {
    if (user?.data && rolesList.length) {
      reset({
        name: user.data.name,
        email: user.data.email,
        phone: user.data.phone ?? "",
        password: "",
        status: user.data.status === "active" ? "active" : "inactive",
        role_id: String(user.data.role_id) || "",
        contract_start_date: user.data.contract_start_date ?? "",
        contract_end_date: user.data.contract_end_date ?? "",
        sp_level: String(user.data.sp_level ?? 0),
      });
    }
  }, [user, rolesList, reset]);

  useEffect(() => {
    if (user?.data?.equipments) {
      setUserEquipments(user.data.equipments);
    }
  }, [user]);

  const onSubmit = (data) => {
    // PERBAIKAN: Gunakan FormData SATU KALI SAJA untuk teks dan file
    const payload = new FormData();

    // MAGIC KEYWORD: Memberitahu Laravel bahwa request POST ini sebenarnya adalah PUT
    payload.append("_method", "PUT");

    payload.append("id", userId);
    payload.append("name", data.name);
    payload.append("email", data.email);
    if (data.phone) payload.append("phone", data.phone);
    payload.append("status", data.status);
    payload.append("role_id", data.role_id);
    if (data.contract_start_date)
      payload.append("contract_start_date", data.contract_start_date);
    if (data.contract_end_date)
      payload.append("contract_end_date", data.contract_end_date);
    payload.append("sp_level", data.sp_level);

    if (data.password && data.password.trim().length > 0) {
      payload.append("password", data.password.trim());
    }

    // Jika User mengupload file baru, lampirkan ke payload
    const contractFile = data.contract_file?.[0];
    if (contractFile instanceof File) {
      payload.append("contract_file", contractFile);
    }

    payload.append(
      "equipment_ids",
      JSON.stringify(userEquipments.map((equipment) => equipment.id)),
    );

    toast.promise(
      new Promise((resolve, reject) => {
        // Cukup panggil mutate SATU KALI dengan FormData utuh
        mutate(payload, {
          onSuccess: () => {
            resolve();
            router.push("/dashboard/settings/users");
          },
          onError: reject,
        });
      }),
      {
        loading: "Updating user...",
        success: "User updated successfully!",
        error: "Failed to update user.",
      },
    );
  };

  if (loadingUser) return <p className="p-6">Loading user data...</p>;

  return (
    <DashboardLayout title="Edit User" desc="Edit user here">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* NAME */}
        <div className="flex flex-col space-y-2">
          <Label>Nama</Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        {/* EMAIL */}
        <div className="flex flex-col space-y-2">
          <Label>Email</Label>
          <Input {...register("email")} />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        {/* PHONE */}
        <div className="flex flex-col space-y-2">
          <Label>Telepon</Label>
          <Input {...register("phone")} />
        </div>

        {/* PASSWORD */}
        <div className="flex flex-col space-y-2">
          <Label>Password (leave empty to keep current password)</Label>
          <div className="flex gap-2">
            <Input
              type={showPassword ? "text" : "password"}
              {...register("password")}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>

        {/* STATUS */}
        <div className="flex flex-col space-y-2 ">
          <Label>Status</Label>

          <Controller
            name="status"
            control={control}
            render={({ field }) => {
              return (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      className="capitalize"
                      placeholder={user.data?.status}
                    />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Initial</SelectItem>
                  </SelectContent>
                </Select>
              );
            }}
          />

          {errors.status && (
            <p className="text-red-500 text-sm">{errors.status.message}</p>
          )}
        </div>

        {/* ROLE */}
        <div className="flex flex-col space-y-2">
          <Label>Role</Label>

          <Controller
            name="role_id"
            control={control}
            render={({ field }) => {
              return (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        rolesList.find(
                          (role) =>
                            Number(role.id) === Number(user.data?.role_id),
                        )?.name || "Select role"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {rolesList.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />

          {errors.role_id && (
            <p className="text-red-500 text-sm">{errors.role_id.message}</p>
          )}
        </div>

        {/* CONTRACT DATES */}
        <div className="flex flex-col space-y-2">
          <Label>Contract Start</Label>
          <Input type="date" {...register("contract_start_date")} />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Contract End</Label>
          <Input type="date" {...register("contract_end_date")} />
        </div>

        {/* EQUIPMENT */}
        <div className="flex flex-col space-y-2 md:col-span-2 w-full">
          <Label>Peralatan</Label>
          <CreatableSelect
            fetchUrl="/master/equipments"
            fetchKey={["equipments"]}
            postUrl="/master/equipments"
            invalidateKeys={["equipments"]}
            labelKey="name"
            valueKey="id"
            placeholder="Pilih atau tambah peralatan"
            value={selectedEquipment?.id ?? ""}
            onChange={(option) => {
              if (!option) return;
              setSelectedEquipment(null);
              setUserEquipments((prev) =>
                prev.some((item) => Number(item.id) === Number(option.id))
                  ? prev
                  : [...prev, option],
              );
            }}
            createPayload={(input) => ({ name: input })}
          />
          {userEquipments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {userEquipments.map((equipment) => (
                <div
                  key={equipment.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-sm"
                >
                  <span>{equipment.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setUserEquipments((prev) =>
                        prev.filter(
                          (item) => Number(item.id) !== Number(equipment.id),
                        ),
                      )
                    }
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-slate-400">
            Pilih peralatan yang sudah terpasang pada profil karyawan.
          </p>
        </div>

        {/* CONTRACT FILE */}
        <div className=" flex space-y-2 md:col-span-2 gap-4">
          <div className="flex flex-col space-y-2 md:col-span-2 w-full">
            <Label>Contract File (PDF/DOC/XLSX)</Label>
            <div className="flex flex-col gap-2">
              {user?.data?.contract_file && (
                <a
                  href={resolveImageUrl(user.data.contract_file)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline text-blue-500"
                >
                  Lihat Contract Saat Ini
                </a>
              )}
              <Input type="file" {...register("contract_file")} />
            </div>
          </div>

          {/* SP */}
          <div className="flex flex-col space-y-2 w-full">
            <Label>SP Level</Label>
            <Controller
              control={control}
              name="sp_level"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? "0"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="SP Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* BTN */}
        <div className="md:col-span-2 flex gap-3 mt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Simpan Perubahan"}
          </Button>

          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
