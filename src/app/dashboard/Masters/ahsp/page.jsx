"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AhspItemSheet from "./components/ahsp-item-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  FileText,
  Layers,
  Settings,
  ArrowDownUp,
  HardHat,
  Truck,
  PercentSquare,
} from "lucide-react";
import TableAhsp from "./table/table-ahsp";

// Jumlah section yang di-load per halaman
const SECTIONS_PER_PAGE = 3;

export default function AhspMasterPage() {
  const [filter, setFilter] = useState({
    search: "",
    section_id: "all",
    sort: "kode",
    has_material: "all",
    has_man_power: "all",
  });

  // Halaman section untuk infinite scroll
  const [sectionPage, setSectionPage] = useState(1);

  // Akumulasi sections yang sudah di-load (tiap section sudah berisi items-nya)
  const [accumulatedSections, setAccumulatedSections] = useState([]);

  // Reset akumulasi setiap kali filter berubah
  const filterRef = useRef(filter);
  useEffect(() => {
    if (filterRef.current !== filter) {
      filterRef.current = filter;
      setAccumulatedSections([]);
      setSectionPage(1);
    }
  }, [filter]);

  // --- QUERY untuk grouped-sections ---
  const query = useMemo(() => {
    const f = {
      search: filter.search || undefined,
      section_id: filter.section_id !== "all" ? filter.section_id : undefined,
    };
    if (filter.has_material !== "all") f.has_material = filter.has_material;
    if (filter.has_man_power !== "all") f.has_man_power = filter.has_man_power;

    return {
      page: sectionPage,
      per_page: SECTIONS_PER_PAGE,
      sort: filter.sort,
      filter: f,
    };
  }, [filter, sectionPage]);

  // --- FETCH grouped sections (tiap section sudah include subsections + items) ---
  const { data, isLoading, refetch } = useApiFetch(
    ["ahsp-grouped-sections", query],
    "/master/ahsp/grouped-sections",
    query,
  );

  // Masih butuh sections untuk dropdown filter & global config
  const { data: sectionsRes, refetch: refetchSections } = useApiFetch(
    ["ahsp-sections"],
    "/master/ahsp/sections",
  );

  const sections = sectionsRes?.data ?? [];
  const lastPage = data?.data?.last_page ?? 1;

  // --- Akumulasi sections saat data baru datang ---
  useEffect(() => {
    const newSections = data?.data?.data;
    if (!newSections) return;

    if (sectionPage === 1) {
      // Reset total — filter baru atau load awal
      const mapped = newSections.map((sec) => ({
        ...sec,
        directItems: sec.items ?? [],
      }));
      setAccumulatedSections(mapped);
    } else {
      // Append section baru, hindari duplikasi
      setAccumulatedSections((prev) => {
        const existingIds = new Set(prev.map((s) => s.id));
        const unique = newSections
          .filter((s) => !existingIds.has(s.id))
          .map((sec) => ({ ...sec, directItems: sec.items ?? [] })); // ← tambahkan ini
        return [...prev, ...unique];
      });
    }
  }, [data, sectionPage]);

  // --- Infinite Scroll: load section page berikutnya ---
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && sectionPage < lastPage) {
          setSectionPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [isLoading, sectionPage, lastPage]);

  // --- Global Config dari sections ---
  const globalConfig = useMemo(() => {
    if (!sections || sections.length === 0)
      return { mandor: 0, vendor: 0, margin: 0 };
    return {
      mandor: sections[0].mandor_pct || 0,
      vendor: sections[0].vendor_pct || 0,
      margin: sections[0].margin_pct || 0,
    };
  }, [sections]);

  // --- MUTATIONS ---
  const { mutateAsync: importAhsp, isPending } = usePost(
    "/master/ahsp/import",
    {
      invalidate: [["ahsp-grouped-sections"], ["ahsp-sections"]],
    },
  );

  const { mutateAsync: updateSectionConfig } = usePut(
    (payload) => `/master/ahsp/sections/${payload.id}/config`,
    { invalidate: [["ahsp-grouped-sections"], ["ahsp-sections"]] },
  );

  // --- MODAL STATES ---
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [openItem, setOpenItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const [openGlobalConfig, setOpenGlobalConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState({
    mandor_pct: 0,
    vendor_pct: 0,
    margin_pct: 0,
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (openGlobalConfig) {
      setConfigDraft({
        mandor_pct: globalConfig.mandor,
        vendor_pct: globalConfig.vendor,
        margin_pct: globalConfig.margin,
      });
    }
  }, [openGlobalConfig, globalConfig]);

  const handleSubmitImport = async () => {
    if (!importFile) return;
    const fd = new FormData();
    fd.append("file", importFile);
    try {
      const res = await importAhsp(fd);
      const stats = res?.data?.import?.stats;
      toast.success(
        stats
          ? `Import sukses: ${stats.items} item, ${stats.details} detail`
          : "Import AHSP sukses",
      );
      setIsImportOpen(false);
      setImportFile(null);
      // Reset ke halaman 1 agar data di-reload dari awal
      setAccumulatedSections([]);
      setSectionPage(1);
      refetch();
      refetchSections?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Import AHSP gagal");
    }
  };

  const handleSaveGlobalConfig = async () => {
    if (!sections || sections.length === 0) {
      toast.error("Tidak ada section untuk diperbarui.");
      return;
    }
    setIsSavingConfig(true);
    try {
      await Promise.all(
        sections.map((sec) =>
          updateSectionConfig({
            id: sec.id,
            mandor_pct: Number(configDraft.mandor_pct),
            vendor_pct: Number(configDraft.vendor_pct),
            margin_pct: Number(configDraft.margin_pct),
          }),
        ),
      );
      toast.success("Konfigurasi persentase global tersimpan");
      setOpenGlobalConfig(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menyimpan konfigurasi",
      );
    } finally {
      setIsSavingConfig(false);
    }
  };

  // --- Handler filter: reset akumulasi otomatis via filterRef di atas ---
  const handleFilterChange = useCallback((updater) => {
    setFilter((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
  }, []);

  return (
    <DashboardLayout
      title="Master AHSP"
      desc="Pusat data Analisa Harga Satuan Pekerjaan beserta komponen pendukung."
    >
      <div className="flex flex-col gap-6">
        {/* --- TOP BAR: GLOBAL CONFIG & ACTIONS --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
              <HardHat className="w-4 h-4 text-orange-600" />
              <span className="text-muted-foreground">Mandor:</span>
              <strong className="text-foreground">
                {globalConfig.mandor}%
              </strong>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="text-muted-foreground">Vendor:</span>
              <strong className="text-foreground">
                {globalConfig.vendor}%
              </strong>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
              <PercentSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-muted-foreground">Margin:</span>
              <strong className="text-foreground">
                {globalConfig.margin}%
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              className="w-1/2 md:w-auto shadow-sm"
              onClick={() => setOpenGlobalConfig(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Atur Persentase
            </Button>
            <Button
              variant="default"
              className="w-1/2 md:w-auto shadow-sm"
              onClick={() => setIsImportOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Import Excel
            </Button>
          </div>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Cari kode atau nama pekerjaan..."
              value={filter.search}
              onChange={(e) =>
                handleFilterChange((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="w-full bg-card"
            />
          </div>

          <Select
            value={filter.section_id}
            onValueChange={(v) =>
              handleFilterChange((prev) => ({ ...prev, section_id: v }))
            }
          >
            <SelectTrigger className="w-full bg-card">
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {filter.section_id === "all"
                    ? "Semua Kategori (Section)"
                    : sections.find((s) => s.id === parseInt(filter.section_id))
                        ?.nama || "Terpilih"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori (Section)</SelectItem>
              {sections.map((sec) => (
                <SelectItem key={sec.id} value={String(sec.id)}>
                  {sec.kode} - {sec.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={`${filter.has_man_power}-${filter.has_material}`}
            onValueChange={(v) => {
              const [man, mat] = v.split("-");
              handleFilterChange((prev) => ({
                ...prev,
                has_man_power: man,
                has_material: mat,
              }));
            }}
          >
            <SelectTrigger className="w-full bg-card">
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Komponen" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-all">Semua Komponen</SelectItem>
              <SelectItem value="1-all">Hanya dgn Man Power</SelectItem>
              <SelectItem value="all-1">Hanya dgn Material</SelectItem>
              <SelectItem value="1-1">Man Power & Material</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.sort}
            onValueChange={(v) =>
              handleFilterChange((prev) => ({ ...prev, sort: v }))
            }
          >
            <SelectTrigger className="w-full bg-card">
              <div className="flex items-center gap-2 truncate">
                <ArrowDownUp className="w-4 h-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Urutkan" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kode">Kode (A-Z)</SelectItem>
              <SelectItem value="-kode">Kode (Z-A)</SelectItem>
              <SelectItem value="-harga_total">Harga Tertinggi</SelectItem>
              <SelectItem value="harga_total">Harga Terendah</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/*
         * TableAhsp sekarang menerima `groupedItems` yang sudah pre-grouped dari backend.
         * Setiap element adalah 1 section lengkap dengan subsections + items-nya.
         */}
        <TableAhsp
          data={{ groupedItems: accumulatedSections }}
          state={{ isLoading, setSelectedItemId, setOpenItem, refetch }}
          ref={{ loadMoreRef }}
        />

        {/* Modal Import */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import AHSP Excel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>File Excel (.xlsx)</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmitImport}
                disabled={!importFile || isPending}
              >
                Mulai Import
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Global Config */}
        <Dialog open={openGlobalConfig} onOpenChange={setOpenGlobalConfig}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atur Persentase Global</DialogTitle>
              <DialogDescription>
                Perubahan ini akan diterapkan ke semua section secara bersamaan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <HardHat className="w-4 h-4" /> Mandor (%)
                </Label>
                <Input
                  type="number"
                  value={configDraft.mandor_pct}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      mandor_pct: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Vendor (%)
                </Label>
                <Input
                  type="number"
                  value={configDraft.vendor_pct}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      vendor_pct: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <PercentSquare className="w-4 h-4" /> Margin (%)
                </Label>
                <Input
                  type="number"
                  value={configDraft.margin_pct}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      margin_pct: e.target.value,
                    })
                  }
                />
              </div>
              <Button
                className="w-full mt-2"
                onClick={handleSaveGlobalConfig}
                disabled={isSavingConfig}
              >
                {isSavingConfig ? "Menyimpan..." : "Simpan Konfigurasi"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AhspItemSheet
          open={openItem}
          onOpenChange={setOpenItem}
          itemId={selectedItemId}
        />
      </div>
    </DashboardLayout>
  );
}
