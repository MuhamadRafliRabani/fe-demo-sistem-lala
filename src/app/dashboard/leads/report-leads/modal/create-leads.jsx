"use client";

import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Info, Loader2, UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import Tooltips from "@/components/tooltips";
import { DatePicker } from "@/components/date-picker";
import { usePost } from "@/hooks/use-api-mutation";
import { useFlashData } from "@/hooks/use-flash-data";
import { useDateRange } from "@/lib/date-range";
import { formatDateDb } from "@/lib/date-format-db";
import { cn } from "@/lib/utils";
import {
  buildingTypes,
  INCOME,
  requestTypes,
  sourceLeads,
  statusLeads,
} from "@/data/data";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

// ----------------------
// CONSTANTS
// ----------------------
export const OPTIONAL_STATUS = ["Gajelas", "Follow up"];

export const FIELD_LABELS = {
  name: "Nama client",
  whatsapp_number: "Nomor phone",
  request_type: "Kebutuhan",
  building_type: "Jenis bangunan",
  building_area: "Luas bangunan",
  source: "Sumber",
  location: "Lokasi",
  notes: "Catatan",
};

export const DEFAULT_VALUES = {
  date: "",
  name: "",
  whatsapp_number: "",
  request_type: "",
  building_type: "",
  building_area: "",
  status: "",
  source: "",
  location: "",
  notes: "",
  income: "",
  follow_up_count: 0,
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
};

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
    building_area: z.number().min(0).nullable().optional(),
    status: z.string().min(1, "Status wajib dipilih"),
    source: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    income: z.string().optional(),
    follow_up_count: z.number().optional(),
  })
  .superRefine((v, ctx) => {
    if (OPTIONAL_STATUS.includes(v.status)) return;

    Object.keys(FIELD_LABELS).forEach((field) => {
      if (!hasValue(v[field])) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${FIELD_LABELS[field]} wajib diisi`,
        });
      }
    });
  });

// ----------------------
// SMALL UI HELPERS
// ----------------------
export function Section({ title, desc, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

export function Field({ label, required, error, hint, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center justify-between gap-2 text-sm font-medium">
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        {hint}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function SelectField({
  name,
  control,
  label,
  placeholder,
  options,
  required,
  error,
  className,
}) {
  return (
    <Field
      label={label}
      required={required}
      error={error}
      className={className}
    >
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <SelectTrigger
              className={cn("w-full", error && "border-red-500")}
              aria-invalid={!!error}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}

// ----------------------
// MAIN COMPONENT
// ----------------------
/**
 * Props:
 * - open          : boolean
 * - onOpenChange  : (open: boolean) => void
 * - onSuccess     : () => void (opsional, dipanggil setelah data tersimpan)
 */
export default function CreateLeadModal({ open, onOpenChange, onSuccess }) {
  const { mutate, isPending } = usePost("/leads", {
    invalidate: [["leads"]],
  });
  const { start } = useDateRange("today");

  // pakai ref biar nilai action selalu terbaca benar saat submit
  const submitAction = useRef("create");

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
    defaultValues: DEFAULT_VALUES,
  });

  useFlashData(watch, reset, "lead_form_data");

  const status = watch("status");
  const isRequired = !OPTIONAL_STATUS.includes(status);

  // set tanggal otomatis setiap modal dibuka
  useEffect(() => {
    if (open) setValue("date", formatDateDb(start));
  }, [open]);

  const onSubmit = (data) => {
    const action = submitAction.current;

    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            reset({ ...DEFAULT_VALUES, date: formatDateDb(start) });
            localStorage.removeItem("lead_form_data");

            if (action === "create") onOpenChange(false);
            onSuccess?.();
            resolve();
          },
          onError: (err) => reject(err?.response?.data?.message),
        });
      }),
      {
        loading: "Menyimpan...",
        success: "Lead berhasil ditambahkan!",
        error: (msg) => msg ?? "Gagal menyimpan data!",
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* HEADER */}
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base sm:text-lg">
                Tambah Lead Baru
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Pilih status dulu, kolom wajib akan menyesuaikan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* BODY (scrollable) */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            {/* STATUS & TANGGAL */}
            <Section title="Status lead">
              <Field
                label="Tanggal"
                required
                error={errors.date?.message}
                hint={
                  <Tooltips
                    trigger={<Info className="size-4 text-muted-foreground" />}
                    desc="Secara otomatis terisi dengan tanggal hari ini"
                  />
                }
              >
                <DatePicker
                  label=""
                  value={formatDateDb(start)}
                  disabled={true}
                  {...register("date")}
                  onChange={(date) => setValue("date", formatDateDb(date))}
                />
              </Field>

              <div className="space-y-1.5">
                <SelectField
                  name="status"
                  control={control}
                  label="Status"
                  placeholder="Pilih status"
                  options={statusLeads.slice(1)}
                  required
                  error={errors.status?.message}
                />
                {status && !isRequired && (
                  <p className="text-xs text-muted-foreground">
                    Status “{status}”: kolom lain boleh dikosongkan.
                  </p>
                )}
              </div>
            </Section>

            <hr className="border-border" />

            {/* INFO CLIENT */}
            <Section title="Info client" desc="Data kontak dan lokasi client.">
              <Field
                label="Nama client"
                required={isRequired}
                error={errors.name?.message}
              >
                <Input
                  placeholder="Masukkan nama"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              </Field>

              <Field
                label="Phone"
                required={isRequired}
                error={errors.whatsapp_number?.message}
              >
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="Contoh: 08123456789"
                  aria-invalid={!!errors.whatsapp_number}
                  {...register("whatsapp_number")}
                />
              </Field>

              <Field
                label="Lokasi"
                required={isRequired}
                error={errors.location?.message}
                className="sm:col-span-2"
              >
                <Input
                  placeholder="Masukkan lokasi"
                  aria-invalid={!!errors.location}
                  {...register("location")}
                />
              </Field>
            </Section>

            <hr className="border-border" />

            {/* DETAIL KEBUTUHAN */}
            <Section
              title="Detail kebutuhan"
              desc="Apa yang dicari client dan dari mana lead masuk."
            >
              <SelectField
                name="request_type"
                control={control}
                label="Kebutuhan"
                placeholder="Pilih kebutuhan"
                options={requestTypes}
                required={isRequired}
                error={errors.request_type?.message}
              />

              <SelectField
                name="building_type"
                control={control}
                label="Jenis bangunan"
                placeholder="Pilih jenis bangunan"
                options={buildingTypes}
                required={isRequired}
                error={errors.building_type?.message}
              />

              <Field
                label="Luas bangunan"
                required={isRequired}
                error={errors.building_area?.message}
              >
                <InputGroup>
                  <InputGroupInput
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    aria-invalid={!!errors.building_area}
                    {...register("building_area", {
                      setValueAs: (v) =>
                        v === "" || v === null || v === undefined
                          ? null
                          : Number(v),
                    })}
                  />
                  <InputGroupAddon>
                    <InputGroupText>m²</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <SelectField
                name="source"
                control={control}
                label="Sumber"
                placeholder="Pilih sumber"
                options={sourceLeads}
                required={isRequired}
                error={errors.source?.message}
              />

              <SelectField
                name="income"
                control={control}
                label="Pendapatan (opsional)"
                placeholder="Pilih pendapatan"
                options={INCOME}
                error={errors.income?.message}
              />
            </Section>

            <hr className="border-border" />

            {/* CATATAN */}
            <Section title="Catatan">
              <Field
                label="Catatan tambahan"
                required={isRequired}
                error={errors.notes?.message}
                className="sm:col-span-2"
              >
                <Textarea
                  rows={4}
                  className="resize-none"
                  placeholder="Tulis detail penting dari percakapan dengan client..."
                  aria-invalid={!!errors.notes}
                  {...register("notes")}
                />
              </Field>
            </Section>
          </div>

          {/* FOOTER (selalu kelihatan) */}
          <div className="flex flex-col-reverse gap-2 border-t bg-muted/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => (submitAction.current = "create_another")}
            >
              {isPending && submitAction.current === "create_another" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Simpan & Tambah Lagi
            </Button>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isPending}
              onClick={() => (submitAction.current = "create")}
            >
              {isPending && submitAction.current === "create" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Simpan Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
