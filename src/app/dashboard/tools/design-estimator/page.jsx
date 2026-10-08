"use client";

import DashboardLayout from "@/components/layouts/dashboard-layout";
import DesignEstimator from "@/components/tools/design-estimator";

export default function DesignEstimatorPage() {
  return (
    <DashboardLayout
      title="Estimasi Desain"
      desc="Kalkulator biaya desain arsitektur dan interior berdasarkan luasan atau jumlah area."
    >
      <DesignEstimator />
    </DashboardLayout>
  );
}
// const generatePDFBlob = async () => {
//   // Gunakan tinggi halaman yang sedikit lebih panjang (320mm) agar muat dalam 1 halaman
//   const pdf = new jsPDF("p", "mm", [210, 320]);
//   const pageWidth = pdf.internal.pageSize.getWidth();
//   const pageHeight = pdf.internal.pageSize.getHeight();
//   const margin = 20;
//   let y = 20;

//   // Karena user ingin 1 halaman saja, kita tidak perlu checkPageBreak yang menambah halaman baru
//   const checkPageBreak = (needed) => {
//     // Logic dikosongkan agar tetap di 1 halaman sesuai permintaan
//   };

//   const COLORS = {
//     primary: [19, 90, 134], // #135a86
//     accent: [254, 216, 24], // #fed818
//     slate900: [15, 23, 42],
//     slate800: [30, 41, 59],
//     slate600: [71, 85, 105],
//     slate500: [100, 116, 139],
//     slate400: [148, 163, 184],
//     slate200: [226, 232, 240],
//     slate50: [248, 250, 252],
//     white: [255, 255, 255],
//     redText: [225, 29, 72], // Added red text for discount
//   };

//   const clientName = form.clientName || "Nama Klien";
//   const location = form.location || "Lokasi Proyek";
//   const today = new Date();
//   const tanggal = today.toLocaleDateString("id-ID", {
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   });

//   // Generate Professional Ref Number with Client ID if available
//   const clientSuffix = initialData?.uuid
//     ? initialData.uuid.slice(-4).toUpperCase()
//     : Math.floor(1000 + Math.random() * 9000);
//   const refNumber = `EST/${today.getFullYear()}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${clientSuffix}`;

//   const isOptionD = form.option === "D";
//   const pkg = estimation.package;

//   // --- HEADER ---
//   pdf.setFillColor(...COLORS.white);
//   pdf.rect(0, 0, pageWidth, pageHeight, "F");

//   // Border Top
//   pdf.setFillColor(...COLORS.primary);
//   pdf.rect(0, 0, pageWidth, 3, "F");
//   y = 15;

//   // Logo & Title
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(22);
//   pdf.setTextColor(...COLORS.slate900);
//   pdf.text("LANGITLANGIT", margin, y + 5);
//   const logoWidth = pdf.getTextWidth("LANGITLANGIT");
//   pdf.setTextColor(...COLORS.primary);
//   pdf.text(".ID", margin + logoWidth, y + 5);

//   pdf.setFont("helvetica", "medium");
//   pdf.setFontSize(9);
//   pdf.setTextColor(...COLORS.slate500);
//   pdf.text("Architecture & Interior Design", margin, y + 10);

//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(16);
//   pdf.setTextColor(...COLORS.primary);
//   pdf.text("QUOTATION", pageWidth - margin, y + 4, { align: "right" });
//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(9);
//   pdf.setTextColor(...COLORS.slate500);
//   pdf.text("Dokumen Penawaran Desain", pageWidth - margin, y + 9, {
//     align: "right",
//   });

//   y += 20;
//   pdf.setDrawColor(...COLORS.slate200);
//   pdf.setLineWidth(0.5);
//   pdf.line(margin, y, pageWidth - margin, y);
//   y += 6;

//   // --- META INFO ---
//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(9);
//   const splitLocation = pdf.splitTextToSize(
//     location,
//     (pageWidth - margin * 2) * 0.5 - 10,
//   );
//   // Hitung tinggi box berdasarkan panjang lokasi
//   const metaBoxHeight = Math.max(35, 20 + splitLocation.length * 4.5);

//   pdf.setFillColor(...COLORS.slate50);
//   pdf.setDrawColor(...COLORS.slate200);
//   pdf.roundedRect(
//     margin,
//     y,
//     pageWidth - margin * 2,
//     metaBoxHeight,
//     3,
//     3,
//     "FD",
//   );

