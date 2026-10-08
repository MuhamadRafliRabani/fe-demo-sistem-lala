"use client";

import { useEffect } from "react";
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

import { usePathname, useRouter } from "next/navigation";
import { usePut } from "@/hooks/use-api-mutation";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { statusSurvey } from "@/data/data";
import { Textarea } from "@/components/ui/textarea";
import { useApiFetch } from "@/hooks/use-api-fetch";
import MultiSelect from "@/components/MultiSelect";
import Loader from "@/components/ui/loader";

// ----------------------
// VALIDATION
// ----------------------
const schema = z.object({
  lead_id: z.number().optional(),
  name: z.string().optional(),
  date: z.date().optional(),
  surveyors: z
    .array(z.number())
    .min(1, "Surveyor minimal 1 orang")
    .max(3, "Surveyor maksimal 3 orang"),
  address: z.string().optional(),
  status: z.string().min(1, "Status wajib diisi"),
});

export default function LeadFormComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const scheduleID = pathname.split("/").pop();

  // FETCH USER
  const { data: schedule, isLoading: loadingSchedule } = useApiFetch(
    ["clients", scheduleID],
    `/clients/${scheduleID}`
  );

  const { mutate, isPending } = usePut(`/clients/${scheduleID}`);

  // const {
  //   data: client_name,
  //   isLoading: client_name_loading,
  //   error,
  //   refetch,
  // } = useApiFetch("simple", "simple/leads-name/");

  // const selectClientName =
  //   client_name?.data?.map((item) => ({
  //     label: item.name,
  //     value: item.id,
  //   })) ?? [];

  const { data: surveyors, isLoading: isLoadingsurveyors } = useApiFetch(
    "surveyors",
    "/surveyors"
  );

  const selectSurveyors =
    surveyors?.data?.map((item) => ({
      label: item.name,
      value: item.id,
    })) ?? [];

  const {
    register,
    handleSubmit,
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
      }
    );
  };

  useEffect(() => {
    if (schedule?.data) {
      reset({
        date: schedule.data.date,
        name: schedule.data?.leads[0].name,
        lead_id: schedule.data?.leads[0].id,
        address: schedule.data.address,
        status: schedule.data.status,
        surveyors: schedule.data?.surveyor?.map((s) => s.id),
      });
    }
  }, [schedule, reset]);

  if (loadingSchedule && isLoadingsurveyors) return <Loader />;

  return (
    <DashboardLayout
      title="Edit Schedule surveys"
      desc="Edit data schedule surveys disini"
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
              <Select value={schedule?.data?.leads[0].name} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={schedule?.data?.leads[0].name}>
                    {schedule?.data?.leads[0].name}
                  </SelectItem>
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
                value={
                  field.value
                    ? field.value
                    : schedule.data?.surveyor?.map((s) => s.id)
                }
                onChange={field.onChange}
                className={`min-w-full w-fit ${
                  isLoadingsurveyors ? "opacity-90 pointer-events-none" : ""
                }`}
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
              <Select
                onValueChange={field.onChange}
                value={field.value ? field.value : schedule?.data.status}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
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
