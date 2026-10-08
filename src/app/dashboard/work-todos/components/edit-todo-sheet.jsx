"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useApiFetch } from "@/hooks/use-api-fetch";
import Loader from "@/components/ui/loader";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/date-picker";
import { formatDateDb } from "@/lib/date-format-db";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconPlus,
  IconTrash,
  IconCheck,
  IconClock,
  IconX,
  IconLoader,
  IconListCheck,
  IconHash,
  IconChartBar,
} from "@tabler/icons-react";
import {
  canEditTodo,
  getEditTimeValidationMessage,
} from "@/lib/todo-time-validation";

// Component for task statistics
const TaskStats = ({ fields, watch }) => {
  const doneCount = fields.filter(
    (_, idx) => watch(`items.${idx}.status`) === "done",
  ).length;
  return (
    <p className="text-xs text-muted-foreground">
      {fields.length} task{fields.length > 1 ? "s" : ""} • {doneCount} selesai
    </p>
  );
};

const schema = z.object({
  date: z.string().min(1, "Tanggal harus diisi"),
  items: z
    .array(
      z
        .object({
          id: z.number().optional(),
          task_name: z.string().min(1, "Nama task harus diisi"),
          reason: z.string().min(1, "Keterangan harus diisi"),
          status: z
            .enum(["pending", "on_progress", "done"])
            .default("on_progress"),
          type: z
            .enum(["checklist", "quantity", "progress"])
            .default("progress"),
          target_amount: z.coerce.number().optional(),
          current_amount: z.coerce.number().default(0),
          progress_percentage: z.coerce.number().default(0),
        })
        .superRefine((data, ctx) => {
          if (
            data.type === "quantity" &&
            (!data.target_amount || data.target_amount <= 0)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Target harus lebih dari 0",
              path: ["target_amount"],
            });
          }
        }),
    )
    .min(1, "Minimal harus ada 1 task"),
});

