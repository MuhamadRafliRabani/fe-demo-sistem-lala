import { formatDate } from "@/lib/date-format";
import { jsPDF } from "jspdf";

// Helper: Mengubah angka menjadi huruf (Terbilang Bahasa Indonesia)
const angkaKeHuruf = (angka) => {
  const huruf = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  let hasil = "";
  if (angka < 12) hasil = huruf[angka];
  else if (angka < 20) hasil = angkaKeHuruf(angka - 10) + " Belas";
  else if (angka < 100)
    hasil =
      angkaKeHuruf(Math.floor(angka / 10)) +
      " Puluh " +
      angkaKeHuruf(angka % 10);
  else if (angka < 200) hasil = "Seratus " + angkaKeHuruf(angka - 100);
  else if (angka < 1000)
    hasil =
      angkaKeHuruf(Math.floor(angka / 100)) +
      " Ratus " +
      angkaKeHuruf(angka % 100);
  else if (angka < 2000) hasil = "Seribu " + angkaKeHuruf(angka - 1000);
  else if (angka < 1000000)
    hasil =
      angkaKeHuruf(Math.floor(angka / 1000)) +
      " Ribu " +
      angkaKeHuruf(angka % 1000);
  else if (angka < 1000000000)
    hasil =
      angkaKeHuruf(Math.floor(angka / 1000000)) +
      " Juta " +
      angkaKeHuruf(angka % 1000000);
  return hasil.trim();
};

