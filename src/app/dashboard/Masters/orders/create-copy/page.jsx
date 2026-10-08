"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { statusSurvey } from "@/data/data";
import { Textarea } from "@/components/ui/textarea";
import { useFlashData } from "@/hooks/use-flash-data";
import MultiSelect from "@/components/MultiSelect";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatDateDb } from "@/lib/date-format-db";
import Loader from "@/components/ui/loader";

// ----------------------
// VALIDATION
// ----------------------
const schema = z.object({
  lead_id: z.number().optional(),
  name: z.string().min(1, "Client wajib dipilih"),
  date: z.date().optional(),
  surveyors: z
    .array(z.number())
    .min(1, "Surveyor minimal 1 orang")
    .max(3, "Surveyor maksimal 3 orang"),
  address: z.string().optional(),
  status: z.string().min(1, "Status wajib diisi"),
});

export default function LeadFormComponent() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/schedules");
  const [submitAction, setSubmitAction] = useState("create");
  const {
    data: client_name,
    isLoading: client_name_loading,
    error,
    refetch,
  } = useApiFetch("simple", "simple/leads-name/");

  const selectClientName =
    client_name?.data?.map((item) => ({
      label: item.name,
      value: item.id,
    })) ?? [];

  const { data: surveyors, isLoading: isLoadingsurveyors } = useApiFetch(
    "surveyors",
    "/surveyors",
  );

  const selectSurveyors =
    surveyors?.data?.map((item) => ({
      label: item.name,
      value: item.id,
    })) ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      lead_id: "",
      name: "",
      date: null,
      surveyors: [],
      address: "",
      status: "",
    },
  });

  // useFlashData(watch, reset, "survey_form_data");
  useEffect(() => {
    setValue("status", "belum dimulai");
    localStorage.removeItem("survey_form_data");
  }, []);

  if (client_name_loading && isLoadingsurveyors) return <Loader />;

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            if (submitAction === "create") {
              router.push("/dashboard/surveys/schedule-surveys");
            }

            if (submitAction === "create_another") {
              reset({
                lead_id: "",
                name: "",
                date: null,
                surveyors: [],
                address: "",
                status: "belum dimulai",
              });
              refetch();
            }

            localStorage.removeItem("survey_form_data");
            resolve();
          },
          onError: (err) => {
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Jadwal survey berhasil ditambahkan!",
        error: (msg) => (msg ? msg : "Gagal untuk menyimpan!"),
      },
    );
  };

  if (isLoadingsurveyors) return <Loader />;

  return (
    <DashboardLayout
      title="Create Schedule surveys"
      desc="Tambah schedule surveys baru disini"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* NAME */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Nama
            <span className="text-red-500">*</span>
          </Label>

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  field.onChange(value);

                  const selected = selectClientName.find(
                    (item) => item.label === value,
                  );

                  if (selected) {
                    setValue("lead_id", selected.value);
                  }
                }}
              >
                <SelectTrigger
                  className="w-full"
                  disabled={client_name_loading}
                >
                  <SelectValue placeholder="Pilih Client" />
                </SelectTrigger>

                <SelectContent>
                  {selectClientName.map((item) => (
                    <SelectItem key={item.value} value={item.label}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        {/* DATE */}
        <div className="flex flex-col space-y-2">
          <Label className="flex justify-between items-center">
            <p>
              Tanggal Survey<span className="text-red-500">*</span>
            </p>
          </Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                label=""
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                }}
                withTime
              />
            )}
          />
          {errors.date && (
            <span className="text-red-500 text-sm">{errors.date.message}</span>
          )}
        </div>

        {/* SURVEYORS */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Surveyors<span className="text-red-500">*</span>
          </Label>

          <Controller
            name="surveyors"
            control={control}
            render={({ field }) => (
              <MultiSelect
                name="surveyors"
                placeholder="Pilih surveyors..."
                options={selectSurveyors}
                value={field.value}
                onChange={field.onChange}
                className="min-w-full w-fit"
              />
            )}
          />

          {errors.surveyors && (
            <span className="text-red-500 text-sm">
              {errors.surveyors.message}
            </span>
          )}
        </div>

        {/* STATUS */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Status<span className="text-red-500">*</span>
          </Label>

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="w-full" disabled>
                  <SelectValue placeholder="Belum dimulai" />
                </SelectTrigger>

                <SelectContent>
                  {statusSurvey.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value ?? "belum dimulai"}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
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

        {/* ADDRESS */}
        <div className="flex flex-col space-y-2 md:col-span-2">
          <Label>
            Alamat<span className="text-red-500">*</span>
          </Label>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <Textarea placeholder="Masukan alamat survey..." {...field} />
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
            onClick={() => router.push("/dashboard/surveys/schedule-surveys")}
          >
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