export default function EditTodoSheet({
  open,
  onOpenChange,
  todoId,
  onSuccess,
}) {
  // Fetch todo data (which includes items)
  const {
    data: todoData,
    isLoading: loadingTodo,
    refetch: refetchTodo,
  } = useApiFetch(
    todoId ? ["work-todo-edit", todoId] : null,
    todoId ? `/work-todos/${todoId}` : null,
    {},
    open && !!todoId, // Hanya fetch ketika sheet dibuka dan todoId ada
  );

  const { mutate, isPending } = usePut(`/work-todos/${todoId}`);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: "",
      items: [
        {
          task_name: "",
          reason: "",
          status: "on_progress",
          type: "progress",
          target_amount: 0,
          current_amount: 0,
          progress_percentage: 0,
        },
      ],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = (data) => {
    if (!canEditTodo()) {
      toast.error(getEditTimeValidationMessage());
      return;
    }

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
            resolve();
          },
          onError: (err) => {
            const errorMessage =
              err?.response?.data?.errors?.time?.[0] ||
              err?.response?.data?.message ||
              "Gagal untuk menyimpan!";
            reject(errorMessage);
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Todo berhasil diupdate!",
        error: (msg) => (msg ? msg : "Gagal untuk menyimpan!"),
      },
    );
  };

  // Refetch data ketika sheet dibuka
  useEffect(() => {
    if (open && todoId) {
      refetchTodo();
    }
  }, [open, todoId, refetchTodo]);

  // Load todo data when sheet opens
  useEffect(() => {
    if (todoData?.data && open) {
      const todo = todoData.data;
      const items =
        todo.items?.map((item) => ({
          id: item.id,
          task_name: item.task_name || "",
          reason: item.reason || "",
          status: item.status || "on_progress",
          type: item.type || "progress",
          target_amount: item.target_amount || 0,
          current_amount: item.current_amount || 0,
          progress_percentage: item.progress_percentage || 0,
        })) || [];

      reset({
        date: todo.date || "",
        items:
          items.length > 0
            ? items
            : [
                {
                  task_name: "",
                  reason: "",
                  status: "on_progress",
                  type: "progress",
                  target_amount: 0,
                  current_amount: 0,
                  progress_percentage: 0,
                },
              ],
      });
    }
  }, [todoData, open, reset]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      reset({
        date: "",
        items: [
          {
            task_name: "",
            reason: "",
            status: "on_progress",
            type: "progress",
            target_amount: 0,
            current_amount: 0,
            progress_percentage: 0,
          },
        ],
      });
    }
  }, [open, reset]);

  const handleMarkAllDone = () => {
    const currentItems = getValues("items");
    const updatedItems = currentItems.map((item) => ({
      ...item,
      status: "done",
    }));
    updatedItems.forEach((item, index) => {
      update(index, item);
    });
    toast.success("Semua tugas ditandai sebagai done");
  };

  const handleDeleteItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("Minimal harus ada 1 task");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Edit Todo List</SheetTitle>
          <SheetDescription>
            Edit todo dan kelola tugas-tugas kamu. Tambah, edit, atau hapus
            tugas sesuai kebutuhan.
          </SheetDescription>
        </SheetHeader>

        {loadingTodo ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 mt-6 px-3"
          >
            {/* DATE */}
            <div className="space-y-2">
              <Label>
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={watch("date")}
                onChange={(date) => setValue("date", formatDateDb(date))}
              />
              {errors.date && (
                <span className="text-red-500 text-sm">
                  {errors.date.message}
                </span>
              )}
            </div>

            {/* ITEMS SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">
                    Tasks <span className="text-red-500">*</span>
                  </Label>
                  <TaskStats fields={fields} watch={watch} />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllDone}
                    className="gap-2"
                  >
                    <IconCheck className="h-4 w-4" />
                    Done Semua
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() =>
                      append({
                        task_name: "",
                        reason: "",
                        status: "on_progress",
                        type: "progress",
                        target_amount: 0,
                        current_amount: 0,
                        progress_percentage: 0,
                      })
                    }
                    className="gap-2"
                  >
                    <IconPlus className="h-4 w-4" />
                    Tambah Task
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                {fields.map((field, index) => {
                  const currentStatus = watch(`items.${index}.status`);
                  const currentType = watch(`items.${index}.type`);
                  const isDone = currentStatus === "done";
                  const isOnProgress = currentStatus === "on_progress";

                  return (
                    <div
                      key={field.id}
                      className={`relative p-5 rounded-lg border-2 transition-all ${
                        isDone
                          ? "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800"
                          : isOnProgress
                            ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800"
                            : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm shrink-0 ${
                              isDone
                                ? "bg-green-600 text-white"
                                : isOnProgress
                                  ? "bg-blue-600 text-white"
                                  : "bg-primary/10 text-primary"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Task {index + 1}
                            </Label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Controller
                            name={`items.${index}.type`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isDone}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="checklist">
                                    <div className="flex items-center gap-2">
                                      <IconListCheck className="h-3 w-3" />
                                      Checklist
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="quantity">
                                    <div className="flex items-center gap-2">
                                      <IconHash className="h-3 w-3" />
                                      Quantity
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="progress">
                                    <div className="flex items-center gap-2">
                                      <IconChartBar className="h-3 w-3" />
                                      Progress
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <Controller
                            name={`items.${index}.status`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    <div className="flex items-center gap-2">
                                      <IconClock className="h-3 w-3" />
                                      Pending
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="on_progress">
                                    <div className="flex items-center gap-2">
                                      <IconLoader className="h-3 w-3" />
                                      On Progress
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="done">
                                    <div className="flex items-center gap-2">
                                      <IconCheck className="h-3 w-3" />
                                      Done
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Task Content */}
                      <div className="space-y-4 pl-11">
                        {/* Task Name */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            Nama Task
                            <span className="text-red-500">*</span>
                            {isDone && (
                              <Badge
                                variant="outline"
                                className="ml-auto h-5 text-xs bg-green-100 text-green-700 border-green-300"
                              >
                                <IconCheck className="h-3 w-3 mr-1" />
                                Selesai
                              </Badge>
                            )}
                            {isOnProgress && (
                              <Badge
                                variant="outline"
                                className="ml-auto h-5 text-xs bg-blue-100 text-blue-700 border-blue-300"
                              >
                                <IconLoader className="h-3 w-3 mr-1" />
                                On Progress
                              </Badge>
                            )}
                          </Label>
                          <Input
                            placeholder="Masukkan nama task..."
                            {...register(`items.${index}.task_name`)}
                            className={`${isDone ? "bg-white/80" : ""}`}
                            disabled={isDone}
                          />
                          {errors.items?.[index]?.task_name && (
                            <span className="text-red-500 text-sm flex items-center gap-1">
                              <IconX className="h-3 w-3" />
                              {errors.items[index].task_name.message}
                            </span>
                          )}
                        </div>

                        {/* Type Specific Inputs */}
                        {currentType === "quantity" && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                Target
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="number"
                                placeholder="Target"
                                {...register(`items.${index}.target_amount`)}
                                className={`${isDone ? "bg-white/80" : ""}`}
                                disabled={isDone}
                                min={1}
                              />
                              {errors.items?.[index]?.target_amount && (
                                <span className="text-red-500 text-sm flex items-center gap-1">
                                  <IconX className="h-3 w-3" />
                                  {errors.items[index].target_amount.message}
                                </span>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                Tercapai
                              </Label>
                              <Input
                                type="number"
                                placeholder="Current"
                                {...register(`items.${index}.current_amount`)}
                                className={`${isDone ? "bg-white/80" : ""}`}
                                disabled={isDone}
                                min={0}
                                onChange={(e) => {
                                  register(
                                    `items.${index}.current_amount`,
                                  ).onChange(e);
                                  const val = Number(e.target.value);
                                  const target = Number(
                                    getValues(`items.${index}.target_amount`) ||
                                      0,
                                  );
                                  if (val >= target && target > 0) {
                                    setValue(`items.${index}.status`, "done");
                                  } else if (
                                    val > 0 &&
                                    watch(`items.${index}.status`) === "pending"
                                  ) {
                                    setValue(
                                      `items.${index}.status`,
                                      "on_progress",
                                    );
                                  }
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {currentType === "progress" && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              Progress (%)
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0 - 100"
                                {...register(
                                  `items.${index}.progress_percentage`,
                                )}
                                className={`${isDone ? "bg-white/80" : ""} pr-8`}
                                disabled={isDone}
                                min={0}
                                max={100}
                                onChange={(e) => {
                                  register(
                                    `items.${index}.progress_percentage`,
                                  ).onChange(e);
                                  const val = Number(e.target.value);
                                  if (val === 100) {
                                    setValue(`items.${index}.status`, "done");
                                  } else if (
                                    val > 0 &&
                                    watch(`items.${index}.status`) === "pending"
                                  ) {
                                    setValue(
                                      `items.${index}.status`,
                                      "on_progress",
                                    );
                                  }
                                }}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                %
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reason/Keterangan */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            Alasan / Keterangan
                            <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            placeholder="Tambahkan alasan atau keterangan untuk task ini..."
                            {...register(`items.${index}.reason`)}
                            rows={3}
                            className={`resize-none ${
                              isDone ? "bg-white/80" : ""
                            }`}
                            disabled={isDone}
                          />
                          {errors.items?.[index]?.reason && (
                            <span className="text-red-500 text-sm flex items-center gap-1">
                              <IconX className="h-3 w-3" />
                              {errors.items[index].reason.message}
                            </span>
                          )}
                          {watch(`items.${index}.reason`) && (
                            <p className="text-xs text-muted-foreground">
                              {watch(`items.${index}.reason`).length} karakter
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Indicator Bar */}
                      {isDone && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-green-600 rounded-t-lg" />
                      )}
                      {isOnProgress && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-t-lg" />
                      )}
                    </div>
                  );
                })}
              </div>

              {errors.items &&
                typeof errors.items === "object" &&
                !Array.isArray(errors.items) && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <IconX className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      {errors.items.message}
                    </span>
                  </div>
                )}

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    Belum ada task. Tambahkan task pertama Anda.
                  </p>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <SheetFooter className="mt-6 px-3 pt-4 border-t sticky bottom-0 bg-background">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="text-xs text-muted-foreground">
                  Waktu pengeditan: Sampai 17:17
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="min-w-32"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader className="h-4 w-4" />
                        Menyimpan...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <IconCheck className="h-4 w-4" />
                        Simpan Perubahan
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
