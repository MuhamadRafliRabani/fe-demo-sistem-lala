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

import { useRouter } from "next/navigation";
import { usePost } from "@/hooks/use-api-mutation";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { statusJenisPembangunan } from "@/data/data";
import { formatDateDb } from "@/lib/date-format-db";
import { useFlashData } from "@/hooks/use-flash-data";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { normalizeParams } from "@/lib/serialisasi-filter-leads";
import { Textarea } from "@/components/ui/textarea";
import { addWorkingDays } from "@/lib/30-working-days";
import Tooltips from "@/components/tooltips";
import { Info } from "lucide-react";
import Loader from "@/components/ui/loader";
import SearchableSelect from "@/components/searchable-select";

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
    priority_order: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() !== "" ? val : undefined)),
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

export default function ScheduleCreatePage() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/tasks");

  const [submitAction, setSubmitAction] = useState("create");

  const queryClient = {
    fields: "id,name",
    filter: {
      schedule: "schedule",
      not_task: "not_task",
    },
    // sort: filter.sort,
    // paginate,
    // page,
  };

  const {
    data: clients,
    isLoading: clients_loading,
    error,
    refetch,
  } = useApiFetch("clients", "/clients", queryClient);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: "",
      description: "",
      assigned_designer_id: "",
      start_date: "",
      end_date: "",
      priority_order: "",
    },
  });

  useFlashData(watch, reset, "schedule_designs_form_data");

  const onSubmit = (data) => {
    const payload = {
      ...data,
      priority_order:
        data.priority_order ? Number(data.priority_order) : undefined,
    };

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(payload, {
          onSuccess: () => {
            if (submitAction === "create") {
              router.push("/dashboard/designs/schedule-designs");
            }

            if (submitAction === "create_another") {
              reset({
                client_id: "",
                description: "",
                assigned_designer_id: "",
                start_date: "",
                end_date: "",
                priority_order: "",
              });
            }

            localStorage.removeItem("schedule_designs_form_data");
            resolve();
          },
          onError: (err) => reject(err),
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Progress client berhasil disimpan!",
        error: "Failed to submit.",
      },
    );
  };

  const clientOptions =
    clients?.data?.map((item) => ({
      label: item.name,
      value: String(item.id),
    })) ?? [];

  const { data: designers } = useApiFetch("designers", "/users", {
    page: 1,
    paginate: 100,
    filter: {
      role_id: "5",
    },
  });

  const { data: countTask, isLoading: isloadingCountact } = useApiFetch(
    "count/tasks",
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

  if (isloadingCountact && clients_loading) return <Loader />;
  return (
    <DashboardLayout title="Create Task Desaind" desc="Tambah task baru disini">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* START DATE */}
        <div className="flex flex-col space-y-2">
          <Label className="flex items-center justify-between">
            <p>
              Start Date <span className="text-red-500">*</span>
            </p>
            <Tooltips
              desc="Tanggal selesai (end date) akan otomatis terisi 30 hari setelah tanggal mulai yang dipilih"
              trigger={<Info className="size-4" />}
            />
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
            Tanggal Berakhir <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="end_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label=""
                value={field.value}
                onChange={(value) => field.onChange(formatDateDb(value))}
                disabled
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
              <SearchableSelect
                value={field.value}
                options={clientOptions}
                labelKey="label"
                valueKey="value"
                onChange={(val) => {
                  field.onChange(val);

                  const client = clientOptions.find((c) => c.value === val);
                  if (client) {
                    setValue("name", client.label, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }}
                placeholder="Pilih Client"
              />
            )}
          />

          {errors.client_id && (
            <span className="text-sm text-red-500">
              {errors.client_id.message}
            </span>
          )}
        </div>

        {/* DESIGNER */}
        <div className="flex flex-col space-y-2">
          <Label>
            Designer <span className="text-red-500">*</span>
          </Label>

          <Controller
            name="assigned_designer_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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

        {/* PRIORITY ORDER */}
        <div className="flex flex-col space-y-2">
          <Label>Priority Order</Label>
          <Input
            type="number"
            min={1}
            placeholder="Contoh: 1 untuk tugas paling prioritas"
            {...register("priority_order")}
          />
        </div>

        {/* DESCRIPTION */}
        <div className="md:col-span-2 flex flex-col space-y-2">
          <Label>Deskripsi</Label>
          <Textarea
            placeholder="Deskripsi tambahan (opsional)"
            {...register("description")}
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
            onClick={() => router.push("/dashboard/designs/schedule-designs")}
          >
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