export const generateQuitansiSurvey = async (customData = {}) => {
  // ==========================================
  // 1. EXTRACT DATA DARI PAYLOAD REAL ANDA
  // ==========================================
  const client = customData?.client || {};
  const order = customData?.order || {};
  const payment = order?.payment || {};

  const amount = order?.amount || 2000000;
  const rawDate =
    order?.paid_at ||
    order?.cretime ||
    customData?.date ||
    new Date().toISOString();

  const RECEIPT_DATA = {
    receiptNo:
      payment?.payment_code ||
      order?.order_code ||
      `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    date: formatDate(rawDate),
    clientName: client?.name || "Nama Klien",
    clientPhone: client?.phone || "-",
    clientEmail: client?.email || "-",
    clientAddress: customData?.address || "-",
    title: order?.title || "Survey Lapangan & Konsultasi Desain",
    amount: amount,
    amountWords: `${angkaKeHuruf(amount)} Rupiah`,
    status:
      payment?.payment_status === "paid" || order?.status === "paid"
        ? "LUNAS"
        : "PENDING",
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // ==========================================
  // 2. SETUP PDF & COLORS (Modern SaaS Style)
  // ==========================================
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  const colors = {
    primary: [19, 90, 134], // Biru Langitlangit
    accent: [254, 216, 24], // Kuning Langitlangit
    slate900: [15, 23, 42], // Teks Utama (Hitam Elegan)
    slate600: [71, 85, 105], // Teks Sekunder
    slate500: [100, 116, 139], // Label
    slate400: [168, 173, 186], // Teks Terbilang & Catatan
    slate200: [226, 232, 240], // Garis tabel tipis
    slate50: [248, 250, 252], // Background block halus
    successBg: [209, 250, 229], // Background Lunas (Hijau Muda)
    successTxt: [5, 150, 105], // Text Lunas (Hijau Tua)
    white: [255, 255, 255],
  };

  // Background Kertas Murni Putih
  pdf.setFillColor(...colors.white);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // ==========================================
  // 3. HEADER (Color Accents & Logo)
  // ==========================================
  // Baris Biru & Kuning di atas dokumen
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 5, "F");
  pdf.setFillColor(...colors.accent);
  pdf.rect(0, 5, pageWidth, 1.5, "F");

  let y = 25; // Turunkan posisi awal agar lebih lega

  // --- LOGO (Kiri) ---
  const logoPath = "/langit-langit/langit-langit.png";
  try {
    const imgElement = new Image();
    imgElement.src = logoPath;
    await new Promise((resolve, reject) => {
      imgElement.onload = resolve;
      imgElement.onerror = reject;
    });

    const targetWidth = 40;
    const ratio = imgElement.naturalHeight / imgElement.naturalWidth;
    const targetHeight = targetWidth * ratio;
    pdf.addImage(
      imgElement,
      "PNG",
      margin,
      y - 8,
      targetWidth,
      targetHeight,
      undefined,
      "FAST",
    );
  } catch (error) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(...colors.primary);
    pdf.text("LANGITLANGIT.ID", margin, y + 6);
  }

  // --- INFO PERUSAHAAN (Kanan) ---
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(...colors.slate900);
  pdf.text("KWITANSI", pageWidth - margin, y + 6, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.slate500);

  // Beri jarak vertikal antar baris info perusahaan
  y += 14;
  pdf.text("LANGITLANGIT.ID", pageWidth - margin, y, { align: "right" });
  y += 5;
  pdf.text("Architecture & Interior Design", pageWidth - margin, y, {
    align: "right",
  });
  y += 5;
  pdf.text(
    "langitlangit.id@gmail.com | +62 812-2225-0143",
    pageWidth - margin,
    y,
    {
      align: "right",
    },
  );

  y += 30; // Jarak ekstra lapang sebelum informasi penagihan

  // ==========================================
  // 4. BILLING INFO & METADATA (Spasi Diperlebar)
  // ==========================================
  // Simpan posisi Y untuk menyelaraskan bagian kiri dan kanan
  const startBillingY = y;

  // Info Klien (Kiri)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate500);
  pdf.text("TELAH TERIMA DARI:", margin, y);

  y += 8; // Tambah spasi
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...colors.slate900);
  pdf.text(RECEIPT_DATA.clientName, margin, y);

  y += 6; // Tambah spasi
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...colors.slate600);
  pdf.text(RECEIPT_DATA.clientPhone, margin, y);

  y += 6; // Tambah spasi
  pdf.text(RECEIPT_DATA.clientEmail, margin, y);

  y += 6; // Tambah spasi
  const addressSplit = pdf.splitTextToSize(RECEIPT_DATA.clientAddress, 85);
  pdf.text(addressSplit, margin, y);

  // Metadata Kwitansi (Kanan)
  let metaY = startBillingY;
  const labelX = pageWidth - margin - 50;
  const valueX = pageWidth - margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate500);

  pdf.text("NO. REFERENSI:", labelX, metaY, { align: "right" });
  pdf.text("TANGGAL:", labelX, metaY + 10, { align: "right" }); // Spasi meta diperlebar dari 6 ke 10
  pdf.text("STATUS:", labelX, metaY + 20, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...colors.slate900);

  pdf.text(RECEIPT_DATA.receiptNo, valueX, metaY, { align: "right" });
  pdf.text(RECEIPT_DATA.date, valueX, metaY + 10, { align: "right" });

  // Status Lunas (Badge Hijau agar rapi)
  const badgeWidth = 24;
  const badgeHeight = 6;
  const badgeBgY = metaY + 20 - 4.5;
  pdf.setFillColor(
    ...(RECEIPT_DATA.status === "LUNAS" ? colors.successBg : colors.slate200),
  );
  pdf.roundedRect(
    valueX - badgeWidth,
    badgeBgY,
    badgeWidth,
    badgeHeight,
    1,
    1,
    "F",
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(
    ...(RECEIPT_DATA.status === "LUNAS" ? colors.successTxt : colors.slate600),
  );
  pdf.text(RECEIPT_DATA.status, valueX - badgeWidth / 2, metaY + 20, {
    align: "center",
  });

  // Update Y posisi ke bawah area terpanjang (Alamat Kiri)
  y = Math.max(y + addressSplit.length * 5 + 15, metaY + 45);

  // ==========================================
  // 5. TABEL MINIMALIS (Spasi Diperlebar)
  // ==========================================
  // Garis atas tabel
  pdf.setDrawColor(...colors.slate200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 10; // Spasi sebelum header tabel
  // Header Tabel
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate500);
  pdf.text("DESKRIPSI", margin, y);
  pdf.text("QTY", pageWidth - margin - 60, y, { align: "center" });
  pdf.text("HARGA", pageWidth - margin - 30, y, { align: "right" });
  pdf.text("TOTAL", pageWidth - margin, y, { align: "right" });

  y += 6; // Spasi setelah header tabel
  // Garis bawah header tabel
  pdf.setLineWidth(0.1);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 12; // Spasi sebelum baris item pertama
  // Isi Tabel (Item)
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.slate900);

  const titleSplit = pdf.splitTextToSize(RECEIPT_DATA.title, 100);
  pdf.text(titleSplit, margin, y);
  pdf.text("1", pageWidth - margin - 60, y, { align: "center" });
  pdf.text(formatRupiah(RECEIPT_DATA.amount), pageWidth - margin - 30, y, {
    align: "right",
  });
  pdf.text(formatRupiah(RECEIPT_DATA.amount), pageWidth - margin, y, {
    align: "right",
  });

  y += titleSplit.length * 6 + 3; // Spasi extra di bawah item
  // Garis penutup tabel
  pdf.setDrawColor(...colors.slate200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 15; // Jarak sebelum box total

  // ==========================================
  // 6. AREA TOTAL BERWARNA (Branded Element)
  // ==========================================
  const totalBoxWidth = 90;
  const totalBoxX = pageWidth - margin - totalBoxWidth;

  // Subtotal List
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...colors.slate600);
  pdf.text("Subtotal", totalBoxX + 5, y);
  pdf.text(formatRupiah(RECEIPT_DATA.amount), pageWidth - margin, y, {
    align: "right",
  });

  y += 8;
  pdf.text("Pajak / Biaya Lain", totalBoxX + 5, y);
  pdf.text("Rp 0", pageWidth - margin, y, { align: "right" });

  y += 12;

  // BOX TOTAL DIBAYAR (Aksen Biru & Kuning)
  pdf.setFillColor(...colors.primary);
  pdf.roundedRect(totalBoxX, y, totalBoxWidth, 16, 2, 2, "F");

  // Pita Kuning Kecil di sudut kiri Box
  pdf.setFillColor(...colors.accent);
  pdf.rect(totalBoxX, y, 3, 16, "F");

  // Teks Total
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.white);
  pdf.text("TOTAL DIBAYAR", totalBoxX + 10, y + 10.5);

  pdf.setFontSize(12);
  pdf.text(
    formatRupiah(RECEIPT_DATA.amount),
    pageWidth - margin - 5,
    y + 10.5,
    { align: "right" },
  );

  y += 35; // Jarak jauh ke bawah

  // ==========================================
  // 7. FOOTER AREA (Dengan spasi lapang)
  // ==========================================
  const footerHeight = 70;
  const footerY = pageHeight - footerHeight;

  // Background footer
  pdf.setFillColor(...colors.slate50);
  pdf.rect(0, footerY, pageWidth, footerHeight, "F");

  // Isi Footer
  let fY = footerY + 15;

  // Terbilang
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate400);
  pdf.text("TERBILANG", margin, fY);

  fY += 7; // Spasi
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.primary); // Teks terbilang diberi warna biru
  pdf.text(`"${RECEIPT_DATA.amountWords}"`, margin, fY);

  fY += 14; // Spasi

  // Catatan
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate400);
  pdf.text("CATATAN PEMBAYARAN", margin, fY);

  fY += 7; // Spasi
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.slate600);
  pdf.text(
    "Pembayaran dilakukan melalui Bank Transfer (BCA) a/n LANGIT KARYA INDONESIA.",
    margin,
    fY,
  );

  fY += 6; // Spasi
  pdf.text(
    "Kwitansi elektronik ini sah dan di-generate otomatis oleh sistem (tanpa tanda tangan basah).",
    margin,
    fY,
  );

  // Terima kasih di kanan bawah
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate500);
  pdf.text(
    "Terima kasih atas kepercayaan Anda kepada Langitlangit.id",
    pageWidth - margin,
    footerY + 55,
    { align: "right" },
  );

  // ==========================================
  // 8. EXPORT
  // ==========================================
  const safeClientName = RECEIPT_DATA.clientName
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  const fileName = `Kwitansi_${safeClientName}.pdf`;
  pdf.save(fileName);

  return pdf.output("blob");
};
