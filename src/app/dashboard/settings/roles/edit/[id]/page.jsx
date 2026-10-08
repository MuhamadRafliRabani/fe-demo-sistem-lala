"use client";

import { useEffect } from "react";
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
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePut } from "@/hooks/use-api-mutation";
import DashboardLayout from "@/components/layouts/dashboard-layout";

// VALIDATION SCHEMA
const roleSchema = z.object({
  name: z.string().min(1),
  desc: z.string().min(1),
});

export default function Page() {
  const pathname = usePathname();
  const router = useRouter();
  const roleId = pathname.split("/").pop();

  // FETCH USER
  const { data: role, isLoading: loadingRole } = useApiFetch(
    ["role", roleId],
    `/role/${roleId}`,
  );

  const { mutate, isPending } = usePut(`/roles/${roleId}`, {
    invalidate: [["roles"]],
  });

  // FORM
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      desc: "",
    },
  });

  useEffect(() => {
    if (role?.data) {
      reset({
        name: role.data.name,
        desc: role.data.desc,
      });
    }
  }, [role, reset]);

  const onSubmit = (data) => {
    const payload = {
      id: Number(roleId),
      name: data.name,
      desc: data.desc,
    };
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(payload, {
          onSuccess: () => {
            resolve();
            router.push("/dashboard/settings/roles");
          },
          onError: reject,
        });
      }),
      {
        loading: "Updating role...",
        success: "Role updated successfully!",
        error: "Failed to update role.",
      },
    );
  };

  if (loadingRole) return <p className="p-6">Loading role data...</p>;

  return (
    <DashboardLayout title="Edit role" desc="Edit role here">
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

        {/* DESCRIPTION */}
        <div className="flex flex-col space-y-2">
          <Label>Deskripsi</Label>
          <Input {...register("desc")} />
          {errors.desc && (
            <p className="text-red-500 text-sm">{errors.desc.message}</p>
          )}
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
