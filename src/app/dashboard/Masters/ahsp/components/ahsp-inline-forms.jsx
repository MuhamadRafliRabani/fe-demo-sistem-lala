"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Generic field change helper used by parent via setFormData
// ---------------------------------------------------------------------------
export function fieldUpdater(setFormData) {
  return (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));
}

// ---------------------------------------------------------------------------
// InlineSectionForm
// Used for: create section, edit section
// Fields: kode, nama
// ---------------------------------------------------------------------------
export function InlineSectionForm({
  label,
  formData,
  onChange,
  onSave,
  onCancel,
  isPending,
  inputSize = "h-8", // slightly larger for section rows
  namePlaceholder = "Nama Section (cth: PEKERJAAN ATAP)",
}) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xl">
      {label && (
        <span className="text-sm font-bold text-emerald-600 mr-1 shrink-0">
          {label}
        </span>
      )}
      <Input
        className={`w-24 ${inputSize} bg-background`}
        value={formData.kode || ""}
        onChange={(e) => onChange("kode", e.target.value)}
        placeholder="Kode"
      />
      <Input
        className={`flex-1 ${inputSize} bg-background`}
        value={formData.nama || ""}
        onChange={(e) => onChange("nama", e.target.value)}
        placeholder={namePlaceholder}
      />
      <Button
        size="sm"
        onClick={onSave}
        disabled={isPending}
        className={inputSize}
      >
        Simpan
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
        className={`${inputSize} bg-background`}
      >
        Batal
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InlineItemForm
// Used for: create item, edit item (in both direct & subsection contexts)
// Fields: kode, nama, satuan, harga_total
// ---------------------------------------------------------------------------
export function InlineItemForm({
  label,
  formData,
  onChange,
  onSave,
  onCancel,
  isPending,
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      {label && (
        <span className="text-xs font-bold text-emerald-600 mr-1 shrink-0">
          {label}
        </span>
      )}
      <Input
        className="w-20 h-7 text-xs bg-background"
        value={formData.kode || ""}
        onChange={(e) => onChange("kode", e.target.value)}
        placeholder="Kode"
      />
      <Input
        className="flex-1 h-7 text-xs bg-background"
        value={formData.nama || ""}
        onChange={(e) => onChange("nama", e.target.value)}
        placeholder="Uraian Pekerjaan"
      />
      <Input
        className="w-20 h-7 text-xs bg-background"
        value={formData.satuan || ""}
        onChange={(e) => onChange("satuan", e.target.value)}
        placeholder="Satuan"
      />
      <Input
        type="number"
        className="w-28 h-7 text-xs bg-background"
        value={formData.harga_total || ""}
        onChange={(e) => onChange("harga_total", e.target.value)}
        placeholder="Harga HPP"
      />
      <Button
        size="sm"
        onClick={onSave}
        disabled={isPending}
        className="h-7 text-xs px-3"
      >
        Simpan
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
        className="h-7 text-xs px-3 bg-background"
      >
        Batal
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionButtons — hover action icons (edit / delete / add)
// ---------------------------------------------------------------------------
import { Pencil, Trash2, Plus } from "lucide-react";

export function ActionButtons({ onAdd, onEdit, onDelete, isDeleting }) {
  return (
    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {onAdd && (
        <button
          onClick={onAdd}
          className="p-1.5 text-muted-foreground hover:text-emerald-600 bg-background border rounded-md shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-muted-foreground hover:text-blue-600 bg-background border rounded-md shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1.5 text-muted-foreground hover:text-red-600 bg-background border rounded-md shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
