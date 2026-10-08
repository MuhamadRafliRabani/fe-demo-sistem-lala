"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  const [form, setForm] = useState({
    clientName: initialData?.clientName || "",
    location: initialData?.location || "",
    luasTanah: initialData?.luasTanah || 0,
    l1: initialData?.l1 || 0,
    l2: initialData?.l2 || 0,
    l3: initialData?.l3 || 0,
    area: initialData?.area || 0,
    option: initialData?.option || "A",
    includeRAB: initialData?.includeRAB || false,
    includeDED: initialData?.includeDED || false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Fetch existing data if surveyReportId is provided
  const { data: existingEstimate, isLoading: isLoadingExisting } = useApiFetch(
    surveyReportId ? ["design-estimate", surveyReportId] : null,
    surveyReportId ? `/design-estimates/survey-report/${surveyReportId}` : null,
    undefined,
    !!surveyReportId,
  );

  // Hydrate form from existing data
  useEffect(() => {
    if (existingEstimate?.data) {
      const payload = existingEstimate.data;
      setForm({
        clientName: payload.client_name || "",
        location: payload.location || "",
        luasTanah: payload.land_area ?? 0,
        l1: payload.building_area_l1 ?? 0,
        l2: payload.building_area_l2 ?? 0,
        l3: payload.building_area_l3 ?? 0,
        area: payload.area_count ?? 0,
        option: payload.option || "A",
        includeRAB: !!payload.rab, // BUG FIX: Memaksa nilai menjadi boolean murni
        includeDED: !!payload.ded, // BUG FIX: Memaksa nilai menjadi boolean murni
      });
      isFirstRender.current = false; // Mark as hydrated
    }
  }, [existingEstimate]);

  // API Mutations
  // const uploadPdfMutation = usePost("/design-estimates/upload-pdf");
  const saveEstimateMutation = usePost("/design-estimates");

  // BUG FIX: Fungsi baru untuk handle perubahan paket secara manual oleh user
  const handleOptionChange = (selectedOptionId) => {
    setForm((prev) => {
      // Jika pilih paket B (Premium), otomatis RAB & DED di-check
      if (selectedOptionId === "B") {
        return {
          ...prev,
          option: selectedOptionId,
          includeRAB: true,
          includeDED: true,
        };
      }
      // Jika pilih selain B, matikan otomatis check RAB & DED
      return {
        ...prev,
        option: selectedOptionId,
        includeRAB: false,
        includeDED: false,
      };
    });
  };

  const totalLuas = useMemo(() => {
    const land = Number(form.luasTanah) || 0;
    const l2 = Number(form.l2) || 0;
    const l3 = Number(form.l3) || 0;
    return land + l2 + l3;
  }, [form.luasTanah, form.l2, form.l3]);

  // OPTIMASI: Hitung Potongan Commitment Fee
  const estimation = useMemo(() => {
    const COMMITMENT_FEE = 2_000_000;
    const pkg = Object.values(DESIGN_PACKAGES).find(
      (p) => p.id === form.option,
    );
    if (!pkg)
      return { valid: false, base: 0, total: 0, originalTotal: 0, discount: 0 };

    const rabPrice = form.includeRAB && form.option !== "B" ? 3_500_000 : 0;
    const dedPrice = form.includeDED && form.option !== "B" ? 3_500_000 : 0;

    if (pkg.type === "m2" && totalLuas > 0) {
      const base = totalLuas * pkg.price;
      const originalTotal = base + rabPrice + dedPrice;
      const total = Math.max(0, originalTotal - COMMITMENT_FEE);
      return {
        valid: true,
        base,
        total,
        originalTotal,
        discount: COMMITMENT_FEE,
        package: pkg,
      };
    }
    if (pkg.type === "area" && form.area > 0) {
      const base = Number(form.area) * pkg.price;
      const originalTotal = base + rabPrice + dedPrice;
      const total = Math.max(0, originalTotal - COMMITMENT_FEE);
      return {
        valid: true,
        base,
        total,
        originalTotal,
        discount: COMMITMENT_FEE,
        package: pkg,
      };
    }
    return { valid: false, base: 0, total: 0, originalTotal: 0, discount: 0 };
  }, [form.option, form.area, totalLuas, form.includeRAB, form.includeDED]);

  const handleContractPdf = async () => {
    try {
      await downloadFile(
        `tasks/${clientId}/contract-pdf`,
        `Kontrak_Desain_${form.clientName || "Draft"}.pdf`,
      );
      return true;
    } catch (error) {
      toast.error("Gagal mengunduh PDF Kontrak.");
      console.error(error);
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
      toast.error("Gagal mengunduh PDF Quotation.");
      console.error(error);
      return false;
    }
  };

  const handleSaveToDB = async () => {
    if (!estimation.valid) {
      toast.error("Mohon lengkapi data estimasi terlebih dahulu");
      return false;
    }

    if (!surveyReportId) {
      toast.error(
        "Survey report tidak ditemukan. Estimasi hanya dapat disimpan jika berasal dari survey.",
      );
      return false;
    }

    try {
      const formData = new FormData();
      if (clientId) {
        formData.append("client_id", String(clientId));
      }
      // Get current package for feature extraction
      const currentPkg = estimation.package;
      if (!currentPkg) throw new Error("Paket tidak valid");

      // Extract all features (Base + Selected Optional)
      const baseFeatures = currentPkg.features || [];
      const finalFeatures = [...baseFeatures];

      if (
        form.includeRAB &&
        !finalFeatures.some((f) => f.includes("RAB") || f.includes("Anggaran"))
      ) {
        finalFeatures.push("Rencana Anggaran Biaya (RAB)");
      }
      if (
        form.includeDED &&
        !finalFeatures.some(
          (f) => f.includes("DED") || f.includes("Gambar Kerja"),
        )
      ) {
        finalFeatures.push("Gambar Kerja Lengkap (DED)");
      }

      const payload = {
        survey_report_id: surveyReportId,
        client_name: form.clientName || null,
        location: form.location || null,
        land_area: Number(form.luasTanah) || 0,
        building_area_l1: Number(form.l1) || 0,
        building_area_l2: Number(form.l2) || 0,
        building_area_l3: Number(form.l3) || 0,
        area_count: Number(form.area) || 0,
        option: form.option,
        rab: !!form.includeRAB,
        ded: !!form.includeDED,
        base_amount: estimation.base,
        rab_amount: !!form.includeRAB && form.option !== "B" ? 3500000 : 0,
        ded_amount: !!form.includeDED && form.option !== "B" ? 3500000 : 0,
        total_amount: estimation.total,
        pdf_path: null,
      };

      await saveEstimateMutation.mutateAsync(payload);
      toast.success("Data estimasi berhasil disimpan ke database.");
      return true;
    } catch (e) {
      const msg = e?.response?.data?.message || "Gagal menyimpan data.";
      toast.error(msg);
      console.error(e);
      return false;
    }
  };

  const handleProcessAll = async () => {
    if (!estimation.valid) {
      toast.error("Mohon lengkapi data estimasi terlebih dahulu");
      return;
    }

    if (!surveyReportId) {
      toast.error(
        "Survey report tidak ditemukan. Estimasi hanya dapat disimpan jika berasal dari survey.",
      );
      return;
    }

    setIsSaving(true);

    try {
      // 1. Simpan ke Database
      const isSaved = await handleSaveToDB();
      if (!isSaved) return; // Stop eksekusi jika gagal

      // 2. Download PDF Quotation dari API Backend
      const isQuotationDownloaded = await handleQuotationPdf();
      if (!isQuotationDownloaded) return; // Stop eksekusi jika gagal

      // 3. Download PDF Kontrak dari API Backend
      await handleContractPdf();

      toast.success("Seluruh dokumen berhasil diproses dan diunduh.");
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* --- LEFT COLUMN: INPUTS & PACKAGES --- */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: Client Data */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-indigo-500 bg-card">
                  <User size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Data Proyek
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Informasi dasar klien dan lokasi
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField
                label="Nama Klien"
                value={form.clientName}
                onChange={(val) => update("clientName", val)}
                placeholder="Masukkan nama klien..."
                icon={User}
                type="text"
              />
              <InputField
                label="Lokasi Proyek"
                value={form.location}
                onChange={(val) => update("location", val)}
                placeholder="Alamat atau wilayah..."
                icon={MapPin}
                type="text"
              />
            </CardContent>
          </Card>

          {/* Section 2: Dimensions */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-blue-500 bg-card">
                  <Ruler size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Dimensi & Luasan
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Masukkan luas tanah dan bangunan (m²)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField
                  label="Luas Tanah"
                  value={form.luasTanah}
                  onChange={(val) => update("luasTanah", val)}
                  suffix="m²"
                  placeholder="0"
                  icon={Home}
                />
                <InputField
                  label="Lantai 1"
                  value={form.l1}
                  onChange={(val) => update("l1", val)}
                  suffix="m²"
                  placeholder="0"
                  icon={Ruler}
                />
                <InputField
                  label="Lantai 2"
                  value={form.l2}
                  onChange={(val) => update("l2", val)}
                  suffix="m²"
                  placeholder="0"
                  icon={Ruler}
                />
                <InputField
                  label="Lantai 3"
                  value={form.l3}
                  onChange={(val) => update("l3", val)}
                  suffix="m²"
                  placeholder="0"
                  icon={Ruler}
                />
              </div>

              {/* Interior Special Input */}
              <div className="p-4 rounded-xl border border-dashed bg-muted/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Layers
                      size={18}
                      className={
                        form.option === "D"
                          ? "text-emerald-500 mt-1"
                          : "text-slate-600 mt-1"
                      }
                    />
                    <div>
                      <p className="text-sm font-medium">Jumlah Ruangan</p>
                      <p className="text-xs text-muted-foreground">
                        Khusus perhitungan Paket Per Ruangan
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:w-32">
                    <InputField
                      value={form.area}
                      onChange={(val) => update("area", val)}
                      placeholder="0"
                      suffix="Ruang"
                      icon={Layers}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Options (Compact) */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-amber-500 bg-card">
                  <Calculator size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Pilih Paket Desain
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Pilih skema harga yang akan digunakan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {Object.values(DESIGN_PACKAGES).map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleOptionChange(pkg.id)} // BUG FIX: Menggunakan fungsi baru
                  className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    form.option === pkg.id
                      ? "bg-primary/[0.04] border-primary ring-2 ring-primary/5 shadow-sm"
                      : "bg-card border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${pkg.bgColor} ${pkg.color}`}
                    >
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">
                        {pkg.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {pkg.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-foreground">
                      {formatCurrency(pkg.price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      / {pkg.type === "m2" ? "m²" : "ruang"}
                    </p>
                  </div>
                  {form.option === pkg.id && (
                    <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5 shadow-md">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Section 4: Additional Features (RAB & DED) */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-indigo-500 bg-card">
                  <FileText size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Fitur Tambahan
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Opsi tambahan yang ingin disertakan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={form.option === "B"}
                onClick={() => update("includeRAB", !form.includeRAB)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  form.includeRAB
                    ? "bg-primary/[0.04] border-primary ring-2 ring-primary/5"
                    : "bg-card border-border hover:border-primary/40"
                } ${form.option === "B" ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`p-2 rounded-lg ${form.includeRAB ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm leading-tight">RAB</p>
                  <p className="text-[10px] text-muted-foreground">
                    Estimasi Material (Included)
                  </p>
                </div>
                {form.includeRAB && (
                  <CheckCircle2 size={14} className="text-primary" />
                )}
              </button>

              <button
                type="button"
                disabled={form.option === "B"}
                onClick={() => update("includeDED", !form.includeDED)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  form.includeDED
                    ? "bg-primary/[0.04] border-primary ring-2 ring-primary/5"
                    : "bg-card border-border hover:border-primary/40"
                } ${form.option === "B" ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`p-2 rounded-lg ${form.includeDED ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <Ruler size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm leading-tight">DED</p>
                  <p className="text-[10px] text-muted-foreground">
                    Gambar Kerja Lengkap (Included)
                  </p>
                </div>
                {form.includeDED && (
                  <CheckCircle2 size={14} className="text-primary" />
                )}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: RESULTS SUMMARY (Sticky) --- */}
        <div className="lg:col-span-7 relative lg:sticky lg:top-6">
          <Card className="shadow-2xl overflow-hidden flex flex-col h-full border-primary/10">
            {/* Header Summary */}
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calculator size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Ringkasan Biaya
                  </span>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-black border ${estimation.valid ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}
                >
                  {estimation.valid ? "SIAP EXPORT" : "DATA BELUM LENGKAP"}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-1 font-medium">
                  Total Estimasi Final
                </p>
                {/* OPTIMASI: Menampilkan harga asli yang dicoret jika mendapat diskon */}
                {estimation.valid && estimation.discount > 0 && (
                  <p className="text-sm font-medium text-rose-500 line-through mb-1">
                    {formatCurrency(estimation.originalTotal)}
                  </p>
                )}
                <p
                  className={`text-5xl font-black tracking-tighter ${estimation.valid ? "text-foreground" : "text-muted-foreground/20"}`}
                >
                  {formatCurrency(estimation.total)}
                </p>
                {/* OPTIMASI: Teks catatan pemotongan */}
                {estimation.valid && estimation.discount > 0 && (
                  <p className="text-xs text-emerald-500 font-medium mt-1">
                    *Telah dipotong Commitment Fee{" "}
                    {formatCurrency(estimation.discount)}
                  </p>
                )}
              </div>
            </div>

            {/* Detailed Breakdown */}
            <CardContent className="p-0 flex-1">
              {!estimation.valid ? (
                <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground h-[300px]">
                  <Layers
                    size={48}
                    className="text-muted-foreground/20 mb-4 animate-pulse"
                    strokeWidth={1}
                  />
                  <p className="text-sm font-medium">
                    Lengkapi data luasan and pilih opsi paket <br /> untuk
                    melihat rincian biaya.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {/* Base Cost Info */}
                  <div className="p-8 space-y-6 bg-muted/10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          Paket Terpilih
                        </p>
                        <h3 className="text-xl font-black text-foreground">
                          {estimation.package?.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {estimation.package?.subtitle}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Basis Harga
                        </p>
                        <p className="text-lg font-black text-foreground">
                          {formatCurrency(estimation.package?.price)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            /{" "}
                            {estimation.package?.type === "m2" ? "m²" : "ruang"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                          Volume Proyek
                        </p>
                        <p className="text-lg font-black text-foreground">
                          {form.option === "D"
                            ? `${form.area} Ruang`
                            : `${totalLuas} m²`}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
                        <p className="text-[10px] font-bold text-primary uppercase mb-1">
                          Status Laporan
                        </p>
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                          <CheckCircle2 size={16} />
                          Ready
                        </div>
                      </div>
                    </div>

                    {/* OPTIMASI: Commitment Fee Addon Info */}
                    {estimation.discount > 0 && (
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 shadow-sm mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          <p className="text-xs font-bold text-rose-600 uppercase">
                            Potongan Commitment Fee
                          </p>
                        </div>
                        <p className="font-mono text-rose-600 font-bold">
                          - {formatCurrency(estimation.discount)}
                        </p>
                      </div>
                    )}

                    {/* Included Features (Scope of Work) */}
                    <div className="space-y-3 pt-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Cakupan Layanan (Included):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        {estimation.package?.features.map((feat, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-[11px] text-foreground/80"
                          >
                            <CheckCircle2
                              size={12}
                              className="text-primary mt-0.5 shrink-0"
                            />
                            <span>{feat}</span>
                          </div>
                        ))}
                        {/* Optional Features in UI */}
                        {form.includeRAB &&
                          !estimation.package?.features.some(
                            (f) => f.includes("RAB") || f.includes("Anggaran"),
                          ) && (
                            <div className="flex items-start gap-2 text-[11px] text-foreground/80">
                              <CheckCircle2
                                size={12}
                                className="text-primary mt-0.5 shrink-0"
                              />
                              <span>Rencana Anggaran Biaya (RAB)</span>
                            </div>
                          )}
                        {form.includeDED &&
                          !estimation.package?.features.some(
                            (f) =>
                              f.includes("DED") || f.includes("Gambar Kerja"),
                          ) && (
                            <div className="flex items-start gap-2 text-[11px] text-foreground/80">
                              <CheckCircle2
                                size={12}
                                className="text-primary mt-0.5 shrink-0"
                              />
                              <span>Gambar Kerja Lengkap (DED)</span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-8 space-y-4">
                    {/* Selalu tampilkan tombol simpan jika clientId ada (menandakan ini konteks aktivitas survey) */}
                    {(surveyReportId || clientId) && (
                      <div className="space-y-2">
                        <Button
                          onClick={handleProcessAll}
                          disabled={
                            !estimation.valid || isSaving || !surveyReportId
                          }
                          className="w-full h-14 text-base font-black gap-3 shadow-xl bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] transition-all"
                        >
                          {isSaving ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <Save size={20} />
                          )}
                          Simpan & Proses Dokumen
                        </Button>
                        {!surveyReportId && (
                          <p className="text-[10px] text-center text-amber-600 font-medium bg-amber-50 py-1.5 rounded-lg border border-amber-100">
                            Simpan aktif setelah Survey Report dibuat
                          </p>
                        )}
                      </div>
                    )}

                    {/* <Button
                      className="w-full h-14 text-base font-black gap-3 shadow-xl hover:scale-[1.02] transition-all"
                      disabled={!estimation.valid || isSaving}
                      onClick={handleDownloadPDF}
                    >
                      <Download size={20} />
                      Download Penawaran Manual
                    </Button> */}
                    {/* <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                      <FileText
                        size={16}
                        className="text-amber-500 shrink-0 mt-0.5"
                      />
                      <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                        *Estimasi biaya bersifat sementara. Daftar rincian
                        cakupan layanan (Scope of Work) dapat dilihat langsung
                        pada laporan PDF yang diunduh.
                      </p>
                    </div> */}
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
