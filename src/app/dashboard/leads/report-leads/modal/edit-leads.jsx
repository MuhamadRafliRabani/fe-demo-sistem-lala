"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Info, Loader2, PencilLine } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Tooltips from "@/components/tooltips";
import { DatePicker } from "@/components/date-picker";
import { usePut } from "@/hooks/use-api-mutation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatDateDb } from "@/lib/date-format-db";
import {
  buildingTypes,
  INCOME,
  requestTypes,
  sourceLeads,
  statusLeads,
} from "@/data/data";
import {
  Section,
  Field,
  SelectField,
  OPTIONAL_STATUS,
  FIELD_LABELS,
} from "./create-leads";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

// ----------------------
// VALIDATION
// ----------------------
const parseBuildingArea = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const hasValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
};

const schema = z
  .object({
    date: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    whatsapp_number: z.string().nullable().optional(),
    request_type: z.string().nullable().optional(),
    building_type: z.string().nullable().optional(),
    building_area: z.preprocess(
      (value) => parseBuildingArea(value),
      z
        .number({ invalid_type_error: "Luas bangunan harus berupa angka" })
        .min(0)
        .nullable()
        .optional(),
    ),
    status: z.string().min(1, "Status wajib dipilih"),
    source: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    income: z.string().nullable().optional(),
    follow_up_count: z
      .number({ invalid_type_error: "Harus berupa angka" })
      .min(0, "Minimal 0")
      .max(4, "Maksimal 4")
      .nullable()
      .optional(),
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
// FORM (dirender setelah data lead selesai di-load)
// ----------------------
function EditLeadForm({ lead, leadId, onClose, onSuccess }) {
  const { mutate, isPending } = usePut(`/leads/${leadId}`, {
    invalidate: [["leads"], ["lead"]],
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: lead.date ?? "",
      name: lead.name ?? "",
      whatsapp_number: lead.whatsapp_number ?? "",
      request_type: lead.request_type ?? "",
      building_type: lead.building_type ?? "",
      building_area: parseBuildingArea(lead.building_area),
      status: lead.status ?? "",
      source: lead.source ?? "",
      location: lead.location ?? "",
      notes: lead.notes ?? "",
      income: lead.income ?? "",
      follow_up_count: lead.follow_up_count ?? 0,
    },
  });

  const status = watch("status");
  const isRequired = !OPTIONAL_STATUS.includes(status);

  const onSubmit = (data) => {
    toast.promise(
      new Promise((resolve, reject) => {
        mutate(data, {
          onSuccess: () => {
            onClose();
            onSuccess?.();
            resolve();
          },
          onError: (err) => reject(err?.response?.data?.message),
        });
      }),
      {
        loading: "Mengupdate...",
        success: "Lead berhasil diupdate!",
        error: (msg) => msg ?? "Gagal menyimpan data!",
      },
    );
  };

  return (
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
                desc="Tanggal lead masuk"
              />
            }
          >
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label=""
                  value={field.value}
                  onChange={(v) => field.onChange(formatDateDb(v))}
                />
              )}
            />
          </Field>

          <div className="space-y-1.5">
            <SelectField
              name="status"
              control={control}
              label="Status"
              placeholder="Pilih status"
              options={statusLeads}
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
              <Controller
                name="building_area"
                control={control}
                render={({ field }) => (
                  <InputGroupInput
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(parseBuildingArea(value));
                    }}
                    placeholder="0"
                    aria-invalid={!!errors.building_area}
                  />
                )}
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
            className="w-full"
            options={INCOME}
            error={errors.income?.message}
          />
        </Section>

        <hr className="border-border" />

        {/* FOLLOW UP & CATATAN */}
        <Section title="Follow-up & catatan">
          <Field
            label="Jumlah follow-up"
            error={errors.follow_up_count?.message}
            hint={<span className="text-xs text-muted-foreground">0 – 4</span>}
          >
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={4}
              placeholder="0"
              aria-invalid={!!errors.follow_up_count}
              {...register("follow_up_count", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
          </Field>

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
          onClick={onClose}
        >
          Batal
        </Button>

        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}

// ----------------------
// LOADER / FETCH WRAPPER
// ----------------------
function EditLeadContent({ leadId, onClose, onSuccess }) {
  const { data, isLoading } = useApiFetch(["lead", leadId], `/lead/${leadId}`);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Data lead tidak bisa dimuat. Coba tutup lalu buka lagi.
        </p>
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
      </div>
    );
  }

  return (
    <EditLeadForm
      lead={data.data}
      leadId={leadId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

// ----------------------
// MAIN COMPONENT
// ----------------------
/**
 * Props:
 * - open          : boolean
 * - onOpenChange  : (open: boolean) => void
 * - leadId        : id lead yang mau diedit
 * - onSuccess     : () => void (opsional, dipanggil setelah data tersimpan)
 */
export default function EditLeadModal({
  open,
  onOpenChange,
  leadId,
  onSuccess,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* HEADER */}
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PencilLine className="size-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base sm:text-lg">
                Edit Lead
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Perbarui data lead, lalu simpan perubahan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {leadId && (
          <EditLeadContent
            leadId={leadId}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
