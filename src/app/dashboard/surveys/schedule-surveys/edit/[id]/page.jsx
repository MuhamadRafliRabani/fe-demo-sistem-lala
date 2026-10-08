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
import { Input } from "@/components/ui/input";

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
import { formatDateDb } from "@/lib/date-format-db";
import SearchableSelect from "@/components/searchable-select";

// ----------------------
// VALIDATION
// ----------------------
const schema = z.object({
  client_id: z.number().optional(),
  name: z.string().optional(),
  date: z.date().optional(),
  surveyors: z
    .array(z.number())
    .min(1, "Surveyor minimal 1 orang")
    .max(3, "Surveyor maksimal 3 orang"),
  region_id: z.number().min(1, "Domisili wajib dipilih"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  link_address: z.string().optional().nullable(),
  status: z.string().min(1, "Status wajib diisi"),
});

export default function LeadFormComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const scheduleID = pathname.split("/").pop();

  // FETCH USER
  const { data: schedule, isLoading: loadingSchedule } = useApiFetch(
    ["schedule", scheduleID],
    `/schedules/${scheduleID}`,
  );

  const { mutate, isPending } = usePut(`/schedules/${scheduleID}`, {
    invalidate: [["schedules"], ["surveyors"], ["schedule"]],
  });

  // const {
  //   data: client_name,
  //   isLoading: client_name_loading,
  //   error,
  //   refetch,
  // } = useApiFetch("clients", "/clients", {
  //   not_schedule: "not_schedule",
  // });

  //   const selectClientName =
  //     client_name?.data?.map((item) => ({
  //       label: item.name,
  //       value: item.id,
  //     })) ?? [];

  const { data: surveyors, isLoading: isLoadingsurveyors } = useApiFetch(
    "surveyors",
    "/surveyors",
  );

  const { data: regionsResponse, isLoading: isLoadingRegions } = useApiFetch(
    "regions",
    "/master/regions",
    {
      page: 1,
      per_page: 100,
      is_active: true,
    },
  );

  const regions = regionsResponse?.data?.data ?? [];

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
      client_id: "",
      name: "",
      date: null,
      surveyors: [],
      region_id: "",
      alamat: "",
      link_address: "",
      status: "",
    },
  });

  const onSubmit = (data) => {
    const selectedRegion = regions.find((r) => r.id === data.region_id) || null;
    const domicile = selectedRegion?.name || "";
    const alamat = data.alamat ? data.alamat.trim() : "";

    let address = "";
    if (alamat && domicile) {
      address = `${alamat}, ${domicile}`;
    } else if (alamat) {
      address = alamat;
    } else if (domicile) {
      address = domicile;
    }

    const { alamat: _alamat, ...rest } = data;

    const payload = {
      ...rest,
      address,
      link_address: data.link_address || null,
    };

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(payload, {
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
    if (schedule?.data) {
      const fullAddress = schedule.data.address || "";
      let regionId = schedule.data.region?.id ?? "";
      let alamat = fullAddress;

      if (!regionId && regions.length && fullAddress) {
        const lowerAddress = fullAddress.toLowerCase();
        const matchedRegion = regions.find((region) => {
          if (!region.name) return false;
          return lowerAddress.includes(region.name.toLowerCase());
        });

        if (matchedRegion && matchedRegion.name) {
          regionId = matchedRegion.id;
          const lowerRegion = matchedRegion.name.toLowerCase();
          const idx = lowerAddress.lastIndexOf(lowerRegion);
          if (idx > 0) {
            alamat = fullAddress.slice(0, idx).replace(/,\s*$/, "");
          }
        }
      }

      reset({
        date: new Date(schedule.data.date),
        name: schedule.data.client?.name,
        client_id: schedule.data.client.id,
        region_id: regionId,
        alamat,
        link_address: schedule.data.link_address || "",
        status: schedule.data.status,
        surveyors: schedule.data?.surveyor?.map((s) => s.id),
      });
    }
  }, [schedule, regions, reset]);

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
              <Select value={schedule?.data.client?.name} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={schedule?.data.client?.name}>
                    {schedule?.data.client?.name}
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

        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Domisili<span className="text-red-500">*</span>
          </Label>
          <Controller
            name="region_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                options={
                  regions.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })) ?? []
                }
                onChange={field.onChange}
                placeholder={
                  isLoadingRegions ? "Memuat domisili..." : "Pilih domisili"
                }
                disabled={isLoadingRegions}
              />
            )}
          />
          {errors.region_id && (
            <span className="text-red-500 text-sm">
              {errors.region_id.message}
            </span>
          )}
        </div>

        <div className="flex flex-col space-y-2 md:col-span-2">
          <Label>
            Alamat<span className="text-red-500">*</span>
          </Label>
          <Controller
            name="alamat"
            control={control}
            render={({ field }) => (
              <Textarea placeholder="Masukan alamat survey..." {...field} />
            )}
          />
          {errors.alamat && (
            <span className="text-red-500 text-sm">
              {errors.alamat.message}
            </span>
          )}
        </div>

        <div className="flex flex-col space-y-2 md:col-span-2">
          <Label>Shareloc (opsional)</Label>
          <Controller
            name="link_address"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Tempel link shareloc Google Maps (boleh kosong)"
                {...field}
              />
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
