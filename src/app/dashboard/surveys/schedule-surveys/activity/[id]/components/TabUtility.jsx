import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Save,
  Plus,
  Trash2,
  FileText,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { toast } from "sonner";

// Memuat library jspdf secara dinamis dengan pengecekan duplikasi
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const normalizeSectionTitle = (title) => {
  if (!title || typeof title !== "string") return "";
  const parts = title.split(". ");
  if (parts.length <= 1) {
    return title.trim().toLowerCase();
  }
  return parts.slice(1).join(". ").trim().toLowerCase();
};

const mergeSections = (baseSections, savedSections) => {
  if (!Array.isArray(baseSections)) return [];
  if (!Array.isArray(savedSections) || savedSections.length === 0) {
    return baseSections;
  }

  const savedMap = new Map();

  savedSections.forEach((section) => {
    if (!section || !section.title) return;
    const key = normalizeSectionTitle(section.title);
    if (!key) return;
    savedMap.set(key, section);
  });

  return baseSections.map((baseSection) => {
    const key = normalizeSectionTitle(baseSection.title);
    const savedSection = savedMap.get(key);

    if (!savedSection || !Array.isArray(savedSection.items)) {
      return baseSection;
    }

    const savedItems = savedSection.items;

    const mergedItems = baseSection.items.map((baseItem) => {
      const matchedItem = savedItems.find(
        (item) => item && item.label === baseItem.label,
      );

      if (!matchedItem) {
        return baseItem;
      }

      return {
        ...baseItem,
        value:
          matchedItem.value === undefined || matchedItem.value === null
            ? ""
            : matchedItem.value,
        note:
          matchedItem.note === undefined || matchedItem.note === null
            ? ""
            : matchedItem.note,
      };
    });

    return {
      ...baseSection,
      items: mergedItems,
    };
  });
};

