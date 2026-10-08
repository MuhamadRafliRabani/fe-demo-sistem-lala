"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import jsPDF from "jspdf";
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
  Download,
  Save,
  MapPin,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { toast } from "sonner";

// Utility for formatting currency clean without decimals for estimation
const formatRupiah = (num = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);

export function TabEstimateDesign({ schedule }) {
  const [form, setForm] = useState({
    clientName: "",
    location: "",
    luasTanah: 0,
    l1: 0,
    l2: 0,
    l3: 0,
    area: 0,
    option: "A",
    rab: false,
    ded: false,
  });
  const [flashLoaded, setFlashLoaded] = useState(false);
  const hasHydratedRef = useRef(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Auto-check logic for Premium (Option B) and reset for others
  useEffect(() => {
    if (form.option === "B") {
      setForm((f) => ({ ...f, rab: true, ded: true }));
    } else {
      setForm((f) => ({ ...f, rab: false, ded: false }));
    }
  }, [form.option]);

  const clientId = schedule?.client_id || schedule?.client?.id || null;

  const surveyReportId =
    schedule?.surveyReport?.id || schedule?.survey_report?.id || null;
  const flashKey = surveyReportId ? `design_estimate_${surveyReportId}` : null;

  const { data: existingEstimate } = useApiFetch(
    surveyReportId ? ["design-estimate", surveyReportId] : null,
    surveyReportId ? `/design-estimates/survey-report/${surveyReportId}` : null,
    undefined,
    !!surveyReportId,
  );

  useEffect(() => {
    if (!flashKey) return;

    try {
      const saved = localStorage.getItem(flashKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);

      setForm((prev) => ({
        ...prev,
        clientName:
          parsed.clientName !== undefined ? parsed.clientName : prev.clientName,
        location:
          parsed.location !== undefined ? parsed.location : prev.location,
        luasTanah:
          parsed.luasTanah !== undefined ? parsed.luasTanah : prev.luasTanah,
        l1: parsed.l1 !== undefined ? parsed.l1 : prev.l1,
        l2: parsed.l2 !== undefined ? parsed.l2 : prev.l2,
        l3: parsed.l3 !== undefined ? parsed.l3 : prev.l3,
        area: parsed.area !== undefined ? parsed.area : prev.area,
        option: parsed.option || prev.option,
        rab: typeof parsed.rab === "boolean" ? parsed.rab : prev.rab,
        ded: typeof parsed.ded === "boolean" ? parsed.ded : prev.ded,
      }));

      setFlashLoaded(true);
    } catch {
      // ignore
    }
  }, [flashKey]);

  useEffect(() => {
    if (flashLoaded) return;

    const payload = existingEstimate?.data;
    if (!payload) return;

    setForm((prev) => ({
      ...prev,
      clientName: payload.client_name || "",
      location: payload.location || "",
      luasTanah: payload.land_area ?? 0,
      l1: payload.building_area_l1 ?? 0,
      l2: payload.building_area_l2 ?? 0,
      l3: payload.building_area_l3 ?? 0,
      area: payload.area_count ?? 0,
      option: payload.option || "A",
      rab: !!payload.rab,
      ded: !!payload.ded,
    }));
  }, [existingEstimate, flashLoaded]);

  useEffect(() => {
    if (flashLoaded) return;
    if (!schedule) return;
    if (existingEstimate?.data) return;

    setForm((prev) => ({
      ...prev,
      clientName: schedule.client?.name || prev.clientName,
      location: schedule.address || prev.location,
    }));
  }, [schedule, existingEstimate, flashLoaded]);

  useEffect(() => {
    if (!flashKey) return;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    try {
      localStorage.setItem(flashKey, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form, flashKey]);

  const uploadPdfMutation = usePost("/design-estimates/upload-pdf");
  const saveEstimateMutation = usePost("/design-estimates");
  const { mutateAsync: createDesignOrder } = usePost("/orders/design");

  const totalLuas = useMemo(() => {
    const land = Number(form.luasTanah) || 0;
    const l2 = Number(form.l2) || 0;
    const l3 = Number(form.l3) || 0;
    return land + l2 + l3;
  }, [form.luasTanah, form.l2, form.l3]);

  // RAB and DED are now included in the base price (0 additional cost)
  const rabPrice = 0;
  const dedPrice = 0;

  const estimation = useMemo(() => {
    if (form.option === "A" && totalLuas > 0) {
      const base = totalLuas * 100_000;
      return { valid: true, base, total: base };
    }
    if (form.option === "B" && totalLuas > 0) {
      const base = totalLuas * 200_000; // Updated to 200rb for Premium
      return { valid: true, base, total: base };
    }
    if (form.option === "C" && totalLuas > 0) {
      const base = totalLuas * 150_000; // Updated to 150rb for Reguler
      return { valid: true, base, total: base };
    }
    if (form.option === "D" && form.area > 0) {
      const base = Number(form.area) * 4_500_000; // Updated to 4.5jt for Per Ruangan
      return { valid: true, base, total: base };
    }
    return { valid: false, base: 0, total: 0 };
  }, [form.option, form.area, totalLuas]);

  const generatePDFBlob = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let y = 20;

    const checkPageBreak = (needed) => {
      if (y + needed > pageHeight - margin) {
        pdf.addPage();
        y = 20;
      }
    };

    const COLORS = {
      primary: [19, 90, 134],
      accent: [198, 161, 91],
      navy: [9, 18, 40],
      blue: [37, 99, 235],
      textLight: [120, 130, 160],
      border: [230, 233, 240],
      yellowBg: [255, 244, 214],
      yellowText: [125, 96, 34],
      grayText: [140, 145, 160],
    };

    const drawSectionLabel = (label) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...COLORS.textLight);
      pdf.text(label.toUpperCase(), margin, y);
      pdf.setDrawColor(...COLORS.border);
      pdf.line(margin + 40, y, pageWidth - margin, y);
      y += 8;
    };

    const clientName =
      form.clientName || schedule?.client?.name || "Nama Klien";
    const location =
      form.location ||
      schedule?.address ||
      schedule?.region?.name ||
      "Lokasi Proyek";
    const landArea = Number(form.luasTanah) || 0;
    const l1 = Number(form.l1) || 0;
    const l2 = Number(form.l2) || 0;
    const l3 = Number(form.l3) || 0;
    const totalLuasArsitektur = totalLuas;
    const today = new Date();
    const tanggal = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

    let logoLoaded = false;
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";

    try {
      await Promise.race([
        new Promise((resolve) => {
          logoImg.onload = () => {
            logoLoaded = true;
            resolve();
          };
          logoImg.onerror = () => {
            logoLoaded = false;
            resolve();
          };
          logoImg.src = "/langit-langit/langit-langit-name-dark.png";
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      logoLoaded = false;
    }

    const logoMaxHeight = 18;
    let finalLogoHeight = 0;

    if (logoLoaded && logoImg.complete && logoImg.naturalWidth > 0) {
      const logoRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      const displayWidth = logoMaxHeight * logoRatio;
      pdf.addImage(logoImg, "PNG", margin, y, displayWidth, logoMaxHeight);
      finalLogoHeight = logoMaxHeight;
    } else {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(...COLORS.primary);
      pdf.text("LANGITLANGIT.ID", margin, y + 8);
      finalLogoHeight = 10;
    }

    const headerRightX = pageWidth - margin;
    const titleY = y + finalLogoHeight / 2 - 2;

    pdf.setFont("times", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(20, 24, 33);
    pdf.text("DESIGN ESTIMATION", headerRightX, titleY, { align: "right" });
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.textLight);
    pdf.text(tanggal, headerRightX, titleY + 6, { align: "right" });

    y += Math.max(finalLogoHeight, 24) + 6;

    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(0.6);
    pdf.line(margin, y, pageWidth - margin, y);
    pdf.setDrawColor(...COLORS.accent);
    pdf.setLineWidth(1.2);
    pdf.line(pageWidth - margin - 35, y, pageWidth - margin, y);

    y += 14;

    const isOptionC = form.option === "C";

    checkPageBreak(40);
    drawSectionLabel("01. Data Luasan Proyek");

    const boxWidth = (pageWidth - margin * 2 - 12) / 4;
    const boxHeight = 26;
    const labels = ["LUAS TANAH", "LANTAI 1", "LANTAI 2", "LANTAI 3"];
    const values = [landArea, l1, l2, l3];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);

    labels.forEach((label, idx) => {
      const x = margin + idx * (boxWidth + 4);
      const value = values[idx];

      pdf.setDrawColor(...COLORS.border);
      pdf.setFillColor(249, 250, 252);
      pdf.roundedRect(x, y, boxWidth, boxHeight, 4, 4, "FD");

      pdf.setTextColor(...COLORS.textLight);
      pdf.text(label, x + 5, y + 8);

      pdf.setTextColor(...COLORS.navy);
      pdf.setFontSize(14);
      const displayValue = isOptionC ? "" : `${value}`;
      if (displayValue) {
        pdf.text(displayValue, x + boxWidth / 2, y + 17, {
          align: "center",
        });
      }

      if (!isOptionC) {
        pdf.setFontSize(7);
        pdf.setTextColor(...COLORS.textLight);
        pdf.text("m²", x + boxWidth - 8, y + 19);
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.textLight);
      }
    });

    y += boxHeight + 18;

    checkPageBreak(20);
    pdf.setFillColor(...COLORS.blue);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, 16, 8, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text("TOTAL LUAS HITUNG ARSITEKTUR", margin + 8, y + 5);
    pdf.setFontSize(16);
    const totalDisplay = isOptionC ? "" : `${totalLuasArsitektur}`;
    if (totalDisplay) {
      pdf.text(totalDisplay, pageWidth - margin - 15, y + 11, {
        align: "right",
      });
      pdf.setFontSize(7);
      pdf.text("M²", pageWidth - margin - 5, y + 11);
    }

    y += 28;

    checkPageBreak(80);
    drawSectionLabel("02. Ringkasan Estimasi Biaya");

    const cardX = margin;
    const cardWidth = pageWidth - margin * 2;
    const cardRadius = 6;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...COLORS.border);
    const cardHeight = 60;
    pdf.roundedRect(
      cardX,
      y,
      cardWidth,
      cardHeight,
      cardRadius,
      cardRadius,
      "FD",
    );

    const headerHeight = 13;
    pdf.setFillColor(...COLORS.navy);
    pdf.roundedRect(
      cardX,
      y,
      cardWidth,
      headerHeight,
      cardRadius,
      cardRadius,
      "F",
    );

    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      `OPSI ${form.option}: ${getOptionLabel(form.option)}`.toUpperCase(),
      cardX + 6,
      y + 8,
    );

    pdf.setFillColor(14, 27, 73);
    const pillWidth = 24;
    const pillX = cardX + cardWidth - pillWidth - 6;
    pdf.roundedRect(pillX, y + 3, pillWidth, 7, 3, 3, "F");
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PER AREA", pillX + pillWidth / 2, y + 7.5, { align: "center" });

    let contentY = y + headerHeight + 8;
    const contentX = cardX + 8;
    const contentRightX = cardX + cardWidth - 8;

    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.grayText);

    const areaLabel =
      form.option === "C"
        ? `${Number(form.area) || 0} AREA x Rp 2,5jt`
        : `${totalLuasArsitektur} m² x ${getOptionDesc(form.option)}`;

    pdf.text(`BIAYA DESAIN (${areaLabel})`, contentX, contentY);
    pdf.setTextColor(...COLORS.navy);
    pdf.text(formatRupiah(estimation.base), contentRightX, contentY, {
      align: "right",
    });
    contentY += 7;

    if (form.rab) {
      pdf.setTextColor(...COLORS.grayText);
      pdf.text("ADD-ON: PENYUSUNAN RAB MATERIAL", contentX, contentY);
      pdf.setTextColor(34, 197, 94);
      pdf.text("FREE", contentRightX, contentY, {
        align: "right",
      });
      contentY += 7;
    }
    if (form.ded) {
      pdf.setTextColor(...COLORS.grayText);
      pdf.text("ADD-ON: GAMBAR DED", contentX, contentY);
      pdf.setTextColor(34, 197, 94);
      pdf.text("FREE", contentRightX, contentY, {
        align: "right",
      });
      contentY += 7;
    }

    const totalY = y + cardHeight - 9;
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(cardX + 4, totalY - 5, cardX + cardWidth - 4, totalY - 5);

    pdf.setTextColor(...COLORS.textLight);
    pdf.setFontSize(7);
    pdf.text(
      `TOTAL ESTIMASI ${form.option}`.toUpperCase(),
      contentX,
      totalY - 1,
    );
    pdf.setTextColor(...COLORS.blue);
    pdf.setFontSize(14);
    pdf.text(formatRupiah(estimation.total), contentRightX, totalY + 1, {
      align: "right",
    });

    y += cardHeight + 14;

    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    const shouldShowSipil = form.option === "A" || form.option === "B";
    const shouldShowInterior = form.option === "C" || form.option === "B";

    const sipilImg = shouldShowSipil
      ? await loadImage("/asset/survey/sipil.jpeg")
      : null;
    const interiorImg = shouldShowInterior
      ? await loadImage("/asset/survey/interior.jpeg")
      : null;

    const images = [];
    const imageLabels = [];
    if (sipilImg) {
      images.push(sipilImg);
      imageLabels.push("Sipil");
    }
    if (interiorImg) {
      images.push(interiorImg);
      imageLabels.push("Interior");
    }

    if (images.length > 0) {
      checkPageBreak(45);
      const maxImgHeight = 30;
      const gap = 6;
      const usableWidth = pageWidth - margin * 2;
      const slotWidth =
        images.length === 1 ? usableWidth : (usableWidth - gap) / 2;

      let imgY = y;

      images.forEach((img, idx) => {
        const ratio = img.naturalWidth / img.naturalHeight || 1;
        let drawWidth = maxImgHeight * ratio;
        if (drawWidth > slotWidth) {
          drawWidth = slotWidth;
        }
        const drawHeight = drawWidth / ratio;

        const slotX =
          images.length === 1
            ? margin + (usableWidth - drawWidth) / 2
            : margin + idx * (slotWidth + gap) + (slotWidth - drawWidth) / 2;

        pdf.addImage(img, "JPEG", slotX, imgY, drawWidth, drawHeight);
        const label = imageLabels[idx] ?? "";
        if (label) {
          pdf.setFontSize(7);
          pdf.setTextColor(...COLORS.grayText);
          pdf.text(label, slotX + drawWidth / 2, imgY + drawHeight + 4, {
            align: "center",
          });
        }
      });

      y = imgY + maxImgHeight + 14;
    }

    checkPageBreak(25);
    const noteHeight = 18;
    pdf.setFillColor(...COLORS.yellowBg);
    pdf.setDrawColor(...COLORS.yellowBg);
    pdf.roundedRect(margin, y, pageWidth - margin * 2, noteHeight, 4, 4, "FD");
    pdf.setTextColor(...COLORS.yellowText);
    pdf.setFontSize(7);
    const noteText =
      "Seluruh biaya di atas bersifat refundable jika proyek dilanjutkan ke tahap konstruksi/pelaksanaan bersama kami.";
    pdf.text(noteText, margin + 6, y + 6, {
      maxWidth: pageWidth - margin * 2 - 12,
    });

    y += noteHeight + 20;

    checkPageBreak(20);
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.textLight);
    pdf.text("Hormat kami,", margin, y);
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.navy);
    pdf.text("Surveyor", margin, y + 10);

    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.textLight);
    pdf.text("LANGITLANGIT.ID", pageWidth - margin, y + 10, {
      align: "right",
    });

    return pdf.output("blob");
  };

  const handleDownloadPDF = async () => {
    if (!estimation.valid) {
      toast.error("Mohon lengkapi data estimasi terlebih dahulu");
      return;
    }
    try {
      const pdfBlob = await generatePDFBlob();
      const clientName = form.clientName || "Draft";
      const fileName = `Estimasi_${clientName.replace(/\s+/g, "_")}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Gagal membuat PDF.");
    }
  };

  const handleSaveToDB = async () => {
    if (!surveyReportId) {
      toast.error(
        "Survey report belum dibuat. Simpan laporan survey terlebih dahulu.",
      );
      return;
    }
    if (!estimation.valid) {
      toast.error("Lengkapi data estimasi terlebih dahulu.");
      return;
    }
    try {
      const pdfBlob = await generatePDFBlob();
      const clientName = form.clientName || "Draft";
      const fileName = `Estimasi_${clientName.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`;
      const formData = new FormData();
      formData.append("pdf_file", pdfBlob, fileName);
      if (clientId) {
        formData.append("client_id", String(clientId));
      }

      const uploadRes = await uploadPdfMutation.mutateAsync(formData);
      const pdfPath =
        uploadRes?.data?.path ||
        uploadRes?.path ||
        uploadRes?.data?.data?.path ||
        null;

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
        rab: !!form.rab,
        ded: !!form.ded,
        pdf_path: pdfPath,
      };

      await saveEstimateMutation.mutateAsync(payload);
      toast.success("Data estimasi berhasil disimpan ke database.");
      try {
        if (flashKey) {
          localStorage.removeItem(flashKey);
        }
      } catch {
        // ignore
      }
    } catch (e) {
      toast.error("Gagal menyimpan data.");
      console.error(e);
    }
  };

  // Helper labels
  const getOptionLabel = (opt) => {
    switch (opt) {
      case "A":
        return "Paket Sipil";
      case "B":
        return "Paket Premium";
      case "C":
        return "Paket Reguler";
      case "D":
        return "Per Ruangan";
      default:
        return "";
    }
  };

  const getOptionDesc = (opt) => {
    switch (opt) {
      case "A":
        return "Rp 100rb / m²";
      case "B":
        return "Rp 200rb / m²";
      case "C":
        return "Rp 150rb / m²";
      case "D":
        return "Rp 4,5jt / area";
      default:
        return "";
    }
  };

  const handleCreateDesignOrder = async () => {
    if (!estimation.valid) {
      toast.error("Lengkapi data estimasi terlebih dahulu.");
      return;
    }

    if (!schedule?.id) {
      toast.error("ID survey tidak ditemukan.");

      return;
    }

    if (isCreatingOrder) return;

    setIsCreatingOrder(true);
    try {
      const payload = {
        survey_id: schedule.id,
        price: estimation.total,
      };

      const res = await createDesignOrder(payload);
      const url = res?.payment_url || res?.data?.payment_url;

      if (url) {
        window.open(url, "_blank");
        toast.success(
          "Order design berhasil dibuat. Silakan lanjut ke pembayaran.",
        );
      } else {
        toast.success("Order design berhasil dibuat.");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || "Gagal membuat order design.";
      toast.error(message);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="space-y-6 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="lg:col-span-5 space-y-6">
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
              <div className="p-4 rounded-xl border border-dashed bg-muted">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Layers
                      size={18}
                      className={
                        form.option === "C"
                          ? "text-emerald-500 mt-1"
                          : "text-slate-600 mt-1"
                      }
                    />
                    <div>
                      <p className="text-sm font-medium">Jumlah Area</p>
                      <p className="text-xs text-muted-foreground">
                        Khusus perhitungan Paket Per Area (Opsi C)
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:w-32">
                    <InputField
                      value={form.area}
                      onChange={(val) => update("area", val)}
                      placeholder="0"
                      suffix="Area"
                      icon={Layers}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Options & Addons */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg border text-amber-500 bg-card">
                  <FileText size={18} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Paket & Layanan Tambahan
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Pilih skema harga yang akan digunakan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Option Selector Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {["A", "C", "B", "D"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update("option", opt)}
                    className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 ${
                      form.option === opt
                        ? "bg-primary/10 border-primary ring-1 ring-primary/20"
                        : "bg-muted border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex justify-between w-full mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          form.option === opt
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        Opsi {opt}
                      </span>
                      {form.option === opt && (
                        <CheckCircle2 size={16} className="text-blue-500" />
                      )}
                    </div>
                    <p className="font-semibold text-sm">
                      {getOptionLabel(opt)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {getOptionDesc(opt)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Add-ons Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors bg-muted ${form.option === "B" ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border flex items-center justify-center">
                      {form.rab && (
                        <CheckCircle2 size={12} className="text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Penyusunan RAB</p>
                      <p className="text-[10px] text-muted-foreground">
                        Estimasi material (Included)
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    disabled={form.option === "B"}
                    checked={form.rab}
                    onChange={(e) => update("rab", e.target.checked)}
                  />
                </label>

                <label
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors bg-muted ${form.option === "B" ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border flex items-center justify-center">
                      {form.ded && (
                        <CheckCircle2 size={12} className="text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Gambar DED</p>
                      <p className="text-[10px] text-muted-foreground">
                        Gambar kerja detail (Included)
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    disabled={form.option === "B"}
                    checked={form.ded}
                    onChange={(e) => update("ded", e.target.checked)}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: RESULTS SUMMARY --- */}
        <div className="lg:col-span-7 relative lg:sticky lg:top-6">
          <Card className=" shadow-xl overflow-hidden flex flex-col h-full">
            {/* Header Summary */}
            <div className=" p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calculator size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Ringkasan Biaya
                  </span>
                </div>
                <div
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${estimation.valid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"}`}
                >
                  {estimation.valid ? "SIAP EXPORT" : "BELUM LENGKAP"}
                </div>
              </div>

              <div className="mt-2">
                <p className="text-sm text-slate-500 mb-1 ">
                  Total Estimasi Final
                </p>
                <p
                  className={`text-4xl font-bold tracking-tight !line-through ${estimation.valid ? "text-white" : "text-slate-700"}`}
                >
                  {formatRupiah(estimation.total)}
                </p>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <CardContent className="p-0 flex-1">
              {!estimation.valid ? (
                <div className="p-8 flex flex-col items-center justify-center text-center text-slate-500 h-[300px]">
                  <Layers
                    size={48}
                    className="text-slate-800 mb-4"
                    strokeWidth={1}
                  />
                  <p className="text-sm">
                    Lengkapi data luasan dan pilih opsi paket untuk melihat
                    rincian.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* Base Cost */}
                  <div className="p-5 hover:bg-slate-900/40 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-medium text-slate-200">
                          Biaya Desain Dasar
                        </p>
                        <p className="text-xs text-slate-500">
                          {getOptionLabel(form.option)} •{" "}
                          {getOptionDesc(form.option)}
                        </p>
                      </div>
                      <p className="font-mono font-medium text-slate-300">
                        {formatRupiah(estimation.base)}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {form.option !== "C" ? (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-900 rounded text-slate-500 border border-slate-800">
                          Total Luas: {totalLuas} m²
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-950/30 rounded text-emerald-500 border border-emerald-900/50">
                          Total Area: {form.area}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Addons */}
                  {(form.rab || form.ded) && (
                    <div className="p-5 space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        Layanan Tambahan (Included)
                      </p>
                      {form.rab && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>{" "}
                            Penyusunan RAB
                          </span>
                          <span className="font-mono text-emerald-500 font-bold">
                            FREE
                          </span>
                        </div>
                      )}
                      {form.ded && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>{" "}
                            Gambar DED
                          </span>
                          <span className="font-mono text-emerald-500 font-bold">
                            FREE
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* Actions Footer */}
            <div className="p-5  space-y-3">
              <Button
                onClick={handleCreateDesignOrder}
                disabled={!estimation.valid || !schedule?.id || isCreatingOrder}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-11"
              >
                {isCreatingOrder ? (
                  "Membuat Order Design..."
                ) : (
                  <>
                    <ArrowRight size={18} className="mr-2" /> Buat Order Design
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleSaveToDB(schedule?.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-11"
              >
                {uploadPdfMutation.isPending ||
                saveEstimateMutation.isPending ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save size={18} className="mr-2" /> Simpan ke Database
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={!estimation.valid}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-11"
              >
                <Download size={18} className="mr-2" /> Download PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
