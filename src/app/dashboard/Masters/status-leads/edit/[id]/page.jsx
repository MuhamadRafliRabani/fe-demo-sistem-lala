"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { useApiFetch } from "@/hooks/use-api-fetch";

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

const EditStatusLeadPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [isLoading, setIsLoading] = useState(false);

  const { data, isLoading: isLoadingData } = useApiFetch(
    `status-lead-${id}`,
    `/master/status-leads/${id}`,
  );

  const item = data?.data;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        order: item.order,
        is_active: item.is_active,
      });
    }
  }, [item, reset]);

  const isActive = watch("is_active");
  const nameValue = watch("name");

  const onSubmit = async (formData) => {
    setIsLoading(true);
    try {
      // Auto-generate value from name (lowercase)
      const submitData = {
        ...formData,
        value: normalizeStatusLeadValue(formData.name),
      };
      await axiosInstance.put(`/master/status-leads/${id}`, submitData);
      toast.success("Status lead berhasil diupdate");
      router.push("/dashboard/Masters/status-leads");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Gagal mengupdate status lead",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <DashboardLayout title="Edit Status Lead" desc="Edit status lead.">
        <div>Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Status Lead" desc="Edit status lead.">
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
              "Update"
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

export default EditStatusLeadPage;