//   // Left: Ditujukan Kepada
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(7);
//   pdf.setTextColor(...COLORS.slate400);
//   pdf.text("DITUJUKAN KEPADA:", margin + 8, y + 8);

//   pdf.setFontSize(11);
//   pdf.setTextColor(...COLORS.primary);
//   pdf.text(clientName.toUpperCase(), margin + 8, y + 15);

//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(9);
//   pdf.setTextColor(...COLORS.slate600);
//   pdf.text(splitLocation, margin + 8, y + 21);

//   // Right: Detail Dokumen
//   const rightColX = pageWidth - margin - 55; // Geser sedikit ke kiri agar tidak overflow
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(7);
//   pdf.setTextColor(...COLORS.slate400);
//   pdf.text("DETAIL DOKUMEN:", rightColX, y + 8);

//   pdf.setFont("helvetica", "normal");
//   pdf.setFontSize(9);
//   pdf.setTextColor(...COLORS.slate500);
//   pdf.text("Tanggal", rightColX, y + 15);
//   pdf.text("No. Ref", rightColX, y + 21);

//   pdf.setFont("helvetica", "bold");
//   pdf.setTextColor(...COLORS.slate900);
//   pdf.text(`: ${tanggal}`, rightColX + 15, y + 15);
//   // Wrap ref number if needed or ensure enough space
//   const refText = `: ${refNumber}`;
//   pdf.text(refText, rightColX + 15, y + 21);

//   y += metaBoxHeight + 12;

//   // --- METRIK LUASAN ---
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(12);
//   pdf.setTextColor(...COLORS.primary);
//   pdf.text("Rincian Luasan Proyek", margin, y);
//   pdf.setDrawColor(...COLORS.slate200);
//   pdf.setLineWidth(0.2);
//   pdf.line(margin, y + 2, pageWidth - margin, y + 2);
//   y += 8;

//   const boxWidth = (pageWidth - margin * 2 - 12) / 4;
//   const boxHeight = 22;
//   const luasanItems = [
//     { label: "LUAS TANAH", val: form.luasTanah },
//     { label: "LANTAI 1", val: form.l1 },
//     { label: "LANTAI 2", val: form.l2 },
//     { label: "LANTAI 3", val: form.l3 },
//   ];

//   luasanItems.forEach((item, idx) => {
//     const x = margin + idx * (boxWidth + 4);
//     pdf.setDrawColor(...COLORS.slate200);
//     pdf.setFillColor(...COLORS.white);
//     pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, "FD");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(6);
//     pdf.setTextColor(...COLORS.slate500);
//     pdf.text(item.label, x + boxWidth / 2, y + 6, { align: "center" });

//     pdf.setFontSize(12);
//     pdf.setTextColor(...COLORS.slate800);
//     const valText = isOptionD ? "-" : `${item.val || 0}`;
//     pdf.text(valText, x + boxWidth / 2 - (isOptionD ? 0 : 2), y + 15, {
//       align: "center",
//     });

//     if (!isOptionD && item.val > 0) {
//       pdf.setFontSize(7);
//       pdf.setTextColor(...COLORS.slate500);
//       pdf.text(
//         "m²",
//         x + boxWidth / 2 + pdf.getTextWidth(valText) / 2 + 1,
//         y + 15,
//       );
//     }
//   });

//   y += boxHeight + 6;

//   if (!isOptionD) {
//     pdf.setFillColor(...COLORS.primary);
//     pdf.roundedRect(margin, y, pageWidth - margin * 2, 12, 2, 2, "F");
//     pdf.setFillColor(...COLORS.accent);
//     pdf.rect(margin, y, 3, 12, "F");

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(9);
//     pdf.setTextColor(...COLORS.white);
//     pdf.text("TOTAL LUAS HITUNG ARSITEKTUR", margin + 8, y + 7.5);

//     pdf.setFontSize(14);
//     const totalLuasText = `${totalLuas}`;
//     pdf.text(totalLuasText, pageWidth - margin - 12, y + 8.5, {
//       align: "right",
//     });
//     pdf.setFontSize(8);
//     pdf.setTextColor(...COLORS.accent);
//     pdf.text("m²", pageWidth - margin - 10, y + 8.5);
//     y += 20;
//   } else {
//     y += 10;
//   }

//   // --- TABEL HARGA ---
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(12);
//   pdf.setTextColor(...COLORS.primary);
//   pdf.text("Rincian Biaya Desain", margin, y);
//   pdf.setDrawColor(...COLORS.slate200);
//   pdf.line(margin, y + 2, pageWidth - margin, y + 2);
//   y += 8;

