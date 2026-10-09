"use client";
import { useState } from "react";
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
import Image from "next/image";

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

const initialContent = {
  title: "",
  platform: "Instagram",
  status: "Draft",
  date: null,
  description: "",
};

const platformOptions = [
  { value: "Instagram", label: "Instagram" },
  { value: "Youtube", label: "Youtube" },
  { value: "Blog", label: "Blog" },
  { value: "Twitter", label: "Twitter" },
  { value: "TikTok", label: "TikTok" },
];

const buildDateAndTime = (value) => {
  if (!value) {
    return { date: "", time: "" };
  }

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return { date: "", time: "" };
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

const buildDateFromItem = (item) => {
  if (!item?.date) {
    return null;
  }

  const base = new Date(item.date);

  if (item.time) {
    const [hours = "00", minutes = "00"] = String(item.time).split(":");
    const h = Number(hours);
    const m = Number(minutes);

    if (!Number.isNaN(h)) {
      base.setHours(h);
    }

    if (!Number.isNaN(m)) {
      base.setMinutes(m);
    }

    base.setSeconds(0);
  }

  return base;
};

const ContentPage = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [originRect, setOriginRect] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newContent, setNewContent] = useState(initialContent);

  const { start, end } = useDateRange("this_month");
  const [dateRange, setDateRange] = useState({
    start,
    end,
  });

  const accents = {
    Youtube: "#818cf8",
    Instagram: "#fb7185",
    Blog: "#34d399",
    Twitter: "#38bdf8",
    TikTok: "#f43f5e",
  };

  const startStr = dateRange.start ? formatDateDb(dateRange.start) : null;
  const endStr = dateRange.end ? formatDateDb(dateRange.end) : null;

  const filterParams = {};

  if (filterStatus !== "All") {
    filterParams.status = filterStatus;
  }

  if (startStr && endStr) {
    filterParams.date_between = {
      start: startStr,
      end: endStr,
    };
  }

  const { data, refetch } = useApiFetch(
    ["content-calendar", filterStatus, startStr, endStr],
    "/content-calendar",
    {
      fields:
        "id,user_id,title,platform,type,date,time,status,description,cretime,creby,modtime,modby",
      include: "user",
      sort: "-date",
      paginate: 200,
      page: 1,
      filter: Object.keys(filterParams).length ? filterParams : undefined,
    },
    true,
  );

  const { mutate: createContent, isPending: isSaving } = usePost(
    "/content-calendar",
    {
      invalidate: [["content-calendar"]],
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setEditingItem(null);
        setNewContent(initialContent);
        refetch();
      },
    },
  );

  const { mutate: updateContent, isPending: isUpdating } = usePut(
    (payload) => `/content-calendar/${payload.id}`,
    {
      invalidate: [["content-calendar"]],
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setEditingItem(null);
        setNewContent(initialContent);
        refetch();
      },
    },
  );

  const { mutate: deleteContent, isPending: isDeleting } = useRemove(
    (payload) => `/content-calendar/${payload.id}`,
    {
      invalidate: [["content-calendar"]],
      onSuccess: () => {
        refetch();
      },
    },
  );

  const apiItems = data?.data?.data ?? [];

  const contentItems =
    apiItems.map((item) => {
      const accentColor =
        accents[item.platform] ||
        accents[item.platform?.toString()] ||
        "var(--muted-foreground)";

      let normalizedDate = "";

      if (item.date) {
        const parsed = new Date(item.date);

        if (!Number.isNaN(parsed.getTime())) {
          const year = parsed.getFullYear();
          const month = String(parsed.getMonth() + 1).padStart(2, "0");
          const day = String(parsed.getDate()).padStart(2, "0");
          normalizedDate = `${year}-${month}-${day}`;
        }
      }

      return {
        id: item.id,
        userId: item.user_id,
        userName: item.user?.name ?? null,
        title: item.title,
        description: item.description,
        platform: item.platform,
        type: item.type,
        date: normalizedDate,
        time: item.time,
        status: item.status,
        accentColor,
        links: 0,
        team: item.user?.name ?? "Creator",
      };
    }) ?? [];

  const daysOfWeek = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

  const filteredItems =
    filterStatus === "All"
      ? contentItems
      : contentItems.filter((item) => item.status === filterStatus);

  const today = new Date();
  const baseDate = dateRange.start ? new Date(dateRange.start) : today;
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayDateStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const calendarDays = [];

  for (let i = 1; i <= daysInMonth; i++) {
    const day = i;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    calendarDays.push({
      day,
      date: dateStr,
      items: filteredItems.filter((item) => item.date === dateStr),
    });
  }

  const selectedDayObj = selectedDate
    ? calendarDays.find((d) => d.date === selectedDate)
    : null;

  const handleDayClick = (day, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOriginRect(rect);
    setSelectedDate(day.date);
    setTimeout(() => setIsFullyExpanded(true), 50);
  };

  const handleBack = () => {
    setIsFullyExpanded(false);
    setTimeout(() => {
      setSelectedDate(null);
      setOriginRect(null);
    }, 400);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setNewContent(initialContent);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setNewContent({
      title: item.title || "",
      platform: item.platform || "Instagram",
      status: item.status || "Draft",
      date: buildDateFromItem(item),
      description: item.description || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (item) => {
    if (!item?.id) return;
    const confirmed = window.confirm("Hapus jadwal konten ini dari kalender?");
    if (!confirmed) return;

    deleteContent({ id: item.id });
  };

  const handleAddContent = (e) => {
    e.preventDefault();

    const { date, time } = buildDateAndTime(newContent.date);

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

  const getPlatformIcon = (platform, size = 12) => {
    switch (platform.toLowerCase()) {
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

  const MiniCardPreview = ({ item }) => (
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

  const ElegantCard = ({ item, onEdit, onDelete }) => {
    return (
      <div className="group relative flex flex-col bg-card text-card-foreground rounded-xl overflow-hidden border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full min-h-[240px]">
        {/* Top Accent Line & Shadow Glow */}
        <div
          className="absolute top-0 left-0 w-full h-[3px]"
          style={{ backgroundColor: item.accentColor }}
        ></div>
        <div
          className="absolute top-0 left-0 w-full h-10 opacity-0 group-hover:opacity-10 transition-opacity"
          style={{
            background: `linear-gradient(to bottom, ${item.accentColor}, transparent)`,
          }}
        ></div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar & User Info */}
              <div className="relative">
                <Image
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah`}
                  alt={item.team}
                  height={50}
                  width={50}
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
                  {/* Platform Label (Updated for clarity) */}
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

                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>

                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          item.status === "Published"
                            ? "var(--success)"
                            : item.status === "Scheduled"
                              ? "var(--primary)"
                              : "var(--muted-foreground)",
                      }}
                    ></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              >
                <FileEdit size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item);
                }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Title & Content */}
          <div className="mb-4">
            <h3 className="text-[17px] font-extrabold text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
              {item.title}
            </h3>
            <p className="text-muted-foreground text-[11px] mt-2 line-clamp-3 leading-relaxed">
              {item.description ||
                "Tambahkan deskripsi aset konten Anda di sini untuk memberikan konteks lebih mendalam bagi tim."}
            </p>
          </div>

          {/* Footer Area */}
          <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-primary group/link">
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
                {item.time || "00:00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Calendar Konten"
      desc="Kelola jadwal konten kamu di satu tempat."
    >
      <div className="mt-4 md:mt-6 min-h-[calc(100vh-120px)] bg-background font-sans text-foreground flex flex-col overflow-hidden selection:bg-primary selection:text-primary-foreground rounded-xl border border-border shadow-xl">
        <div className="flex-1 flex flex-col relative p-6 overflow-hidden">
          <div
            className={`mb-6 flex items-center justify-between transition-all duration-500 ${selectedDayObj ? "opacity-0 -translate-y-10 pointer-events-none" : "opacity-100"}`}
          >
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
                    {apiItems?.length ?? 0} Aset Terjadwal
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex bg-muted p-1 rounded-md border border-border">
                  {["All", "Draft", "Scheduled", "Published"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-4 py-2 text-[9px] font-bold rounded-sm transition-all uppercase tracking-widest ${filterStatus === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 text-[10px]">
                <div className="flex items-center gap-2  px-3 py-1 rounded ">
                  <DatePicker
                    value={dateRange.start}
                    onChange={(val) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: val,
                      }))
                    }
                    label={null}
                    placeholder="Mulai"
                    className="text-xs font-bold min-w-[140px]"
                  />

                  <DatePicker
                    value={dateRange.end}
                    onChange={(val) =>
                      setDateRange((prev) => ({
                        ...prev,
                        end: val,
                      }))
                    }
                    label={null}
                    placeholder="Selesai"
                    className="text-xs font-bold min-w-[140px]"
                  />
                </div>
              </div>

              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md text-[10px] font-bold hover:brightness-110 shadow-lg shadow-primary/10 transition-all uppercase tracking-widest"
              >
                <Plus size={14} />
                Tambah Konten
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="h-full grid grid-cols-7 border-t border-l border-border rounded-md overflow-hidden bg-card">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="bg-muted py-3 text-center text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-r border-b border-border"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((dayObj) => {
                const isSelected = selectedDayObj?.date === dayObj.date;
                const isToday = dayObj.date === todayDateStr;

                return (
                  <div
                    key={dayObj.date}
                    onClick={(e) =>
                      !selectedDayObj && handleDayClick(dayObj, e)
                    }
                    className={`
                    relative border-r border-b border-border transition-all duration-300 flex flex-col
                    ${selectedDayObj && !isSelected ? "opacity-5 blur-sm" : "opacity-100"}
                    ${!selectedDayObj ? "bg-card hover:bg-muted cursor-pointer group/cell" : ""}
                  `}
                  >
                    <div className="p-3 flex justify-between items-start">
                      <span
                        className={`text-xs font-bold ${isToday ? "bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full -m-1 shadow-md" : "text-muted-foreground group-hover/cell:text-foreground"}`}
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
            </div>

            {selectedDayObj && (
              <div className="fixed inset-0 z-[150]  flex items-center justify-center p-8 md:p-40 pointer-events-none">
                <div
                  className="bg-card text-card-foreground rounded-lg shadow-2xl border border-border overflow-hidden pointer-events-auto transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
                  style={{
                    position: "fixed",
                    left: isFullyExpanded ? "32px" : `${originRect?.left}px`,
                    top: isFullyExpanded ? "50%" : `${originRect?.top}px`,
                    width: isFullyExpanded ? "380px" : `${originRect?.width}px`,
                    height: isFullyExpanded
                      ? "calc(100% - 64px)"
                      : `${originRect?.height}px`,
                    transform: isFullyExpanded
                      ? "translateY(-50%)"
                      : "translateY(0)",
                    zIndex: 160,
                  }}
                >
                  <div
                    className={`p-10 h-full flex flex-col transition-all duration-500 ${isFullyExpanded ? "opacity-100" : "opacity-0"}`}
                  >
                    <button
                      onClick={handleBack}
                      className="mb-10 w-12 h-12 bg-muted text-muted-foreground hover:text-primary rounded-md flex items-center justify-center transition-all border border-border"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="mt-auto">
                      <span className="text-primary font-bold uppercase tracking-widest text-[9px]">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                      </span>
                      <h2 className="text-[120px] font-bold leading-none -ml-2 tracking-tighter">
                        {selectedDayObj.day.toString().padStart(2, "0")}
                      </h2>
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mb-8">
                        Aktivitas Terjadwal
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/10 transition-transform active:scale-95"
                      >
                        + Buat Konten
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={`
                  fixed right-8 top-8 bottom-8 left-[444px] z-[155] pointer-events-auto
                  transition-all duration-500 delay-100 flex flex-col
                  ${isFullyExpanded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20"}
                `}
                >
                  <div className="bg-background/95 backdrop-blur-xl h-full rounded-lg border border-border p-10 flex flex-col shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                      <div>
                        <h3 className="text-3xl font-bold tracking-tight uppercase">
                          Workspace Agenda
                        </h3>
                        <p className="text-muted-foreground font-bold uppercase tracking-wider text-[9px] mt-1">
                          Daftar produksi aktif untuk hari ini
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-3 bg-muted rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                      {selectedDayObj.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                          <CalendarIcon size={100} strokeWidth={1} />
                          <p className="text-xl font-bold mt-4 uppercase tracking-widest">
                            Kosong
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-6">
                          {selectedDayObj.items.map((item) => (
                            <ElegantCard
                              key={item.id}
                              item={item}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center px-6 py-10 bg-background/80 backdrop-blur-xl">
            <div className="bg-card text-card-foreground w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden">
              <form onSubmit={handleAddContent}>
                <div className="px-10 pt-10 pb-6 flex items-center justify-between bg-muted/60 border-b border-border">
                  <h3 className="text-2xl font-bold uppercase tracking-tight text-foreground">
                    Input Aset Produksi
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="px-10 py-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Judul Konten
                    </label>
                    <input
                      required
                      autoFocus
                      className="w-full px-5 py-3 bg-background border border-input rounded-md focus:border-primary focus:ring-2 focus:ring-ring/20 outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground"
                      placeholder="Tulis judul..."
                      value={newContent.title}
                      onChange={(e) =>
                        setNewContent({ ...newContent, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        Platform
                      </label>
                      <SearchableSelect
                        options={platformOptions}
                        value={newContent.platform}
                        onChange={(val) =>
                          setNewContent({
                            ...newContent,
                            platform: val,
                          })
                        }
                        placeholder="Pilih platform"
                        className="w-full text-xs font-bold uppercase bg-background border border-input text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        Status
                      </label>
                      <SearchableSelect
                        options={[
                          { value: "Draft", label: "Draft" },
                          { value: "Scheduled", label: "Scheduled" },
                          { value: "Published", label: "Published" },
                        ]}
                        value={newContent.status}
                        onChange={(val) =>
                          setNewContent({
                            ...newContent,
                            status: val,
                          })
                        }
                        placeholder="Pilih status"
                        className="w-full text-xs font-bold uppercase bg-background border border-input text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      Tanggal
                    </label>
                    <div className="bg-background border border-input rounded-md px-3 py-2">
                      <DatePicker
                        value={newContent.date}
                        onChange={(val) =>
                          setNewContent({
                            ...newContent,
                            date: val,
                          })
                        }
                        label={null}
                        placeholder="Pilih tanggal & waktu"
                        className="text-xs font-bold"
                        withTime
                      />
                    </div>
                  </div>
                </div>

                <div className="px-10 pb-10 pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving || isUpdating}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-md font-bold text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/15 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving || isUpdating
                      ? "Menyimpan..."
                      : "Simpan Aset Produksi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style
          dangerouslySetInnerHTML={{
            __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in oklch, var(--muted-foreground) 35%, transparent); border-radius: 10px; }
      `,
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default ContentPage;