export const TabUtility = ({ scheduleId, schedule }) => {
  const [isPdfReady, setIsPdfReady] = useState(false);

  useEffect(() => {
    const initPDF = async () => {
      try {
        // 1. Load jsPDF Core dulu
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        );

        // 2. Pastikan global variable tersedia untuk plugin autotable
        if (window.jspdf && window.jspdf.jsPDF) {
          window.jsPDF = window.jspdf.jsPDF;
        }

        // 3. Load AutoTable Plugin setelah jsPDF siap
        await loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js",
        );

        setIsPdfReady(true);
      } catch (e) {
        console.error("Gagal memuat library PDF", e);
      }
    };

    initPDF();
  }, []);

  // --- DATA AWAL DARI CSV ---
  const initialData = useMemo(
    () => [
      {
        id: 1,
        title: "1. DATA LOKASI & LINGKUNGAN",
        items: [
          { label: "Alamat lengkap", type: "text", value: "", note: "" },
          { label: "Share location", type: "text", value: "", note: "" },
          {
            label: "Akses jalan menuju rumah (m)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Lebar jalan terkecil (m)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Tipe jalan",
            type: "radio",
            options: ["Aspal", "Beton", "Paving", "Tanah"],
            value: "",
            note: "",
          },
          {
            label: "Akses mobil material",
            type: "radio",
            options: ["Bisa", "Terbatas", "Tidak bisa"],
            value: "",
            note: "",
          },
          {
            label: "Area parkir pekerja & material",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Akses keluar–masuk pekerja",
            type: "radio",
            options: ["Pintu samping", "Depan", "Belakang"],
            value: "",
            note: "",
          },
          {
            label: "Posisi rumah",
            type: "radio",
            options: ["Hook", "Tengah", "Tusuk sate", "Cul-de-sac"],
            value: "",
            note: "",
          },
          {
            label: "Jenis Tanah",
            type: "radio",
            options: [
              "Tanah Merah (Lempung / Clay)",
              "Tanah Uruk",
              "Tanah Pasir",
              "Tanah Lanau (Silt)",
              "Tanah Berbatu",
              "Tanah Rawa / Bekas Sawah",
              "Tanah Hitam (Humus)",
            ],
            value: "",
            note: "",
          },
          {
            label: "Kedalaman Tanah Keras (M)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Kelembaban & Air Tanah",
            type: "radio",
            options: [
              "Ada rembesan",
              "Air tanah dangkal",
              "Air tanah dalam",
              "Bekas Genangan",
            ],
            value: "",
            note: "",
          },
          {
            label: "Kemiringan Lahan",
            type: "radio",
            options: ["Datar", "Miring ringan", "Miring tajam"],
            value: "",
            note: "",
          },
          {
            label: "Elevasi rumah vs jalan (cm)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Elevasi teras vs halaman (cm)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Riwayat Lahan",
            type: "radio",
            options: [
              "Bekas sawah",
              "Bekas kolam",
              "Bekas bangunan lama",
              "Tanah urug proyek",
            ],
            value: "",
            note: "",
          },
          {
            label: "Vegetasi di Lahan",
            type: "radio",
            options: ["Pohon besar", "Akar tua", "Semak liar"],
            value: "",
            note: "",
          },

          {
            label: "Risiko banjir (tinggi air max)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Kondisi saluran depan rumah",
            type: "radio",
            options: ["Lancar", "Macet"],
            value: "",
            note: "",
          },
          {
            label: "Arah matahari & orientasi rumah",
            type: "text",
            value: "",
            note: "",
          },
          // {
          //   label: "Suhu Kelembaban (°C)",
          //   type: "text",
          //   value: "",
          //   note: "",
          // },
        ],
      },
      {
        id: 2,
        title: "2. KONDISI STRUKTUR & ARSITEKTUR",
        items: [
          {
            label: "Tipe pondasi",
            type: "radio",
            options: ["Batu kali", "Footplate", "Raft", "Tidak terlihat"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi lantai",
            type: "radio",
            options: ["Rata", "Miring", "Retak", "Beda elevasi"],
            value: "",
            note: "",
          },
          {
            label: "Ketinggian floor to floor (m)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Ketinggian floor to ceiling (m)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Kolom & balok terlihat?",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Ada indikasi amblas?",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 3,
        title: "3. KONDISI DINDING",
        items: [
          {
            label: "Material dinding",
            type: "radio",
            options: ["Bata merah", "Batako", "Hebel", "Partisi"],
            value: "",
            note: "",
          },
          {
            label: "Ketebalan dinding (estimasi)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Dinding antar tetangga",
            type: "radio",
            options: ["Single", "Double"],
            value: "",
            note: "",
          },
          {
            label: "Sikuan Dinding",
            type: "radio",
            options: ["Siku", "Tidak siku"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Plester",
            type: "radio",
            options: ["Baik", "Rapuh", "Kopong"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Aci",
            type: "radio",
            options: ["Baik", "Retak", "Bergelombang"],
            value: "",
            note: "",
          },
          {
            label: "Cat Interior",
            type: "radio",
            options: ["Baik", "Mengelupas", "Berkapur", "Jamur", "Lembab"],
            value: "",
            note: "",
          },
          {
            label: "Cat Eksterior",
            type: "radio",
            options: ["Baik", "Mengelupas", "Berkapur", "Jamur", "Lembab"],
            value: "",
            note: "",
          },
          {
            label: "Rising damp (0–60 cm dari lantai)",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Lembab tengah dinding",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Lembab dekat plafon",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Risiko dinding tetangga",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Retak diagonal (Struktur)",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Retak vertikal (Sambungan)",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Retak horizontal (Kelembaban)",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Spider crack (Finishing)",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 4,
        title: "4. PINTU & JENDELA",
        items: [
          {
            label: "Jenis Pintu Utama",
            type: "radio",
            options: ["Kayu", "Panel HPL", "Baja", "Aluminium", "UPVC"],
            value: "",
            note: "",
          },
          {
            label: "Pintu Kamar Mandi",
            type: "radio",
            options: ["PVC", "Aluminium", "Kayu"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Kusen Pintu",
            type: "radio",
            options: ["Baik", "Keropos", "Miring", "Retak", "Rayap", "Lepas"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Daun Pintu",
            type: "radio",
            options: ["Baik", "Melengkung", "Retak", "Lapuk", "Mengembang"],
            value: "",
            note: "",
          },
          {
            label: "Engsel & Handle",
            type: "radio",
            options: ["Baik", "Bunyi", "Kendor", "Turun", "Macet"],
            value: "",
            note: "",
          },
          {
            label: "Gesekan lantai (Pintu)",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Material Jendela",
            type: "radio",
            options: ["Aluminium", "Kayu", "UPVC"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Kusen Jendela",
            type: "radio",
            options: [
              "Baik",
              "Keropos",
              "Sealant getas",
              "Celah udara",
              "Retak",
            ],
            value: "",
            note: "",
          },
          {
            label: "Daun Jendela",
            type: "radio",
            options: ["Rapat", "Tidak rapat", "Sliding macet", "Engsel aus"],
            value: "",
            note: "",
          },
          {
            label: "Kaca",
            type: "radio",
            options: ["Baik", "Retak", "Pecah", "Jamur", "Water stain"],
            value: "",
            note: "",
          },
          {
            label: "Jendela Bocor saat hujan?",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 0,
        title: "5. ASET KENDARAAN",
        items: [
          { label: "Jumlah mobil", type: "text", value: "", note: "" },
          { label: "Jumlah motor", type: "text", value: "", note: "" },
          {
            label: "Jumlah kendaraan lain",
            type: "text",
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 5,
        title: "6. ATAP & PLAFON",
        items: [
          {
            label: "Jenis Atap",
            type: "radio",
            options: ["Genteng beton", "Keramik", "Metal", "Spandek", "Asbes"],
            value: "",
            note: "",
          },
          {
            label: "Masalah Atap",
            type: "radio",
            options: [
              "Tidak ada",
              "Bocor",
              "Genteng geser/pecah",
              "Talang bermasalah",
              "Rembes",
            ],
            value: "",
            note: "",
          },
          {
            label: "Jenis Rangka Atap",
            type: "radio",
            options: ["Kayu", "Baja Ringan"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Rangka",
            type: "radio",
            options: [
              "Baik",
              "Keropos",
              "Rayap",
              "Kurang Kuat",
              "Karat",
              "Lendut",
            ],
            value: "",
            note: "",
          },
          {
            label: "Aluminium foil (Insulasi)",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Ventilasi atap",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Jenis Plafon",
            type: "radio",
            options: ["Gypsum hollow", "Gypsum kayu", "PVC", "Triplek"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Plafon",
            type: "radio",
            options: [
              "Baik",
              "Retak",
              "Melengkung",
              "Noda",
              "Menguning",
              "Tidak rata",
            ],
            value: "",
            note: "",
          },
          { label: "Tinggi plafon (cm)", type: "text", value: "", note: "" },
          {
            label: "Drop ceiling",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 6,
        title: "7. LISTRIK (SNI)",
        items: [
          {
            label: "Kapasitas listrik (VA)",
            type: "text",
            value: "",
            note: "",
          },
          { label: "MCB utama (Ampere)", type: "text", value: "", note: "" },
          { label: "Sub MCB ruangan", type: "text", value: "", note: "" },
          {
            label: "Grounding",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Jenis Kabel",
            type: "radio",
            options: ["NYM", "NYA", "Campuran"],
            value: "",
            note: "",
          },
          {
            label: "Ukuran Kabel Dominan",
            type: "radio",
            options: ["2x1.5", "2x2.5", "3x2.5"],
            value: "",
            note: "",
          },
          {
            label: "Pipa conduit",
            type: "radio",
            options: ["Tertanam", "Exposed"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi kabel",
            type: "radio",
            options: ["Normal", "Getas", "Terbuka"],
            value: "",
            note: "",
          },
          {
            label: "Kerapian Jalur",
            type: "radio",
            options: ["Rapi", "Semrawut"],
            value: "",
            note: "",
          },
          {
            label: "Stop kontak per ruang",
            type: "radio",
            options: ["Cukup", "Kurang"],
            value: "",
            note: "",
          },
          {
            label: "Titik AC & Water Heater",
            type: "radio",
            options: ["Ada/Cukup", "Tidak Ada/Kurang"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 7,
        title: "8. UTILITAS AIR BERSIH",
        items: [
          {
            label: "Sumber Air",
            type: "radio",
            options: ["PAM", "Jetpump", "Sumur bor"],
            value: "",
            note: "",
          },
          {
            label: "Kedalaman sumur (jika ada)",
            type: "text",
            value: "",
            note: "",
          },
          {
            label: "Tandon Air",
            type: "radio",
            options: ["Atas Ada", "Atas Tidak", "Bawah Ada", "Bawah Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Tekanan Air",
            type: "radio",
            options: ["Lemah", "Sedang", "Kuat"],
            value: "",
            note: "",
          },
          {
            label: "Pipa air panas",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Indikasi Kebocoran",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Pipa sesuai SNI",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 8,
        title: "9. AIR KOTOR & PLUMBING",
        items: [
          { label: "Lokasi Septic Tank", type: "text", value: "", note: "" },
          {
            label: "Kondisi Septic Tank",
            type: "radio",
            options: ["Normal", "Penuh", "Rusak", "Tidak ketemu"],
            value: "",
            note: "",
          },
          {
            label: "Material Septic Tank",
            type: "radio",
            options: ["Beton", "HDPE"],
            value: "",
            note: "",
          },
          {
            label: "Kitchen sink flow",
            type: "radio",
            options: ["Lancar", "Macet"],
            value: "",
            note: "",
          },
          {
            label: "Floor drain flow",
            type: "radio",
            options: ["Lancar", "Macet"],
            value: "",
            note: "",
          },
          {
            label: "Pipa WC flow",
            type: "radio",
            options: ["Lancar", "Macet"],
            value: "",
            note: "",
          },
          { label: "Jumlah Bak Kontrol", type: "text", value: "", note: "" },
          {
            label: "Kondisi Bak Kontrol",
            type: "radio",
            options: ["Baik", "Retak", "Sumbatan", "Tutup rusak"],
            value: "",
            note: "",
          },
          {
            label: "Parit depan rumah",
            type: "radio",
            options: ["Lancar", "Macet", "Kering"],
            value: "",
            note: "",
          },
          {
            label: "Air balik saat hujan (Backflow)",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 9,
        title: "10. SISTEM AC",
        items: [
          { label: "Diameter pipa AC", type: "text", value: "", note: "" },
          {
            label: "Kondisi insulasi pipa",
            type: "radio",
            options: ["Baik", "Rusak", "Terbuka"],
            value: "",
            note: "",
          },
          {
            label: "Jalur pipa refrigerant",
            type: "radio",
            options: ["Tanam", "Exposed"],
            value: "",
            note: "",
          },
          {
            label: "Pembuangan (Condensate) ke",
            type: "radio",
            options: ["Floor drain", "Pipa dedicated", "Halaman/Talang"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi pipa drain",
            type: "radio",
            options: ["Lancar", "Macet", "Bocor"],
            value: "",
            note: "",
          },
          {
            label: "Lokasi Outdoor Unit",
            type: "radio",
            options: ["Dinding", "Lantai", "Balkon", "Atap"],
            value: "",
            note: "",
          },
          {
            label: "Kondisi Bracket",
            type: "radio",
            options: ["Baik", "Keropos/Karat"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 10,
        title: "11. KEAMANAN & KENYAMANAN",
        items: [
          {
            label: "CCTV",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          { label: "Jumlah titik CCTV", type: "text", value: "", note: "" },
          {
            label: "Area rawan rayap",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Area rawan lembab",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Sirkulasi/Ventilasi",
            type: "radio",
            options: ["Baik", "Standard", "Buruk"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 11,
        title: "12. TAMAN & HALAMAN",
        items: [
          {
            label: "Elevasi tanah",
            type: "radio",
            options: ["Tinggi", "Rendah"],
            value: "",
            note: "",
          },
          {
            label: "Area tergenang saat hujan",
            type: "radio",
            options: ["Ya", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Sumur resapan",
            type: "radio",
            options: ["Ada", "Tidak"],
            value: "",
            note: "",
          },
          {
            label: "Saluran pembuangan belakang",
            type: "radio",
            options: ["Lancar", "Macet", "Bocor"],
            value: "",
            note: "",
          },
        ],
      },
      {
        id: 12,
        title: "13. CHECKLIST DOKUMENTASI",
        items: [
          { label: "Fasad Rumah", type: "checkbox", value: "Belum", note: "" },
          {
            label: "Semua Ruangan",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Dinding & Retakan",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Pintu & Jendela",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Plafon & Atap",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Titik Listrik & Panel",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Jalur & Pipa AC",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Pipa Plumbing/Sanitasi",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Bak Kontrol & Septic Tank",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
          {
            label: "Area Lembab & Rembesan",
            type: "checkbox",
            value: "Belum",
            note: "",
          },
        ],
      },
    ],
    [],
  );

  // --- STATE ---
  const [info, setInfo] = useState({
    customer: "",
    date: new Date().toISOString().split("T")[0],
    surveyor: "",
  });
  const [sections, setSections] = useState(initialData);
  const [activeTab, setActiveTab] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [flashLoaded, setFlashLoaded] = useState(false);
  const hasHydratedRef = useRef(false);
  const [pdfPath, setPdfPath] = useState(null);

  const scheduleIdNumber =
    typeof scheduleId === "string" ? parseInt(scheduleId, 10) : scheduleId;

  const { data: utilityResponse, isLoading: isLoadingUtility } = useApiFetch(
    scheduleIdNumber ? ["survey-utilities", scheduleIdNumber] : null,
    scheduleIdNumber ? `/survey-utilities/schedule/${scheduleIdNumber}` : null,
  );

  const { mutate: saveUtility, isPending: isSaving } = usePost(
    "/survey-utilities",
    {
      invalidate: scheduleIdNumber
        ? [["survey-utilities", scheduleIdNumber]]
        : undefined,
    },
  );

  const uploadPdfMutation = usePost("/survey-utilities/upload-pdf");

  const clientId = schedule?.client_id || schedule?.client?.id || null;

  const utilityData = utilityResponse?.data?.data;

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!scheduleIdNumber || Number.isNaN(scheduleIdNumber)) return;

    try {
      const saved = localStorage.getItem(`survey_utility_${scheduleIdNumber}`);
      if (!saved) return;
      const parsed = JSON.parse(saved);

      if (parsed.sections && Array.isArray(parsed.sections)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSections(parsed.sections);
      }

      if (parsed.info && typeof parsed.info === "object") {
        setInfo((prev) => ({
          ...prev,
          ...parsed.info,
        }));
      }

      setFlashLoaded(true);
    } catch {
      // ignore
    }
  }, [scheduleIdNumber]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!utilityData || flashLoaded) return;

    const rawData =
      utilityData && typeof utilityData === "object"
        ? utilityData.data || utilityData
        : null;

    if (!rawData || typeof rawData !== "object") return;

    if (
      typeof utilityData.pdf_path === "string" &&
      utilityData.pdf_path.length > 0
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPdfPath(utilityData.pdf_path);
    }

    const savedSections = Array.isArray(rawData.sections)
      ? rawData.sections
      : Array.isArray(rawData)
        ? rawData
        : [];

    const merged = mergeSections(initialData, savedSections);
    if (merged && merged.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSections(merged);
    }

    if (rawData.info && typeof rawData.info === "object") {
      setInfo((prev) => ({
        ...prev,
        ...rawData.info,
      }));
    }
  }, [utilityData, flashLoaded]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!scheduleIdNumber || Number.isNaN(scheduleIdNumber)) return;

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }

    try {
      localStorage.setItem(
        `survey_utility_${scheduleIdNumber}`,
        JSON.stringify({
          info,
          sections,
        }),
      );
    } catch {
      // ignore
    }
  }, [info, sections, scheduleIdNumber]);

  // --- HANDLERS ---
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (sectionId, itemIndex, field, newValue) => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        const newItems = [...sec.items];
        newItems[itemIndex] = { ...newItems[itemIndex], [field]: newValue };
        return { ...sec, items: newItems };
      }
      return sec;
    });
    setSections(updatedSections);
  };

  const handleAddSection = () => {
    const name = prompt("Masukkan Nama Kategori Baru:");
    if (name) {
      const newId =
        sections.length > 0 ? Math.max(...sections.map((s) => s.id)) + 1 : 1;
      setSections([
        ...sections,
        { id: newId, title: name.toUpperCase(), items: [] },
      ]);
      setActiveTab(newId);
    }
  };

  const handleAddItemToSection = (sectionId) => {
    const name = prompt("Masukkan Nama Item Pemeriksaan:");
    if (name) {
      const updatedSections = sections.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            items: [
              ...sec.items,
              { label: name, type: "text", value: "", note: "" },
            ],
          };
        }
        return sec;
      });
      setSections(updatedSections);
    }
  };

  const deleteSection = (id) => {
    if (confirm("Hapus kategori ini?")) {
      setSections(sections.filter((s) => s.id !== id));
      if (activeTab === id) setActiveTab(sections[0]?.id || 0);
    }
  };

  const handleSaveUtility = () => {
    generatePDF(false);
  };

  // --- PDF GENERATION ---
  const generatePDF = async (shouldDownload = true) => {
    if (!window.jspdf) {
      alert("Library PDF belum siap. Tunggu sebentar atau refresh halaman.");
      return;
    }

    const doc = new window.jspdf.jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Langit-Langit ID - SURVEY REPORT", pageWidth / 2, 15, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Divisi Operasional - Utilitas & Kondisi Existing",
      pageWidth / 2,
      20,
      { align: "center" },
    );

    // Info Table
    doc.autoTable({
      startY: 25,
      head: [["Informasi", "Detail"]],
      body: [
        ["Nama Customer", info.customer],
        ["Tanggal Survey", info.date],
        ["Nama Surveyor", info.surveyor],
      ],
      theme: "plain",
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    });

    let lastY = doc.lastAutoTable.finalY + 10;

    // Iterate Sections
    sections.forEach((sec) => {
      // Perkiraan tinggi header section (8) + gap (1) + header tabel (9) + minimal 1 baris (10) = ~28mm
      const minHeightNeeded = 30;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14; // sesuai margin autoTable

      // Check page break: jika sisa space kurang dari yang dibutuhkan
      if (lastY + minHeightNeeded > pageHeight - margin) {
        doc.addPage();
        lastY = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(41, 128, 185); // Blue branding
      doc.setTextColor(255, 255, 255);
      doc.rect(14, lastY, pageWidth - 28, 8, "F");
      doc.text(sec.title, 16, lastY + 6);

      // Table Body
      const tableBody = sec.items.map((item) => {
        let val = item.value;
        if (item.type === "checkbox") {
          val = item.value === "Sudah" ? "SUDAH" : "BELUM";
        }
        return [item.label, val || "-", item.note || "-"];
      });

      doc.autoTable({
        startY: lastY + 9,
        head: [["Item Pemeriksaan", "Kondisi / Nilai", "Keterangan Tambahan"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [220, 220, 220], textColor: 20 },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 50 },
        },
        margin: { left: 14, right: 14 },
        // Pastikan tabel bisa break page otomatis
        pageBreak: "auto",
        // Callback agar jika tabel terpotong ke halaman baru, lastY terupdate dengan benar
        didDrawPage: (data) => {
          // Tidak perlu manual update lastY di sini karena doc.lastAutoTable.finalY akan handle
        },
      });

      lastY = doc.lastAutoTable.finalY + 10;
    });

    // Footer sign
    if (lastY > 240) doc.addPage();
    const signY = lastY + 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Mengetahui,", 20, signY);
    doc.text("Surveyor", 160, signY);

    doc.text(`( ${info.customer || "Customer"} )`, 20, signY + 25);
    doc.text(`( ${info.surveyor || "Petugas"} )`, 160, signY + 25);

    const safeCustomer =
      typeof info.customer === "string" && info.customer.trim().length > 0
        ? info.customer.trim().replace(/\s+/g, "_")
        : "Customer";

    const safeDate =
      typeof info.date === "string" && info.date.trim().length > 0
        ? info.date.trim()
        : new Date().toISOString().split("T")[0];

    const fileName = `Utility_${safeCustomer}_${safeDate}.pdf`;

    try {
      const pdfBlob = doc.output("blob");
      const formData = new FormData();
      formData.append("pdf_file", pdfBlob, fileName);

      if (clientId) {
        formData.append("client_id", String(clientId));
      }

      let uploadedPath = pdfPath || null;

      try {
        const uploadRes = await uploadPdfMutation.mutateAsync(formData);
        uploadedPath =
          uploadRes?.data?.path ||
          uploadRes?.path ||
          uploadRes?.data?.data?.path ||
          null;
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Gagal mengunggah PDF utilitas";
        toast.error(message);
      }

      if (uploadedPath) {
        setPdfPath(uploadedPath);

        if (scheduleIdNumber && !Number.isNaN(scheduleIdNumber)) {
          const payload = {
            schedule_id: scheduleIdNumber,
            data: {
              info,
              sections,
            },
            pdf_path: uploadedPath,
          };

          saveUtility(payload, {
            onSuccess: () => {
              try {
                localStorage.removeItem(`survey_utility_${scheduleIdNumber}`);
              } catch {}
              toast.success("Data utilitas dan PDF berhasil disimpan");
            },
            onError: (err) => {
              const message =
                err?.response?.data?.message ||
                "Gagal menyimpan data utilitas dengan PDF";
              toast.error(message);
            },
          });
        }
      }
    } catch (error) {
      const message =
        error?.message || "Terjadi kesalahan saat memproses PDF utilitas";
      toast.error(message);
    }

    if (shouldDownload) {
      doc.save(fileName);
    }
  };

  const activeSectionData = sections.find((s) => s.id === activeTab);

  return (
    <div className="h-full font-sans text-foreground">
      <div className="pt-5 md:pt-8 pb-16 flex flex-col lg:flex-row gap-6 md:px-4">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border shadow-sm transform transition-transform duration-300 lg:translate-x-0 lg:static lg:shadow-none lg:bg-transparent lg:w-1/4 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="h-full overflow-y-auto p-4 lg:p-0">
            <div className="flex justify-between items-center lg:hidden mb-4">
              <h2 className="font-bold text-sm text-foreground">
                Navigasi Utility
              </h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveTab(sec.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
                    activeTab === sec.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-foreground hover:bg-accent/10"
                  }`}
                >
                  {sec.title.length > 25
                    ? sec.title.substring(0, 25) + "..."
                    : sec.title}
                </button>
              ))}
              <button
                onClick={handleAddSection}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-primary/40 text-primary rounded-lg hover:bg-primary/5 font-medium text-xs"
              >
                <Plus size={16} /> Tambah Kategori
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 w-full">
          <div className="flex items-center justify-between mb-4 lg:hidden w-full max-md:px-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#132534] w-full border border-white/15 text-xs font-semibold text-slate-100"
            >
              <Menu size={16} />
              <span>Navigasi Utility</span>
            </button>
          </div>
          {activeSectionData && (
            <div className="bg-card rounded-md md:rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
                <h2 className="font-bold text-base text-foreground">
                  {activeSectionData.title}
                </h2>
                {activeSectionData.id > 12 && (
                  <button
                    onClick={() => deleteSection(activeSectionData.id)}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="py-6 md:p-6 space-y-6">
                {activeSectionData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-border rounded-lg transition-colors bg-muted/60"
                  >
                    <div className="mb-3">
                      <label className="block font-semibold text-foreground mb-2">
                        {item.label}
                      </label>

                      {item.type === "text" && (
                        <input
                          type="text"
                          className="w-full p-2 rounded bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          placeholder="Isi kondisi..."
                          value={item.value}
                          onChange={(e) =>
                            handleItemChange(
                              activeSectionData.id,
                              idx,
                              "value",
                              e.target.value,
                            )
                          }
                        />
                      )}

                      {item.type === "radio" && (
                        <div className="flex flex-wrap gap-2">
                          {item.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() =>
                                handleItemChange(
                                  activeSectionData.id,
                                  idx,
                                  "value",
                                  opt,
                                )
                              }
                              className={`px-3 py-1.5 text-xs rounded-full border ${
                                item.value === opt
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:bg-accent/10"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {item.type === "checkbox" && (
                        <button
                          onClick={() =>
                            handleItemChange(
                              activeSectionData.id,
                              idx,
                              "value",
                              item.value === "Sudah" ? "Belum" : "Sudah",
                            )
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded border text-xs ${
                            item.value === "Sudah"
                              ? "bg-success/10 border-success/50 text-success-foreground"
                              : "bg-background border-border text-foreground"
                          }`}
                        >
                          {item.value === "Sudah" ? (
                            <CheckSquare size={20} />
                          ) : (
                            <Square size={20} />
                          )}
                          {item.value === "Sudah"
                            ? "Sudah Dicek / Ada"
                            : "Belum Dicek / Tidak Ada"}
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        className="w-full text-sm p-2 border-b border-border bg-transparent focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
                        placeholder="Tambahkan keterangan detail jika ada..."
                        value={item.note}
                        onChange={(e) =>
                          handleItemChange(
                            activeSectionData.id,
                            idx,
                            "note",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => handleAddItemToSection(activeSectionData.id)}
                  className="w-full py-3 border border-dashed border-border text-foreground rounded hover:bg-accent/5 flex items-center justify-center gap-2 text-xs max-md:mx-auto max-md:w-[90%]"
                >
                  <Plus size={16} /> Tambah Item Pemeriksaan Lain di Kategori
                  Ini
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button for PDF */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <button
          onClick={handleSaveUtility}
          disabled={isSaving || isLoadingUtility}
          className="bg-success text-success-foreground hover:bg-success/90 font-bold py-3 px-6 rounded-full shadow-sm flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-60"
        >
          <Save size={20} />{" "}
          {isSaving ? "Menyimpan Data Utility..." : "Simpan Data Utility"}
        </button>
        <button
          onClick={() => generatePDF(true)}
          disabled={!isPdfReady}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 px-6 rounded-full shadow-sm flex items-center gap-2 transition-transform hover:scale-105 disabled:opacity-60"
        >
          <FileText size={20} />{" "}
          {isPdfReady ? "Export PDF Laporan" : "Memuat PDF..."}
        </button>
      </div>
    </div>
  );
};
