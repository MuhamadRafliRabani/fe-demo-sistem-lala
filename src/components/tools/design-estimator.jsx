"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/construction-estimator/input-field";
import {
  Home,
  Ruler,
  Layers,
  FileText,
  CheckCircle2,
  MapPin,
  Calculator,
  User,
  Save,
  Loader2,
  Plus,
  Trash2,
  Circle,
  CheckCircle,
  Building2,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download-file";
import { formatCurrency } from "@/lib/construction-estimator-utils";
import { DESIGN_PACKAGES } from "@/data/design-paket";

export default function DesignEstimator({
  initialData = null,
  surveyReportId = null,
  clientId = null,
}) {
  // 1. STATE GLOBAL
  const [form, setForm] = useState({
    clientName: initialData?.clientName || "",
    location: initialData?.location || "",
    useCommitmentFee: Number(initialData?.commitment_fee) > 0,
    commitmentFeeValue: Number(initialData?.commitment_fee) || 2000000,
  });

  // 2. STATE ITEMS (JSON Array)
  const [items, setItems] = useState([
    {
      id: Date.now().toString(),
      namaArea: "Area Bangunan Utama",
      luasTanah: 0,
      l1: 0,
      l2: 0,
      l3: 0,
      area: 0,
      paketId: "B",
      includeRAB: true,
      includeDED: true,
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // FETCH DATA
  const { data: existingEstimate, isLoading: isLoadingExisting } = useApiFetch(
    surveyReportId ? ["design-estimate", surveyReportId] : null,
    surveyReportId ? `/design-estimates/survey-report/${surveyReportId}` : null,
    undefined,
    !!surveyReportId,
  );

  // HYDRATION (Load DB to State)
  useEffect(() => {
    if (existingEstimate?.data) {
      const payload = existingEstimate.data;

      setForm((prev) => ({
        ...prev,
        clientName: payload.client_name || prev.clientName,
        location: payload.location || prev.location,
        useCommitmentFee:
          Number(payload.commitment_fee) > 0 || prev.useCommitmentFee,
        commitmentFeeValue:
          Number(payload.commitment_fee) > 0
            ? Number(payload.commitment_fee)
            : prev.commitmentFeeValue,
      }));

      // Migrasi JSON
      if (
        payload.estimation_data?.items &&
        payload.estimation_data.items.length > 0
      ) {
        setItems(
          payload.estimation_data.items.map((item) => ({
            id: item.id || Date.now().toString() + Math.random(),
            namaArea: item.nama_area || "Area Utama",
            luasTanah: Number(item.luas_tanah) || 0,
            l1: Number(item.l1) || 0,
            l2: Number(item.l2) || 0,
            l3: Number(item.l3) || 0,
            area: Number(item.area_count) || 0,
            paketId: item.paket_id || "B",
            includeRAB: !!item.include_rab,
            includeDED: !!item.include_ded,
          })),
        );
      }
      // Migrasi Legacy (Data lama)
      else if (isFirstRender.current) {
        setItems([
          {
            id: Date.now().toString(),
            namaArea: "Area Bangunan Utama",
            luasTanah: Number(payload.land_area) || 0,
            l1: Number(payload.building_area_l1) || 0,
            l2: Number(payload.building_area_l2) || 0,
            l3: Number(payload.building_area_l3) || 0,
            area: Number(payload.area_count) || 0,
            paketId: payload.option || "B",
            includeRAB: !!payload.rab,
            includeDED: !!payload.ded,
          },
        ]);
      }
      isFirstRender.current = false;
    }
  }, [existingEstimate]);

  const saveEstimateMutation = usePost("/design-estimates");

  // HANDLER ITEMS
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        namaArea: `Area Bangunan ${items.length + 1}`,
        luasTanah: 0,
        l1: 0,
        l2: 0,
        l3: 0,
        area: 0,
        paketId: "A",
        includeRAB: false,
        includeDED: false,
      },
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    } else {
      toast.error("Minimal harus ada 1 area utama.");
    }
  };

  const handleUpdateItem = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "paketId") {
            if (value === "B") {
              updated.includeRAB = true;
              updated.includeDED = true;
            } else {
              updated.includeRAB = false;
              updated.includeDED = false;
            }
          }
          return updated;
        }
        return item;
      }),
    );
  };

  // KALKULASI & BREAKDOWN
  const estimation = useMemo(() => {
    let totalBase = 0;
    let totalRAB = 0;
    let totalDED = 0;
    let validItemCount = 0;
    let breakdown = [];

    items.forEach((item) => {
      const pkg = DESIGN_PACKAGES[item.paketId];
      const totalLuasM2 =
        Number(item.luasTanah) +
        Number(item.l1) +
        Number(item.l2) +
        Number(item.l3);
      const activeLuas = item.paketId === "D" ? Number(item.area) : totalLuasM2;

      if (pkg && activeLuas > 0) {
        validItemCount++;

        const basePrice = activeLuas * pkg.price;
        const rabPrice = item.includeRAB
          ? item.paketId === "B"
            ? 0
            : 3_500_000
          : 0;
        const dedPrice = item.includeDED
          ? item.paketId === "B"
            ? 0
            : 3_500_000
          : 0;

        totalBase += basePrice;
        totalRAB += rabPrice;
        totalDED += dedPrice;

        breakdown.push({
          ...item,
          activeLuas,
          pkgDetail: pkg,
          basePrice,
          rabPrice,
          dedPrice,
          itemTotal: basePrice + rabPrice + dedPrice,
        });
      }
    });

    const originalTotal = totalBase + totalRAB + totalDED;
    const appliedDiscount =
      form.useCommitmentFee && validItemCount > 0
        ? Number(form.commitmentFeeValue)
        : 0;
    const total = Math.max(0, originalTotal - appliedDiscount);

    return {
      valid: validItemCount > 0,
      breakdown,
      originalTotal,
      discount: appliedDiscount,
      total,
      totalBase,
      totalRAB,
      totalDED,
    };
  }, [items, form.useCommitmentFee, form.commitmentFeeValue]);

  // PDF & DB HANDLERS
  const handleContractPdf = async () => {
    try {
      await downloadFile(
        `tasks/${clientId}/contract-pdf`,
        `Kontrak_Desain_${form.clientName || "Draft"}.pdf`,
      );
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleQuotationPdf = async () => {
    try {
      await downloadFile(
        `tasks/${clientId}/quotation-pdf`,
        `Quotation_Desain_${form.clientName || "Draft"}.pdf`,
      );
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSaveToDB = async () => {
    if (!estimation.valid) {
      toast.error("Mohon isi nilai luasan minimal di 1 area");
      return false;
    }

    try {
      const estimationData = {
        luas_tanah_global: Number(items[0]?.luasTanah) || 0,
        items: items.map((item) => {
          const totalLuasM2 =
            Number(item.luasTanah) +
            Number(item.l1) +
            Number(item.l2) +
            Number(item.l3);
          const pkg = DESIGN_PACKAGES[item.paketId];
          return {
            id: item.id,
            nama_area: item.namaArea,
            luas_tanah: Number(item.luasTanah) || 0,
            l1: Number(item.l1) || 0,
            l2: Number(item.l2) || 0,
            l3: Number(item.l3) || 0,
            area_count: Number(item.area) || 0,
            total_luas: totalLuasM2,
            tipe: pkg?.type || "m2",
            paket_id: item.paketId,
            include_rab: item.includeRAB,
            include_ded: item.includeDED,
          };
        }),
      };

      const payload = {
        survey_report_id: surveyReportId,
        client_name: form.clientName || null,
        location: form.location || null,
        estimation_data: estimationData,
        base_amount: estimation.totalBase,
        rab_amount: estimation.totalRAB,
        ded_amount: estimation.totalDED,
        commitment_fee: estimation.discount,
        total_amount: estimation.total,
        land_area: Number(items[0]?.luasTanah) || 0,
        building_area_l1: Number(items[0]?.l1) || 0,
        building_area_l2: Number(items[0]?.l2) || 0,
        building_area_l3: Number(items[0]?.l3) || 0,
        area_count: Number(items[0]?.area) || 0,
        option: items[0]?.paketId || "B",
        rab: !!items[0]?.includeRAB,
        ded: !!items[0]?.includeDED,
      };

      await saveEstimateMutation.mutateAsync(payload);
      toast.success("Data estimasi berhasil disimpan.");
      return true;
    } catch (e) {
      toast.error("Gagal menyimpan data.");
      return false;
    }
  };

  const handleProcessAll = async () => {
    if (!estimation.valid)
      return toast.error("Mohon isi luasan minimal di 1 area");
    if (!surveyReportId) return toast.error("Survey report tidak ditemukan.");

    setIsSaving(true);
    try {
      const isSaved = await handleSaveToDB();
      if (!isSaved) return;

      const isQuotationDownloaded = await handleQuotationPdf();
      if (!isQuotationDownloaded)
        return toast.error("Gagal mendownload Quotation.");

      await handleContractPdf();
      toast.success("Dokumen Quotation & Kontrak berhasil diproses.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Memuat data estimasi...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* --- LEFT COLUMN: INPUTS & PACKAGES --- */}
        <div className="xl:col-span-7 space-y-6">
          {/* Card 1: Data Proyek */}
          <Card className="bg-card shadow-none border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-indigo-500 bg-card">
                  <User size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Data Proyek Klien
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Nama Klien"
                value={form.clientName}
                onChange={(val) => updateForm("clientName", val)}
                placeholder="Nama Klien"
                icon={User}
                type="text"
              />
              <InputField
                label="Lokasi Proyek"
                value={form.location}
                onChange={(val) => updateForm("location", val)}
                placeholder="Alamat Proyek"
                icon={MapPin}
                type="text"
              />
            </CardContent>
          </Card>

          {/* Rincian Modul Area Header */}
          <div className="flex items-center justify-between pt-2 pb-2 border-b border-border/50">
            <div className="max-md:px-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Layers size={18} className="text-primary" />
                Rincian Modul Area
              </h3>
              <p className="text-xs text-muted-foreground mt-1 w-full">
                Atur spesifikasi dan paket untuk setiap bangunan/area
              </p>
            </div>
            <Button
              onClick={handleAddItem}
              size="sm"
              variant="outline"
              className="gap-2 border-primary/20 max-md:flex-1 text-primary hover:bg-primary/5"
            >
              <Plus size={16} /> Tambah Modul
            </Button>
          </div>

          {/* DYNAMIC CARDS */}
          <div className="space-y-6">
            {items.map((item, index) => (
              <Card
                key={item.id}
                className="relative overflow-visible shadow-sm border-border"
              >
                {index !== 0 && (
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute max-md:right-1 -top-3 -right-3 bg-rose-100 text-rose-600 p-1.5 rounded-full hover:bg-rose-500 hover:text-white transition-all z-10 shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <CardContent className="p-0">
                  {/* Nama Area Input */}
                  <div className="p-5 border-b bg-muted/20">
                    <InputField
                      label={`NAMA AREA ${index + 1}`}
                      value={item.namaArea}
                      onChange={(val) =>
                        handleUpdateItem(item.id, "namaArea", val)
                      }
                      placeholder="Contoh: Area Bangunan Utama / Paviliun"
                      icon={Home}
                      type="text"
                    />
                  </div>

                  {/* Section 1: Dimensi */}
                  <div className="p-5 border-b border-border/50">
                    <p className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2">
                      <Ruler size={14} /> 1. Metrik Luasan Arsitektur
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <InputField
                        label="Luas Tanah"
                        value={item.luasTanah}
                        onChange={(val) =>
                          handleUpdateItem(item.id, "luasTanah", val)
                        }
                        suffix="m²"
                        placeholder="0"
                        icon={Home}
                      />
                      <InputField
                        label="Lantai 1"
                        value={item.l1}
                        onChange={(val) => handleUpdateItem(item.id, "l1", val)}
                        suffix="m²"
                        placeholder="0"
                        icon={Ruler}
                      />
                      <InputField
                        label="Lantai 2"
                        value={item.l2}
                        onChange={(val) => handleUpdateItem(item.id, "l2", val)}
                        suffix="m²"
                        placeholder="0"
                        icon={Ruler}
                      />
                      <InputField
                        label="Lantai 3"
                        value={item.l3}
                        onChange={(val) => handleUpdateItem(item.id, "l3", val)}
                        suffix="m²"
                        placeholder="0"
                        icon={Ruler}
                      />
                    </div>
                  </div>

                  {/* Section 2: Ruangan */}
                  <div className="p-5 border-b border-border/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          2. Modul Interior (Khusus Paket Per Ruangan)
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Abaikan jika menggunakan paket luasan (m²)
                        </p>
                      </div>
                      <div className="w-full md:w-32">
                        <InputField
                          value={item.area}
                          onChange={(val) =>
                            handleUpdateItem(item.id, "area", val)
                          }
                          placeholder="0"
                          suffix="Ruang"
                          icon={Layers}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Paket & Ekstra */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                      <Calculator size={14} /> 3. Pemilihan Paket & Ekstra
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(DESIGN_PACKAGES).map(([pkgKey, pkg]) => (
                        <button
                          key={pkgKey}
                          type="button"
                          onClick={() =>
                            handleUpdateItem(item.id, "paketId", pkgKey)
                          }
                          className={`p-3 text-left rounded-xl border transition-all duration-200 ${
                            item.paketId === pkgKey
                              ? "bg-primary/[0.04] border-primary ring-1 ring-primary/20 shadow-sm"
                              : "bg-card border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="font-bold text-xs leading-tight text-foreground">
                            {pkg.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatCurrency(pkg.price)}
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        disabled={item.paketId === "B"}
                        onClick={() =>
                          handleUpdateItem(
                            item.id,
                            "includeRAB",
                            !item.includeRAB,
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                          item.includeRAB
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium dark:bg-indigo-950/30 dark:text-indigo-400"
                            : "bg-card text-muted-foreground"
                        } ${item.paketId === "B" ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <CheckCircle2
                          size={14}
                          className={
                            item.includeRAB
                              ? "text-indigo-600 dark:text-indigo-400"
                              : "opacity-0"
                          }
                        />
                        + RAB Material
                      </button>
                      <button
                        type="button"
                        disabled={item.paketId === "B"}
                        onClick={() =>
                          handleUpdateItem(
                            item.id,
                            "includeDED",
                            !item.includeDED,
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                          item.includeDED
                            ? "bg-blue-50 border-blue-200 text-blue-700 font-medium dark:bg-blue-950/30 dark:text-blue-400"
                            : "bg-card text-muted-foreground"
                        } ${item.paketId === "B" ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <CheckCircle2
                          size={14}
                          className={
                            item.includeDED
                              ? "text-blue-600 dark:text-blue-400"
                              : "opacity-0"
                          }
                        />
                        + Gambar DED
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* --- RIGHT COLUMN: RESULTS SUMMARY --- */}
        <div className="xl:col-span-5 relative xl:sticky xl:top-6">
          <Card className="shadow-2xl overflow-hidden flex flex-col h-full border-primary/10 bg-card">
            {/* Header Summary */}
            <div className="p-6 md:p-8 border-b border-border bg-card text-foreground">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calculator size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Grand Total
                  </span>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-black border ${estimation.valid ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}
                >
                  {estimation.valid ? "SIAP PROSES" : "DATA BELUM LENGKAP"}
                </div>
              </div>

              <div className="mt-2">
                <p
                  className={`text-4xl md:text-5xl font-black tracking-tighter ${estimation.valid ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {formatCurrency(estimation.total)}
                </p>
              </div>
            </div>

            <CardContent className="p-0 flex-1 flex flex-col">
              {/* Toggle Commitment Fee */}
              <div className="p-5 border-b border-border bg-muted/30">
                <button
                  type="button"
                  onClick={() =>
                    updateForm("useCommitmentFee", !form.useCommitmentFee)
                  }
                  className="flex items-center gap-3 w-full text-left"
                >
                  {form.useCommitmentFee ? (
                    <CheckCircle className="text-destructive" size={20} />
                  ) : (
                    <Circle className="text-muted-foreground" size={20} />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-bold ${form.useCommitmentFee ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      Potong Commitment Fee
                    </p>
                  </div>
                </button>

                {form.useCommitmentFee && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <InputField
                      label="Nominal Potongan"
                      value={form.commitmentFeeValue}
                      onChange={(val) => updateForm("commitmentFeeValue", val)}
                      placeholder="Masukkan nominal"
                      icon={FileText}
                    />
                  </div>
                )}
              </div>

              {!estimation.valid ? (
                <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground h-[300px]">
                  <Layers
                    size={48}
                    className="text-muted-foreground/20 mb-4 animate-pulse"
                    strokeWidth={1}
                  />
                  <p className="text-sm font-medium">
                    Lengkapi data area di panel kiri <br /> untuk melihat
                    rincian biaya.
                  </p>
                </div>
              ) : (
                <div className="p-6 md:p-8 space-y-6 flex-1 flex flex-col">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">
                    Breakdown Rincian Biaya
                  </p>

                  <div className="flex-1">
                    {/* List Items */}
                    <div className="space-y-4">
                      {estimation.breakdown.map((bd) => (
                        <div key={bd.id} className="space-y-2.5">
                          {/* Baris 1: Paket Utama */}
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm text-foreground">
                                {bd.namaArea} - {bd.pkgDetail.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Luasan/Vol: {bd.activeLuas}{" "}
                                {bd.pkgDetail.type === "m2" ? "m²" : "Ruang"}
                              </p>
                            </div>
                            <p className="font-bold text-sm text-foreground whitespace-nowrap">
                              {formatCurrency(bd.basePrice)}
                            </p>
                          </div>

                          {/* Baris 2: RAB (Sejajar) */}
                          {bd.includeRAB && (
                            <div className="flex justify-between items-center pt-1 border-t border-dashed border-border/30">
                              <div>
                                <p className="font-medium text-[13px] text-foreground">
                                  Penyusunan RAB Material
                                </p>
                                <p className="text-[10px] text-primary">
                                  Layanan Tambahan
                                </p>
                              </div>
                              <p className="font-medium text-[13px] text-foreground">
                                {bd.paketId === "B"
                                  ? "Termasuk (Rp 0)"
                                  : formatCurrency(bd.rabPrice)}
                              </p>
                            </div>
                          )}

                          {/* Baris 3: DED (Sejajar) */}
                          {bd.includeDED && (
                            <div className="flex justify-between items-center pt-1 border-t border-dashed border-border/30">
                              <div>
                                <p className="font-medium text-[13px] text-foreground">
                                  Gambar Kerja Lengkap (DED)
                                </p>
                                <p className="text-[10px] text-primary">
                                  Layanan Tambahan
                                </p>
                              </div>
                              <p className="font-medium text-[13px] text-foreground">
                                {bd.paketId === "B"
                                  ? "Termasuk (Rp 0)"
                                  : formatCurrency(bd.dedPrice)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Calculation Summary (Subtotal -> Discount -> Total) */}
                    <div className="pt-6 mt-6 border-t-2 border-dashed border-border/60 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          Subtotal Biaya Desain
                        </span>
                        <span className="font-bold text-sm text-foreground">
                          {formatCurrency(estimation.originalTotal)}
                        </span>
                      </div>

                      {estimation.discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-rose-500">
                            Potongan Commitment Fee
                          </span>
                          <span className="font-bold text-sm text-rose-500">
                            - {formatCurrency(estimation.discount)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4 mt-2 border-t border-border/50">
                        <span className="text-sm font-black text-foreground uppercase tracking-wider">
                          Total Estimasi
                        </span>
                        <span className="font-black text-lg text-primary">
                          {formatCurrency(estimation.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Button */}
                  <div className="pt-4 border-t border-border/50 mt-auto">
                    {(surveyReportId || clientId) && (
                      <Button
                        onClick={handleProcessAll}
                        disabled={isSaving}
                        className="w-full h-14 text-base font-black gap-3 shadow-xl bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] transition-all text-primary-foreground"
                      >
                        {isSaving ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Save size={20} />
                        )}
                        Simpan & Export Dokumen
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
