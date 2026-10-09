"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Plus,
  X,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  Clock,
  FileEdit,
  Calendar as CalendarIcon,
  ArrowLeft,
  Link2,
  Trash2,
  FileText,
  MoreVertical,
  MessagesSquare,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut, useRemove } from "@/hooks/use-api-mutation";
import SearchableSelect from "@/components/searchable-select";
import { DatePicker } from "@/components/date-picker";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useDateRange } from "@/lib/date-range";
import { formatDateDb } from "@/lib/date-format-db";

/* -------------------------------------------------------------------------- */
/*  Konstanta (di luar komponen supaya tidak dibuat ulang setiap render)       */
/* -------------------------------------------------------------------------- */

const MONTH_NAMES = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

const DAYS_OF_WEEK = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

const STATUS_FILTERS = ["All", "Draft", "Scheduled", "Published"];

const STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Scheduled", label: "Scheduled" },
  { value: "Published", label: "Published" },
];

const PLATFORM_OPTIONS = [
  { value: "Instagram", label: "Instagram" },
  { value: "Youtube", label: "Youtube" },
  { value: "Blog", label: "Blog" },
  { value: "Twitter", label: "Twitter" },
  { value: "TikTok", label: "TikTok" },
];

const ACCENTS = {
  Youtube: "#818cf8",
  Instagram: "#fb7185",
  Blog: "#34d399",
  Twitter: "#38bdf8",
  TikTok: "#f43f5e",
};

const FALLBACK_ACCENT = "var(--muted-foreground)";

const API_FIELDS =
  "id,user_id,title,platform,type,date,time,status,description,cretime,creby,modtime,modby";

const initialContent = {
  title: "",
  platform: "Instagram",
  status: "Draft",
  date: null,
  description: "",
};

const SCROLLBAR_CSS = `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: color-mix(in oklch, var(--muted-foreground) 35%, transparent);
    border-radius: 10px;
  }
`;

const INPUT_CLASS =
  "w-full px-5 py-3 bg-background border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-ring/20 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground";

const LABEL_CLASS =
  "text-[9px] font-bold text-muted-foreground uppercase tracking-widest";

/* -------------------------------------------------------------------------- */
/*  Helper murni                                                               */
/* -------------------------------------------------------------------------- */

const pad = (n) => String(n).padStart(2, "0");

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Ubah nilai tanggal apa pun menjadi kunci "YYYY-MM-DD" di zona waktu lokal.
 * - String "YYYY-MM-DD" dipakai apa adanya (tidak di-parse, jadi tidak bisa geser hari).
 * - String ISO / Date lain di-parse lalu dibaca dengan zona waktu lokal.
 */
const toDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string" && DATE_ONLY.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const buildDateAndTime = (value) => {
  if (!value) return { date: "", time: "" };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };

  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

/** Gabungkan item.date + item.time menjadi Date lokal untuk DatePicker. */
const buildDateFromItem = (item) => {
  const key = toDateKey(item?.date);
  if (!key) return null;

  const [year, month, day] = key.split("-").map(Number);
  const [rawH = "0", rawM = "0"] = String(item.time ?? "").split(":");
  const h = Number(rawH);
  const m = Number(rawM);

  return new Date(
    year,
    month - 1,
    day,
    Number.isNaN(h) ? 0 : h,
    Number.isNaN(m) ? 0 : m,
    0,
  );
};

const getPlatformIcon = (platform, size = 12) => {
  switch ((platform ?? "").toLowerCase()) {
    case "instagram":
      return <Instagram size={size} />;
    case "youtube":
      return <Youtube size={size} />;
    case "twitter":
      return <Twitter size={size} />;
    case "blog":
      return <FileText size={size} />;
    default:
      return <Globe size={size} />;
  }
};

const normalizeItem = (item) => ({
  id: item.id,
  userId: item.user_id,
  userName: item.user?.name ?? null,
  title: item.title,
  description: item.description,
  platform: item.platform,
  type: item.type,
  date: toDateKey(item.date),
  time: item.time,
  status: item.status,
  accentColor: ACCENTS[item.platform] ?? FALLBACK_ACCENT,
  links: 0,
  team: item.user?.name ?? "Creator",
});

/* -------------------------------------------------------------------------- */
/*  Komponen kecil (di luar ContentPage: identitas stabil, tidak remount)      */
/* -------------------------------------------------------------------------- */

/** Render ke document.body supaya tidak terkurung stacking context / overflow parent. */
const Portal = ({ children }) => createPortal(children, document.body);