//   // Table Header
//   pdf.setFillColor(...COLORS.slate50);
//   pdf.roundedRect(margin, y, pageWidth - margin * 2, 10, 2, 2, "F");
//   pdf.setFontSize(8);
//   pdf.setTextColor(...COLORS.slate500);
//   pdf.text("Deskripsi Paket", margin + 4, y + 6.5);
//   pdf.text("Qty", margin + 100, y + 6.5, { align: "center" });
//   pdf.text("Harga Satuan", margin + 135, y + 6.5, { align: "right" });
//   pdf.text("Total", pageWidth - margin - 4, y + 6.5, { align: "right" });
//   y += 10;

//   // Table Body
//   if (pkg) {
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(10);
//     pdf.setTextColor(...COLORS.primary);
//     pdf.text(pkg.name, margin + 4, y + 6);
//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(8);
//     pdf.setTextColor(...COLORS.slate500);
//     pdf.text(pkg.subtitle, margin + 4, y + 11);

//     pdf.setFontSize(9);
//     pdf.setTextColor(...COLORS.slate800);
//     const qtyText = isOptionD
//       ? `${Number(form.area) || 0} Ruang`
//       : `${totalLuas} m²`;
//     pdf.text(qtyText, margin + 100, y + 8, { align: "center" });
//     pdf.text(formatRupiah(pkg.price), margin + 135, y + 8, {
//       align: "right",
//     });
//     pdf.setFont("helvetica", "bold");
//     pdf.setTextColor(...COLORS.slate900);
//     pdf.text(formatRupiah(estimation.base), pageWidth - margin - 4, y + 8, {
//       align: "right",
//     });
//     y += 15;

//     // Add RAB Row if selected
//     if (form.includeRAB) {
//       const rabPrice = form.option === "B" ? 0 : 3_500_000;
//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(9);
//       pdf.setTextColor(...COLORS.primary);
//       pdf.text("Penyusunan RAB Material", margin + 4, y + 4);
//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8);
//       pdf.setTextColor(...COLORS.slate500);
//       pdf.text("Layanan Tambahan", margin + 4, y + 8);

//       pdf.setFontSize(9);
//       pdf.setTextColor(...COLORS.slate800);
//       pdf.text("1 Paket", margin + 100, y + 6, { align: "center" });
//       pdf.text(formatRupiah(rabPrice), margin + 135, y + 6, {
//         align: "right",
//       });
//       pdf.setFont("helvetica", "bold");
//       pdf.setTextColor(...COLORS.slate900);
//       pdf.text(formatRupiah(rabPrice), pageWidth - margin - 4, y + 6, {
//         align: "right",
//       });
//       y += 12;
//     }

//     // Add DED Row if selected
//     if (form.includeDED) {
//       const dedPrice = form.option !== "B" ? 3_500_000 : 0;
//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(9);
//       pdf.setTextColor(...COLORS.primary);
//       pdf.text("Gambar Kerja Lengkap (DED)", margin + 4, y + 4);
//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8);
//       pdf.setTextColor(...COLORS.slate500);
//       pdf.text("Layanan Tambahan", margin + 4, y + 8);

//       pdf.setFontSize(9);
//       pdf.setTextColor(...COLORS.slate800);
//       pdf.text("1 Paket", margin + 100, y + 6, { align: "center" });
//       pdf.text(formatRupiah(dedPrice), margin + 135, y + 6, {
//         align: "right",
//       });
//       pdf.setFont("helvetica", "bold");
//       pdf.setTextColor(...COLORS.slate900);
//       pdf.text(formatRupiah(dedPrice), pageWidth - margin - 4, y + 6, {
//         align: "right",
//       });
//       y += 12;
//     }

//     // OPTIMASI: Add Commitment Fee Row in PDF if applicable
//     if (estimation.discount > 0) {
//       pdf.setFont("helvetica", "bold");
//       pdf.setFontSize(9);
//       pdf.setTextColor(...COLORS.redText);
//       pdf.text("Potongan Commitment Fee", margin + 4, y + 4);
//       pdf.setFont("helvetica", "normal");
//       pdf.setFontSize(8);
//       pdf.setTextColor(...COLORS.slate500);
//       pdf.text("Diskon Khusus", margin + 4, y + 8);

