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
  IconPlus,
  IconTrash,
  IconCheck,
  IconClock,
  IconX,
  IconLoader,
  IconListCheck,
  IconHash,
  IconChartBar,
  IconMinus,
} from "@tabler/icons-react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const schema = z
  .object({
    task_name: z.string().min(1, "Nama task harus diisi"),
    reason: z.string().optional(),
    status: z.enum(["pending", "on_progress", "done"], {
      required_error: "Status harus diisi",
    }),
    type: z.enum(["checklist", "quantity", "progress"]).default("progress"),
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
  });

export default function EditTodoItemSheet({
  open,
  onOpenChange,
  todoId,
  itemId,
  onSuccess,
}) {
  // Fetch todo data (which includes items)
  const {
    data: todoData,
    isLoading: loadingItem,
    refetch: refetchItem,
  } = useApiFetch(
    todoId && itemId ? ["work-todo", todoId, itemId] : null,
    todoId ? `/work-todos/${todoId}` : null,
  );

  const { mutate, isPending } = usePut(
    itemId ? `/work-todo-items/${itemId}` : null,
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      task_name: "",
      reason: "",
      status: "pending",
      type: "progress",
      target_amount: 0,
      current_amount: 0,
      progress_percentage: 0,
    },
  });

  const onSubmit = (data) => {
    if (!itemId) return;

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
            resolve();
          },
          onError: (err) => {
            if (err) reject(err?.response?.data?.message);
          },
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Todo item berhasil diupdate!",
        error: (msg) => (msg ? msg : "Gagal untuk menyimpan!"),
      },
    );
  };

  // Find the item from todo data
  useEffect(() => {
    if (todoData?.data && open && itemId) {
      // Extract item from todo.items array by itemId
      const todo = todoData.data;
      const item = todo.items?.find((i) => i.id === parseInt(itemId));

      if (item) {
        reset({
          task_name: item.task_name || "",
          reason: item.reason || "",
          status: item.status || "pending",
          type: item.type || "progress",
          target_amount: item.target_amount || 0,
          current_amount: item.current_amount || 0,
          progress_percentage: item.progress_percentage || 0,
        });
      }
    }
  }, [todoData, itemId, open, reset]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      reset({
        task_name: "",
        reason: "",
        status: "pending",
        type: "progress",
        target_amount: 0,
        current_amount: 0,
        progress_percentage: 0,
      });
    }
  }, [open, reset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Edit Todo Item</SheetTitle>
          <SheetDescription>
            Edit task dan ubah status dari pending ke done ketika sudah selesai.
          </SheetDescription>
        </SheetHeader>

        {loadingItem ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 mt-6 px-3"
          >
            {/* TASK NAME */}
            <div className="flex flex-col space-y-2">
              <Label>
                Nama Task <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Masukan nama task..."
                {...register("task_name")}
              />
              {errors.task_name && (
                <span className="text-red-500 text-sm">
                  {errors.task_name.message}
                </span>
              )}
            </div>

            {/* REASON */}
            <div className="flex flex-col space-y-2">
              <Label>Alasan/Keterangan (Opsional)</Label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <Textarea
                    placeholder="Masukan alasan/keterangan..."
                    {...field}
                  />
                )}
              />
              {errors.reason && (
                <span className="text-red-500 text-sm">
                  {errors.reason.message}
                </span>
              )}
            </div>

            {/* STATUS */}
            <div className="flex flex-col space-y-2">
              <Label>
                Status <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checklist">
                          <div className="flex items-center gap-2">
                            <IconListCheck className="h-4 w-4" />
                            Checklist
                          </div>
                        </SelectItem>
                        <SelectItem value="quantity">
                          <div className="flex items-center gap-2">
                            <IconHash className="h-4 w-4" />
                            Quantity
                          </div>
                        </SelectItem>
                        <SelectItem value="progress">
                          <div className="flex items-center gap-2">
                            <IconChartBar className="h-4 w-4" />
                            Progress
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />

                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="on_progress">On Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {errors.status && (
                <span className="text-red-500 text-sm">
                  {errors.status.message}
                </span>
              )}
            </div>

            {/* TARGET AMOUNT (Only for Quantity) */}
            {watch("type") === "quantity" && (
              <div className="flex flex-col space-y-2">
                <Label>
                  Target Jumlah <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Masukan target jumlah..."
                  {...register("target_amount")}
                />
                {errors.target_amount && (
                  <span className="text-red-500 text-sm">
                    {errors.target_amount.message}
                  </span>
                )}
              </div>
            )}

            {/* CHECKLIST UI */}
            {watch("type") === "checklist" && (
              <div className="flex flex-col space-y-4 border p-4 rounded-lg bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <Label>Status Checklist</Label>
                  <Badge
                    variant={
                      watch("status") === "done" ? "default" : "secondary"
                    }
                  >
                    {watch("status") === "done"
                      ? "Selesai"
                      : watch("status") === "on_progress"
                        ? "Dikerjakan"
                        : "Pending"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={
                      watch("status") === "pending" ? "default" : "outline"
                    }
                    onClick={() => setValue("status", "pending")}
                    className="w-full"
                  >
                    Pending
                  </Button>
                  <Button
                    type="button"
                    variant={
                      watch("status") === "on_progress" ? "default" : "outline"
                    }
                    onClick={() => setValue("status", "on_progress")}
                    className="w-full"
                  >
                    Proses
                  </Button>
                  <Button
                    type="button"
                    variant={watch("status") === "done" ? "default" : "outline"}
                    onClick={() => setValue("status", "done")}
                    className="w-full"
                  >
                    Selesai
                  </Button>
                </div>
              </div>
            )}

            {/* PROGRESS UI */}
            {watch("type") === "progress" && (
              <div className="flex flex-col space-y-4 border p-4 rounded-lg bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <Label>Progress (%)</Label>
                  <span className="font-bold text-lg text-primary">
                    {watch("progress_percentage")}%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="flex-1 cursor-pointer h-10"
                    value={watch("progress_percentage")}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setValue("progress_percentage", val);
                      if (val === 100) setValue("status", "done");
                      else if (val > 0 && watch("status") === "pending")
                        setValue("status", "on_progress");
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="w-20 text-center"
                    value={watch("progress_percentage")}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val > 100) val = 100;
                      if (val < 0) val = 0;
                      setValue("progress_percentage", val);
                      if (val === 100) setValue("status", "done");
                      else if (val > 0 && watch("status") === "pending")
                        setValue("status", "on_progress");
                    }}
                  />
                </div>

                <div className="flex gap-2 justify-center flex-wrap">
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={
                        watch("progress_percentage") === pct
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }
                      onClick={() => {
                        setValue("progress_percentage", pct);
                        if (pct === 100) setValue("status", "done");
                        else if (pct > 0 && watch("status") === "pending")
                          setValue("status", "on_progress");
                      }}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* QUANTITY UI */}
            {watch("type") === "quantity" && (
              <div className="flex flex-col space-y-4 border p-4 rounded-lg bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <Label>Progress Jumlah</Label>
                  <div className="text-right">
                    <span className="font-bold text-lg text-primary">
                      {watch("current_amount")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      / {watch("target_amount") || 0}
                    </span>
                  </div>
                </div>

                <Progress
                  value={
                    (watch("current_amount") / (watch("target_amount") || 1)) *
                    100
                  }
                  className="h-2"
                />

                <div className="flex items-center gap-4 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = Number(watch("current_amount") || 0);
                      if (current > 0) setValue("current_amount", current - 1);
                    }}
                  >
                    <IconMinus className="h-4 w-4" />
                  </Button>

                  <Input
                    type="number"
                    className="w-24 text-center text-lg font-medium"
                    value={watch("current_amount")}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setValue("current_amount", val);
                      const target = Number(watch("target_amount") || 0);
                      if (target > 0 && val >= target)
                        setValue("status", "done");
                      else if (val > 0 && watch("status") === "pending")
                        setValue("status", "on_progress");
                    }}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = Number(watch("current_amount") || 0);
                      const newVal = current + 1;
                      setValue("current_amount", newVal);
                      const target = Number(watch("target_amount") || 0);
                      if (target > 0 && newVal >= target)
                        setValue("status", "done");
                      else if (newVal > 0 && watch("status") === "pending")
                        setValue("status", "on_progress");
                    }}
                  >
                    <IconPlus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue("current_amount", 0)}
                  >
                    Reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const target = Number(watch("target_amount") || 0);
                      const half = Math.floor(target / 2);
                      setValue("current_amount", half);
                      if (half > 0 && watch("status") === "pending")
                        setValue("status", "on_progress");
                    }}
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={
                      Number(watch("current_amount")) >=
                      Number(watch("target_amount"))
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : ""
                    }
                    onClick={() => {
                      const target = Number(watch("target_amount") || 0);
                      setValue("current_amount", target);
                      setValue("status", "done");
                    }}
                  >
                    Selesai ({watch("target_amount")})
                  </Button>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <SheetFooter className="mt-4 px-3">
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
