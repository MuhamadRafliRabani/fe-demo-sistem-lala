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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

import { usePut } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { statusSurvey } from "@/data/data";
import { Textarea } from "@/components/ui/textarea";
import { useApiFetch } from "@/hooks/use-api-fetch";
import MultiSelect from "@/components/MultiSelect";
import Loader from "@/components/ui/loader";
import { formatDateDb } from "@/lib/date-format-db";
import SearchableSelect from "@/components/searchable-select";
import { Input } from "@/components/ui/input";

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

export default function EditScheduleSheet({
  open,
  onOpenChange,
  scheduleId,
  onSuccess,
}) {
  // FETCH SCHEDULE DATA
  const {
    data: schedule,
    isLoading: loadingSchedule,
    refetch: refetchSchedule,
  } = useApiFetch(
    scheduleId ? ["schedules", scheduleId] : null,
    scheduleId ? `/schedules/${scheduleId}` : null,
  );

  const { mutate, isPending } = usePut(`/schedules/${scheduleId}`);

  // FETCH SURVEYORS
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
    reset,
    control,
    watch,
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
            onSuccess?.();
            onOpenChange(false);
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

  // Reset form when schedule data is loaded or sheet opens
  useEffect(() => {
    if (schedule?.data && open) {
      refetchSchedule();
      reset({
        date: new Date(schedule.data.date),
        name: schedule.data.client?.name,
        client_id: schedule.data.client?.id,
        region_id: schedule.data.region?.id,
        alamat: schedule.data.address,
        link_address: schedule.data.link_address,
        status: schedule.data.status,
        surveyors:
          schedule.data?.surveyors?.map((s) => s.id) ||
          schedule.data?.surveyor?.map((s) => s.id) ||
          [],
      });
    }
  }, [schedule, reset, open, refetchSchedule]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      reset({
        client_id: "",
        name: "",
        date: null,
        surveyors: [],
        region_id: "",
        alamat: "",
        link_address: "",
        status: "",
      });
    }
  }, [open, reset]);

  const { data: regionsResponse, isLoading: isLoadingRegions } = useApiFetch(
    ["regions"],
    "/master/regions",
    {
      page: 1,
      per_page: 100,
      is_active: true,
    },
  );

  const regions = regionsResponse?.data?.data ?? [];

  const regionOptions =
    regions.map((item) => ({
      label: item.name,
      value: item.id,
    })) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Edit Schedule Survey</SheetTitle>
          <SheetDescription>
            Edit data schedule survey disini. Pastikan semua field terisi dengan
            benar.
          </SheetDescription>
        </SheetHeader>

        {loadingSchedule || isLoadingsurveyors ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 px-3"
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
                  <Select value={schedule?.data?.client?.name} disabled>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={schedule?.data?.client?.name}>
                        {schedule?.data?.client?.name}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.name && (
                <span className="text-red-500 text-sm">
                  {errors.name.message}
                </span>
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
                <span className="text-red-500 text-sm">
                  {errors.date.message}
                </span>
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
                        : schedule?.data?.surveyors?.map((s) => s.id) || []
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
                    value={field.value ? field.value : schedule?.data?.status}
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
                    options={regionOptions}
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
            <div className="flex flex-col space-y-2">
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

            {/* ADDRESS */}
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
            </div>

            {/* ACTION BUTTONS */}
            <SheetFooter className="md:col-span-2 mt-4 px-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
