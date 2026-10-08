"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { usePathname, useRouter } from "next/navigation";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { statusJenisPembangunan } from "@/data/data";
import { formatDateDb } from "@/lib/date-format-db";
import { useFlashData } from "@/hooks/use-flash-data";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { normalizeParams } from "@/lib/serialisasi-filter-leads";
import { Textarea } from "@/components/ui/textarea";
import Loader from "@/components/ui/loader";
import { addWorkingDays } from "@/lib/30-working-days";

// ----------------------
// VALIDATION
// ----------------------
const schema = z
  .object({
    client_id: z.string().min(1, "Client wajib dipilih"),
    description: z.string().optional(),
    assigned_designer_id: z.string().min(1, "Designer wajib dipilih"),
    start_date: z.string().min(1, "Start date wajib diisi"),
    end_date: z.string().min(1, "End date wajib diisi"),
  })
  .refine(
    (data) =>
      !data.start_date ||
      !data.end_date ||
      new Date(data.end_date) >= new Date(data.start_date),
    {
      message: "End date tidak boleh lebih kecil dari start date",
      path: ["end_date"],
    },
  );

export default function ScheduleDesignEditPage() {
  const router = useRouter();
  const pathname = usePathname();
  const TaskID = pathname.split("/").pop();

  // FETCH USER
  const { data: tasks, isLoading: loadingTasks } = useApiFetch(
    ["tasks", TaskID],
    `/tasks/${TaskID}`,
  );

  const { mutate, isPending } = usePut(`/tasks/${TaskID}`);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    register,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: "",
      description: "",
      assigned_designer_id: "",
      start_date: "",
      end_date: "",
    },
  });

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            router.push("/dashboard/surveys/schedule-surveys");

            resolve();
          },
          onError: (err) => {
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Jadwal survey berhasil diupdate!",
        error: (msg) => (msg ? msg : "Gagal untuk menyimpan!"),
      },
    );
  };

  useEffect(() => {
    if (tasks?.data) {
      reset({
        client_id: String(tasks.data.client?.id),
        description: tasks.data.description,
        assigned_designer_id: String(tasks.data.assignedDesigner?.id),
        start_date: tasks.data.start_date,
        end_date: tasks.data.end_date,
      });
    }
  }, [tasks, reset]);

  const { data: clients } = useApiFetch("clients", "/clients");

  const clientOptions =
    clients?.data?.map((item) => ({
      label: item.name,
      value: String(item.id),
    })) ?? [];

  const { data: designers } = useApiFetch("designers", "/users", {
    page: 1,
    paginate: 50,
    filter: {
      role_id: "5",
    },
  });

  const { data: countTask, isLoading: isLoadingCountTask } = useApiFetch(
    "tasks",
    "/count/tasks",
  );

  const designerOptions =
    designers?.data?.data?.map((item) => ({
      label: item.name,
      value: String(item.id),
    })) ?? [];

  const startDate = watch("start_date");

  useEffect(() => {
    if (!startDate) return;

    const start = new Date(startDate);
    if (isNaN(start.getTime())) return;

    const end = addWorkingDays(start, 30);

    setValue("end_date", formatDateDb(end), {
      shouldValidate: true,
    });
  }, [startDate]);

  if (loadingTasks && isLoadingCountTask) return <Loader />;

  return (
    <DashboardLayout title="Create Task Desaind" desc="Tambah task baru disini">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* START DATE */}
        <div className="flex flex-col space-y-2">
          <Label>
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="start_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label=""
                value={field.value}
                onChange={(value) => field.onChange(formatDateDb(value))}
              />
            )}
          />
          {errors.start_date && (
            <span className="text-sm text-red-500">
              {errors.start_date.message}
            </span>
          )}
        </div>

        {/* START DATE */}
        <div className="flex flex-col space-y-2">
          <Label>
            End Date <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label=""
                value={field.value}
                onChange={(value) => field.onChange(formatDateDb(value))}
              />
            )}
          />
          {errors.end_date && (
            <span className="text-sm text-red-500">
              {errors.end_date.message}
            </span>
          )}
        </div>
        {/* CLIENT */}
        <div className="flex flex-col space-y-2">
          <Label>
            Client <span className="text-red-500">*</span>
          </Label>

          <Controller
            name="client_id"
            control={control}
            render={({ field }) => (
              <Select
                value={
                  !field.value ? String(tasks?.data.client?.id) : field.value
                }
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih client" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.client_id && (
            <span className="text-sm text-red-500">
              {errors.client_id.message}
            </span>
          )}
        </div>

        {/* DESIGNER */}
        <div className="flex flex-col space-y-2 ">
          <Label>
            Designer <span className="text-red-500">*</span>
          </Label>

          <Controller
            name="assigned_designer_id"
            control={control}
            render={({ field }) => (
              <Select
                value={
                  !field.value
                    ? String(tasks?.data.assignedDesigner?.id)
                    : field.value
                }
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih designer" />
                </SelectTrigger>
                <SelectContent>
                  {designerOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                      {" - "}
                      {" ( "}
                      {countTask?.find(
                        (count) => count.assigned_designer_id == item.value,
                      )?.total_task ?? 0}
                      {" )"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.assigned_designer_id && (
            <span className="text-sm text-red-500">
              {errors.assigned_designer_id.message}
            </span>
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="md:col-span-2 flex flex-col space-y-2">
          <Label>Description</Label>
          <Textarea
            placeholder="Deskripsi tambahan (opsional)"
            {...register("description")}
          />
        </div>

        {/* ACTION BUTTONS */}
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
