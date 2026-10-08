import { jsPDF } from "jspdf";
import { formatDate } from "@/lib/date-format";

const generateInvoice = async (customData = {}) => {
  // ==========================================
  // 1. CENTRALIZED CONFIGURATION & DATA (TIDAK BERUBAH)
  // ==========================================

  // Konfigurasi Statis (Nama Perusahaan, Bank, Harga)
  const CONFIG = {
    company: {
      name: "LANGITLANGIT",
      suffix: ".ID",
      tagline: "Architecture & Interior Design",
    },
    bank: {
      bankName: "Bank BCA",
      accountNo: "8692630911",
      accountName: "LANGIT KARYA INDONESIA",
    },
    pricing: {
      commitmentFee: 2000000,
      feeDescription: "Commitment Fee - Survey & Konsultasi Desain",
    },
    colors: {
      primary: [19, 90, 134], // #135a86
      accent: [254, 216, 24], // #fed818
      slate900: [15, 23, 42],
      slate800: [30, 41, 59],
      slate600: [71, 85, 105],
      slate500: [100, 116, 139],
      slate300: [203, 213, 225],
      slate400: [148, 163, 184],
      slate200: [226, 232, 240],
      slate50: [248, 250, 252],
      white: [255, 255, 255],
    },
  };

  // Helper function untuk format waktu (TIDAK BERUBAH, tapi pastikan datetime yang benar dilempar)
  function formatSurveyTime(datetime) {
    if (!datetime) return null;
    const [date, time] = datetime?.split(" ");
    if (!time) return null;
    const [hours, minutes] = time?.split(":").map(Number);

    const start = new Date();
    start.setHours(hours, minutes, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 2);

    const format = (d) => d.toTimeString().slice(0, 5); // HH:mm

    return `${format(start)} - ${format(end)} WIB`;
  }

  // Data Dinamis (Klien, Jadwal, Invoice Info)
  const today = new Date();
  const defaultDate = today.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const INVOICE_DATA = {
    clientName: customData.client?.name || "Nama Klien",
    clientEmail: customData.client?.email || "email@klien.com",
    address: customData.address || "Alamat Proyek / Lokasi Survey",
    // Gunakan helper formatDate jika ada, jika tidak fallback ke default
    surveyDate: formatDate(customData.date, true) || defaultDate,
    // Gunakan datetime untuk format waktu survey
    surveyTime: formatSurveyTime(customData.datetime) || "10:00 - 12:00 WIB",
    issueDate: customData.issueDate || defaultDate,
    refNumber:
      customData.order?.payment?.payment_code ||
      `INV-SRV/${today.getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
  };

  const invoiceAmount = Number(
    customData.order?.amount ??
      customData.amount ??
      CONFIG.pricing.commitmentFee,
  );

  // Helper function untuk format Rupiah (TIDAK BERUBAH)
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // ==========================================
  // 2. SETUP PDF DOCUMENT (TIDAK BERUBAH)
  // ==========================================

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  const { colors } = CONFIG;

  // Background
  pdf.setFillColor(...colors.white);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Border Top
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, 3, "F");
  y = 15;

  // ==========================================
  // 3. HEADER SECTIONS (DIMODIFIKASI UNTUK GAMBAR)
  // ==========================================

  // --- MULAI PERUBAHAN UNTUK LOGO ---

  // Tentukan path gambar Anda (asumsi served dari root '/public')
  const logoPath = "/langit-langit/langit-langit.png";

  try {
    // 1. Load gambar secara dinamis untuk membaca ukuran aslinya
    const imgElement = new Image();
    imgElement.src = logoPath;

    // Tunggu gambar selesai dimuat ke dalam memori
    await new Promise((resolve, reject) => {
      imgElement.onload = resolve;
      imgElement.onerror = reject;
    });

    // 2. Tentukan lebar logo di PDF (dalam mm)
    const targetWidth = 30; // <-- Ubah angka ini jika logo ingin lebih besar/kecil

    // 3. Hitung tinggi otomatis agar gambar TIDAK GEPENG (menjaga aspek rasio)
    const ratio = imgElement.naturalHeight / imgElement.naturalWidth;
    const targetHeight = targetWidth * ratio;

    const imgX = margin;
    const imgY = y - 13; // Geser sedikit ke atas agar sejajar dengan tulisan INVOICE

    // 4. Tambahkan gambar ke PDF
    pdf.addImage(
      imgElement,
      "PNG",
      imgX,
      imgY,
      targetWidth,
      targetHeight,
      undefined,
      "FAST",
    );

    // 5. Sesuaikan posisi tagline agar selalu dinamis di bawah gambar
    pdf.setFont("helvetica", "medium");
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.slate500);
    pdf.text(CONFIG.company.tagline, margin, imgY + targetHeight - 2); // Jarak 3mm di bawah logo
  } catch (error) {
    // Fallback: Jika gambar gagal dimuat, gunakan teks logo lama
    console.error("Gagal memuat logo image. Menggunakan fallback teks.", error);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(...colors.slate900);
    pdf.text(CONFIG.company.name, margin, y + 5);
    const logoWidth = pdf.getTextWidth(CONFIG.company.name);
    pdf.setTextColor(...colors.primary);
    pdf.text(CONFIG.company.suffix, margin + logoWidth, y + 5);

    pdf.setFont("helvetica", "medium");
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.slate500);
    pdf.text(CONFIG.company.tagline, margin, y + 10);
  }
  // --- SELESAI PERUBAHAN UNTUK LOGO ---

  // Document Title (TIDAK BERUBAH)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...colors.primary);
  pdf.text("INVOICE", pageWidth - margin, y + 4, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.slate500);
  pdf.text("Tagihan Commitment Fee", pageWidth - margin, y + 9, {
    align: "right",
  });

  y += 20;
  pdf.setDrawColor(...colors.slate200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ==========================================
  // 4 - 7. SISA KODE (TIDAK BERUBAH)
  // ==========================================

  // META INFO, INVOICE TABLE, TERMS & CONDITIONS, PAYMENT INFO, SAVE COMMAND
  // Semuanya tetap sama persis seperti kode Anda sebelumnya.

  const metaBoxHeight = 45;
  pdf.setFillColor(...colors.slate50);
  pdf.setDrawColor(...colors.slate200);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, metaBoxHeight, 3, 3, "FD");

  // Kiri: Ditujukan Kepada
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...colors.slate400);
  pdf.text("DITUJUKAN KEPADA:", margin + 8, y + 8);

  pdf.setFontSize(11);
  pdf.setTextColor(...colors.primary);
  pdf.text(INVOICE_DATA.clientName.toUpperCase(), margin + 8, y + 15);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.slate600);
  pdf.text(INVOICE_DATA.clientEmail, margin + 8, y + 21);

  const splitAddress = pdf.splitTextToSize(
    INVOICE_DATA.address,
    (pageWidth - margin * 2) * 0.5 - 10,
  );
  pdf.text(splitAddress, margin + 8, y + 27);

  // Kanan: Detail Dokumen & Jadwal
  const rightColX = pageWidth - margin - 75;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...colors.slate400);
  pdf.text("DETAIL SURVEY & INVOICE:", rightColX, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.slate500);

  const labels = ["No. Invoice", "Tgl. Terbit", "Jadwal Survey", "Waktu"];
  const values = [
    INVOICE_DATA.refNumber,
    INVOICE_DATA.issueDate,
    INVOICE_DATA.surveyDate,
    INVOICE_DATA.surveyTime,
  ];

  labels.forEach((label, idx) => {
    const rowY = y + 15 + idx * 6;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...colors.slate500);
    pdf.text(label, rightColX, rowY);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...colors.slate900);
    pdf.text(`: ${values[idx]}`, rightColX + 22, rowY);
  });

  y += metaBoxHeight + 12;

  // INVOICE TABLE

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.primary);
  pdf.text("Rincian Tagihan", margin, y);
  pdf.setDrawColor(...colors.slate200);
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  // Table Header
  pdf.setFillColor(...colors.slate50);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 10, 2, 2, "F");
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.slate500);
  pdf.text("Deskripsi Layanan", margin + 4, y + 6.5);
  pdf.text("Qty", margin + 110, y + 6.5, { align: "center" });
  pdf.text("Harga", margin + 135, y + 6.5, { align: "right" });
  pdf.text("Total", pageWidth - margin - 4, y + 6.5, { align: "right" });
  y += 10;

  // Table Body
  const invoiceDescription =
    customData.order?.title || CONFIG.pricing.feeDescription;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.primary);
  pdf.text(invoiceDescription, margin + 4, y + 6);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.slate500);
  pdf.text(
    "Biaya kunjungan lokasi, pengukuran awal, dan konsultasi kebutuhan",
    margin + 4,
    y + 11,
  );

  pdf.setFontSize(9);
  pdf.setTextColor(...colors.slate800);
  pdf.text("1 Paket", margin + 108, y + 8, { align: "center" });
  pdf.text(formatRupiah(invoiceAmount), margin + 140, y + 8, {
    align: "right",
  });

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...colors.slate900);
  pdf.text(formatRupiah(invoiceAmount), pageWidth - margin - 4, y + 8, {
    align: "right",
  });
  y += 15;

  // Table Footer / Total
  pdf.setDrawColor(...colors.slate200);
  pdf.line(margin + 100, y, pageWidth - margin, y);
  y += 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.slate600);
  pdf.text("TOTAL PEMBAYARAN", pageWidth - margin - 60, y, {
    align: "right",
  });

  pdf.setFontSize(16);
  pdf.setTextColor(...colors.primary);
  pdf.text(formatRupiah(invoiceAmount), pageWidth - margin - 4, y + 1, {
    align: "right",
  });
  y += 15;

  // TERMS & CONDITIONS (REFUND POLICY)

  const termsBoxHeight = 20;
  pdf.setFillColor(...colors.slate50);
  pdf.setDrawColor(...colors.accent); // Garis pinggir kuning/emas biar unik
  pdf.setLineWidth(0.5);
  pdf.roundedRect(
    margin,
    y,
    pageWidth - margin * 2,
    termsBoxHeight,
    2,
    2,
    "FD",
  );

  // Icon/Badge kecil di dalam box terms
  pdf.setFillColor(...colors.accent);
  pdf.rect(margin, y, 4, termsBoxHeight, "F"); // Aksen kuning di pinggir kiri

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate800);
  pdf.text("Catatan Penting:", margin + 8, y + 7);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.slate600);
  pdf.text(
    "Biaya commitment fee sebesar Rp 1.000.000 ini akan dikembalikan (menjadi pemotongan/diskon biaya total)",
    margin + 8,
    y + 12,
  );
  pdf.text(
    "apabila Anda memutuskan untuk melanjutkan ke tahap pengerjaan desain bersama kami.",
    margin + 8,
    y + 16,
  );

  y += termsBoxHeight + 15;

  // PAYMENT INFO & SIGNATURE

  // Bank Info
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.primary);
  pdf.text("Informasi Pembayaran", margin, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate600);
  pdf.text(`Bank: ${CONFIG.bank.bankName}`, margin, y + 5);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.slate900);
  pdf.text(CONFIG.bank.accountNo, margin, y + 10);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(...colors.slate600);
  pdf.text(`a/n ${CONFIG.bank.accountName}`, margin, y + 15);

  // Perintah Save
  const fileName = `Invoice_Survey_${INVOICE_DATA.clientName.replace(/\s+/g, "_")}.pdf`;
  pdf.save(fileName);

  // Return Blob (TIDAK BERUBAH)
  return pdf.output("blob");
};

export default generateInvoice;
