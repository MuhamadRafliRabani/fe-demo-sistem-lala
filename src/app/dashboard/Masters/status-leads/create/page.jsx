"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { LoaderIcon } from "lucide-react";

const normalizeStatusLeadValue = (value) =>
  String(value ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bdiscusion\b/gi, "discussion")
    .toLowerCase();

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  order: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
});

const CreateStatusLeadPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      order: 0,
      is_active: true,
    },
  });

  const isActive = watch("is_active");
  const nameValue = watch("name");

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Auto-generate value from name (lowercase)
      const submitData = {
        ...data,
        value: normalizeStatusLeadValue(data.name),
      };
      await axiosInstance.post("/master/status-leads", submitData);
      toast.success("Status lead berhasil dibuat");
      router.push("/dashboard/Masters/status-leads");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal membuat status lead",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Status Lead" desc="Tambah status lead baru.">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* NAME */}
        <div className="flex flex-col space-y-2">
          <Label>
            Name<span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="Enter name"
            {...register("name")}
            error={errors.name?.message}
          />
          {nameValue && (
            <p className="text-xs text-muted-foreground">
              Value will be:{" "}
              <span className="font-mono">
                {normalizeStatusLeadValue(nameValue)}
              </span>
            </p>
          )}
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        {/* ORDER */}
        <div className="flex flex-col space-y-2">
          <Label>Order</Label>
          <Input
            type="number"
            placeholder="Enter order"
            {...register("order", { valueAsNumber: true })}
            error={errors.order?.message}
          />
          {errors.order && (
            <span className="text-red-500 text-sm">{errors.order.message}</span>
          )}
        </div>

        {/* IS ACTIVE */}
        <div className="flex flex-col space-y-2 md:col-span-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("is_active", checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="md:col-span-2 flex items-center gap-3 mt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderIcon className="mr-2 size-4 animate-spin" /> Saving...
              </>
            ) : (
              "Create"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/Masters/status-leads")}
          >
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default CreateStatusLeadPage;
