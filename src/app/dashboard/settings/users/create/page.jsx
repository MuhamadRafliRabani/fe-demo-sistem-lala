"use client";

import { useMemo, useState } from "react";
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
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(20).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role_id: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive"]),
  contract_start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  sp_level: z.enum(["0", "1", "2", "3"]),
  contract_file: z
    .any()
    .refine((files) => files?.length > 0, "Contract file is required"),
});

export default function UserFormComponent() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/users", { invalidate: [["users"]] });
  const { data: roles } = useApiFetch("roles", "/roles", { paginate: 15 });
  const rolesList = useMemo(() => {
    if (Array.isArray(roles?.data)) return roles.data;
    return roles?.data?.data || [];
  }, [roles]);

  const [submitAction, setSubmitAction] = useState("create");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role_id: "",
      status: "inactive",
      contract_start_date: "",
      contract_end_date: "",
      sp_level: "0",
    },
  });
  console.log("🚀 ~ UserFormComponent ~ watch:", watch());

  const onSubmit = (data) => {
    const payload = new FormData();
    payload.append("name", data.name);
    payload.append("email", data.email);
    if (data.phone) payload.append("phone", data.phone);
    payload.append("password", data.password);
    payload.append("role_id", data.role_id);
    payload.append("status", data.status);
    if (data.contract_start_date)
      payload.append("contract_start_date", data.contract_start_date);
    if (data.contract_end_date)
      payload.append("contract_end_date", data.contract_end_date);
    payload.append("sp_level", data.sp_level);

    const contractFile = data.contract_file?.[0];
    if (contractFile instanceof File) {
      payload.append("contract_file", contractFile);
    }

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(payload, {
          onSuccess: () => {
            if (submitAction === "create") {
              router.push("/dashboard/settings/users");
            }

            if (submitAction === "create_another") {
              reset({
                name: "",
                email: "",
                phone: "",
                password: "",
                role_id: "",
              });
            }

            resolve();
          },
          onError: (err) => reject(err),
        });
      }),
      {
        loading: "Saving user...",
        success: "User successfully added!",
        error: "Failed to submit.",
      },
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

        {/* EMAIL */}
        <div className="flex flex-col space-y-2">
          <Label>Email</Label>
          <Input placeholder="Enter your email" {...register("email")} />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email.message}</span>
          )}
        </div>

        {/* PHONE */}
        <div className="flex flex-col space-y-2">
          <Label>Telepon</Label>
          <Input placeholder="08595123212" {...register("phone")} />
          {errors.phone && (
            <span className="text-red-500 text-sm">{errors.phone.message}</span>
          )}
        </div>

        {/* PASSWORD */}
        <div className="flex flex-col space-y-2">
          <Label>Password</Label>
          <div className="flex gap-2">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
          {errors.password && (
            <span className="text-red-500 text-sm">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* STATUS */}
        <div className="flex flex-col space-y-2">
          <Label>Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Initial</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && (
            <span className="text-red-500 text-sm">
              {errors.status.message}
            </span>
          )}
        </div>

        {/* ROLE - FIXED VERSION */}
        <div className="flex flex-col space-y-2">
          <Label>Role</Label>

          <Controller
            control={control}
            name="role_id"
            render={({ field }) => (
              <Select
                onValueChange={(v) => field.onChange(String(v))}
                value={field.value ?? ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>

                <SelectContent>
                  {rolesList.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.role_id && (
            <span className="text-red-500 text-sm">
              {errors.role_id.message}
            </span>
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

        {/* CONTRACT FILE */}
        <div className="flex justify-center gap-4 col-span-2 space-y-2 ">
          <div className="w-full space-y-2">
            <Label>Contract File (PDF/DOC)</Label>
            <Input type="file" {...register("contract_file")} />
            {errors.contract_file && (
              <span className="text-red-500 text-sm">
                {errors.contract_file.message}
              </span>
            )}
          </div>

          <div className="w-full space-y-2">
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
            {isPending ? "Saving..." : "Create & Create another"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/settings/users")}
          >
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
