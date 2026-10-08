"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { FormRow } from "@/components/form-row";
import { DatePicker } from "@/components/date-picker";
import MultiSelect from "@/components/MultiSelect";

import { usePost, usePut } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatDateDb } from "@/lib/date-format-db";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { statusDesigns } from "@/data/data";
import { normalizeParams } from "@/lib/serialisasi-filter-leads";
import { getScheduleByStage } from "@/lib/get-schedule-stage";
const today = new Date();
today.setHours(0, 0, 0, 0);

const schema = z
  .object({
    action: z.string(),
    next_stage_id: z.string().min(1, "Stage wajib diisi"),
    designer_id: z.string().min(1, "Disigner wajib diisi"),
    start_date: z.date().nullable().optional(),
    end_date: z.date().nullable().optional(),
    townhall_date: z.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.next_stage_id == 10) {
        return data.townhall_date != undefined && data.townhall_date != null;
      }
      return true;
    },
    {
      message: "Tanggal townhall wajib diisi untuk stage Townhall",
      path: ["townhall_date"],
    },
  );

export function ChangeStageModal({
  open,
  setOpen,
  id,
  refetch,
  name,
  schedule,
}) {
  const { mutate, isPending } = usePut(`/tasks/${id}`, {
    invalidate: [["tasks-v2"], ["designer-tasks-dashboard"], ["tasks"]],
  });

  // Stabilkan params untuk task query
  const taskParams = useMemo(
    () => ({
      include: "currentStage,assignedDesigner",
    }),
    [],
  );

  // Hanya fetch task ketika modal dibuka dan id ada
  const {
    data: task,
    isLoading: isLoadingsurveyors,
    refetch: refetchTask,
  } = useApiFetch(
    ["tasks", id, taskParams],
    `/tasks/v2/${id}`,
    taskParams,
    open && !!id, // enabled: hanya fetch ketika modal dibuka dan id ada
  );

  const designerParams = useMemo(
    () => ({
      page: 1,
      paginate: 100,
      filter: {
        role_id: "5",
      },
    }),
    [],
  );

  // Hanya fetch designers ketika modal dibuka
  const { data: ds } = useApiFetch(
    "users-designers",
    "/users",
    designerParams,
    open, // enabled: hanya fetch ketika modal dibuka
  );

  const designers =
    ds?.data?.data?.map((item) => ({ label: item.name, value: item.id })) ?? [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      action: "next_stage",
      next_stage_id: "",
      designer_id: "",
      start_date: "",
      end_date: "",
      townhall_date: undefined,
    },
  });

  // SUBMIT
  const onSubmit = (data) => {
    // Hanya kirim townhall_date jika stage adalah 10 atau "townhall"
    const submitData = { ...data };

    if (submitData.next_stage_id >= 12) {
      delete submitData.start_date;
      delete submitData.end_date;
      delete submitData.townhall_date;
    }

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(submitData, {
          onSuccess: () => {
            setOpen(false);
            resolve();
          },
          onError: (err) => {
            if (err) reject(err?.response?.data.message);
          },
        });
      }),
      {
        loading: "Menyimpam...",
        success: "Survey berhasil ditambahkan!",
        error: (msg) => msg ?? "Gagal menyimpan data!",
      },
    );
  };

  useEffect(() => {
    // Hanya update form ketika modal dibuka dan data sudah tersedia
    if (!open || !task?.data) return;

    setValue("action", "next_stage");
    setValue("next_stage_id", String(task?.data.current_stage?.id || ""));
    setValue("designer_id", String(task?.data.assigned_designer?.id || ""));
    setValue("start_date", schedule?.start ? new Date(schedule?.start) : null);
    setValue("end_date", schedule?.end ? new Date(schedule?.end) : null);
    setValue(
      "townhall_date",
      task?.data?.current_stage?.id == 10 ? new Date() : undefined,
    );
  }, [open, task?.data, schedule?.start, schedule?.end, setValue]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Stage</DialogTitle>
          <DialogDescription>
            Masukan stage dan designer yang diperlukan.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 mt-2" onSubmit={handleSubmit(onSubmit)}>
          {/* ======================== */}
          {/* TANGGAL */}
          {/* ======================== */}
          <div>
            <Controller
              name="next_stage_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (Number(value) >= 12) {
                      reset({
                        ...watch(),
                        start_date: null,
                        end_date: null,
                        townhall_date: null,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statusDesigns.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {errors.next_stage_id && (
              <p className="text-red-500 text-sm">
                {errors.next_stage_id.message}
              </p>
            )}
          </div>

          <div>
            <Controller
              name="designer_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih designer" />
                  </SelectTrigger>

                  <SelectContent>
                    {designers.map((item) => (
                      <SelectItem key={item.value} value={String(item.value)}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {errors.designer_id && (
              <p className="text-red-500 text-sm">
                {errors.designer_id.message}
              </p>
            )}
          </div>

          {/* Tanggal Townhall, hanya muncul jika stage id = 10 atau "townhall" */}
          {watch("next_stage_id") == 10 && (
            <Controller
              name="townhall_date"
              control={control}
              render={({ field }) => (
                <div className="mt-3">
                  <DatePicker
                    label="Tanggal Townhall"
                    value={field.value || null}
                    onChange={field.onChange}
                    minDate={today}
                    required={true}
                    withTime
                    placeholder="Pilih tanggal townhall"
                  />
                  {errors.townhall_date && (
                    <p className="text-red-500 text-sm">
                      Tanggal townhall wajib diisi untuk stage Townhall
                    </p>
                  )}
                </div>
              )}
            />
          )}

          {/* ======================== */}
          {/* ACTION BUTTON */}
          {/* ======================== */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>

            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
