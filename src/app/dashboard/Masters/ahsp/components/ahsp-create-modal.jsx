"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, ChevronRight, FileText, ArrowLeft } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import MoneyInput from "@/components/MoneyInput";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const TYPE_META = {
  section: {
    label: "Section",
    desc: "Kategori utama pekerjaan (cth: Pekerjaan Atap)",
    Icon: Layers,
    accent: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-900/40",
    border: "border-blue-200 dark:border-blue-800",
  },
  subsection: {
    label: "Subsection",
    desc: "Sub-kategori / lantai / zona (cth: Lantai 1)",
    Icon: ChevronRight,
    accent: "text-purple-600",
    bg: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/40",
    border: "border-purple-200 dark:border-purple-800",
  },
  item: {
    label: "Item AHSP",
    desc: "Rincian pekerjaan beserta harga satuan",
    Icon: FileText,
    accent: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
};

const KODE_PLACEHOLDER = {
  section: "cth: A, 01, I",
  subsection: "cth: A.1, 01.1",
  item: "cth: A.01.001",
};

const NAMA_PLACEHOLDER = {
  section: "cth: PEKERJAAN ATAP",
  subsection: "cth: Lantai 1",
  item: "cth: Pasang Rangka Atap Baja Ringan",
};

const KODE_MAX_LENGTH = { section: 10, subsection: 20, item: 30 };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function isFormValid(type, formData) {
  if (!formData.kode?.trim() || !formData.nama?.trim()) return false;
  if ((type === "subsection" || type === "item") && !formData.section_id)
    return false;
  return true;
}

// ---------------------------------------------------------------------------
// TypePicker — Step 1
// ---------------------------------------------------------------------------
function TypePicker({ allowedTypes, onSelect }) {
  const entries = Object.entries(TYPE_META).filter(([t]) =>
    allowedTypes.includes(t),
  );

  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-muted-foreground">
        Pilih jenis data yang ingin ditambahkan:
      </p>
      <div className="grid gap-3">
        {entries.map(([type, { Icon, label, desc, accent, bg, border }]) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 ${bg} ${border}`}
          >
            <div
              className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 ${accent}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-semibold ${accent}`}>{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field — reusable wrapper
// ---------------------------------------------------------------------------
function Field({ label, required, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
        {hint && (
          <span className="text-xs text-muted-foreground font-normal ml-1">
            ({hint})
          </span>
        )}
      </Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreateForm — Step 2
// ---------------------------------------------------------------------------
function CreateForm({ type, formData, onChange, sections, subsections }) {
  // Gracefully handle Input (event.target.value) & MoneyInput (number)
  const set = (key) => (val) =>
    onChange({ ...formData, [key]: val?.target?.value ?? val });

  const handleSectionChange = (sectionId) => {
    onChange({ ...formData, section_id: sectionId, subsection_id: "" });
  };

  return (
    <div className="space-y-4 pt-1">
      {/* Section dropdown — required for subsection & item */}
      {(type === "subsection" || type === "item") && (
        <Field label="Section" required>
          <Select
            value={String(formData.section_id || "")}
            onValueChange={handleSectionChange}
          >
            <SelectTrigger className="bg-background w-full">
              <SelectValue placeholder="Pilih section..." />
            </SelectTrigger>
            <SelectContent>
              {sections.map((sec) => (
                <SelectItem key={sec.id} value={String(sec.id)}>
                  {sec.kode ? `${sec.kode} – ` : ""}
                  {sec.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {/* Subsection dropdown — optional for item */}
      {type === "item" && (
        <Field label="Subsection" hint="opsional">
          <Select
            value={String(formData.subsection_id || "__none__")}
            onValueChange={(v) =>
              onChange({
                ...formData,
                subsection_id: v === "__none__" ? "" : v,
              })
            }
            disabled={!formData.section_id}
          >
            <SelectTrigger className="bg-background w-full">
              <SelectValue
                placeholder={
                  formData.section_id
                    ? "Tanpa subsection / pilih subsection"
                    : "Pilih section terlebih dahulu"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="text-muted-foreground">
                  — Tanpa subsection —
                </span>
              </SelectItem>
              {subsections.map((sub) => (
                <SelectItem key={sub.id} value={String(sub.id)}>
                  {sub.kode ? `${sub.kode} – ` : ""}
                  {sub.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {/* Kode & Sort Order — side by side */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kode" required>
          <Input
            className="bg-background"
            value={formData.kode || ""}
            onChange={set("kode")}
            placeholder={KODE_PLACEHOLDER[type]}
            maxLength={KODE_MAX_LENGTH[type]}
            autoFocus
          />
        </Field>

        {/* sort_order sekarang berlaku untuk semua tipe berdasarkan backend baru */}
        <Field label="Urutan" hint="opsional">
          <Input
            type="number"
            className="bg-background"
            value={formData.sort_order ?? ""}
            onChange={set("sort_order")}
            placeholder="Otomatis (akhir)"
            min={1}
          />
        </Field>
      </div>

      {/* Nama / Uraian */}
      <Field label="Nama / Uraian" required>
        <Input
          className="bg-background"
          value={formData.nama || ""}
          onChange={set("nama")}
          placeholder={NAMA_PLACEHOLDER[type]}
        />
      </Field>

      {/* Satuan & Harga — item only */}
      {type === "item" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Satuan">
            <Input
              className="bg-background"
              value={formData.satuan || ""}
              onChange={set("satuan")}
              placeholder="cth: m², m³, buah"
            />
          </Field>
          <Field label="Harga HPP" hint="Rp">
            <MoneyInput
              value={formData.harga_total || ""}
              onChange={set("harga_total")}
              min={0}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------
export default function AhspCreateModal({
  open,
  onClose,
  createModal,
  onSelectType,
  onChangeFormData,
  onSave,
  isCreating,
}) {
  const {
    type,
    formData,
    allowedTypes = ["section", "subsection", "item"],
  } = createModal;

  const meta = type ? TYPE_META[type] : null;
  const canSave = type && isFormValid(type, formData);
  const canGoBack = allowedTypes.length > 1;

  const { data: sectionsRes } = useApiFetch(
    ["ahsp-sections-modal"],
    "/master/ahsp/sections",
    { enabled: open },
  );

  const selectedSectionId = formData?.section_id;
  const { data: subsectionsRes } = useApiFetch(
    ["ahsp-subsections-modal", selectedSectionId],
    `/master/ahsp/subsections/${selectedSectionId}`,
    { enabled: open && !!selectedSectionId },
  );

  const sections = sectionsRes?.data ?? [];
  const subsections = subsectionsRes?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {type && canGoBack && (
              <button
                onClick={() => onSelectType(null)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                title="Kembali"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <DialogTitle>
              {type ? `Tambah ${TYPE_META[type].label}` : "Tambah Data Baru"}
            </DialogTitle>
          </div>

          {meta && (
            <div
              className={`inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg text-sm font-medium border w-fit ${meta.bg} ${meta.border} ${meta.accent}`}
            >
              <meta.Icon className="w-3.5 h-3.5" />
              {meta.desc}
            </div>
          )}
        </DialogHeader>

        {!type && (
          <TypePicker allowedTypes={allowedTypes} onSelect={onSelectType} />
        )}

        {type && (
          <>
            <CreateForm
              type={type}
              formData={formData}
              onChange={onChangeFormData}
              sections={sections}
              subsections={subsections}
            />
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={onSave}
                disabled={!canSave || isCreating}
              >
                {isCreating
                  ? "Menyimpan..."
                  : `Simpan ${TYPE_META[type].label}`}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
                className="px-5"
              >
                Batal
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