//       pdf.setFontSize(9);
//       pdf.setTextColor(...COLORS.slate800);
//       pdf.text("1 Paket", margin + 100, y + 6, { align: "center" });
//       pdf.setTextColor(...COLORS.redText);
//       pdf.text(
//         `- ${formatRupiah(estimation.discount)}`,
//         margin + 135,
//         y + 6,
//         {
//           align: "right",
//         },
//       );
//       pdf.setFont("helvetica", "bold");
//       pdf.text(
//         `- ${formatRupiah(estimation.discount)}`,
//         pageWidth - margin - 4,
//         y + 6,
//         {
//           align: "right",
//         },
//       );
//       y += 12;
//     }

//     y += 5;
//   }

//   // Table Footer / Total
//   pdf.setDrawColor(...COLORS.slate200);
//   pdf.line(margin + 100, y, pageWidth - margin, y);
//   y += 12; // Ditambah jarak agar tidak tumpuk
//   pdf.setFont("helvetica", "bold");
//   pdf.setFontSize(10);
//   pdf.setTextColor(...COLORS.slate600);
//   pdf.text("TOTAL ESTIMASI", pageWidth - margin - 60, y, { align: "right" });
//   pdf.setFontSize(18);
//   pdf.setTextColor(...COLORS.primary);
//   pdf.text(formatRupiah(estimation.total), pageWidth - margin - 4, y + 1, {
//     align: "right",
//   });
//   y += 18;

//   // --- SCOPE OF WORK ---
//   if (pkg) {
//     const features = pkg.features || [];
//     const finalFeatures = [...features];
//     if (
//       form.includeRAB &&
//       !finalFeatures.some((f) => f.includes("RAB") || f.includes("Anggaran"))
//     ) {
//       finalFeatures.push("Rencana Anggaran Biaya (RAB)");
//     }
//     if (
//       form.includeDED &&
//       !finalFeatures.some(
//         (f) => f.includes("DED") || f.includes("Gambar Kerja"),
//       )
//     ) {
//       finalFeatures.push("Gambar Kerja Lengkap (DED)");
//     }

//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(12);
//     pdf.setTextColor(...COLORS.primary);
//     pdf.text("Cakupan Layanan (Scope of Work)", margin, y);
//     pdf.setDrawColor(...COLORS.slate200);
//     pdf.line(margin, y + 2, pageWidth - margin, y + 2);
//     y += 10;

//     const colWidth = (pageWidth - margin * 2 - 10) / 2;
//     finalFeatures.forEach((feature, idx) => {
//       const col = idx % 2;
//       const row = Math.floor(idx / 2);
//       const itemX = margin + col * (colWidth + 10);
//       const itemY = y + row * 8;

//       // Yellow Checkbox Circle
//       pdf.setFillColor(...COLORS.accent);
//       pdf.circle(itemX + 2, itemY - 1, 1.5, "F");

//       // Checkmark tick
//       pdf.setDrawColor(...COLORS.primary);
//       pdf.setLineWidth(0.4);
//       pdf.line(itemX + 1.2, itemY - 1, itemX + 1.8, itemY - 0.2);
//       pdf.line(itemX + 1.8, itemY - 0.2, itemX + 2.8, itemY - 1.8);

//       pdf.setFont("helvetica", "medium");
//       pdf.setFontSize(8.5);
//       pdf.setTextColor(...COLORS.slate800);
//       pdf.text(feature, itemX + 6, itemY);
//     });

//     y += Math.ceil(finalFeatures.length / 2) * 8 + 8;

//     // Bank info card below Cakupan Layanan
//     const bankCardHeight = 26;
//     pdf.setFillColor(...COLORS.slate50);
//     pdf.setDrawColor(...COLORS.slate200);
//     pdf.roundedRect(
//       margin,
//       y,
//       pageWidth - margin * 2,
//       bankCardHeight,
//       4,
//       4,
//       "FD",
//     );
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(9);
//     pdf.setTextColor(...COLORS.primary);
//     pdf.text("Bank Transfer", margin + 8, y + 8);
//     pdf.setFont("helvetica", "bold");
//     pdf.setFontSize(9);
//     pdf.setTextColor(...COLORS.slate800);
//     pdf.text("No. Rek: 8692630911", margin + 8, y + 16);
//     pdf.setFont("helvetica", "normal");
//     pdf.setFontSize(8.5);
//     pdf.setTextColor(...COLORS.slate600);
//     pdf.text("Atas Nama: LANGIT KARYA INDONESIA", margin + 8, y + 22);
//     y += bankCardHeight + 10;
//   }

//   return pdf.output("blob");
// };
