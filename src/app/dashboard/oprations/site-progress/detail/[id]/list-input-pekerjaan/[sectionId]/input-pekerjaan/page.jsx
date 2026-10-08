"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2, CheckCircle2, Loader2, Layers } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { usePost, useRemove } from "@/hooks/use-api-mutation";
import MoneyInput from "@/components/MoneyInput";
import SavedItemRow from "./components/save-item-row";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import SearchableSelect from "@/components/searchable-select";
import CreatableSelect from "@/components/CreatableSelect"; // Sesuaikan path ini
import { useApiFetch } from "@/hooks/use-api-fetch";

export default function InputPekerjaanDetailPage() {
  const params = useParams();
  const kpiId = params?.id ? String(params.id) : null;
  const initialSectionId = params?.sectionId ? String(params.sectionId) : null;

  // ─── States Form ───
  const [activeSheet, setActiveSheet] = useState("sipil");
  const [activeSectionId, setActiveSectionId] = useState(initialSectionId);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [level, setLevel] = useState(""); // Menyimpan string nama level
  const [metode, setMetode] = useState("Analisa Standar (PUPR)");
  const [manualPrice, setManualPrice] = useState(0);
  const [volume, setVolume] = useState("");
  const [keterangan, setKeterangan] = useState("");

  // ─── API Fetches ───
  const { data: sectionsRes } = useApiFetch(
    ["sections"],
    `/master/ahsp/sections`,
  );
  const sections = sectionsRes?.data || [];

  const { data: detailSiteProgress } = useApiFetch(
    ["detail-site-progress", kpiId],
    `/site-progress/${kpiId}`,
  );

  const { data: sectionDetailResponse, isLoading: isLoadingSection } =
    useApiFetch(
      activeSectionId ? ["rab-section-detail", activeSectionId] : null,
      activeSectionId ? `/rab/sections/${activeSectionId}` : null,
    );

  const {
    data: savedItemsResponse,
    isLoading: isLoadingItems,
    refetch: refetchSavedItems,
  } = useApiFetch(
    activeSectionId
      ? ["rab-saved-items", kpiId, activeSectionId, activeSheet]
      : null,
    activeSectionId
      ? `/rab/sections/${activeSectionId}/items?kpi_id=${kpiId}&sheet=${activeSheet}`
      : null,
  );

  // ─── API Mutations ───
  const { mutate: saveItem, isPending: isSaving } = usePost(
    `/site-progress/rab/store-ahsp-item`,
    { invalidate: [["rab-saved-items", kpiId, activeSectionId, activeSheet]] },
  );

  const { mutate: deleteItem, isPending: isDeleting } = useRemove(
    (itemId) => `/site-progress/rab/items/${itemId}`,
    {
      invalidate: [["rab-saved-items", kpiId, activeSectionId, activeSheet]],
    },
  );

  // ─── Ekstraksi Data ───
  const sectionData = sectionDetailResponse?.data ?? {};
  const savedItems = savedItemsResponse?.data ?? [];

  // Meratakan data agar kompatibel dengan SearchableSelect
  const flatDropdownOptions = useMemo(() => {
    if (!sectionData) return [];
    const options = [];

    if (
      Array.isArray(sectionData.subsections) &&
      sectionData.subsections.length > 0
    ) {
      sectionData.subsections.forEach((sub) => {
        if (Array.isArray(sub.items)) {
          sub.items.forEach((item) => {
            options.push({
              value: String(item.id),
              label: `${item.kode ? item.kode + " - " : ""}${item.uraian_pekerjaan || item.nama}`,
              group: sub.nama,
            });
          });
        }
      });
    }

    if (
      Array.isArray(sectionData.direct_items) &&
      sectionData.direct_items.length > 0
    ) {
      sectionData.direct_items.forEach((item) => {
        options.push({
          value: String(item.id),
          label: `${item.kode ? item.kode + " - " : ""}${item.uraian_pekerjaan || item.nama}`,
          group: "Item Langsung",
        });
      });
    }

    return options;
  }, [sectionData]);

  // ─── Handlers ───
  const handleSimpan = (e) => {
    e.preventDefault();
    if (!selectedParentId)
      return toast.error("Pilih item pekerjaan terlebih dahulu.");
    if (!volume || volume <= 0) return toast.error("Volume harus diisi.");
    if (metode === "Manual Analisa" && (!manualPrice || manualPrice <= 0)) {
      return toast.error("Harga Satuan Manual harus diisi.");
    }

    const payload = {
      section_id: activeSectionId,
      kpi_id: kpiId,
      parent_id: selectedParentId,
      volume: Number(volume),
      keterangan: keterangan,
      level: level,
      metode: metode,
      manual_price: metode === "Manual Analisa" ? manualPrice : null,
      sheet: activeSheet,
    };

    saveItem(payload, {
      onSuccess: () => {
        toast.success(
          `Item berhasil disimpan ke sheet ${activeSheet.toUpperCase()}!`,
        );
        setVolume("");
        setKeterangan("");
        setManualPrice(0);
        refetchSavedItems();
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || "Gagal menyimpan item.");
      },
    });
  };

  const handleDelete = (itemId) => {
    if (!confirm("Hapus rincian pekerjaan ini?")) return;
    deleteItem(itemId, {
      onSuccess: () => {
        toast.success("Item berhasil dihapus.");
        refetchSavedItems();
      },
      onError: (err) => {
        return toast.error(
          err?.response?.data?.message || "Gagal menghapus item.",
        );
      },
    });
  };

  // ─── Render ───
  return (
    <DashboardLayout>
      <div className="w-full bg-background min-h-screen pb-10 pt-4">
        {/* BANNER PROJECT INFO */}
        {detailSiteProgress?.data && (
          <div className="px-2 mb-6">
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
              <div className="flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Project LOKI
                </p>
                <h2 className="text-xl font-bold text-primary">
                  {detailSiteProgress.data.project_name || "-"}
                </h2>
              </div>
              <div className="hidden md:block w-px h-10 bg-border"></div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Site Leader
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {detailSiteProgress.data.site_leader || "-"}
                </p>
              </div>
              <div className="hidden md:block w-px h-10 bg-border"></div>
              <div className="flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Target / Tipe
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {detailSiteProgress.data.target}% /{" "}
                  <span className="capitalize">
                    {detailSiteProgress.data.building_type || "-"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className=" px-2 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── KOLOM KIRI: FORM INPUT ─── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-primary rounded-full"></div>
                  <h3 className="font-semibold text-foreground text-sm">
                    Form Input Area
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 uppercase tracking-wider px-2.5 py-1 rounded-md">
                  Langkah 1
                </span>
              </div>

              {/* TABS SHEET: SIPIL / INTERIOR */}
              <div className="flex items-center gap-4 px-6 pt-3 bg-background border-b border-border">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet("sipil");
                    setLevel("");
                  }}
                  className={`px-4 py-2.5 text-[13px] font-extrabold border-b-2 transition-all ${
                    activeSheet === "sipil"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  SIPIL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet("interior");
                    setLevel("");
                  }}
                  className={`px-4 py-2.5 text-[13px] font-extrabold border-b-2 transition-all ${
                    activeSheet === "interior"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  INTERIOR
                </button>
              </div>

              {/* Kategori Sections (Scroll Horizontal) */}
              <div className="border-b border-border bg-background/50">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex w-max p-2">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        onClick={() => {
                          setActiveSectionId(String(section.id));
                          setSelectedParentId("");
                        }}
                        className={`flex items-center justify-center px-4 py-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${
                          activeSectionId === String(section.id)
                            ? "bg-primary/10 text-primary font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
                        }`}
                      >
                        {section.kode ? `${section.kode} - ` : ""}
                        {section.uraian_pekerjaan || section.nama}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="h-1.5" />
                </ScrollArea>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSimpan} className="p-6 space-y-6">
                {/* PILIH ITEM PEKERJAAN */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground/80">
                    Item Pekerjaan AHSP
                  </label>
                  <SearchableSelect
                    options={flatDropdownOptions}
                    value={selectedParentId}
                    onChange={setSelectedParentId}
                    placeholder="-- Cari & Pilih Item Pekerjaan --"
                    valueKey="value"
                    labelKey="label"
                    className="h-11 rounded-lg border-input bg-background text-sm font-medium text-foreground focus:ring-2 focus:ring-ring focus:border-primary transition-all "
                  />
                </div>

                {/* Box Konfigurasi */}
                <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-5">
                  {/* PENGGUNAAN CREATABLE SELECT UNTUK LEVEL/RUANGAN */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground/80 flex justify-between">
                      <span>
                        {activeSheet === "sipil"
                          ? "Level Pekerjaan / Lantai"
                          : "Grouping / Ruangan"}
                      </span>
                      <span className="text-muted-foreground font-normal">
                        (Opsional)
                      </span>
                    </label>
                    <CreatableSelect
                      fetchUrl={`/site-progress/rab/levels?sheet=${activeSheet}`}
                      fetchKey={["rab-levels-options", activeSheet]}
                      postUrl={`/site-progress/rab/levels`}
                      invalidateKeys={["rab-levels-options"]}
                      labelKey="nama"
                      valueKey="nama" // Value form kita berupa string nama, bukan ID
                      createPayload={(inputValue) => ({
                        nama: inputValue,
                        sheet: activeSheet,
                      })}
                      value={level}
                      onChange={(option) => setLevel(option ? option.nama : "")}
                      placeholder={
                        activeSheet === "sipil"
                          ? "Pilih / Ketik nama lantai..."
                          : "Pilih / Ketik nama ruangan..."
                      }
                      className="w-full text-foreground [&_[role=combobox]]:h-11 [&_[role=combobox]]:bg-background"
                      createLabel="Buat & Simpan: {query}"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                      Sistem akan menyarankan opsi yang pernah dibuat, atau
                      ketik nama baru untuk menambahkannya ke database.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-foreground/80">
                      Metode Analisa Harga
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <Input
                          type="radio"
                          name="metode"
                          value="Analisa Standar (PUPR)"
                          checked={metode === "Analisa Standar (PUPR)"}
                          onChange={() => setMetode("Analisa Standar (PUPR)")}
                          className="w-4 h-4 text-primary bg-background border-input focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          Standar (PUPR)
                        </span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <Input
                          type="radio"
                          name="metode"
                          value="Manual Analisa"
                          checked={metode === "Manual Analisa"}
                          onChange={() => setMetode("Manual Analisa")}
                          className="w-4 h-4 text-primary bg-background border-input focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          Manual Analisa
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {metode === "Manual Analisa" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                    <label className="text-xs font-semibold text-foreground/80">
                      Harga Satuan Manual (Rp)
                    </label>
                    <div className="relative">
                      <MoneyInput
                        value={manualPrice}
                        onChange={(num) => setManualPrice(num)}
                        className="h-11 rounded-lg bg-background border border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all overflow-hidden"
                        inputClassName="w-full h-full text-sm font-medium text-foreground bg-transparent px-3 focus:outline-none border-none ring-0"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground/80">
                    Volume / Qty Pekerjaan
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Masukkan hasil hitung volume dari gambar kerja.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground/80">
                    Keterangan / Lokasi{" "}
                    <span className="text-muted-foreground font-normal">
                      (Opsional)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Sisi Timur"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Hitung & Simpan"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ─── KOLOM KANAN: DAFTAR RINCIAN TERSIMPAN ─── */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border shadow-sm rounded-xl flex flex-col lg:sticky lg:top-28 h-[600px] lg:h-[calc(100vh-140px)]">
              <div className="px-6 py-5 border-b border-border bg-muted/10 flex-shrink-0 flex justify-between items-center">
                <h3 className="font-semibold text-foreground text-[15px]">
                  Rincian Tersimpan{" "}
                  <span className="text-primary font-bold uppercase">
                    ({activeSheet})
                  </span>
                </h3>
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  {savedItems.length} Item
                </span>
              </div>

              <div className="flex justify-between items-center px-6 py-3 border-b border-border bg-muted/30 flex-shrink-0">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Uraian Pekerjaan
                </span>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pr-16">
                  Biaya
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                {isLoadingItems || isLoadingSection ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm font-medium">Memuat rincian...</p>
                  </div>
                ) : savedItems.length > 0 ? (
                  <div className="space-y-1 mt-2">
                    {savedItems.map((item) => (
                      <SavedItemRow
                        key={item.id}
                        item={item}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Trash2 className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">
                      Belum ada rincian yang dihitung di sheet {activeSheet}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
