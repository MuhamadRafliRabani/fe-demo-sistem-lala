"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { usePost } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";

// VALIDATION
const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  desc: z.string().max(255),
});

export default function UserFormComponent() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/roles", { invalidate: [["roles"]] });

  const [submitAction, setSubmitAction] = useState("create");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      desc: "",
    },
  });

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            if (submitAction === "create") {
              router.push("/dashboard/settings/roles");
            }

            if (submitAction === "create_another") {
              reset({
                name: "",
                desc: "",
              });
            }

            resolve();
          },
          onError: (err) => reject(err),
        });
      }),
      {
        loading: "Saving role...",
        success: "Role successfully added!",
        error: "Failed to submit.",
      }
    );
  };

  return (
    <DashboardLayout title="Create User" desc="Buat user baru disini">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* NAME */}
        <div className="flex flex-col space-y-2">
          <Label>Nama</Label>
          <Input placeholder="Enter your username" {...register("name")} />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="flex flex-col space-y-2">
          <Label>Deskripsi</Label>
          <Input placeholder="Enter role description" {...register("desc")} />
          {errors.desc && (
            <span className="text-red-500 text-sm">{errors.desc.message}</span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="md:col-span-2 flex items-center gap-3 mt-4">
          <Button
            type="submit"
            disabled={isPending}
            onClick={() => setSubmitAction("create")}
          >
            {isPending ? "Creating..." : "Create"}
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
            onClick={() => router.push("/dashboard/settings/roles")}
          >
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
