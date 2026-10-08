"use client";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import React, { useState, useEffect, useRef } from "react";

// --- HELPER: Ubah Gambar Path ke Base64 (Untuk Injeksi Logo PDF) ---
const getBase64Image = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve({
        url: canvas.toDataURL("image/png"),
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => {
      console.warn("Gambar logo gagal dimuat untuk PDF.");
      resolve(null);
    };
    img.src = url;
  });
};

const formatTanggalIndo = (dateString) => {
  if (!dateString) return ".......................";
  const date = new Date(dateString);
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${hari[date.getDay()]}, ${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

// --- Daftar Hari Libur 2026 & Fungsi Hitung 60 Hari Kerja ---
const holidays2026 = [
  "2026-01-01",
  "2026-02-18",
  "2026-03-03",
  "2026-03-19",
  "2026-03-20",
  "2026-03-23",
  "2026-03-24",
  "2026-03-21",
  "2026-03-22",
  "2026-04-03",
  "2026-05-01",
  "2026-05-14",
  "2026-05-27",
  "2026-05-31",
  "2026-06-01",
  "2026-06-16",
  "2026-08-17",
  "2026-08-25",
  "2026-12-25",
];

const calculateEndDate = (startDateStr) => {
  if (!startDateStr) return "";
  let currentDate = new Date(startDateStr);
  let addedDays = 0;

  while (addedDays < 60) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    const isHoliday = holidays2026.includes(dateString);

    if (!isWeekend && !isHoliday) addedDays++;
  }

  const resYear = currentDate.getFullYear();
  const resMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const resDay = String(currentDate.getDate()).padStart(2, "0");
  return `${resYear}-${resMonth}-${resDay}`;
};

const romanMonths = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

export default function GenerateContractDesign() {
  const previewRef = useRef(null);

  const [formData, setFormData] = useState({
    nomorKontrak: "",
    tanggalPerjanjian: "",
    namaKlien: "",
    telpKlien: "",
    alamatKlien: "",
    alamatProyek: "Permata Puri Cibubur Cluster Y Block C-33",
    paket: "Premium",
    tanggalMulai: "",
    tanggalSelesai: "",
    lokasiTtd: "Depok",
    tanggalTtd: "",
    rincianBiaya: [
      { id: 1, pekerjaan: "Paket Premium", nilai: 20000000 },
      {
        id: 2,
        pekerjaan: "Add on Estimasi Rencana Anggaran Biaya (RAB)",
        nilai: 3500000,
      },
      {
        id: 3,
        pekerjaan: "Add on Detail Engineering Desain (DED)",
        nilai: 3500000,
      },
    ],
  });

  useEffect(() => {
    const defaultSeq = Math.floor(100 + Math.random() * 900);
    const currentMonthRoman = romanMonths[new Date().getMonth()];
    setFormData((prev) => ({
      ...prev,
      nomorKontrak: `${defaultSeq}/INV/LKI/${currentMonthRoman}/2026`,
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "tanggalMulai" && value) {
        newData.tanggalSelesai = calculateEndDate(value);
      }
      if (name === "tanggalPerjanjian" && value) {
        const dateObj = new Date(value);
        const monthRoman = romanMonths[dateObj.getMonth()];
        const parts = newData.nomorKontrak.split("/");
        if (parts.length >= 4) {
          parts[3] = monthRoman;
          parts[4] = "2026";
          newData.nomorKontrak = parts.join("/");
        }
      }

      // --- PERBAIKAN BUG: Sinkronisasi Paket dengan Rincian Biaya Pertama ---
      if (name === "paket") {
        let nilaiPaket = 0;
        // Asumsi estimasi harga default per paket (bisa diubah manual oleh user setelahnya)
        if (value === "Premium") nilaiPaket = 20000000;
        else if (value === "Reguler") nilaiPaket = 15000000;
        else if (value === "Sipil") nilaiPaket = 10000000;
        else if (value === "Per Ruangan") nilaiPaket = 4500000;

        if (newData.rincianBiaya.length > 0) {
          newData.rincianBiaya = [...newData.rincianBiaya]; // Clone array
          newData.rincianBiaya[0] = {
            ...newData.rincianBiaya[0],
            pekerjaan: `Paket ${value}`,
            nilai: nilaiPaket,
          };
        } else {
          // Jika tidak ada item sama sekali, tambahkan item pertama
          newData.rincianBiaya = [
            { id: 1, pekerjaan: `Paket ${value}`, nilai: nilaiPaket },
          ];
        }
      }
      // --------------------------------------------------------------------

      return newData;
    });
  };

  const handleBiayaChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rincianBiaya: prev.rincianBiaya.map((item) =>
        item.id === id
          ? { ...item, [field]: field === "nilai" ? Number(value) : value }
          : item,
      ),
    }));
  };

  const tambahBiaya = () => {
    const newId =
      formData.rincianBiaya.length > 0
        ? Math.max(...formData.rincianBiaya.map((i) => i.id)) + 1
        : 1;
    setFormData((prev) => ({
      ...prev,
      rincianBiaya: [
        ...prev.rincianBiaya,
        { id: newId, pekerjaan: "", nilai: 0 },
      ],
    }));
  };

  const hapusBiaya = (id) => {
    setFormData((prev) => ({
      ...prev,
      rincianBiaya: prev.rincianBiaya.filter((item) => item.id !== id),
    }));
  };

  const totalBiaya = formData.rincianBiaya.reduce(
    (sum, item) => sum + (item.nilai || 0),
    0,
  );

  // FUNGSI DOWNLOAD PDF MENGGUNAKAN HTML2PDF
  const handleDownloadPDF = async () => {
    if (typeof window === "undefined" || !previewRef.current) return;

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = previewRef.current;
      const fileName = `Kontrak_Desain_${formData.namaKlien || "Klien"}.pdf`;

      const logoData = await getBase64Image("/langit-langit/langit-langit.png");

      const opt = {
        // Margin: [Atas 55mm, Kanan 20mm, Bawah 45mm, Kiri 20mm]
        margin: [55, 20, 45, 20],
        filename: fileName,
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          letterRendering: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get("pdf")
        .then(function (pdf) {
          const totalPages = pdf.internal.getNumberOfPages();

          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);

            // --- INJEKSI HEADER (KOP SURAT) ---
            if (logoData) {
              const imgH = 32; // Tinggi logo DIPERBESAR
              const imgW = (logoData.width * imgH) / logoData.height;
              pdf.addImage(logoData.url, "PNG", 12, 1, imgW, imgH);
            }

            pdf.setFontSize(9); // Font DIPERKECIL
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "bold");
            // Posisi Y disesuaikan sedikit karena logo lebih besar
            pdf.text("PT. LANGIT KARYA INDONESIA", 20, 31);

            pdf.setFontSize(7); // Font DIPERKECIL
            pdf.setFont("helvetica", "normal");
            pdf.text("Jl. Abdul Gani Raya No 100 Kalibaru Cilodong", 20, 35);
            pdf.text("Depok, Jawa Barat, Indonesia", 20, 39);

            pdf.text("Telp: +6281 2222 50143", 20, 43);
            pdf.text("IG: @langitlangit.id", 65, 43);

            pdf.text("Email: langitlangit.id@gmail.com", 20, 47);
            pdf.text("Web: www.langitlangit.id", 65, 47);

            // Garis Bawah Header ditaruh di y=51 menyesuaikan turunnya teks
            pdf.setLineWidth(0.5);
            pdf.line(20, 51, 190, 51);

            // --- INJEKSI FOOTER (KOTAK TTD KECIL) ---
            const boxY = 260; // Posisi aman di margin bawah
            const boxX = 130;
            const boxW = 60;
            const boxH = 16;

            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.2);
            pdf.rect(boxX, boxY, boxW, boxH);
            pdf.line(boxX + boxW / 2, boxY, boxX + boxW / 2, boxY + boxH);
            pdf.line(boxX, boxY + 5, boxX + boxW, boxY + 5);

            pdf.setFontSize(6.5);
            pdf.text("PIHAK PERTAMA", boxX + 15, boxY + 3.5, {
              align: "center",
            });
            pdf.text("PIHAK KEDUA", boxX + 45, boxY + 3.5, { align: "center" });

            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Halaman ${i} dari ${totalPages}`, 190, 285, {
              align: "right",
            });
          }
        })
        .save();
    } catch (error) {
      console.error("Gagal men-generate PDF:", error);
      alert("Terjadi kesalahan saat memproses PDF.");
    }
  };

  // Helper Best Practice untuk Anti-Terpotong
  const avoidBreak = {
    pageBreakInside: "avoid",
    breakInside: "avoid",
    display: "block",
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-neutral-50">
        {/* LEFT PANEL: FORM INPUT */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-neutral-200 flex flex-col z-10 shrink-0">
          <div className="p-6 bg-[#135a86] text-white">
            <h1 className="text-lg font-semibold tracking-wide flex items-center gap-2">
              Generator Kontrak
            </h1>
            <p className="text-sm text-[#fed818] mt-1 opacity-90">
              Lengkapi form, PDF otomatis menyesuaikan
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <section>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Info Dokumen
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    Nomor Kontrak
                  </label>
                  <input
                    type="text"
                    name="nomorKontrak"
                    value={formData.nomorKontrak}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    Tanggal Perjanjian
                  </label>
                  <input
                    type="date"
                    name="tanggalPerjanjian"
                    value={formData.tanggalPerjanjian}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Data Klien
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="namaKlien"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.namaKlien}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    name="telpKlien"
                    value={formData.telpKlien}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    Alamat Tinggal
                  </label>
                  <textarea
                    name="alamatKlien"
                    value={formData.alamatKlien}
                    onChange={handleChange}
                    rows="2"
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none resize-none"
                  ></textarea>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Data Proyek & Paket
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    Alamat Proyek
                  </label>
                  <textarea
                    name="alamatProyek"
                    value={formData.alamatProyek}
                    onChange={handleChange}
                    rows="2"
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none resize-none"
                  ></textarea>
                </div>
                <div className="p-4 rounded-sm border border-neutral-200 bg-neutral-50/50">
                  <label className="block text-[13px] font-semibold text-[#135a86] mb-3">
                    Pilihan Paket
                  </label>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Premium",
                        value: "Premium",
                        price: "200 rb",
                      },
                      {
                        label: "Reguler",
                        value: "Reguler",
                        price: "150 rb",
                      },
                      {
                        label: "Sipil",
                        value: "Sipil",
                        price: "100 rb",
                      },
                      {
                        label: "Per Ruangan",
                        value: "Per Ruangan",
                        price: "4.5 jt",
                      },
                    ].map((pkt) => (
                      <label
                        key={pkt.value}
                        className="flex items-center space-x-3 cursor-pointer group"
                      >
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="paket"
                            value={pkt.value}
                            checked={formData.paket === pkt.value}
                            onChange={handleChange}
                            className="peer appearance-none w-4 h-4 border border-neutral-400 rounded-full checked:border-[#135a86] checked:border-4 transition-all outline-none"
                          />
                        </div>
                        <span className="text-[13px] text-neutral-700">
                          <strong>
                            {pkt.label}{" "}
                            <span className="text-black/60 text-xs">
                              (RP {pkt.price}/m²)
                            </span>
                          </strong>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                      Tgl Mulai Kerja
                    </label>
                    <input
                      type="date"
                      name="tanggalMulai"
                      value={formData.tanggalMulai}
                      onChange={handleChange}
                      className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                      Tgl Selesai
                    </label>
                    <input
                      type="date"
                      name="tanggalSelesai"
                      value={formData.tanggalSelesai}
                      onChange={handleChange}
                      className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-200 bg-neutral-100 rounded-sm outline-none"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  Rincian Biaya
                </h2>
                <button
                  onClick={tambahBiaya}
                  className="text-xs font-medium text-[#135a86] hover:text-[#0f466b]"
                >
                  + Tambah
                </button>
              </div>
              <div className="space-y-4">
                {formData.rincianBiaya.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white border border-neutral-200 rounded-sm relative"
                  >
                    <button
                      onClick={() => hapusBiaya(item.id)}
                      className="absolute -top-2 -right-2 bg-neutral-100 border border-neutral-200 text-neutral-500 rounded-full w-6 h-6 text-xs hover:bg-red-50 hover:text-red-600"
                    >
                      &times;
                    </button>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nama Pekerjaan"
                        value={item.pekerjaan}
                        onChange={(e) =>
                          handleBiayaChange(
                            item.id,
                            "pekerjaan",
                            e.target.value,
                          )
                        }
                        className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-200 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                      />
                      <div className="flex items-center relative">
                        <span className="absolute left-3 text-sm text-neutral-400 font-medium">
                          Rp
                        </span>
                        <input
                          type="number"
                          placeholder="Nominal"
                          value={item.nilai}
                          onChange={(e) =>
                            handleBiayaChange(item.id, "nilai", e.target.value)
                          }
                          className="w-full text-sm p-2.5 pl-9 text-neutral-900 border border-neutral-200 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between items-center">
                  <span className="text-[13px] font-bold text-neutral-600 uppercase">
                    Total Biaya
                  </span>
                  <span className="text-base font-bold text-[#135a86]">
                    {formatRupiah(totalBiaya)}
                  </span>
                </div>
              </div>
            </section>

            <section className="pb-8">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Tanda Tangan
              </h2>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    name="lokasiTtd"
                    value={formData.lokasiTtd}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[13px] font-medium text-neutral-600 mb-1.5">
                    Tanggal TTD
                  </label>
                  <input
                    type="date"
                    name="tanggalTtd"
                    value={formData.tanggalTtd}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 text-neutral-900 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-[#135a86] outline-none"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="p-6 border-t border-neutral-200 bg-white shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-[#135a86] hover:bg-[#0f466b] text-white font-medium py-3 px-4 rounded-sm shadow-sm transition-all flex justify-center items-center gap-2 outline-none"
            >
              Generate PDF
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div className="flex-1 bg-neutral-200/80 p-8 overflow-y-auto flex justify-center items-start custom-scrollbar">
          <div
            className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] printable-area"
            style={{
              width: "210mm",
              paddingTop: "15mm",
              paddingLeft: "20mm",
              paddingRight: "20mm",
              paddingBottom: "25mm",
              boxSizing: "border-box",
            }}
          >
            {/* VISUAL HEADER KHUSUS DI BROWSER */}
            <div className="mb-6 pb-3 border-b-[1.5px] border-black select-none opacity-80">
              <img
                src="/langit-langit/langit-langit-crop.png"
                alt="Logo"
                className="h-16 mb-2 object-contain"
              />
              <div className="text-[9px] leading-tight text-black">
                <p className="font-bold text-[10px] mb-0.5">
                  PT. LANGIT KARYA INDONESIA
                </p>
                <p>Jl. Abdul Gani Raya No 100 Kalibaru Cilodong</p>
                <p>Depok, Jawa Barat, Indonesia</p>
                <div className="flex gap-8 mt-1">
                  <p>📞 +6281 2222 50143</p>
                  <p>📷 @langitlangit.id</p>
                </div>
                <div className="flex gap-8 mt-0.5">
                  <p>✉️ langitlangit.id@gmail.com</p>
                  <p>🌐 www.langitlangit.id</p>
                </div>
              </div>
            </div>

            {/* TARGET PDF YANG DITANGKAP HTML2CANVAS */}
            <div
              ref={previewRef}
              style={{
                width: "170mm",
                fontSize: "11pt",
                lineHeight: "1.5",
                fontFamily: '"Inter", sans-serif',
                color: "#000000",
              }}
            >
              {/* -------------------- PEMBUKAAN -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "2rem",
                    fontWeight: "bold",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "14pt",
                      textDecoration: "underline",
                      marginBottom: "0.25rem",
                    }}
                  >
                    SURAT PERJANJIAN KONTRAK DESAIN
                  </h1>
                  <p style={{ fontSize: "12pt", margin: 0 }}>
                    NO: {formData.nomorKontrak || "......................."}
                  </p>
                </div>
                <p style={{ textAlign: "justify", marginBottom: "1rem" }}>
                  Perjanjian ini <strong>{`("KONTRAK")`}</strong> dibuat dan
                  ditandatangani pada hari ini{" "}
                  {formData.tanggalPerjanjian
                    ? formatTanggalIndo(formData.tanggalPerjanjian)
                    : "......................."}{" "}
                  oleh:
                </p>
                <table
                  style={{
                    width: "100%",
                    marginBottom: "1rem",
                    borderCollapse: "collapse",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ width: "8rem", verticalAlign: "top" }}>
                        Nama
                      </td>
                      <td style={{ width: "1rem", verticalAlign: "top" }}>:</td>
                      <td>{formData.namaKlien || "......................."}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>No Telp</td>
                      <td style={{ verticalAlign: "top" }}>:</td>
                      <td>{formData.telpKlien || "......................."}</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>Alamat</td>
                      <td style={{ verticalAlign: "top" }}>:</td>
                      <td style={{ textAlign: "justify" }}>
                        {formData.alamatKlien || "......................."}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p
                style={{
                  textAlign: "justify",
                  marginBottom: "1rem",
                  ...avoidBreak,
                }}
              >
                Bertindak sebagai Pemilik Rumah dan selanjutnya dalam Perjanjian
                Kontrak Desain ini disebut <strong>PIHAK PERTAMA</strong>.
              </p>

              <div style={avoidBreak}>
                <table
                  style={{
                    width: "100%",
                    marginBottom: "1rem",
                    borderCollapse: "collapse",
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ width: "8rem", verticalAlign: "top" }}>
                        Nama
                      </td>
                      <td style={{ width: "1rem", verticalAlign: "top" }}>:</td>
                      <td>Deni Ruswandi</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>No. KTP</td>
                      <td style={{ verticalAlign: "top" }}>:</td>
                      <td>3202301802020001</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>No Telp</td>
                      <td style={{ verticalAlign: "top" }}>:</td>
                      <td>081383885071</td>
                    </tr>
                    <tr>
                      <td style={{ verticalAlign: "top" }}>Alamat</td>
                      <td style={{ verticalAlign: "top" }}>:</td>
                      <td>Jl Raya Abdul Gani No.100 Cilodong Depok</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ textAlign: "justify", marginBottom: "1.5rem" }}>
                  Bertindak untuk dan atas nama pimpinan LANGITLANGIT.ID dibawah
                  naungan PT. LANGIT KARYA INDONESIA, yang selanjutnya akan
                  disebut sebagai <strong>PIHAK KEDUA</strong>.
                </p>
              </div>

              <p
                style={{
                  textAlign: "justify",
                  marginBottom: "1.5rem",
                  ...avoidBreak,
                }}
              >
                Selanjutnya <strong>PIHAK PERTAMA</strong> dan{" "}
                <strong>PIHAK KEDUA</strong> secara sendiri-sendiri disebut{" "}
                <strong>{"PIHAK"}</strong> dan secara bersama-sama disebut{" "}
                <strong>{"PARA PIHAK"}</strong>. Dengan ini{" "}
                <strong>PARA PIHAK</strong> telah menyutujui saling mengikat
                diri mengadakan Perjanjian Kontrak Desain untuk melakukan desain
                rumah <strong>PIHAK PERTAMA</strong> yang mempunyai syarat dan
                peraturan sebagai berikut:
              </p>

              {/* -------------------- PASAL 1 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 1<br />
                  DEFINISI
                </div>
                <p style={{ textAlign: "justify", marginBottom: "1.5rem" }}>
                  Setiap istilah yang diawali dengan huruf besar sebagaimana
                  digunakan dalam Perjanjian Kontrak Desain ini memiliki arti
                  sebagaimana ditentukan dalam Perjanjian Kontrak Desain,
                  kecuali apabila secara tegas didefinisikan lain di dalam
                  Perjanjian Kontrak Desain ini.
                </p>
              </div>

              {/* -------------------- PASAL 2 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 2<br />
                  LINGKUP PEKERJAAN
                </div>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    <strong>PIHAK PERTAMA</strong> memberikan tugas kepada{" "}
                    <strong>PIHAK KEDUA</strong> untuk melaksanakan jasa
                    pembuatan desain untuk bangunan rumah milik PIHAK PERTAMA
                    sesuai pilihan paket untuk bangunan rumah milik{" "}
                    <strong>PIHAK PERTAMA</strong> dengan detail alamat rumah:{" "}
                    <strong>
                      {formData.alamatProyek || "......................."}
                    </strong>
                    .
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Pembuatan desain dilakukan berdasarkan standar profesional
                  yang mengacu pada arahan desain <em>(Design Brief)</em> yang
                  disepakati, sesuai dengan Pilihan Paket berikut (Pilih salah
                  satu):
                  <ul
                    style={{
                      listStyleType: "none",
                      paddingLeft: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <li style={{ marginBottom: "0.25rem" }}>
                      <strong>
                        [{formData.paket === "Premium" ? " V " : "   "}]
                      </strong>{" "}
                      Paket Premium (Rp 200.000/m²) : Konsep desain, DED, Gambar
                      kerja interior, 3D Eksterior & Interior, RAB, Video
                      visualisasi, dan Estimasi waktu.
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      <strong>
                        [{formData.paket === "Reguler" ? " V " : "   "}]
                      </strong>{" "}
                      Paket Reguler (Rp 150.000/m²) : Konsep desain, 3D
                      Eksterior & Interior, Video visualisasi.
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      <strong>
                        [{formData.paket === "Sipil" ? " V " : "   "}]
                      </strong>{" "}
                      Paket Sipil (Rp 100.000/m²) : Konsep desain, 3D Eksterior
                      & Sipil.
                    </li>
                    <li>
                      <strong>
                        [{formData.paket === "Per Ruangan" ? " V " : "   "}]
                      </strong>{" "}
                      Paket Design Per Ruangan (Rp 4.500.000/ruang) :
                      Konsultasi, Konsep, Gambar kerja furniture, 3D visual,
                      Rekomendasi material.
                    </li>
                  </ul>
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  <strong>PIHAK KEDUA</strong> akan menyerahkan hasil desain
                  kepada <strong>PIHAK PERTAMA</strong> dalam bentuk dokumen dan
                  file digital sebagai berikut:
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "1.25rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <li style={{ marginBottom: "0.25rem" }}>
                      File PDF berisi usulan layout (<em>Propose Layout</em>)
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      File PDF berisi tampilan 3D non-render (
                      <em>Proposal 3D Non-Render</em>)
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      File hasil finalisasi desain berupa tampilan 3D render (
                      <em>Final 3D Render</em>)
                    </li>
                    <li>
                      Gambar kerja teknis lengkap (DED & RAB) hanya akan
                      diserahkan apabila <strong>PIHAK PERTAMA</strong> memilih
                      / add on termasuk item tersebut
                    </li>
                  </ul>
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  <strong>PIHAK PERTAMA</strong> tidak berhak menerima file
                  mentah dalam bentuk apa pun, termasuk namun tidak terbatas
                  pada file SKP, CAD, DWG, atau format file asli lainnya, yang
                  merupakan hak cipta exclusive <strong>PIHAK KEDUA</strong>.
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Desain 3D yang diserahkan oleh <strong>PIHAK KEDUA</strong>{" "}
                  bersifat ilustratif dan tidak merupakan representasi 100% dari
                  hasil realisasi di lapangan.
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Pelaksanaan pembuatan desain oleh PIHAK KEDUA diukur secara
                  objektif berdasarkan kesesuaian dengan Arahan Desain (
                  <em>Design Brief</em>) yang telah disepakati oleh PARA PIHAK
                  di awal pekerjaan. Perbedaan selera atau preferensi estetika
                  yang bersifat subjektif dari <strong>PIHAK PERTAMA</strong>,
                  yang menyimpang atau berada di luar koridor{" "}
                  <em>Design Brief</em>, tidak dapat dikategorikan sebagai
                  kegagalan pekerjaan (wanprestasi).
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  <strong>PIHAK PERTAMA</strong> memahami dan menyetujui bahwa
                  visualisasi 3D (Render) yang dihasilkan bersifat ilustratif
                  sebagai referensi komunikasi estetika.
                </li>
                <li style={avoidBreak}>
                  Pelaksanaan pembuatan desain oleh <strong>PIHAK KEDUA</strong>{" "}
                  dinyatakan telah selesai, layak, dan memenuhi standar
                  kontraktual apabila telah memenuhi tolok ukur objektif
                  berikut: Kelengkapan Dokumen (<em>Deliverables</em>) dan
                  Kelayakan Teknis (<em>Buildable</em>).
                </li>
              </ol>

              {/* -------------------- PASAL 3 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 3<br />
                  JANGKA WAKTU
                </div>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    Pekerjaan <strong>PIHAK KEDUA</strong> sebagaimana
                    dijelaskan dalam Pasal 2 akan dimulai pada:
                    <br />
                    Hari, Tanggal & Tahun :{" "}
                    <strong>
                      {formData.tanggalMulai
                        ? formatTanggalIndo(formData.tanggalMulai)
                        : "......................."}
                    </strong>
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Pekerjaan tersebut harus diselesaikan dalam jangka waktu
                  maksimal 60 (enam puluh) hari kerja, tidak termasuk hari
                  Sabtu, Minggu, dan hari libur nasional. Pekerjaan diharapkan
                  selesai pada:
                  <br />
                  Hari, Tanggal & Tahun :{" "}
                  <strong>
                    {formData.tanggalSelesai
                      ? formatTanggalIndo(formData.tanggalSelesai)
                      : "......................."}
                  </strong>
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  <strong>PIHAK KEDUA</strong> akan melaksanakan pekerjaan
                  desain 3D rumah dalam beberapa tahapan dengan rincian sebagai
                  berikut:
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "1.25rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <li style={{ marginBottom: "0.25rem" }}>
                      Tahap Layout Rumah
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      Tahap Propose 1 – Desain 3D Non-Render
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      Tahap Propose 2 – Desain 3D Render
                    </li>
                    <li>Penjadwalan Townhall & Finalisasi Desain</li>
                  </ul>
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Apabila <strong>PIHAK PERTAMA</strong> tidak memberikan
                  tanggapan selambat-lambatnya 7 (tujuh) Hari Kerja sejak draf
                  dikirimkan, maka <strong>PIHAK PERTAMA</strong> dianggap telah
                  menyetujui hasil desain tersebut secara mutlak.
                </li>
                <li style={avoidBreak}>
                  Segala bentuk permintaan revisi yang melampaui kuota pada
                  masing-masing tahapan akan dikategorikan sebagai pekerjaan
                  tambah (<em>Addendum</em>) yang dikenakan biaya tambahan.
                </li>
              </ol>

              {/* -------------------- PASAL 4 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 4<br />
                  NILAI KONTRAK & CARA PEMBAYARAN
                </div>
                <p style={{ textAlign: "justify", marginBottom: "0.5rem" }}>
                  Biaya jasa pembuatan perencanaan kerja yang wajib dibayarkan
                  oleh <strong>PIHAK PERTAMA</strong> kepada{" "}
                  <strong>PIHAK KEDUA</strong> adalah sebesar:
                </p>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    border: "1px solid #000000",
                    marginBottom: "1rem",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <th
                        style={{
                          border: "1px solid #000000",
                          padding: "0.5rem",
                          width: "3rem",
                          textAlign: "center",
                        }}
                      >
                        No
                      </th>
                      <th
                        style={{
                          border: "1px solid #000000",
                          padding: "0.5rem",
                        }}
                      >
                        Pekerjaan
                      </th>
                      <th
                        style={{
                          border: "1px solid #000000",
                          padding: "0.5rem",
                          width: "12rem",
                          textAlign: "center",
                        }}
                      >
                        Nilai (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.rincianBiaya.map((item, idx) => (
                      <tr key={item.id}>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "0.5rem",
                            textAlign: "center",
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "0.5rem",
                          }}
                        >
                          {item.pekerjaan || "-"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000000",
                            padding: "0.5rem",
                            textAlign: "right",
                          }}
                        >
                          {formatRupiah(item.nilai)}
                        </td>
                      </tr>
                    ))}
                    <tr
                      style={{ fontWeight: "bold", backgroundColor: "#f3f4f6" }}
                    >
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "0.5rem",
                          textAlign: "right",
                        }}
                        colSpan="2"
                      >
                        Total
                      </td>
                      <td
                        style={{
                          border: "1px solid #000000",
                          padding: "0.5rem",
                          textAlign: "right",
                        }}
                      >
                        {formatRupiah(totalBiaya)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p
                style={{
                  textAlign: "justify",
                  marginBottom: "0.5rem",
                  ...avoidBreak,
                }}
              >
                Berdasarkan kesepakatan <strong>PARA PIHAK</strong>, pembayaran
                dilakukan secara penuh pada saat penandatanganan Perjanjian
                Kontrak Desain ini.
              </p>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  border: "1px dashed #9ca3af",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  ...avoidBreak,
                }}
              >
                <strong>Cara Pembayaran:</strong>
                <br />
                TRANSFER BCA
                <br />
                869.2630.911
                <br />
                a/n Langit Karya Indonesia
                <br />
                <em>
                  Note: Bukti pembayaran dikirimkan ke Admin Langit Langit ID
                  (Lala)
                </em>
              </div>
              <p
                style={{
                  textAlign: "justify",
                  marginBottom: "1.5rem",
                  ...avoidBreak,
                }}
              >
                <strong>Ketentuan Pembayaran:</strong>
                <br />
                Dana ini bersifat final dan tidak dapat dikembalikan (
                <em>non-refundable</em>) apabila terjadi pembatalan sepihak,
                penolakan desain subjektif, atau terputusnya komunikasi lebih
                dari 14 Hari Kalender. Mengacu pada fasilitas{" "}
                {"Design Fee Refundable"}, apabila{" "}
                <strong>PIHAK PERTAMA</strong> melanjutkan tahap pembangunan
                menggunakan jasa Mitra Kontraktor Rekanan LANGITLANGIT.ID, maka
                biaya desain yang telah dibayarkan akan dikembalikan sebagai
                pemotongan langsung terhadap nilai RAB konstruksi.
              </p>

              {/* -------------------- PASAL 5 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 5<br />
                  TANGGUNG JAWAB
                </div>
                <p style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  Tanggung jawab PIHAK PERTAMA
                </p>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    <strong>PIHAK PERTAMA</strong> wajib melaksanakan pembayaran
                    kepada <strong>PIHAK KEDUA</strong> atas nilai Perjanjian
                    Kontrak Desain sesuai dengan ketentuan, tata cara, dan
                    syarat pembayaran yang telah ditetapkan dalam Perjanjian
                    Kontrak Desain ini.
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  <strong>PIHAK PERTAMA</strong> wajib memberikan informasi yang
                  relevan mengenai situasi dan kondisi lokasi pekerjaan kepada{" "}
                  <strong>PIHAK KEDUA</strong>, sepanjang dianggap perlu dan
                  penting bagi kelancaran pelaksanaan pembuatan desain visual
                  tiga dimensi (3D) dan RAB sebagaimana dimaksud dalam
                  Perjanjian Kontrak Desain ini.
                </li>
                <li style={avoidBreak}>
                  <strong>PIHAK PERTAMA</strong> wajib menyerahkan seluruh data
                  dan informasi terkait kondisi eksisting{" "}
                  <em>(existing condition)</em> di lokasi pekerjaan yang
                  dimiliki oleh <strong>PIHAK PERTAMA</strong> kepada{" "}
                  <strong>PIHAK KEDUA</strong> untuk keperluan perencanaan
                  pekerjaan.
                </li>
              </ol>

              <div style={avoidBreak}>
                <p style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                  Tanggung Jawab PIHAK KEDUA
                </p>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    <strong>PIHAK KEDUA</strong> bertanggung jawab sepenuhnya
                    atas pelaksanaan pekerjaan sebagaimana dimaksud dalam
                    Perjanjian Kontrak Desain ini. <strong>PIHAK KEDUA</strong>{" "}
                    tidak diperkenankan mengalihkan seluruh atau sebagian
                    tanggung jawab pekerjaan kepada Pihak Lain atau Pihak Ketiga
                    di luar ketentuan dalam Perjanjian Kontrak Desain ini.
                    Apabila <strong>PIHAK KEDUA</strong> melibatkan penyedia
                    jasa atau subkontraktor tertentu, maka keterlibatan tersebut
                    tetap berada di bawah koordinasi dan tanggung jawab penuh{" "}
                    <strong>PIHAK KEDUA</strong>, tanpa mengurangi tanggung
                    jawab kontraktualnya kepada <strong>PIHAK PERTAMA</strong>.{" "}
                    <strong>PIHAK KEDUA</strong> wajib menyelesaikan pekerjaan
                    sesuai jadwal pelaksanaan yang tercantum dalam Perjanjian
                    Kontrak Desain, kecuali terjadi kondisi{" "}
                    <em>force majeure</em> yang telah disepakati oleh{" "}
                    <strong>PARA PIHAK</strong>.
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Apabila <strong>PIHAK KEDUA</strong> terlambat menyelesaikan
                  pekerjaan melewati tenggat waktu yang telah disepakati tanpa
                  adanya permohonan perpanjangan waktu tertulis yang disetujui{" "}
                  <strong>PIHAK PERTAMA</strong>, maka{" "}
                  <strong>PIHAK KEDUA</strong> akan dikenakan denda
                  keterlambatan sebesar 1/1000 (satu permil atau 0,1%) per hari
                  kalender dari total nilai Perjanjian Kontrak Desain ini.
                  Akumulasi total denda keterlambatan yang dikenakan kepada{" "}
                  <strong>PIHAK KEDUA</strong> tidak melebihi Rp.1.000.000,-
                  (Satu Juta Rupiah) dari nilai total Perjanjian Kontrak Desain.
                  Apabila keterlambatan pekerjaan melampaui 30 (tiga puluh) hari
                  kalender, maka <strong>PIHAK PERTAMA</strong> berhak
                  mengakhiri Perjanjian Kontrak Desain secara sepihak.
                </li>
                <li style={avoidBreak}>
                  Apabila akumulasi keterlambatan telah menyentuh batas maksimal
                  5% (lima persen) tersebut, maka <strong>PIHAK PERTAMA</strong>{" "}
                  memiliki hak absolut untuk mengakhiri Perjanjian secara
                  sepihak. Dalam hal ini, <strong>PIHAK KEDUA</strong> wajib
                  mengembalikan sisa dana secara proporsional sesuai dengan
                  tahapan pekerjaan yang belum diselesaikan.
                </li>
              </ol>

              {/* -------------------- PASAL 6 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 6<br />
                  FORCE MAJEURE / KEADAAN MEMAKSA
                </div>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    Keadaan Memaksa (<em>Force Majeure</em>) dalam Perjanjian
                    Kontrak Desain ini adalah setiap keadaan atau peristiwa luar
                    biasa yang terjadi di luar kendali{" "}
                    <strong>PARA PIHAK</strong>, yang tidak disebabkan secara
                    langsung maupun tidak langsung oleh kelalaian salah satu
                    Pihak, dan yang secara nyata menghalangi salah satu Pihak,
                    baik seluruhnya maupun sebagian, dalam melaksanakan
                    kewajiban atau tanggung jawabnya berdasarkan Perjanjian
                    Kontrak Desain ini.
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Keadaan Memaksa (<em>Force Majeure</em>) termasuk namun tidak
                  terbatas pada peristiwa-peristiwa berikut:
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "1.25rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <li style={{ marginBottom: "0.25rem" }}>
                      Bencana alam, seperti gempa bumi, tanah longsor, banjir,
                      badai, tsunami, angin topan, aktivitas vulkanik, dan
                      kebakaran;
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      Peristiwa sosial atau politik, seperti perang, blokade,
                      pembajakan, kerusuhan, pemogokan massal (yang tidak
                      disebabkan oleh kesalahan atau kelalaian{" "}
                      <strong>PIHAK KEDUA</strong>), pemberontakan, epidemi,
                      atau pandemi yang berdampak langsung terhadap pelaksanaan
                      kewajiban <strong>PARA PIHAK</strong>;
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      Kebijakan atau keputusan pemerintah yang secara langsung
                      menghambat atau menunda pelaksanaan pekerjaan, termasuk
                      pembatasan kegiatan, larangan distribusi material, atau
                      penutupan wilayah proyek.
                    </li>
                    <li>
                      Gangguan teknis besar yang tidak dapat diprediksi
                      sebelumnya dan menyebabkan pekerjaan tidak dapat
                      dilanjutkan.
                    </li>
                  </ul>
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Apabila terjadi Keadaan Memaksa (<em>Force Majeure</em>),
                  Pihak yang terdampak wajib:
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "1.25rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <li style={{ marginBottom: "0.25rem" }}>
                      Memberitahukan secara tertulis kepada Pihak lainnya
                      selambat-lambatnya dalam waktu 7 (tujuh) hari kalender
                      sejak terjadinya peristiwa tersebut; dan
                    </li>
                    <li>
                      Melampirkan dokumen pendukung atau pernyataan resmi dari
                      pejabat/instansi berwenang yang membuktikan bahwa kejadian
                      tersebut tergolong Keadaan Memaksa (<em>Force Majeure</em>
                      ).
                    </li>
                  </ul>
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Apabila terjadi Keadaan Memaksa (<em>Force Majeure</em>)
                  sebagaimana dimaksud di atas, maka:
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "1.25rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <li style={{ marginBottom: "0.25rem" }}>
                      Pelaksanaan kewajiban <strong>PARA PIHAK</strong> akan
                      ditinjau kembali melalui musyawarah untuk mencapai
                      kesepakatan bersama terkait penyesuaian waktu pelaksanaan,
                      jadwal pembayaran, atau perubahan lain yang diperlukan;
                      dan
                    </li>
                    <li>
                      Selama masa Keadaan Memaksa (<em>Force Majeure</em>)
                      berlangsung, <strong>PARA PIHAK</strong> dibebaskan dari
                      tuntutan denda atau ganti rugi yang timbul akibat
                      keterlambatan pelaksanaan kewajiban, sepanjang dapat
                      dibuktikan bahwa keterlambatan tersebut benar-benar
                      diakibatkan oleh Keadaan Memaksa (<em>Force Majeure</em>).
                    </li>
                  </ul>
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Apabila <em>Force Majeure</em> berlangsung lebih dari 30 (tiga
                  puluh) hari kalender berturut-turut,{" "}
                  <strong>PARA PIHAK</strong> sepakat untuk memberikan tambahan
                  waktu 14 (empat belas) hari kalender guna menunggu situasi
                  kembali memungkinkan.
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Jika setelah tambahan waktu sebagaimana dimaksud pada ayat (5)
                  kondisi <em>Force Majeure</em> masih berlangsung dan pekerjaan
                  tidak dapat dilanjutkan, maka <strong>PARA PIHAK</strong>{" "}
                  sepakat untuk mengakhiri Perjanjian Kontrak Desain ini secara
                  baik-baik tanpa tuntutan hukum di kemudian hari.
                </li>
                <li style={avoidBreak}>
                  Dalam hal pengakhiran sebagaimana dimaksud pada ayat (6),{" "}
                  <strong>PIHAK KEDUA</strong> berkewajiban mengembalikan dana
                  kepada <strong>PIHAK PERTAMA</strong> secara proporsional
                  sesuai dengan tahapan pekerjaan desain yang telah
                  diselesaikan, dengan rincian sebagai berikut:
                  <ul
                    style={{
                      listStyleType: "none",
                      paddingLeft: "0.5rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <li style={{ marginBottom: "0.25rem" }}>
                      • Tahap Layout Awal : 20% dari total biaya desain
                    </li>
                    <li style={{ marginBottom: "0.25rem" }}>
                      • Propose 1 (3D Non-Render) : 10% dari total biaya desain
                    </li>
                    <li>
                      • Propose 2 (3D Render Final + 360) : 5% dari total biaya
                      desain
                    </li>
                  </ul>
                </li>
              </ol>

              {/* -------------------- PASAL 7 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 7<br />
                  HAK KEKAYAAN INTELEKTUAL
                </div>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    <strong>Kepemilikan Hak Cipta:</strong> Seluruh hasil karya
                    desain visual tiga dimensi (3D) yang dibuat oleh{" "}
                    <strong>PIHAK KEDUA</strong> dalam rangka pelaksanaan
                    Perjanjian Kontrak Desain ini merupakan karya cipta yang
                    dilindungi oleh ketentuan peraturan perundang-undangan
                    tentang Hak Kekayaan Intelektual (HKI). Hak cipta atas
                    desain tersebut tetap melekat pada{" "}
                    <strong>PIHAK KEDUA</strong> sebagai pencipta.
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  <strong>Hak Penggunaan oleh PIHAK PERTAMA:</strong>{" "}
                  <strong>PIHAK PERTAMA</strong> berhak menggunakan hasil desain
                  tersebut untuk keperluan pembangunan, renovasi, atau
                  implementasi sesuai dengan tujuan proyek sebagaimana
                  disepakati dalam Perjanjian Kontrak Desain ini.
                </li>
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  <strong>Penggunaan untuk Promosi atau Portofolio:</strong>{" "}
                  <strong>PIHAK KEDUA</strong> berhak menggunakan hasil desain
                  untuk kepentingan promosi, publikasi, atau portofolio
                  profesionalnya, sepanjang tidak mengungkapkan informasi
                  rahasia milik <strong>PIHAK PERTAMA</strong> tanpa persetujuan
                  tertulis terlebih dahulu.
                </li>
                <li style={avoidBreak}>
                  <strong>Keterlibatan Pihak Ketiga:</strong>{" "}
                  <strong>PIHAK PERTAMA</strong> diperbolehkan melibatkan{" "}
                  <strong>PIHAK KETIGA</strong> untuk melaksanakan pekerjaan
                  pembangunan berdasarkan hasil desain tersebut. Dalam hal
                  demikian, <strong>PIHAK PERTAMA</strong> wajib mencantumkan
                  nama <strong>PIHAK KEDUA</strong> sebagai pencipta desain,
                  sebagai bentuk penghormatan atas karya dan pengakuan hak
                  cipta.
                </li>
              </ol>

              {/* -------------------- PASAL 8 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 8<br />
                  PENYELESAIAN PERSELISIHAN
                </div>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    Apabila <strong>PARA PIHAK</strong> timbul perselisihan,
                    perbedaan pendapat, atau sengketa yang berkaitan dengan
                    pelaksanaan Perjanjian Kontrak Desain ini, maka{" "}
                    <strong>PARA PIHAK</strong> sepakat untuk menyelesaikannya
                    terlebih dahulu secara musyawarah untuk mufakat.
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={avoidBreak}>
                  Apabila penyelesaian secara musyawarah tidak tercapai dalam
                  waktu yang wajar, maka <strong>PARA PIHAK</strong> sepakat
                  untuk menyelesaikan sengketa tersebut melalui Pengadilan
                  Negeri Kota Depok yang disepakati <strong>PARA PIHAK</strong>.
                </li>
              </ol>

              {/* -------------------- PASAL 9 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 9<br />
                  KORESPONDENSI, KOMUNIKASI, DAN DOKUMENTASI
                </div>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    Seluruh komunikasi, permintaan perubahan pekerjaan,
                    instruksi teknis, maupun instruksi lainnya yang berkaitan
                    dengan pelaksanaan desain wajib disampaikan oleh{" "}
                    <strong>PIHAK PERTAMA</strong> kepada{" "}
                    <strong>PIHAK KEDUA</strong> atau melalui perwakilan resmi
                    yang ditunjuk oleh <strong>PIHAK KEDUA</strong>.
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Waktu efektif komunikasi dan respon tim LANGIT-LANGIT.ID
                  adalah Senin–Jumat pukul 08.00–17.00 WIB.
                </li>
                <li style={avoidBreak}>
                  Pada hari Sabtu, Minggu, atau hari libur nasional,{" "}
                  <strong>PIHAK PERTAMA</strong> diharapkan dapat memaklumi
                  apabila terjadi keterlambatan respon dalam komunikasi.
                </li>
              </ol>

              {/* -------------------- PASAL 10 -------------------- */}
              <div style={avoidBreak}>
                <div
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  PASAL 10
                  <br />
                  LAIN - LAIN
                </div>
                <ol
                  style={{
                    paddingLeft: "1.25rem",
                    marginBottom: "0.5rem",
                    textAlign: "justify",
                  }}
                >
                  <li>
                    Apabila terdapat hal-hal yang belum diatur atau belum
                    ditetapkan dalam Surat Perjanjian Kontrak Desain ini, maka{" "}
                    <strong>PARA PIHAK</strong> sepakat untuk membahas dan
                    menetapkannya kemudian hari melalui kesepakatan tertulis.
                  </li>
                </ol>
              </div>
              <ol
                start="2"
                style={{
                  paddingLeft: "1.25rem",
                  marginBottom: "1.5rem",
                  textAlign: "justify",
                }}
              >
                <li style={{ ...avoidBreak, marginBottom: "0.5rem" }}>
                  Demikian Surat Perjanjian Kontrak Desain ini dibuat dan
                  ditandatangani di atas materai yang cukup oleh{" "}
                  <strong>PARA PIHAK</strong> dalam keadaan sadar, tanpa paksaan
                  dari Pihak mana pun, serta dalam kondisi sehat jasmani dan
                  Rohani.
                </li>
                <li style={avoidBreak}>
                  Surat Perjanjian Kontrak Desain ini bersifat mengikat dan
                  mempunyai kekuatan hukum yang sah bagi{" "}
                  <strong>PARA PIHAK</strong> sejak tanggal penandatanganan.
                </li>
              </ol>

              {/* -------------------- SIGNATURE SECTION -------------------- */}
              <div style={{ ...avoidBreak, width: "100%", marginTop: "3rem" }}>
                <div
                  style={{ float: "left", width: "50%", textAlign: "center" }}
                >
                  <p style={{ margin: 0 }}>Pihak Pertama,</p>
                  <div style={{ height: "100px" }}></div>
                  <p
                    style={{
                      fontWeight: "bold",
                      textDecoration: "underline",
                      margin: 0,
                    }}
                  >
                    {formData.namaKlien || "( Nama Customer )"}
                  </p>
                </div>
                <div
                  style={{ float: "right", width: "50%", textAlign: "center" }}
                >
                  <p style={{ margin: 0 }}>
                    {formData.lokasiTtd || "Depok"},{" "}
                    {formData.tanggalTtd
                      ? formatTanggalIndo(formData.tanggalTtd)
                      : "......................."}
                    <br />
                    Pihak Kedua,
                  </p>
                  <div style={{ height: "80px" }}></div>
                  <p
                    style={{
                      fontWeight: "bold",
                      textDecoration: "underline",
                      margin: 0,
                      paddingBottom: "5px",
                    }}
                  >
                    Deni Ruswandi
                  </p>
                </div>
                <div style={{ clear: "both" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
