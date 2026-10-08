import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./construction-estimator-utils";
import {
  QUALITY_TIERS,
  SPEC_DETAILS,
  BASE_RATE_LT1,
  BASE_RATE_LT2,
  BASE_RATE_LT3,
  BASE_RATE_LANDSCAPE,
} from "@/hooks/use-construction-estimator";

// --- CONFIGURATION COLORS (BRANDING MATCH #135A86) ---
const COLORS = {
  primary: [19, 90, 134], // #135A86 (LangitLangit Blue)
  secondary: [241, 245, 249], // Very Light Blue/Grey for backgrounds
  accent: [198, 161, 91], // Muted Gold (Complementary Luxury)
  text: [51, 51, 51], // Charcoal
  textLight: [120, 120, 120], // Soft Grey
  white: [255, 255, 255],
  border: [230, 230, 230],
};

/**
 * Generate Luxury PDF untuk Construction Estimator
 */
export async function generateConstructionEstimatorPDF({
  inputs,
  quality,
  calculation,
  locationMultiplier = 1.0,
  location = "lainnya",
  includeContingency = false,
  contingencyPercent = 10,
  includeAdditional = false,
  totalAdditional = 0,
  breakdown = null,
  progressPayments = null,
  returnBlob = false,
}) {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // --- HELPER FUNCTIONS ---

    const checkNewPage = (requiredHeight) => {
      if (yPos + requiredHeight > pageHeight - margin - 20) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    const drawSectionTitle = (title) => {
      checkNewPage(20);
      yPos += 5;

      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...COLORS.primary);
      doc.text(title.toUpperCase(), margin, yPos);

      // Elegant underline
      doc.setDrawColor(...COLORS.accent);
      doc.setLineWidth(0.7);
      doc.line(margin, yPos + 3, margin + 20, yPos + 3); // Gold accent short

      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.2);
      doc.line(margin + 23, yPos + 3, pageWidth - margin, yPos + 3); // Long grey line

      yPos += 12;
    };

    const drawFooter = () => {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer Line
        doc.setDrawColor(...COLORS.accent);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.textLight);

        // Left: Date
        const dateStr = new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        doc.text(dateStr, margin, pageHeight - 12);

        // Center: Brand
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.primary);
        doc.text("LANGITLANGIT.ID", pageWidth / 2, pageHeight - 12, {
          align: "center",
        });

        // Right: Page
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.textLight);
        doc.text(
          `Hal ${i} / ${pageCount}`,
          pageWidth - margin,
          pageHeight - 12,
          { align: "right" },
        );
      }
    };

    // --- LOAD LOGO IMAGE ---
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
          // Path sesuai struktur public folder Next.js/React
          logoImg.src = "/langit-langit/langit-langit-name-dark.png";
        }),
        new Promise((resolve) => setTimeout(resolve, 2000)), // Timeout 2 detik jika gambar gagal load
      ]);
    } catch (e) {
      console.warn("Logo loading failed/timeout");
      logoLoaded = false;
    }

    // --- HEADER SECTION ---

    // Left: LOGO IMAGE
    const logoMaxHeight = 20; // Tinggi maksimum logo agar tidak nabrak
    let finalLogoHeight = 0;

    if (logoLoaded && logoImg.complete && logoImg.naturalWidth > 0) {
      const logoRatio = logoImg.naturalWidth / logoImg.naturalHeight;
      const displayWidth = logoMaxHeight * logoRatio;

      // Draw Image
      doc.addImage(logoImg, "PNG", margin, yPos, displayWidth, logoMaxHeight);
      finalLogoHeight = logoMaxHeight;
    } else {
      // Fallback Text jika logo gagal load
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(...COLORS.primary);
      doc.text("LANGITLANGIT.ID", margin, yPos + 8);
      finalLogoHeight = 10;
    }

    // Right: Document Title
    // Kita posisikan teks di kanan sejajar dengan tengah logo
    const titleY = yPos + finalLogoHeight / 2 - 2;

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.text);
    doc.text("ESTIMASI BIAYA", pageWidth - margin, titleY, { align: "right" });
    doc.text("PEMBANGUNAN RUMAH", pageWidth - margin, titleY + 6, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.textLight);
    doc.text(
      `#EST-${new Date().getTime().toString().slice(-6)}`,
      pageWidth - margin,
      titleY + 12,
      { align: "right" },
    );

    // Decorative Header Line
    yPos += Math.max(finalLogoHeight, 25) + 5; // Pastikan yPos turun cukup jauh

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    // Gold Accent Block on Line
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(1.5);
    doc.line(pageWidth - margin - 40, yPos, pageWidth - margin, yPos);

    yPos += 15; // Space after header

    // --- PROJECT SUMMARY (CLEAN CARD STYLE) ---
    // Background box yang sangat soft
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 40, 2, 2, "F");

    const startY = yPos + 12;
    const col2X = margin + 95;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text("DATA PROYEK", margin + 10, startY - 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Column 1
    let rowY = startY + 6;
    const labels1 = [
      [
        "Lokasi",
        location === "jakarta"
          ? "DKI Jakarta"
          : location.charAt(0).toUpperCase() + location.slice(1),
      ],
      ["Kelas Bangunan", QUALITY_TIERS[quality]?.label || "Gold Class"],
      ["Luas Tanah", `${inputs.landArea || 0} m²`],
    ];

    labels1.forEach(([label, value]) => {
      doc.setTextColor(...COLORS.textLight);
      doc.text(label, margin + 10, rowY);
      doc.setTextColor(...COLORS.text);
      doc.text(":  " + value, margin + 45, rowY);
      rowY += 6;
    });

    // Column 2
    rowY = startY + 6;
    const labels2 = [
      ["Total Bangunan", `${calculation.totalArea} m²`],
      [
        "Est. Waktu",
        `${calculation.estimatedMonthsMin} - ${calculation.estimatedMonthsMax} Bulan`,
      ],
      [
        "Est. Harga/m²",
        formatCurrency(
          (calculation.cost1 + calculation.cost2 + calculation.cost3) /
            (calculation.totalArea || 1),
        ),
      ],
    ];

    labels2.forEach(([label, value]) => {
      doc.setTextColor(...COLORS.textLight);
      doc.text(label, col2X, rowY);
      doc.setTextColor(...COLORS.text);
      doc.text(":  " + value, col2X + 35, rowY);
      rowY += 6;
    });

    yPos += 50;

    // --- SPESIFIKASI MATERIAL (BERDASARKAN KELAS BANGUNAN) ---
    const selectedSpecs = SPEC_DETAILS[quality];
    if (selectedSpecs) {
      drawSectionTitle(
        `Spesifikasi Material - ${QUALITY_TIERS[quality]?.label || ""}`,
      );

      const tableBody = [];
      const categoryConfig = {
        atap: "Atap",
        plafon: "Plafon",
        lantai: "Lantai",
        decking: "Decking / Eksterior",
        sanitary: "Sanitair",
        cat: "Pengecatan",
        pintu: "Pintu",
        jendela: "Jendela",
        aksesoris: "Aksesoris & Hardware",
        listrik: "Listrik",
      };

      const formatSubKey = (key) => {
        return key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      Object.keys(categoryConfig).forEach((key) => {
        const specGroup = selectedSpecs[key];
        if (!specGroup) return;

        const subKeys = Object.keys(specGroup);
        subKeys.forEach((subKey, index) => {
          const items = specGroup[subKey];
          // Format items list with bullets
          const itemsText = items.map((item) => `• ${item}`).join("\n");

          tableBody.push([
            index === 0 ? categoryConfig[key] : "",
            formatSubKey(subKey),
            itemsText,
          ]);
        });
      });

      autoTable(doc, {
        startY: yPos,
        pageBreak: "auto",
        head: [["Kategori", "Komponen", "Spesifikasi"]],
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: COLORS.primary,
          textColor: COLORS.white,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          valign: "top",
          lineColor: COLORS.border,
          lineWidth: 0.1,
          textColor: COLORS.text,
        },
        columnStyles: {
          0: { fontStyle: "bold", width: 30 },
          1: { width: 45, fontStyle: "bold", textColor: COLORS.textLight },
          2: { cellWidth: "auto" },
        },
        margin: { top: margin, bottom: margin + 10, left: margin, right: margin },
      });

      yPos = doc.lastAutoTable.finalY + 15;
    }

    // --- RINCIAN BIAYA (CLEAN TABLE) ---
    drawSectionTitle("Rincian Biaya Pembangunan");

    const costRows = [];
    if (calculation.floor1 > 0)
      costRows.push([
        "Lantai 1",
        `${calculation.floor1}`,
        formatCurrency(calculation.rate1),
        formatCurrency(calculation.cost1),
      ]);
    if (calculation.floor2 > 0)
      costRows.push([
        "Lantai 2",
        `${calculation.floor2}`,
        formatCurrency(calculation.rate2),
        formatCurrency(calculation.cost2),
      ]);
    if (calculation.floor3 > 0)
      costRows.push([
        "Lantai 3 / Rooftop",
        `${calculation.floor3}`,
        formatCurrency(calculation.rate3),
        formatCurrency(calculation.cost3),
      ]);
    if (calculation.remainingLandArea > 0)
      costRows.push([
        "Landscape & Eksterior",
        `${calculation.remainingLandArea}`,
        formatCurrency(calculation.rateLandscape),
        formatCurrency(calculation.costLandscape),
      ]);
    if (includeAdditional && totalAdditional > 0)
      costRows.push([
        "Biaya Perizinan & Penunjang",
        "-",
        "-",
        formatCurrency(totalAdditional),
      ]);

    autoTable(doc, {
      startY: yPos,
      pageBreak: "auto",
      head: [["Komponen Pekerjaan", "Luas (m²)", "Harga / m²", "Subtotal"]],
      body: costRows,
      theme: "striped",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 4,
        valign: "middle",
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right", fontStyle: "bold" },
      },
      margin: { top: margin, bottom: margin + 10, left: margin, right: margin },
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // --- GRAND TOTAL SECTION (UPDATED: WIDER & CLEANER) ---
    const subtotal =
      calculation.cost1 +
      calculation.cost2 +
      calculation.cost3 +
      calculation.costLandscape +
      totalAdditional;
    const contingency = includeContingency
      ? subtotal * (contingencyPercent / 100)
      : 0;
    const totalCost = subtotal + contingency;

    yPos += 5;
    checkNewPage(45);

    // Decorative box for Total - UPDATED WIDTH (110mm) to prevent overlapping
    const boxWidth = 110;
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(
      pageWidth - margin - boxWidth,
      yPos,
      boxWidth,
      45,
      2,
      2,
      "F",
    );

    // Labels inside box
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200); // Light Grey

    let boxY = yPos + 10;

    // Subtotal Row
    doc.text("Subtotal", pageWidth - margin - boxWidth + 10, boxY); // Left aligned label
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(subtotal), pageWidth - margin - 10, boxY, {
      align: "right",
    }); // Right aligned value

    boxY += 8;

    // Contingency Row
    if (contingency > 0) {
      doc.setFont("helvetica", "normal");
      doc.text(
        `Kontingensi (${contingencyPercent}%)`,
        pageWidth - margin - boxWidth + 10,
        boxY,
      );
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(contingency), pageWidth - margin - 10, boxY, {
        align: "right",
      });
      boxY += 8;
    }

    // Divider Line inside Box
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.5);
    doc.line(
      pageWidth - margin - boxWidth + 10,
      boxY,
      pageWidth - margin - 10,
      boxY,
    );

    // Final Total Row
    boxY += 10;
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.white); // Changed from accent to white
    doc.text("TOTAL ESTIMASI", pageWidth - margin - boxWidth + 10, boxY + 3); // Label Kiri (Aman tidak nabrak)

    doc.setFontSize(16);
    doc.text(formatCurrency(totalCost), pageWidth - margin - 10, boxY + 3, {
      align: "right",
    }); // Value Kanan

    yPos += 55;

    // --- BREAKDOWN CHART ---
    if (breakdown) {
      drawSectionTitle("Alokasi Dana");

      const bItems = [
        { l: "Struktur & Pondasi", v: breakdown.struktur, p: "30%" },
        { l: "Arsitektur & Finishing", v: breakdown.finishing, p: "25%" },
        { l: "MEP (Mekanikal, Elektrikal)", v: breakdown.instalasi, p: "15%" },
        { l: "Landscape & External", v: breakdown.landscape, p: "10%" },
        { l: "Overhead & Jasa", v: breakdown.overhead, p: "20%" },
      ];

      bItems.forEach((item) => {
        checkNewPage(12);
        // Thin line track
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(margin, yPos + 2, 100, 1.5, 0.5, 0.5, "F");

        // Fill bar
        const w = (parseInt(item.p) / 100) * 100;
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(margin, yPos + 2, w, 1.5, 0.5, 0.5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.text);
        doc.text(item.l, margin, yPos - 1);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.textLight);
        doc.text(item.p, margin + 110, yPos + 3);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.text);
        doc.text(formatCurrency(item.v), pageWidth - margin, yPos + 3, {
          align: "right",
        });

        yPos += 14;
      });
      yPos += 10;
    }

    // --- PAYMENT SCHEDULE ---
    if (progressPayments && progressPayments.length > 0) {
      drawSectionTitle("Jadwal Pembayaran");

      const paymentRows = progressPayments.map((pay) => [
        pay.stage,
        `${pay.percentage}%`,
        formatCurrency(pay.amount),
      ]);

      autoTable(doc, {
        startY: yPos,
        pageBreak: "auto",
        head: [["Tahap Pembayaran", "Persentase", "Jumlah"]],
        body: paymentRows,
        theme: "striped",
        headStyles: {
          fillColor: COLORS.primary,
          textColor: COLORS.white,
          fontStyle: "bold",
          halign: "center",
        },
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
          textColor: COLORS.text,
        },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "center" },
          2: { halign: "right", fontStyle: "bold" },
        },
        margin: { top: margin, bottom: margin + 10, left: margin, right: margin },
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // --- DISCLAIMER & FOOTER ---
    checkNewPage(30);
    yPos += 10;

    doc.setFont("times", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    const disclaimer =
      "Disclaimer: Dokumen ini adalah estimasi awal. Harga dapat berubah sesuai desain final, spesifikasi material, dan kondisi lapangan.";

    doc.text(disclaimer, margin, yPos, { maxWidth: pageWidth - margin * 2 });

    drawFooter();

    if (returnBlob) {
      return doc.output("blob");
    }

    // Save
    const fileName = `Proposal-LangitLangit-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);

    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