const MiniCardPreview = memo(function MiniCardPreview({ item }) {
  return (
    <div
      className="flex flex-col p-2 mb-1 rounded border border-border/60 transition-all hover:brightness-95 cursor-pointer overflow-hidden"
      style={{
        backgroundColor: `color-mix(in srgb, ${item.accentColor} 8%, transparent)`,
        borderLeft: `3px solid ${item.accentColor}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: item.accentColor }}>
          {getPlatformIcon(item.platform, 10)}
        </span>
        <span className="text-[8px] font-bold text-foreground/80 truncate uppercase tracking-tighter">
          {item.platform}
        </span>
      </div>
      <p className="text-[9px] font-medium text-muted-foreground truncate leading-none">
        {item.title}
      </p>
    </div>
  );
});

const statusDotColor = (status) => {
  if (status === "Published") return "var(--success)";
  if (status === "Scheduled") return "var(--primary)";
  return "var(--muted-foreground)";
};

const ElegantCard = memo(function ElegantCard({
  item,
  onEdit,
  onDelete,
  isDeleting,
}) {
  return (
    <div className="group relative flex flex-col bg-card text-card-foreground rounded-xl overflow-hidden border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full min-h-[240px]">
      {/* Top accent line & glow */}
      <div
        className="absolute top-0 left-0 w-full h-[3px]"
        style={{ backgroundColor: item.accentColor }}
      />
      <div
        className="absolute top-0 left-0 w-full h-10 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${item.accentColor}, transparent)`,
        }}
      />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <Image
                src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(item.team)}`}
                alt={item.team}
                height={50}
                width={50}
                unoptimized
                className="w-10 h-10 rounded-full bg-muted border-2 border-card ring-1 ring-border shadow-sm"
              />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-card text-primary-foreground shadow-sm"
                style={{ backgroundColor: item.accentColor }}
              >
                {getPlatformIcon(item.platform, 8)}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground leading-none mb-1">
                {item.team}
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.accentColor} 6%, transparent)`,
                    borderColor: `color-mix(in srgb, ${item.accentColor} 18%, transparent)`,
                    color: item.accentColor,
                  }}
                >
                  {getPlatformIcon(item.platform, 10)}
                  <span className="text-[8px] uppercase tracking-tight">
                    {item.platform}
                  </span>
                </div>

                <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />

                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusDotColor(item.status) }}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions: tampil saat hover ATAU saat difokus keyboard */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              aria-label={`Edit ${item.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(item);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            >
              <FileEdit size={16} />
            </button>
            <button
              type="button"
              aria-label={`Hapus ${item.title}`}
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(item);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Title & description */}
        <div className="mb-4">
          <h3 className="text-[17px] font-extrabold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h3>
          <p className="text-muted-foreground text-[11px] mt-2 line-clamp-3 leading-relaxed">
            {item.description ||
              "Tambahkan deskripsi aset konten Anda di sini untuk memberikan konteks lebih mendalam bagi tim."}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-1.5 text-primary group/link"
            >
              <div className="p-1 bg-primary/10 rounded-md transition-colors group-hover/link:bg-primary/20">
                <MessagesSquare size={13} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] uppercase tracking-tight">
                Forum Diskusi
              </span>
            </button>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Link2 size={14} strokeWidth={2.5} />
              <span className="text-[11px] font-bold">{item.links}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full border border-border transition-colors group-hover:bg-primary/10 group-hover:border-primary/30">
            <Clock size={12} className="text-primary" />
            <span className="text-[11px] text-foreground tracking-tight">
              {item.time ? String(item.time).slice(0, 5) : "00:00"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                    */
/* -------------------------------------------------------------------------- */

const ContentPage = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newContent, setNewContent] = useState(initialContent);
  const [formError, setFormError] = useState("");

  const { start, end } = useDateRange("this_month");
  const [dateRange, setDateRange] = useState({ start, end });

  /* ------------------------------ Data fetching ----------------------------- */

  const startStr = dateRange.start ? formatDateDb(dateRange.start) : null;
  const endStr = dateRange.end ? formatDateDb(dateRange.end) : null;

  const filterParams = useMemo(() => {
    const params = {};
    if (filterStatus !== "All") params.status = filterStatus;
    if (startStr && endStr) params.date_between = { start: startStr, end: endStr };
    return params;
  }, [filterStatus, startStr, endStr]);

  const { data, refetch } = useApiFetch(
    ["content-calendar", filterStatus, startStr, endStr],
    "/content-calendar",
    {
      fields: API_FIELDS,
      include: "user",
      sort: "-date",
      paginate: 200,
      page: 1,
      filter: Object.keys(filterParams).length ? filterParams : undefined,
    },
    true,
  );

  /* -------------------------------- Mutations ------------------------------- */

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingItem(null);
    setNewContent(initialContent);
    setFormError("");
  }, []);

  const handleSaved = useCallback(() => {
    closeCreateModal();
    refetch();
  }, [closeCreateModal, refetch]);

  const { mutate: createContent, isPending: isSaving } = usePost(
    "/content-calendar",
    { invalidate: [["content-calendar"]], onSuccess: handleSaved },
  );

  const { mutate: updateContent, isPending: isUpdating } = usePut(
    (payload) => `/content-calendar/${payload.id}`,
    { invalidate: [["content-calendar"]], onSuccess: handleSaved },
  );

  const { mutate: deleteContent, isPending: isDeleting } = useRemove(
    (payload) => `/content-calendar/${payload.id}`,
    { invalidate: [["content-calendar"]], onSuccess: () => refetch() },
  );

  /* ----------------------------- Data turunan ------------------------------- */

  const apiItems = useMemo(() => data?.data?.data ?? [], [data]);

  // Kelompokkan per tanggal sekali jalan: O(n), bukan O(hari x n).
  const itemsByDate = useMemo(() => {
    const map = new Map();

    for (const raw of apiItems) {
      const item = normalizeItem(raw);

      // API sudah memfilter status; pengecekan ini hanya pengaman murah.
      if (filterStatus !== "All" && item.status !== filterStatus) continue;
      if (!item.date) continue;

      const bucket = map.get(item.date);
      if (bucket) bucket.push(item);
      else map.set(item.date, [item]);
    }

    return map;
  }, [apiItems, filterStatus]);

  const baseDate = dateRange.start ? new Date(dateRange.start) : new Date();
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();

  const { calendarDays, leadingBlanks, trailingBlanks } = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // getDay(): 0=Minggu. Header kita mulai dari Senin, jadi geser.
    const offset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
      return { day, date, items: itemsByDate.get(date) ?? [] };
    });

    return {
      calendarDays: days,
      leadingBlanks: offset,
      trailingBlanks: (7 - ((offset + daysInMonth) % 7)) % 7,
    };
  }, [currentYear, currentMonth, itemsByDate]);

  const todayKey = toDateKey(new Date());

  const selectedDayObj = useMemo(
    () =>
      selectedDate ? calendarDays.find((d) => d.date === selectedDate) : null,
    [selectedDate, calendarDays],
  );

  /* -------------------------------- Handlers -------------------------------- */

  const handleDayClick = useCallback((dateStr) => setSelectedDate(dateStr), []);
  const handleBack = useCallback(() => setSelectedDate(null), []);

  const handleOpenCreate = useCallback((dateStr) => {
    setEditingItem(null);
    setFormError("");
    setNewContent({
      ...initialContent,
      // Hanya string tanggal yang valid; event klik dari tombol diabaikan.
      date:
        typeof dateStr === "string" && DATE_ONLY.test(dateStr)
          ? new Date(`${dateStr}T09:00:00`)
          : null,
    });
    setIsCreateModalOpen(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setFormError("");
    setNewContent({
      title: item.title || "",
      platform: item.platform || "Instagram",
      status: item.status || "Draft",
      date: buildDateFromItem(item),
      description: item.description || "",
    });
    setIsCreateModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (item) => {
      if (!item?.id) return;
      if (!window.confirm("Hapus jadwal konten ini dari kalender?")) return;
      deleteContent({ id: item.id });
    },
    [deleteContent],
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    const { date, time } = buildDateAndTime(newContent.date);

    if (!date) {
      setFormError("Tanggal dan waktu wajib diisi.");
      return;
    }

    const payload = {
      title: newContent.title,
      platform: newContent.platform,
      status: newContent.status,
      date,
      time,
      description: newContent.description,
    };

    if (editingItem?.id) {
      updateContent({ id: editingItem.id, ...payload });
    } else {
      createContent(payload);
    }
  };

  const setField = (field) => (value) =>
    setNewContent((prev) => ({ ...prev, [field]: value }));

  /* ------------------------ Esc + scroll lock untuk overlay ----------------- */

  const isOverlayOpen = Boolean(selectedDate) || isCreateModalOpen;

  useEffect(() => {
    if (!isOverlayOpen) return;

    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      // Modal create ada di atas agenda, jadi tutup yang paling atas dulu.
      if (isCreateModalOpen) closeCreateModal();
      else setSelectedDate(null);
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOverlayOpen, isCreateModalOpen, closeCreateModal]);

  const isSubmitting = isSaving || isUpdating;

  /* --------------------------------- Render --------------------------------- */

  return (
    <DashboardLayout
      title="Calendar Konten"
      desc="Kelola jadwal konten kamu di satu tempat."
    >
      <div className="mt-4 md:mt-6 min-h-[calc(100vh-120px)] bg-background font-sans text-foreground flex flex-col overflow-hidden selection:bg-primary selection:text-primary-foreground rounded-xl border border-border shadow-xl">
        <div className="flex-1 flex flex-col relative p-6 overflow-hidden">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] rounded border border-primary/20 uppercase">
                    PRO PLAN
                  </span>
                  <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                    {apiItems.length} Aset Terjadwal
                  </p>
                </div>
              </div>

              <div className="flex bg-muted p-1 rounded-md border border-border">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    aria-pressed={filterStatus === s}
                    className={`px-4 py-2 text-[9px] font-bold rounded-sm transition-all uppercase tracking-widest ${
                      filterStatus === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 px-3 py-1 text-[10px]">
                <DatePicker
                  value={dateRange.start}
                  onChange={(val) =>
                    setDateRange((prev) => ({ ...prev, start: val }))
                  }
                  label={null}
                  placeholder="Mulai"
                  className="text-xs font-bold min-w-[140px]"
                />
                <DatePicker
                  value={dateRange.end}
                  onChange={(val) =>
                    setDateRange((prev) => ({ ...prev, end: val }))
                  }
                  label={null}
                  placeholder="Selesai"
                  className="text-xs font-bold min-w-[140px]"
                />
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreate()}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md text-[10px] font-bold hover:brightness-110 shadow-lg shadow-primary/10 transition-all uppercase tracking-widest"
              >
                <Plus size={14} />
                Tambah Konten
              </button>
            </div>
          </div>

          {/* Grid kalender */}
          <div className="flex-1 relative">
            <div className="h-full grid grid-cols-7 border-t border-l border-border rounded-md overflow-hidden bg-card">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="bg-muted py-3 text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-r border-b border-border"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: leadingBlanks }, (_, i) => (
                <div
                  key={`lead-${i}`}
                  aria-hidden="true"
                  className="border-r border-b border-border bg-muted/30"
                />
              ))}

              {calendarDays.map((dayObj) => {
                const isToday = dayObj.date === todayKey;

                return (
                  <div
                    key={dayObj.date}
                    role="button"
                    tabIndex={0}
                    aria-label={`${dayObj.day} ${MONTH_NAMES[currentMonth]} ${currentYear}, ${dayObj.items.length} konten`}
                    onClick={() => handleDayClick(dayObj.date)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleDayClick(dayObj.date);
                      }
                    }}
                    className="group/cell relative flex min-h-[96px] cursor-pointer flex-col border-r border-b border-border bg-card transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <div className="p-3 flex justify-between items-start">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? "bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full -m-1 shadow-md"
                            : "text-muted-foreground group-hover/cell:text-foreground"
                        }`}
                      >
                        {dayObj.day}
                      </span>
                    </div>
                    <div className="px-2 pb-2 flex-1 overflow-hidden">
                      {dayObj.items.slice(0, 3).map((item) => (
                        <MiniCardPreview key={item.id} item={item} />
                      ))}
                      {dayObj.items.length > 3 && (
                        <span className="text-[8px] font-bold text-muted-foreground pl-1">
                          +{dayObj.items.length - 3} lagi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {Array.from({ length: trailingBlanks }, (_, i) => (
                <div
                  key={`trail-${i}`}
                  aria-hidden="true"
                  className="border-r border-b border-border bg-muted/30"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Overlay agenda harian */}
        {selectedDayObj && (
          <Portal>
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm md:p-8"
              onClick={(e) => {
                if (e.target === e.currentTarget) handleBack();
              }}
              role="dialog"
              aria-modal="true"
              aria-label={`Agenda ${selectedDayObj.day} ${MONTH_NAMES[currentMonth]} ${currentYear}`}
            >
              <div className="flex h-full max-h-[900px] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl md:flex-row">
                {/* Sisi kiri: tanggal */}
                <aside className="flex shrink-0 flex-col border-b border-border p-6 md:w-[320px] md:border-r md:border-b-0 md:p-8">
                  <button
                    type="button"
                    onClick={handleBack}
                    aria-label="Kembali"
                    autoFocus
                    className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:text-primary"
                  >
                    <ArrowLeft size={20} />
                  </button>

                  <div className="mt-6 md:mt-auto">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </span>
                    <h2 className="text-7xl font-bold leading-none tracking-tighter md:text-[120px]">
                      {pad(selectedDayObj.day)}
                    </h2>
                    <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Aktivitas Terjadwal
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenCreate(selectedDayObj.date)}
                      className="w-full rounded-md bg-primary py-4 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-xl shadow-primary/10 transition-transform active:scale-95"
                    >
                      + Buat Konten
                    </button>
                  </div>
                </aside>

                {/* Sisi kanan: agenda */}
                <section className="flex min-h-0 flex-1 flex-col bg-background/60 p-6 md:p-10">
                  <div className="mb-6 flex items-center justify-between border-b border-border pb-6">
                    <div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight md:text-3xl">
                        Workspace Agenda
                      </h3>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Daftar produksi aktif untuk hari ini
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Menu"
                      className="rounded-md border border-border bg-muted p-3 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* min-h-0 wajib agar overflow-y-auto benar-benar scroll di dalam flex */}
                  <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
                    {selectedDayObj.items.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-muted-foreground/50">
                        <CalendarIcon size={100} strokeWidth={1} />
                        <p className="mt-4 text-xl font-bold uppercase tracking-widest">
                          Kosong
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6 pb-6 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedDayObj.items.map((item) => (
                          <ElegantCard
                            key={item.id}
                            item={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDeleting={isDeleting}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </Portal>
        )}

        {/* Modal create / edit (z lebih tinggi dari agenda) */}
        {isCreateModalOpen && (
          <Portal>
            <div
              className="fixed inset-0 z-[300] flex items-center justify-center bg-background/80 px-6 py-10 backdrop-blur-xl"
              role="dialog"
              aria-modal="true"
              aria-label={editingItem ? "Edit aset produksi" : "Input aset produksi"}
            >
              <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
                <form onSubmit={handleSubmit}>
                  <div className="px-10 pt-10 pb-6 flex items-center justify-between bg-muted/60 border-b border-border">
                    <h3 className="text-2xl font-bold uppercase tracking-tight text-foreground">
                      {editingItem ? "Edit Aset Produksi" : "Input Aset Produksi"}
                    </h3>
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      aria-label="Tutup"
                      className="text-muted-foreground hover:text-foreground transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="px-10 py-8 space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="content-title" className={LABEL_CLASS}>
                        Judul Konten
                      </label>
                      <input
                        id="content-title"
                        required
                        autoFocus
                        className={INPUT_CLASS}
                        placeholder="Tulis judul..."
                        value={newContent.title}
                        onChange={(e) => setField("title")(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={LABEL_CLASS}>Platform</label>
                        <SearchableSelect
                          options={PLATFORM_OPTIONS}
                          value={newContent.platform}
                          onChange={setField("platform")}
                          placeholder="Pilih platform"
                          className="w-full text-xs font-bold uppercase bg-background border border-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLASS}>Status</label>
                        <SearchableSelect
                          options={STATUS_OPTIONS}
                          value={newContent.status}
                          onChange={setField("status")}
                          placeholder="Pilih status"
                          className="w-full text-xs font-bold uppercase bg-background border border-input text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={LABEL_CLASS}>Tanggal</label>
                      <div className="bg-background border border-input rounded-md px-3 py-2">
                        <DatePicker
                          value={newContent.date}
                          onChange={(val) => {
                            setField("date")(val);
                            setFormError("");
                          }}
                          label={null}
                          placeholder="Pilih tanggal & waktu"
                          className="text-xs font-bold"
                          withTime
                        />
                      </div>
                      {formError && (
                        <p role="alert" className="text-[11px] font-bold text-destructive">
                          {formError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="content-description" className={LABEL_CLASS}>
                        Deskripsi
                      </label>
                      <textarea
                        id="content-description"
                        rows={3}
                        className={`${INPUT_CLASS} resize-none font-medium`}
                        placeholder="Tambahkan konteks untuk tim (opsional)"
                        value={newContent.description}
                        onChange={(e) => setField("description")(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="px-10 pb-10 pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-primary text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/15 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan Aset Produksi"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Portal>
        )}

        <style dangerouslySetInnerHTML={{ __html: SCROLLBAR_CSS }} />
      </div>
    </DashboardLayout>
  );
};

export default ContentPage;
