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
import { useDateRange } from "@/lib/date-range";
import {
  buildingTypes,
  INCOME,
  requestTypes,
  sourceLeads,
  statusLeads,
  surveyTypes,
} from "@/data/data";
import Tooltips from "@/components/tooltips";
import { Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { formatDateDb } from "@/lib/date-format-db";
import { useFlashData } from "@/hooks/use-flash-data";

// ----------------------
// VALIDATION
// ----------------------
const schema = z
  .object({
    date: z.string().optional(),
    name: z.string().optional(),
    whatsapp_number: z.string().optional(),
    request_type: z.string().optional(),
    building_type: z.string().optional(),
    status: z.string().min(1, "Status is required"),
    source: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    income: z.string().optional(),
    follow_up_count: z.number().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.status === "Follow up" || v.status === "Gajelas") {
      return;
    }

    const requiredFields = [
      "name",
      "whatsapp_number",
      "request_type",
      "building_type",
      "source",
      "location",
      "notes",
    ];

    requiredFields.forEach((field) => {
      if (!v[field] || v[field].length === 0) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field.replace("_", " ")} is required`,
        });
      }
    });
  });

export default function LeadFormComponent() {
  const router = useRouter();
  const { mutate, isPending } = usePost("/leads", {
    invalidate: [["leads"]],
  });
  const { start } = useDateRange("today");

  const [submitAction, setSubmitAction] = useState("create");

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
      date: "",
      name: "",
      whatsapp_number: "",
      request_type: "",
      building_type: "",
      status: "",
      source: "",
      location: "",
      notes: "",
      income: "",
      follow_up_count: 0,
    },
  });

  useFlashData(watch, reset, "lead_form_data");

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            if (submitAction === "create") {
              router.push("/dashboard/leads/report-leads");
            }

            if (submitAction === "create_another") {
              reset({
                date: formatDateDb(start),
                // date: "",
                name: "",
                whatsapp_number: "",
                request_type: "",
                building_type: "",
                status: "",
                source: "",
                location: "",
                notes: "",
                income: "",
                follow_up_count: 0,
              });
            }

            localStorage.removeItem("lead_form_data");
            resolve();
          },
          onError: (err) => {
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Lead berhasil ditambahkan!",

        error: (msg) => msg ?? "Gagal menyimpan data!",
      },
    );
  };

  useEffect(() => {
    setValue("date", formatDateDb(start));
  }, []);

  const status = watch("status");
  const optionalStatus = ["Gajelas", "Follow up"];

  return (
    <DashboardLayout title="Create Lead" desc="Tambah lead baru disini">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* DATE */}
        <div className="flex flex-col space-y-2">
          <Label className="flex justify-between items-center">
            <p>
              Tanggal<span className="text-red-500">*</span>
            </p>
            <Tooltips
              trigger={<Info className="size-4" />}
              desc="Secara otomatis terisi dengan tanggal hari ini"
            />
          </Label>
          <DatePicker
            label=""
            value={formatDateDb(start)}
            disabled={true}
            {...register("date")}
            onChange={(date) => setValue("date", formatDateDb(date))}
          />
          {errors.date && (
            <span className="text-red-500 text-sm">{errors.date.message}</span>
          )}
        </div>

        {/* NAME */}
        <div className="flex flex-col space-y-2">
          <Label>
            Client Name{" "}
            {!optionalStatus.includes(status) && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Input placeholder="Masukan nama" {...register("name")} />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        {/* WHATSAPP */}
        <div className="flex flex-col space-y-2">
          <Label>
            Phone
            {!optionalStatus.includes(status) && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Input
            placeholder="Masukan no phone..."
            {...register("whatsapp_number")}
          />
          {errors.whatsapp_number && (
            <span className="text-red-500 text-sm">
              {errors.whatsapp_number.message}
            </span>
          )}
        </div>

        {/* LOCATION */}
        <div className="flex flex-col space-y-2">
          <Label>
            Lokasi
            {!optionalStatus.includes(status) && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Input placeholder="Masukan lokasi" {...register("location")} />
          {errors.location && (
            <span className="text-red-500 text-sm">
              {errors.location.message}
            </span>
          )}
        </div>

        {/* KEBUTUHAN */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Kebutuhan
            {!optionalStatus.includes(status) && (
              <span className="text-red-500">*</span>
            )}
          </Label>

          <Controller
            name="request_type"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value != "" ? field.value : ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kebutuhan" />
                </SelectTrigger>

                <SelectContent>
                  {requestTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.request_type && (
            <span className="text-red-500 text-sm">
              {errors.request_type.message}
            </span>
          )}
        </div>

        {/* BUILDING TYPE */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Jenis Bangunan
            {!optionalStatus.includes(status) && (
              <span className="text-red-500">*</span>
            )}
          </Label>

          <Controller
            name="building_type"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value != "" ? field.value : ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Jenis Bangunan" />
                </SelectTrigger>

                <SelectContent>
                  {buildingTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.building_type && (
            <span className="text-red-500 text-sm">
              {errors.building_type.message}
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
                value={field.value != "" ? field.value : ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>

                <SelectContent>
                  {statusLeads.slice(1).map((item) => (
                    <SelectItem key={item.value} value={item.value}>
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

        {/* SOURCE */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Sumber
            {!optionalStatus.includes(watch("status")) && (
              <span className="text-red-500">*</span>
            )}
          </Label>

          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value != "" ? field.value : ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Sumber" />
                </SelectTrigger>

                <SelectContent>
                  {sourceLeads.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.source && (
            <span className="text-red-500 text-sm">
              {errors.source.message}
            </span>
          )}
        </div>

        {/* INCOME */}
        <div className="flex flex-col space-y-2 w-full">
          <Label>
            Pendapatan
            {!optionalStatus.includes(watch("status")) && (
              <span className="text-red-500">*</span>
            )}
          </Label>

          <Controller
            name="income"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value != "" ? field.value : ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Pendapatan" />
                </SelectTrigger>

                <SelectContent>
                  {INCOME.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {errors.income && (
            <span className="text-red-500 text-sm">
              {errors.income.message}
            </span>
          )}
        </div>

        {/* FOLLOW_UP_COUNT */}
        <div className="flex flex-col space-y-2">
          <Label>
            Follow Up Count{" "}
            {!optionalStatus.includes(status) && (
              <span className="text-red-500">*</span>
            )}
          </Label>
          <Input
            placeholder="Masukan follow up count"
            disabled
            value={0}
            {...register("follow_up_count")}
          />
          {errors.follow_up_count && (
            <span className="text-red-500 text-sm">
              {errors.follow_up_count.message}
            </span>
          )}
        </div>

        {/* SURVEY */}
        {/* <div className="flex flex-col space-y-2">
          <Label>Survey</Label>
          <Select onValueChange={(v) => setValue("survey", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Survey?" />
            </SelectTrigger>
            <SelectContent>
              {surveyTypes.map((item) => (
                <SelectItem key={item.label} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.survey && (
            <span className="text-red-500 text-sm">
              {errors.survey.message}
            </span>
          )}
        </div> */}

        {/* NOTES */}
        <div className="flex flex-col space-y-2 md:col-span-2">
          <Label>
            Catatan
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Masukan catatan tambahan..."
            {...register("notes")}
          />
          {errors.notes && (
            <span className="text-red-500 text-sm">{errors.notes.message}</span>
          )}
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
            onClick={() => router.push("/dashboard/leads/report-leads")}
          >
            Batal
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
