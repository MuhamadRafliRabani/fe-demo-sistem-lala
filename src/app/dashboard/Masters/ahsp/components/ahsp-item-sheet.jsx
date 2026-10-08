"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/loader";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut, useRemove } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import {
  ChevronDown,
  Layers,
  HardHat,
  Truck,
  Box,
  Coins,
  Ruler,
  PercentSquare,
  Users,
  Package,
  Calculator,
  X,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import MoneyInput from "@/components/MoneyInput";

// Import komponen MoneyInput yang baru dibuat
// import { MoneyInput } from "@/components/ui/money-input";

// --- UTILITY FORMATTER ---
const formatUang = (val) => {
  if (typeof val !== "number" || isNaN(val)) return "-";
  return val.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatKoef = (val) => {
  if (typeof val !== "number" || isNaN(val)) return "-";
  return val.toLocaleString("id-ID", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  });
};

// --- MICRO COMPONENT ---
const StatBox = ({ label, value, icon: Icon, isHighlight = false }) => (
  <div
    className={`flex flex-col gap-1.5 p-4 rounded-xl border ${
      isHighlight
        ? "bg-primary/5 border-primary/20"
        : "bg-card border-border shadow-sm"
    }`}
  >
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {Icon && <Icon className="w-4 h-4 opacity-70" />}
      {label}
    </div>
    <div
      className={`text-base font-semibold ${
        isHighlight ? "text-primary text-xl" : "text-foreground text-lg"
      }`}
    >
      {value}
    </div>
  </div>
);

export default function AhspItemSheet({ open, onOpenChange, itemId }) {
  // Fetch Data Item & Details
  const { data, isLoading, refetch } = useApiFetch(
    itemId ? ["ahsp-item", itemId] : null,
    itemId ? `/master/ahsp/items/${itemId}` : null,
  );

  // Fetch Master Categories (A, B, C) untuk Dropdown Form
  const { data: catData } = useApiFetch(
    ["ahsp-master-categories"],
    "/master/ahsp/categories",
  );
  const masterCategories = catData?.data || [];

  // Mutations
  const { mutateAsync: createDetail } = usePost("/master/ahsp/details", {
    invalidate: [
      // ["ahsp-sections"],
      ["ahsp-grouped-sections"],
      // ["ahsp-items"],
      // ["ahsp-master-categories"],
    ],
  });
  const { mutateAsync: updateDetail } = usePut(
    ({ id }) => `/master/ahsp/details/${id}`,
    {
      invalidate: [
        ["ahsp-sections"],
        ["ahsp-items"],
        ["ahsp-grouped-sections"],
        ["ahsp-master-categories"],
      ],
    },
  );
  const { mutateAsync: deleteDetail } = useRemove(
    (payload) => `/master/ahsp/details/${payload.id}`,
    {
      invalidate: [
        ["ahsp-sections"],
        ["ahsp-items"],
        ["ahsp-grouped-sections"],
        ["ahsp-master-categories"],
      ],
    },
  );

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    category_id: "",
    uraian: "",
    satuan: "",
    koefisien: "",
    harga_satuan: 0, // Inisialisasi number untuk MoneyInput
  });

  useEffect(() => {
    if (open && itemId) refetch?.();
  }, [open, itemId, refetch]);

  const item = data?.data ?? null;

  // --- LOGIC GROUPING DETAILS BY CATEGORY ---
  const groupedCategories = useMemo(() => {
    if (!item?.details || item.details.length === 0) {
      // Jika belum ada detail sama sekali, tampilkan kategori master kosong sebagai kerangka
      return masterCategories.map((mc) => ({
        ...mc,
        details: [],
        total: 0,
      }));
    }

    const map = new Map();
    // Buat template dari master
    masterCategories.forEach((mc) => {
      map.set(mc.id, { ...mc, details: [], total: 0 });
    });

    item.details.forEach((detail) => {
      const cat = detail.category;
      if (!cat) return;

      if (!map.has(cat.id)) {
        map.set(cat.id, { ...cat, details: [], total: 0 });
      }

      const group = map.get(cat.id);
      group.details.push(detail);
      group.total += Number(detail.jumlah_harga || 0);
    });

    return Array.from(map.values()).sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );
  }, [item, masterCategories]);

  // --- HANDLERS FOR CRUD ---
  // Parameter categoryId digunakan untuk pre-select kategori saat "Tambah Rincian" ditekan
  const handleOpenModal = (detail = null, categoryId = null) => {
    if (detail) {
      setEditingId(detail.id);
      setFormData({
        category_id: detail.category_id?.toString() || "",
        uraian: detail.uraian || "",
        satuan: detail.satuan || "",
        koefisien: detail.koefisien?.toString() || "",
        harga_satuan: detail.harga_satuan || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        category_id:
          categoryId?.toString() || masterCategories[0]?.id?.toString() || "",
        uraian: "",
        satuan: "",
        koefisien: "",
        harga_satuan: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveDetail = async (e) => {
    e.preventDefault();
    if (
      !formData.category_id ||
      !formData.uraian ||
      !formData.koefisien ||
      formData.harga_satuan === null
    ) {
      toast.error("Harap isi semua kolom wajib!");
      return;
    }

    setIsSaving(true);
    const payload = {
      item_id: itemId,
      category_id: Number(formData.category_id),
      uraian: formData.uraian,
      satuan: formData.satuan,
      koefisien: Number(formData.koefisien),
      harga_satuan: Number(formData.harga_satuan),
    };

    try {
      if (editingId) {
        await updateDetail({ id: editingId, ...payload });
        toast.success("Rincian berhasil diupdate.");
      } else {
        await createDetail(payload);
        toast.success("Rincian berhasil ditambahkan.");
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Terjadi kesalahan sistem.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDetail = async (detailId) => {
    if (!confirm("Yakin ingin menghapus rincian komponen ini?")) return;
    try {
      await deleteDetail({ id: detailId });
      toast.success("Rincian berhasil dihapus.");
      refetch();
    } catch (error) {
      toast.error("Gagal menghapus rincian.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[850px] overflow-y-auto sm:p-0 flex flex-col bg-muted"
      >
        {/* --- HEADER AREA (Sticky) --- */}
        <div className="bg-card p-6 sm:px-8 sm:pt-8 border-b border-border sticky top-0 z-10 shadow-sm">
          <SheetHeader className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="px-2.5 py-1 text-sm font-bold bg-background"
                >
                  <Ruler className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  {item?.satuan || "-"}
                </Badge>
                {item?.has_man_power && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-500/10 text-blue-700 border border-blue-500/20"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" /> Man Power
                  </Badge>
                )}
                {item?.has_material && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                  >
                    <Package className="w-3.5 h-3.5 mr-1.5" /> Material
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                className="px-4 py-2"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <div className="text-sm font-bold text-muted-foreground mb-1">
                {item?.kode || "KODE"}
              </div>
              <SheetTitle className="text-2xl leading-tight">
                {item?.nama || "Memuat data..."}
              </SheetTitle>
            </div>
          </SheetHeader>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="p-6 sm:p-8 flex-1">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader />
            </div>
          ) : item ? (
            <div className="space-y-6 pb-10">
              {/* --- GROUP 1: SECTION & PERSENTASE --- */}
              <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Kategori (Section)
                  </p>
                  <p className="font-bold text-base text-foreground">
                    {item?.section?.kode ? `${item.section.kode}. ` : ""}
                    {item?.section?.nama || "-"}
                  </p>
                </div>
                {/* Blok Persentase Global */}
                <div className="flex items-center justify-center gap-4 bg-muted/40 p-3 rounded-xl border border-border/60 shrink-0">
                  <div className="flex flex-col items-center px-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1">
                      <HardHat className="w-3.5 h-3.5 text-orange-600" /> Mandor
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {item?.section?.mandor_pct ?? 0}%
                    </span>
                  </div>
                  <div className="w-px h-8 bg-border/80"></div>
                  <div className="flex flex-col items-center px-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" /> Vendor
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {item?.section?.vendor_pct ?? 0}%
                    </span>
                  </div>
                  <div className="w-px h-8 bg-border/80"></div>
                  <div className="flex flex-col items-center px-1">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1 mb-1">
                      <PercentSquare className="w-3.5 h-3.5 text-emerald-600" />{" "}
                      Margin
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {item?.section?.margin_pct ?? 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* --- GROUP 2: SUMMARY HARGA --- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatBox
                  label="Harga Total (HPP)"
                  value={`Rp ${formatUang(item?.harga_total)}`}
                  icon={Coins}
                  isHighlight={true}
                />
                <StatBox
                  label="Harga Total ARAP"
                  value={
                    item?.harga_total_arap
                      ? `Rp ${formatUang(item.harga_total_arap)}`
                      : "-"
                  }
                  icon={Calculator}
                />
              </div>

              <hr className="border-border/60 my-2" />

              {/* --- GROUP 3: DETAIL KOMPONEN & CRUD --- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Box className="w-5 h-5 text-muted-foreground" />
                    Rincian Uraian Komponen
                  </h3>
                </div>

                {groupedCategories.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {groupedCategories.map((cat) => (
                      <Collapsible key={cat.id} defaultOpen className="group">
                        <div className="flex items-center justify-between rounded-t-xl border border-border bg-card px-5 py-4 transition-colors shadow-sm">
                          <CollapsibleTrigger className="flex-1 flex items-center justify-between outline-none">
                            <div className="flex flex-col gap-1 text-left">
                              <div className="text-sm font-bold text-foreground">
                                {cat.kode}. {cat.nama}
                              </div>
                              <div className="text-xs font-medium text-muted-foreground">
                                Subtotal Komponen:{" "}
                                <span className="text-primary font-bold">
                                  Rp {formatUang(cat.total)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 pointer-events-none shrink-0"
                            >
                              <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </Button>
                          </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent>
                          <div className="border-x border-b border-border rounded-b-xl bg-card overflow-hidden shadow-sm flex flex-col">
                            <div className="overflow-x-auto">
                              <Table className="min-w-[700px]">
                                <TableHeader className="bg-muted/40">
                                  <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="font-bold">
                                      Uraian Pekerjaan
                                    </TableHead>
                                    <TableHead className="w-[80px] text-center font-bold">
                                      Sat
                                    </TableHead>
                                    <TableHead className="w-[110px] text-right font-bold">
                                      Koefisien
                                    </TableHead>
                                    <TableHead className="w-[150px] text-right font-bold">
                                      Harga Sat.
                                    </TableHead>
                                    <TableHead className="w-[150px] text-right font-bold text-foreground">
                                      Jumlah
                                    </TableHead>
                                    <TableHead className="w-[90px] text-center font-bold">
                                      Aksi
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {cat.details.map((d) => (
                                    <TableRow
                                      key={d.id}
                                      className="hover:bg-muted/20 border-b border-border/50 last:border-0"
                                    >
                                      <TableCell className="font-medium text-foreground/90">
                                        {d.uraian}
                                      </TableCell>
                                      <TableCell className="text-center text-muted-foreground">
                                        {d.satuan || "-"}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {formatKoef(d.koefisien)}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums text-muted-foreground">
                                        {formatUang(d.harga_satuan)}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums font-semibold text-foreground">
                                        {formatUang(d.jumlah_harga)}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                            onClick={() =>
                                              handleOpenModal(d, cat.id)
                                            }
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-red-600 hover:bg-red-50"
                                            onClick={() =>
                                              handleDeleteDetail(d.id)
                                            }
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {cat.details.length === 0 && (
                                    <TableRow>
                                      <TableCell
                                        colSpan={6}
                                        className="h-16 text-center text-muted-foreground italic text-sm"
                                      >
                                        Belum ada rincian di kategori ini.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Tombol Create spesifik per kategori */}
                            <div className="p-3 bg-muted/30 border-t border-border flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full max-w-sm border-dashed"
                                onClick={() => handleOpenModal(null, cat.id)}
                              >
                                <Plus className="w-4 h-4 mr-2" /> Tambah Rincian{" "}
                                {cat.nama}
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border py-12 flex flex-col items-center justify-center gap-3 bg-card/50">
                    <p className="text-sm font-medium text-muted-foreground">
                      Kategori belum tersedia.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-32 flex flex-col items-center justify-center text-center">
              <Box className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <div className="text-base font-medium text-muted-foreground">
                Data AHSP tidak ditemukan.
              </div>
            </div>
          )}
        </div>

        {/* --- MODAL FORM (CREATE / UPDATE DETAIL) --- */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>
                {editingId
                  ? "Edit Rincian Komponen"
                  : "Tambah Rincian Komponen"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveDetail} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Kategori Rincian</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(val) =>
                    setFormData({ ...formData, category_id: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kategori (A/B/C)" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterCategories.map((mc) => (
                      <SelectItem key={mc.id} value={mc.id.toString()}>
                        {mc.kode}. {mc.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Uraian Pekerjaan / Material</Label>
                <Input
                  required
                  placeholder="Contoh: Semen Portland, Tukang Batu..."
                  value={formData.uraian}
                  onChange={(e) =>
                    setFormData({ ...formData, uraian: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Koefisien</Label>
                  {/* Gunakan Input Number standar untuk mengakomodasi nilai desimal. */}
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    placeholder="0.000"
                    value={formData.koefisien}
                    onChange={(e) =>
                      setFormData({ ...formData, koefisien: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Satuan</Label>
                  <Input
                    placeholder="OH, Kg, Zak..."
                    value={formData.satuan}
                    onChange={(e) =>
                      setFormData({ ...formData, satuan: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Harga Satuan</Label>
                {/* Gunakan MoneyInput untuk field Harga/Rupiah */}
                <MoneyInput
                  required
                  value={formData.harga_satuan}
                  onChange={(num) =>
                    setFormData({ ...formData, harga_satuan: num })
                  }
                  placeholder={0}
                  showPrefix={true}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan Rincian"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
