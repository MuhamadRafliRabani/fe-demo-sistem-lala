"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  ChartNoAxesGantt,
  Check,
  ChevronRight,
  Coins,
  FileText,
  Layers,
  Package,
  Ruler,
  Users,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAhspCrud } from "../hooks/use-ahsp-crud";
import AhspCreateModal from "../components/ahsp-create-modal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const unitLabel = (key) => key || "-";
const formatUang = (val) => {
  const n = Number(val);
  return isNaN(n)
    ? "-"
    : n.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};
const fieldUpdater = (setFn) => (key, value) =>
  setFn((prev) => ({ ...prev, [key]: value }));

// ---------------------------------------------------------------------------
// BoolCheck
// ---------------------------------------------------------------------------
function BoolCheck({ value }) {
  return value ? (
    <Check className="h-4 w-4 text-emerald-600 mx-auto" strokeWidth={3} />
  ) : (
    <span className="text-muted-foreground/30">-</span>
  );
}

// ---------------------------------------------------------------------------
// RowActions — always visible in dedicated Aksi column
// ---------------------------------------------------------------------------
function RowActions({ onAdd, onEdit, onDelete, isDeleting }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {onAdd && (
        <button
          onClick={onAdd}
          title="Tambah"
          className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          title="Edit"
          className="p-1.5 rounded-md text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          title="Hapus"
          className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline edit rows
// ---------------------------------------------------------------------------
function SectionEditInline({
  formData,
  onChange,
  onSave,
  onCancel,
  isPending,
}) {
  const on = fieldUpdater(onChange);
  return (
    <TableCell colSpan={8} className="py-2.5 px-4">
      <div className="flex items-center gap-2 w-full max-w-xl">
        <Input
          className="w-24 h-8 bg-background"
          value={formData.kode || ""}
          onChange={(e) => on("kode", e.target.value)}
          placeholder="Kode"
        />
        <Input
          className="flex-1 h-8 bg-background"
          value={formData.nama || ""}
          onChange={(e) => on("nama", e.target.value)}
          placeholder="Nama"
        />
        <Button size="sm" onClick={onSave} disabled={isPending} className="h-8">
          Simpan
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="h-8 bg-background"
        >
          Batal
        </Button>
      </div>
    </TableCell>
  );
}

function ItemEditInline({
  formData,
  onChange,
  onSave,
  onCancel,
  isPending,
  indent,
}) {
  const on = fieldUpdater(onChange);
  return (
    <TableRow className="bg-blue-50/30 dark:bg-blue-950/10">
      <TableCell colSpan={8} className={`py-2 px-4 ${indent}`}>
        <div className="flex items-center gap-2 w-full">
          <Input
            className="w-20 h-7 text-xs"
            value={formData.kode || ""}
            onChange={(e) => on("kode", e.target.value)}
            placeholder="Kode"
          />
          <Input
            className="flex-1 h-7 text-xs"
            value={formData.nama || ""}
            onChange={(e) => on("nama", e.target.value)}
            placeholder="Uraian Pekerjaan"
          />
          <Input
            className="flex-1 h-7 text-xs"
            value={formData.definisi || ""}
            onChange={(e) => on("definisi", e.target.value)}
            placeholder="Descripsi Pekerjaan"
          />
          <Input
            className="w-20 h-7 text-xs"
            value={formData.satuan || ""}
            onChange={(e) => on("satuan", e.target.value)}
            placeholder="Satuan"
          />
          <Input
            type="number"
            className="w-28 h-7 text-xs"
            value={formData.harga_total || ""}
            onChange={(e) => on("harga_total", e.target.value)}
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
            className="h-7 text-xs px-3"
          >
            Batal
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// SectionRow
// ---------------------------------------------------------------------------
function SectionRow({ section, crud }) {
  const {
    isEditing,
    isUpdating,
    editFormData,
    setEditFormData,
    handleEditClick,
    handleSaveEdit,
    handleCancelEdit,
    handleDelete,
    isDeleting,
    openCreateModal,
  } = crud;

  const editing = isEditing("section", section.id);

  return (
    <TableRow className="bg-muted/20 hover:bg-muted/20 border-b-2 border-border/50">
      {editing ? (
        <SectionEditInline
          formData={editFormData}
          onChange={setEditFormData}
          onSave={() => handleSaveEdit("section", section.id)}
          onCancel={handleCancelEdit}
          isPending={isUpdating}
        />
      ) : (
        <>
          <TableCell colSpan={7} className="py-3 px-4">
            <span className="font-bold text-primary tracking-tight text-[15px]">
              {section.kode ? `${section.kode}. ` : ""}
              {section.nama}
            </span>
          </TableCell>
          <TableCell className="text-center">
            <RowActions
              // From section → user picks subsection OR item; section_id pre-filled
              onAdd={() =>
                openCreateModal(["section", "subsection", "item"], {
                  section_id: section.id,
                })
              }
              onEdit={() => handleEditClick("section", section)}
              onDelete={() => handleDelete("section", section.id)}
              isDeleting={isDeleting}
            />
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// SubsectionRow
// ---------------------------------------------------------------------------
function SubsectionRow({ subsec, section, crud }) {
  const {
    isEditing,
    isUpdating,
    editFormData,
    setEditFormData,
    handleEditClick,
    handleSaveEdit,
    handleCancelEdit,
    handleDelete,
    isDeleting,
    openCreateModal,
  } = crud;

  const editing = isEditing("subsection", subsec.id);

  return (
    <TableRow className="bg-muted/5 hover:bg-muted/5">
      {editing ? (
        <SectionEditInline
          formData={editFormData}
          onChange={setEditFormData}
          onSave={() => handleSaveEdit("subsection", subsec.id)}
          onCancel={handleCancelEdit}
          isPending={isUpdating}
        />
      ) : (
        <>
          <TableCell colSpan={7} className="py-2.5 pl-6 border-b-0">
            <div className="font-semibold text-muted-foreground text-[13px] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 opacity-60" />
              {subsec.kode ? `${subsec.kode}. ` : ""}
              {subsec.nama}
            </div>
          </TableCell>
          <TableCell className="text-center border-b-0">
            <RowActions
              // From subsection → only item; section_id & subsection_id pre-filled
              onAdd={() =>
                openCreateModal(["section", "subsection", "item"], {
                  section_id: section.id,
                  subsection_id: subsec.id,
                })
              }
              onEdit={() => handleEditClick("subsection", subsec)}
              onDelete={() => handleDelete("subsection", subsec.id)}
              isDeleting={isDeleting}
            />
          </TableCell>
        </>
      )}
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// ItemRow
// ---------------------------------------------------------------------------
function ItemRow({ item, indent, crud, onRowClick }) {
  const {
    isEditing,
    isUpdating,
    editFormData,
    setEditFormData,
    handleEditClick,
    handleSaveEdit,
    handleCancelEdit,
    handleDelete,
    isDeleting,
  } = crud;

  if (isEditing("item", item.id)) {
    return (
      <ItemEditInline
        formData={editFormData}
        onChange={setEditFormData}
        onSave={() => handleSaveEdit("item", item.id)}
        onCancel={handleCancelEdit}
        isPending={isUpdating}
        indent={indent}
      />
    );
  }

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={(e) => {
        if (e.target.closest("button")) return;
        onRowClick(item.id);
      }}
    >
      <TableCell className={`${indent} font-medium text-muted-foreground`}>
        <div className="flex items-center gap-1.5">
          <ChevronRight className="h-4 w-4 opacity-40" />
          {item.kode}
        </div>
      </TableCell>
      <TableCell className="font-medium text-foreground/90 text-sm">
        {item.nama}
      </TableCell>
      <TableCell
        className="text-sm text-muted-foreground/80 line-clamp-2"
        title={item.definisi}
      >
        {item.definisi || <span className="opacity-30">-</span>}
      </TableCell>
      <TableCell className="text-center font-medium text-muted-foreground text-sm">
        {unitLabel(item.satuan)}
      </TableCell>
      <TableCell className="text-center">
        <BoolCheck value={item.has_man_power} />
      </TableCell>
      <TableCell className="text-center">
        <BoolCheck value={item.has_material} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-muted-foreground text-xs">Rp</span>
          <span className="tabular-nums font-bold text-foreground">
            {formatUang(item.harga_total_arap ?? item.harga_total ?? 0)}
          </span>
        </div>
      </TableCell>
      {/* Dedicated Aksi column — never overlaps price */}
      <TableCell className="text-center">
        <RowActions
          onEdit={() => handleEditClick("item", item)}
          onDelete={() => handleDelete("item", item.id)}
          isDeleting={isDeleting}
        />
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <TableRow>
      <TableCell colSpan={8} className="py-24 text-center">
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <FileText className="h-10 w-10 opacity-20 mb-3" />
          <p className="font-medium">Pencarian tidak menemukan hasil</p>
          <p className="text-sm opacity-60">
            Silakan sesuaikan filter atau pastikan data sudah diimport.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Table header
// ---------------------------------------------------------------------------
const HEADERS = [
  { icon: ChartNoAxesGantt, label: "Kode", w: "w-[130px]" },
  { icon: FileText, label: "Uraian Pekerjaan", w: "min-w-[250px]" },
  { icon: BookOpen, label: "Definisi", w: "min-w-[200px]" },
  { icon: Ruler, label: "Satuan", w: "w-[100px]", align: "center" },
  { icon: Users, label: "Man Power", w: "w-[100px]", align: "center" },
  { icon: Package, label: "Material", w: "w-[100px]", align: "center" },
  { icon: Coins, label: "Summary HPP", w: "w-[160px]", align: "right" },
  { label: "Aksi", w: "w-[96px]", align: "center" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const TableAhsp = ({ data, state, ref, sections = [] }) => {
  const { groupedItems } = data;
  const { isLoading, setSelectedItemId, setOpenItem, refetch } = state;
  const { loadMoreRef } = ref;

  const crud = useAhspCrud({ refetch });
  const {
    createModal,
    setCreateFormData,
    isCreating,
    openCreateModal,
    closeCreateModal,
    selectCreateType,
    handleSaveCreate,
  } = crud;

  const openItemSheet = (id) => {
    setSelectedItemId(id);
    setOpenItem(true);
  };

  return (
    <>
      <AhspCreateModal
        open={createModal.open}
        onClose={closeCreateModal}
        createModal={createModal}
        onSelectType={selectCreateType}
        onChangeFormData={setCreateFormData}
        onSave={handleSaveCreate}
        isCreating={isCreating}
        sections={sections}
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                {HEADERS.map(({ icon: Icon, label, w, align }) => (
                  <TableHead
                    key={label}
                    className={`${w} font-semibold ${align === "center" ? "text-center" : align === "right" ? "text-right" : ""}`}
                  >
                    <div
                      className={`flex items-center gap-2 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}
                    >
                      {Icon && (
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      )}
                      {label}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {groupedItems.length > 0 ? (
                groupedItems.map((section) => (
                  <Fragment key={section.id}>
                    <SectionRow section={section} crud={crud} />

                    {section.directItems?.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        indent="pl-4"
                        crud={crud}
                        onRowClick={openItemSheet}
                      />
                    ))}

                    {section.subsections?.map((subsec) => (
                      <Fragment key={subsec.id}>
                        <SubsectionRow
                          subsec={subsec}
                          section={section}
                          crud={crud}
                        />
                        {subsec.items?.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            indent="pl-10"
                            crud={crud}
                            onRowClick={openItemSheet}
                          />
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                ))
              ) : !isLoading ? (
                <EmptyState />
              ) : null}
            </TableBody>
          </Table>

          {/* Global add button — shows full type picker */}
          {!isLoading && (
            <div className="p-4 border-t border-border flex justify-center bg-muted/10">
              <Button
                variant="outline"
                className="border-dashed border-2 hover:bg-muted"
                onClick={() => openCreateModal()} // null → all 3 types
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Data Baru
              </Button>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div
            ref={loadMoreRef}
            className="h-14 w-full flex items-center justify-center bg-card rounded-b-xl"
          >
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Memuat data...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TableAhsp;
