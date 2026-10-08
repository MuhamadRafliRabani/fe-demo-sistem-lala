"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Paperclip,
  Printer,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Trash2,
  Layers, // <-- Icon Baru
  ChevronRight,
  ChartNoAxesGantt,
  TriangleRight,
  FileText,
  RulerDimensionLine,
  HandCoins,
  Flame,
  Currency, // <-- Icon Baru
} from "lucide-react";

import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import { cn } from "@/lib/utils";
import MoneyInput from "@/components/MoneyInput";
import { toTitleCase } from "@/lib/to-title-case";

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatRupiah = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "-";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

// ─── Transformer ───────────────────────────────────────────────────────────

const transformRabBySheet = (rabData, activeSheet) => {
  console.log("🚀 ~ transformRabBySheet ~ rabData:", rabData);
  const allSections = Array.isArray(rabData?.sections)
    ? rabData.sections
    : Object.values(rabData?.sections || {});

  // Kamus konversi Romawi ke Angka untuk kebutuhan Sorting
  const romanToInt = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
    XI: 11,
    XII: 12,
    XIII: 13,
    XIV: 14,
    XV: 15,
    XVI: 16,
    XVII: 17,
    XVIII: 18,
    XIX: 19,
    XX: 20,
  };

  // 1. Sortir Section Berdasarkan Kode Romawi
  const filteredSections = allSections
    .filter((s) => s.sheet === activeSheet)
    .sort((a, b) => {
      const valA = romanToInt[a.kode?.toUpperCase()] || 999;
      const valB = romanToInt[b.kode?.toUpperCase()] || 999;

      if (valA === 999 && valB === 999) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      }

      return valA - valB;
    });

  if (!filteredSections.length) return { rows: [], totalRab: 0 };

  const rows = [];
  let totalRab = 0;

  filteredSections.forEach((section) => {
    let sectionTotal = 0;

    // Header section
    rows.push({
      id: `sec-${section.id}`,
      type: "section",
      kode: section.kode,
      name: section.nama,
    });

    // 2. Sortir Direct items
    const directItems = (
      Array.isArray(section.direct_items)
        ? section.direct_items
        : Object.values(section.direct_items || {})
    ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    directItems.forEach((item) => {
      const itemTotal = Number(item.jumlah_harga || 0);
      rows.push({
        id: `item-${item.id}`,
        type: "item",
        kode: item.kode,
        desc: item.uraian_pekerjaan,
        spec: item.spesifikasi,
        vol: item.volume,
        unit: item.satuan,
        price: item.harga_satuan,
        total: itemTotal,
      });
      sectionTotal += itemTotal;
      totalRab += itemTotal;
    });

    // 3. Sortir Subsections
    const subsections = (
      Array.isArray(section.subsections)
        ? section.subsections
        : Object.values(section.subsections || {})
    ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    subsections.forEach((sub) => {
      rows.push({
        id: `sub-${sub.id}`,
        type: "subsection",
        kode: sub.kode,
        name: sub.nama,
      });

      // 4. Sortir Sub Items di dalam Subsection
      const subItems = (
        Array.isArray(sub.items) ? sub.items : Object.values(sub.items || {})
      ).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      subItems.forEach((item) => {
        const itemTotal = Number(item.jumlah_harga || 0);
        rows.push({
          id: `item-${item.id}`,
          type: "item",
          kode: item.kode,
          desc: item.uraian_pekerjaan,
          spec: item.spesifikasi,
          vol: item.volume,
          unit: item.satuan,
          price: item.harga_satuan,
          total: itemTotal,
          isIndented: true,
        });
        sectionTotal += itemTotal;
        totalRab += itemTotal;
      });
    });

    rows.push({
      id: `subtotal-${section.id}`,
      type: "subtotal",
      name: section.nama,
      total: sectionTotal,
    });
  });

  return { rows, totalRab };
};

// ─── Constants ─────────────────────────────────────────────────────────────

const TABS = ["sipil", "interior"];

const TAB_CONFIG = {
  sipil: {
    potonganKey: "potonganDesignSipil",
    showKey: "showPotonganDesignSipil",
    apiPotonganKey: "potongan_design_sipil",
  },
  interior: {
    potonganKey: "potonganDesignInterior",
    showKey: "showPotonganDesignInterior",
    apiPotonganKey: "potongan_design_interior",
  },
};

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Page() {
  const params = useParams();
  const projectId = params?.id ? String(params.id) : null;
  const fileInputRef = useRef(null);

  const {
    data: rabResponse,
    isLoading: isLoadingRab,
    refetch: refetchRab,
  } = useApiFetch(
    projectId ? ["site-progress-rab", projectId] : null,
    projectId ? `/site-progress/${projectId}/rab` : null,
  );

  const { data: projectResponse } = useApiFetch(
    projectId ? ["site-progress", projectId] : null,
    projectId ? `/site-progress/${projectId}` : null,
  );

  // ── UI State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("sipil");

  const [settings, setSettings] = useState({
    margin: 10,
    ppn: 11,
    potonganDesignSipil: 0,
    potonganDesignInterior: 0,
    showPotonganDesignSipil: false,
    showPotonganDesignInterior: false,
    showProfitPdf: false,
    hideMaterial: false,
    showSubtotal: true,
  });

  // Sync
  useEffect(() => {
    if (!rabResponse?.data) return;
    setSettings((prev) => ({
      ...prev,
      potonganDesignSipil: Math.trunc(
        Number(rabResponse.data.potongan_design_sipil || 0),
      ),
      potonganDesignInterior: Math.trunc(
        Number(rabResponse.data.potongan_design_interior || 0),
      ),
      showPotonganDesignSipil:
        Number(rabResponse.data.potongan_design_sipil) > 0,
      showPotonganDesignInterior:
        Number(rabResponse.data.potongan_design_interior) > 0,
    }));
  }, [rabResponse?.data]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const { potonganKey, showKey, apiPotonganKey } = TAB_CONFIG[activeTab];

  const apiPotongan = Math.trunc(
    Number(rabResponse?.data?.[apiPotonganKey] || 0),
  );

  const showPotongan = settings[showKey];
  const appliedPotongan = showPotongan ? apiPotongan : 0;

  // ── API Mutations ─────────────────────────────────────────────────────────
  const { mutate: importRab, isPending: isImporting } = usePost(
    `/site-progress/${projectId || 0}/rab/import`,
    {
      invalidate: [
        ["site-progress", projectId],
        ["site-progress-rab", projectId],
      ],
    },
  );

  const { mutate: updateRabImport, isPending: isUpdatingImport } = usePut(
    `/site-progress/${rabResponse?.data?.id || 0}/rab/update/import`,
    {
      invalidate: [
        ["site-progress", projectId],
        ["site-progress-rab", projectId],
      ],
    },
  );

  const { refetch: refetchExport, isFetching: isExporting } = useApiFetch(
    projectId ? ["site-progress-rab-export", projectId] : null,
    projectId ? `/site-progress/rab/${projectId}/export` : null,
    undefined,
    false,
  );

  // ── Computed ──────────────────────────────────────────────────────────────
  const project = projectResponse?.data ?? projectResponse ?? {};
  const rabData = rabResponse?.data ?? rabResponse ?? null;

  const { rows: tableRows, totalRab } = useMemo(
    () => transformRabBySheet(rabData, activeTab),
    [rabData, activeTab],
  );

  const grandTotalRab = Math.round((totalRab - appliedPotongan) / 1000) * 1000;
  const totalWithMargin = totalRab * (1 + (Number(settings.margin) || 0) / 100);
  const grandTotal = settings.includePpn
    ? totalWithMargin * (1 + (Number(settings.ppn) || 0) / 100)
    : totalWithMargin;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateImportRab = () => {
    const promise = new Promise((resolve, reject) => {
      updateRabImport(
        {
          ...settings,
          potongan_design_sipil: settings.potonganDesignSipil,
          potongan_design_interior: settings.potonganDesignInterior,
        },
        {
          onSuccess: async () => resolve(),
          onError: (err) =>
            reject(err?.response?.data?.message || "Update gagal."),
        },
      );
    });
    toast.promise(promise, {
      loading: "Proses potongan design...",
      success: "Berhasil!",
      error: (e) => String(e),
    });
  };

  const onPickFile = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    const promise = new Promise((resolve, reject) => {
      importRab(form, {
        onSuccess: async () => {
          if (fileInputRef.current) fileInputRef.current.value = "";
          await refetchRab?.();
          resolve();
        },
        onError: (err) =>
          reject(err?.response?.data?.message || "Import gagal."),
      });
    });
    toast.promise(promise, {
      loading: "Proses...",
      success: "Berhasil!",
      error: (e) => String(e),
    });
  };

  const onExportExcel = async () => {
    try {
      const res = await refetchExport();
      const payload = res?.data?.data ?? res?.data;
      if (payload?.file_base64) {
        const link = document.createElement("a");
        link.href = payload.file_base64;
        link.download = payload?.filename || `RAB-${activeTab}.xlsx`;
        link.click();
      }
    } catch {
      toast.error("Export Gagal");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Rekapitulasi RAB" desc={project?.project_name}>
      <div className="w-full bg-card rounded-xl shadow-sm flex flex-col border border-border">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-border rounded-t-xl">
          <div className="flex p-1 bg-secondary rounded-lg border border-border">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                  activeTab === tab
                    ? "bg-background text-[#135a86] shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onPickFile}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              <Paperclip className="w-4 h-4 mr-2" /> Lampiran
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-600 border-emerald-500/50"
              onClick={onExportExcel}
              disabled={isExporting}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
            </Button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-8 bg-background rounded-b-xl">
          {/* TABLE AREA */}
          <div className="xl:col-span-9 rounded-xl border border-border bg-card shadow-sm overflow-hidden h-fit">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-[#0f172a] text-slate-200 ">
                  <tr className="text-[11px] font-semibold tracking-wider sticky top-0 uppercase text-left border-b border-[#0f172a]">
                    <th className=" px-5 py-4 w-[5%] text-center">
                      <p className="flex">
                        <ChartNoAxesGantt className="w-4 h-4 mr-2" /> KODE
                      </p>
                    </th>
                    <th className=" px-5 py-4 w-[40%]">
                      <p className="flex">
                        <FileText className="w-4 h-4 mr-2" /> URAAIAN PEKERJAAN
                      </p>
                    </th>
                    <th className=" px-5 py-4 w-[10%] text-center">
                      <p className="flex">
                        <TriangleRight className="w-4 h-4 mr-2" /> VOL
                      </p>
                    </th>
                    <th className=" px-5 py-4 w-[10%] text-center">
                      <p className="flex">
                        <RulerDimensionLine className="w-4 h-4 mr-2" /> SAT
                      </p>
                    </th>
                    <th className=" px-5 py-4 w-[15%] text-right">
                      <p className="flex">
                        <HandCoins className="w-4 h-4 mr-2" /> HARGA SATUAN
                      </p>
                    </th>
                    <th className=" px-5 py-4 w-[15%] text-right">
                      <p className="flex">
                        <Currency className="w-4 h-4 mr-2" /> JUMLAH HARGA
                      </p>
                    </th>
                    <th className=" px-5 py-4 w-[5%] text-center">
                      <p className="flex">
                        <Flame className="w-4 h-4 mr-2" /> AKSI
                      </p>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/50">
                  {isLoadingRab ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center font-medium text-muted-foreground"
                      >
                        Mendata...
                      </td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-10 text-center text-muted-foreground italic"
                      >
                        Tidak ada data {activeTab} di sheet ini.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row) => {
                      // 1. SECTION (Desain menyatu, Kuning/Orange gelap)
                      if (row.type === "section") {
                        return (
                          <tr
                            key={row.id}
                            className="bg-amber-500/10 dark:bg-[#232832] border-b border-amber-500/20 dark:border-[#333a45]"
                          >
                            <td className="px-5 py-3.5 font-bold text-amber-700 dark:text-[#e67e22] text-center">
                              {row.kode}
                            </td>
                            <td
                              colSpan={6}
                              className="px-5 py-3.5 font-bold text-amber-700 dark:text-[#e67e22] uppercase tracking-wide"
                            >
                              {row.name}
                            </td>
                          </tr>
                        );
                      }

                      // 2. SUBSECTION (Pakai Ikon Layers, agak menjorok)
                      if (row.type === "subsection") {
                        return (
                          <tr
                            key={row.id}
                            className="bg-muted/30 border-b border-border/50"
                          >
                            <td className="px-5 py-3 text-center">
                              <div className="flex justify-center">
                                <Layers className="w-4 h-4 text-muted-foreground/60" />
                              </div>
                            </td>
                            <td
                              colSpan={6}
                              className="px-5 py-3 font-semibold text-foreground"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-muted-foreground/80 text-sm">
                                  {row.kode}
                                </span>
                                <span>{toTitleCase(row.name)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // 3. SUBTOTAL
                      if (row.type === "subtotal") {
                        if (!settings.showSubtotal) return null;
                        return (
                          <tr
                            key={row.id}
                            className="bg-muted/30 border-b-2 border-border"
                          >
                            <td
                              colSpan={5}
                              className="px-5 py-3.5 text-right text-muted-foreground font-semibold uppercase text-[11px] tracking-wider"
                            >
                              SUB TOTAL {toTitleCase(row.name)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-[#135a86] dark:text-sky-400">
                              Rp {formatRupiah(row.total)}
                            </td>
                            <td />
                          </tr>
                        );
                      }

                      // 4. ITEM (Indensi menjorok ke dalam pakai ChevronRight)
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-muted/50 transition-colors group"
                        >
                          <td className="px-5 py-4 text-center text-muted-foreground font-medium text-xs align-top">
                            {row.kode}
                          </td>
                          <td className="px-5 py-4 align-top">
                            {/* Flex untuk mengatur posisi Icon & Teks */}
                            <div
                              className={cn(
                                "flex items-start gap-2.5",
                                row.isIndented ? "ml-6" : "", // Menjorok jika item adalah anak subsection
                              )}
                            >
                              <div className="flex flex-col">
                                <div className="font-medium text-foreground">
                                  {toTitleCase(row.desc)}
                                </div>
                                {!settings.hideMaterial && row.spec && (
                                  <div className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                                    {row.spec}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 align-top">
                            {row.vol || 0}
                          </td>
                          <td className="px-5 py-4 text-center text-muted-foreground align-top">
                            {row.unit || "-"}
                          </td>
                          <td className="px-5 py-4 text-right text-muted-foreground align-top">
                            Rp {formatRupiah(row.price)}
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-foreground align-top">
                            Rp {formatRupiah(row.total)}
                          </td>
                          <td className="px-5 py-4 align-top ">
                            <div className="flex flex-col gap-1 items-center">
                              <button className="p-1 hover:bg-secondary rounded border border-border text-muted-foreground">
                                <ChevronUp size={13} />
                              </button>
                              <button className="p-1 hover:bg-secondary rounded border border-border text-muted-foreground">
                                <ChevronDown size={13} />
                              </button>
                              <button className="p-1 hover:bg-red-500/10 text-red-500 rounded border border-red-500/20">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* 5. FOOTER ROWS */}
                  {tableRows.length > 0 && (
                    <>
                      <tr className="bg-[#135a86] text-white">
                        <td
                          colSpan={5}
                          className="px-5 py-4 text-right font-semibold uppercase tracking-widest text-[12px]"
                        >
                          TOTAL RAB {activeTab}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[#fed818] text-[15px] whitespace-nowrap">
                          Rp {formatRupiah(totalRab)}
                        </td>
                        <td />
                      </tr>

                      {showPotongan && (
                        <tr className="bg-[#0f4a70] text-white border-t border-white/10">
                          <td
                            colSpan={5}
                            className="px-5 py-3 text-right font-medium uppercase tracking-widest text-[11px]"
                          >
                            POTONGAN DESIGN
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-[#fed818] text-[14px] whitespace-nowrap">
                            - Rp {formatRupiah(apiPotongan)}
                          </td>
                          <td />
                        </tr>
                      )}

                      <tr className="bg-[#0a3554] text-white border-t border-white/20">
                        <td
                          colSpan={5}
                          className="px-5 py-5 text-right font-bold uppercase tracking-widest text-[13px]"
                        >
                          GRAND TOTAL RAB {activeTab}
                        </td>
                        <td className="px-5 py-5 text-right font-black text-[#fed818] text-[16px] whitespace-nowrap">
                          Rp {formatRupiah(grandTotalRab)}
                        </td>
                        <td />
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm sticky top-6">
              <div className="flex items-center gap-2 mb-6 text-[#135a86]">
                <TrendingUp size={18} />
                <h3 className="font-bold">Analisis Profit</h3>
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase">
                  <span>Modal (RAP)</span>
                  <span className="text-foreground text-sm">
                    {formatRupiah(Number(project?.budget_rap || 0))}
                  </span>
                </div>

                <div className="p-5 bg-[#fed818] rounded-xl text-[#135a86] shadow-inner">
                  <div className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                    Total RAB {activeTab}
                  </div>
                  <div className="text-2xl font-black mt-0.5">
                    Rp {formatRupiah(grandTotalRab)}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Margin (%)
                    </label>
                    <Input
                      type="number"
                      value={settings.margin}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          margin: e.target.value,
                        }))
                      }
                      className="h-9"
                    />

                    {showPotongan && (
                      <>
                        <label className="text-[11px] font-bold text-muted-foreground uppercase mt-2">
                          Potongan Design {activeTab}
                        </label>
                        <div className="flex gap-2">
                          <MoneyInput
                            key={activeTab}
                            defaultValue={apiPotongan}
                            onChange={(num) =>
                              setSettings((prev) => ({
                                ...prev,
                                [potonganKey]: num,
                              }))
                            }
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
                          />
                          <Button
                            className="h-9 px-4"
                            disabled={isUpdatingImport}
                            onClick={handleUpdateImportRab}
                          >
                            Update
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid gap-3 mt-4">
                    {[
                      {
                        id: "subtotal",
                        label: "Tampilkan Subtotal",
                        key: "showSubtotal",
                      },
                      {
                        id: "potongan",
                        label: `Potongan Design (${activeTab})`,
                        key: showKey,
                      },
                      {
                        id: "hide",
                        label: "Sembunyikan Material",
                        key: "hideMaterial",
                      },
                    ].map((cfg) => (
                      <div key={cfg.id} className="flex items-center gap-3">
                        <Checkbox
                          id={cfg.id}
                          checked={!!settings[cfg.key]}
                          onCheckedChange={(v) =>
                            setSettings((prev) => ({
                              ...prev,
                              [cfg.key]: !!v,
                            }))
                          }
                        />
                        <label
                          htmlFor={cfg.id}
                          className="text-xs font-medium cursor-pointer"
                        >
                          {cfg.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total + Margin</span>
                      <span className="font-bold text-foreground">
                        {formatRupiah(totalWithMargin)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-black border-t pt-2 text-[#135a86]">
                      <span>GRAND TOTAL</span>
                      <span className="text-[#8A6D00]">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
