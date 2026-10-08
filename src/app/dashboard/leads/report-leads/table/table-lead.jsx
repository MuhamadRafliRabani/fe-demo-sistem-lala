"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconPlus } from "@tabler/icons-react";
import {
  ArrowDownUp,
  ArrowUpDown,
  CalendarCheck,
  ChevronDown,
  Copy,
  DownloadIcon,
  FileSpreadsheet,
  MapPin,
  MessageCircle,
  Pencil,
  Ruler,
  Send,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { useAuthStore } from "@/hooks/auth-store";
import { formatDate } from "@/lib/date-format";
import { formatDateDb } from "@/lib/date-format-db";
import { useDateRange } from "@/lib/date-range";
import axiosInstance from "@/lib/axios";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/tables/data-table";
import SearchableSelect from "@/components/searchable-select";
import { FollowUpTemplateModal } from "@/components/leads/follow-up-template-modal";
import LeadFaqPanel from "@/components/leads/lead-faq-panel";
import FilterReportLeads from "../filters/filter-report-leads";
import { formatDailyReportMessage } from "../resume/forma-chat-report";
import { handleExport, handleExportReport } from "../libs/export-excel";
import CreateLeadModal from "../modal/create-leads";
import EditLeadModal from "../modal/edit-leads";
import LeadActions from "./action/lead-action";
import {
  buildingTypes,
  normalizeLeadStatusValue,
  requestTypes,
  sourceLeads,
  statusLeads,
} from "@/data/data";

// Key filter yang BUKAN bagian dari "filter data" (tidak perlu reset halaman)
const PAGINATION_KEYS = ["page", "paginate"];

// Maksimal follow-up per lead
const MAX_FOLLOW_UP = 4;

// Gaya tombol sort di header, disamakan dengan header kolom lain
const SORT_BUTTON =
  "h-auto gap-1 p-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground";

// =============================================================
// HELPER
// =============================================================
// "2026-09-25" -> "Hari ini" / "Kemarin" / "3 hari lalu"
const getRelativeDay = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - target) / 86400000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  if (diff === -1) return "Besok";
  return diff > 0 ? `${diff} hari lalu` : `${Math.abs(diff)} hari lagi`;
};

// "120.00" -> "120"
const formatArea = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// true kalau teks kosong / cuma strip ("-", "------") / cuma spasi
const isBlank = (text) => !text || /^[-\s]*$/.test(String(text));

// "Budi Santoso" -> "BS"
const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
};

const findStatus = (value) =>
  statusLeads.find(
    (s) =>
      normalizeLeadStatusValue(s.value) === normalizeLeadStatusValue(value),
  );

const Dash = () => <span className="text-muted-foreground">-</span>;

// =============================================================
// SEL-SEL TABEL
// =============================================================

// Nomor WhatsApp. Klik = template, Ctrl/Cmd+klik = salin, Shift+klik = buka WA.
function PhoneCell({ lead, onOpenTemplate }) {
  const rawNumber = lead.whatsapp_number?.toString() || "";
  if (!rawNumber) return <Dash />;

  let cleanedNumber = rawNumber.replace(/\D/g, "");
  if (cleanedNumber.startsWith("62"))
    cleanedNumber = cleanedNumber.substring(2);
  while (cleanedNumber.startsWith("0"))
    cleanedNumber = cleanedNumber.substring(1);
  if (cleanedNumber.length > 0) cleanedNumber = "62" + cleanedNumber;

  const rawMessage = `Halo ${lead.name || "Kak"},\n\nKami dari Langit Langit ingin menindaklanjuti pembahasan sebelumnya terkait proyek bangunan Anda.\n\nApakah ada pertanyaan atau hal yang ingin didiskusikan lebih lanjut?\n\nTerima kasih!`;
  const encodedMessage = encodeURIComponent(rawMessage);

  const isIOS =
    typeof navigator !== "undefined" &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const whatsappUrl = isIOS
    ? `https://wa.me/${cleanedNumber}?text=${encodedMessage}`
    : `https://api.whatsapp.com/send?phone=${cleanedNumber}&text=${encodedMessage}`;

  const handleClick = async (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(rawNumber);
        toast.success("Nomor disalin");
      } catch {
        toast.error("Gagal menyalin");
      }
      return;
    }
    if (e.shiftKey) {
      e.preventDefault();
      window.open(
        whatsappUrl,
        isIOS ? "_top" : "_blank",
        isIOS ? "" : "noopener,noreferrer",
      );
      return;
    }
    e.preventDefault();
    onOpenTemplate(lead);
  };

  return (
    <a
      href={whatsappUrl}
      onClick={handleClick}
      title="Klik: template WA • Ctrl+klik: salin nomor • Shift+klik: buka WA"
      className="group inline-flex cursor-pointer select-none items-center gap-1 text-xs text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
    >
      <MessageCircle size={13} className="shrink-0" />
      <span className="tabular-nums underline-offset-4 group-hover:underline">
        {rawNumber}
      </span>
      <Copy
        size={11}
        className="w-0 opacity-0 transition-all duration-150 group-hover:w-3 group-hover:opacity-100"
      />
    </a>
  );
}

// Kolom utama: siapa leadnya. Klik nama = buka detail lengkap.
function ClientCell({ lead, onOpenDetail, onOpenTemplate }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
      >
        {getInitials(lead.name)}
      </div>
      <div className="min-w-0 leading-tight">
        <button
          type="button"
          onClick={() => onOpenDetail(lead.id)}
          title="Lihat detail lead"
          className="block max-w-full truncate text-left text-sm font-semibold underline-offset-4 hover:underline"
        >
          {lead.name || "-"}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          {lead.lead_code && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {lead.lead_code}
            </span>
          )}
          <PhoneCell lead={lead} onOpenTemplate={onOpenTemplate} />
        </div>
      </div>
    </div>
  );
}

// Tanggal + "berapa hari lalu". Info dibuat/diubah oleh siapa ada di tooltip.
function DateCell({ lead }) {
  const relative = getRelativeDay(lead.date);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-fit cursor-default leading-tight">
          <p className="whitespace-nowrap text-sm font-medium">
            {formatDate(lead.date)}
          </p>
          {relative && (
            <p className="mt-0.5 text-xs text-muted-foreground">{relative}</p>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="space-y-1 text-xs">
        <p>
          Dibuat {lead.cretime ? formatDate(lead.cretime, true) : "-"} oleh{" "}
          {lead.creby_name || "-"}
        </p>
        <p>
          Diubah {lead.modtime ? formatDate(lead.modtime, true) : "-"} oleh{" "}
          {lead.modby_name || "-"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Dropdown inline di desktop, teks biasa di card mobile.
function EditableCell({ options, value, onChange, variant = "soft", match }) {
  const same = (a, b) => (match ? match(a) === match(b) : a == b);
  const item = options.find((o) => same(o.value, value));
  return (
    <>
      <div className="hidden md:block">
        <SearchableSelect
          variant={variant}
          options={options}
          value={item?.value}
          placeholder={value || "-"}
          onChange={onChange}
          backgroundColor={item?.color}
          icon={item?.icon ?? null}
        />
      </div>
      <div className="flex items-center justify-end gap-2 text-sm font-medium md:hidden">
        {item?.color && (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
        )}
        {item?.label ?? value ?? "-"}
      </div>
    </>
  );
}

// Jenis kebutuhan, jenis bangunan, dan luas dalam satu kolom
function ProjectCell({ row, onFieldChange }) {
  const lead = row.original;
  const area = formatArea(lead.building_area);
  return (
    <div className="space-y-1">
      <EditableCell
        options={requestTypes}
        value={lead.request_type}
        onChange={(v) => onFieldChange(v, row, "request_type")}
      />
      <div className="flex items-center gap-1 md:gap-0">
        <EditableCell
          options={buildingTypes}
          value={lead.building_type}
          onChange={(v) => onFieldChange(v, row, "building_type")}
        />
      </div>
      <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground md:justify-start md:pl-2">
        <Ruler size={12} />
        {area ? `${area} m²` : "Luas belum diisi"}
      </p>
    </div>
  );
}

function LocationNotesCell({ location, notes }) {
  const hasLocation = !isBlank(location);
  const hasNotes = !isBlank(notes);
  return (
    <div className="w-full space-y-1 whitespace-normal text-left md:w-72">
      <p className="flex items-start gap-1.5 text-sm">
        <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "line-clamp-1",
            hasLocation ? "font-medium" : "text-muted-foreground/70",
          )}
          title={hasLocation ? location : undefined}
        >
          {hasLocation ? location : "Lokasi belum diisi"}
        </span>
      </p>
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <StickyNote className="mt-0.5 size-3.5 shrink-0" />
        <span
          className={cn(
            "line-clamp-2",
            !hasNotes && "text-muted-foreground/70",
          )}
          title={hasNotes ? notes : undefined}
        >
          {hasNotes ? notes : "Tidak ada catatan"}
        </span>
      </p>
    </div>
  );
}

// Bar 4 segmen + angka. 0 = abu, 1-3 = amber, 4 = merah.
function FollowUpCell({ count, onClick }) {
  const tone =
    count >= MAX_FOLLOW_UP
      ? { bar: "bg-red-500", text: "text-red-600 dark:text-red-400" }
      : count > 0
        ? { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" }
        : { bar: "bg-muted-foreground/25", text: "text-muted-foreground" };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Klik untuk atur follow-up"
      className="mx-auto flex flex-col items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted/60"
    >
      <span className="flex gap-1">
        {Array.from({ length: MAX_FOLLOW_UP }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-4 rounded-full",
              i < count ? tone.bar : "bg-muted-foreground/25",
            )}
          />
        ))}
      </span>
      <span className={cn("text-xs font-medium tabular-nums", tone.text)}>
        {count}/{MAX_FOLLOW_UP}
      </span>
    </button>
  );
}

function SurveyCell({ schedule }) {
  if (!schedule) {
    return (
      <span className="text-xs text-muted-foreground">Belum dijadwalkan</span>
    );
  }
  const relative = getRelativeDay(schedule.date);
  return (
    <div className="leading-tight">
      <Badge
        variant="outline"
        className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      >
        <CalendarCheck size={12} />
        {formatDate(schedule.date, true)}
      </Badge>
      {relative && (
        <p className="mt-1 pl-0.5 text-xs text-muted-foreground">{relative}</p>
      )}
    </div>
  );
}

function StatusBadge({ value }) {
  const item = findStatus(value);
  const color = item?.color;
  return (
    <Badge
      variant="outline"
      className="gap-1.5"
      style={
        color
          ? {
              backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
              borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
            }
          : undefined
      }
    >
      {color && (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {item?.label ?? value ?? "-"}
    </Badge>
  );
}

// Titik hijau di kolom nama = lead sudah dijadwalkan survey.
function LeadRowIndicator({ row }) {
  if (!row.original.schedule) return null;
  return (
    <span
      className="flex items-center justify-center"
      title="Sudah dijadwalkan survey"
      aria-label="Sudah dijadwalkan survey"
    >
      <span className="size-2 rounded-full bg-emerald-500" />
    </span>
  );
}

// =============================================================
// FILTER CEPAT BERDASARKAN STATUS
// =============================================================
function StatusChips({ value, onChange }) {
  const toggle = (v) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0">
      <Button
        size="sm"
        variant={value.length === 0 ? "secondary" : "ghost"}
        aria-pressed={value.length === 0}
        onClick={() => onChange([])}
        className="h-8 shrink-0 rounded-full px-3 text-xs"
      >
        Semua
      </Button>
      {statusLeads.map((s) => {
        const active = value.includes(s.value);
        return (
          <Button
            key={s.value}
            size="sm"
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            onClick={() => toggle(s.value)}
            className={cn(
              "h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs",
              active && "ring-1 ring-border",
            )}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </Button>
        );
      })}
    </div>
  );
}

// =============================================================
// PANEL DETAIL (menggantikan row-expansion yang dimatikan)
// =============================================================
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  onEdit,
  onOpenTemplate,
  onOpenFollowUp,
}) {
  const hasFaqs = Array.isArray(lead?.faqs) && lead.faqs.length > 0;
  const hasUnansweredFaq =
    hasFaqs && lead.faqs.some((faq) => faq?.pivot?.is_answered !== true);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {lead && (
          <>
            <SheetHeader className="border-b">
              <div className="flex items-center gap-2 pr-6">
                <SheetTitle className="truncate">{lead.name}</SheetTitle>
                <StatusBadge value={lead.status} />
              </div>
              <SheetDescription className="font-mono text-xs">
                {lead.lead_code || "Tanpa kode"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 p-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="WhatsApp">
                  <PhoneCell lead={lead} onOpenTemplate={onOpenTemplate} />
                </Field>
                <Field label="Tanggal masuk">
                  {lead.date ? formatDate(lead.date) : <Dash />}
                </Field>
                <Field label="Kebutuhan">{lead.request_type || <Dash />}</Field>
                <Field label="Sumber">{lead.source || <Dash />}</Field>
                <Field label="Bangunan">{lead.building_type || <Dash />}</Field>
                <Field label="Luas">
                  {formatArea(lead.building_area) ? (
                    `${formatArea(lead.building_area)} m²`
                  ) : (
                    <Dash />
                  )}
                </Field>
              </div>

              <Field label="Lokasi">
                {isBlank(lead.location) ? (
                  <span className="text-muted-foreground">Belum diisi</span>
                ) : (
                  lead.location
                )}
              </Field>

              <Field label="Catatan">
                {isBlank(lead.notes) ? (
                  <span className="text-muted-foreground">
                    Tidak ada catatan
                  </span>
                ) : (
                  <p className="whitespace-pre-wrap">{lead.notes}</p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Follow-up">
                  <div className="-ml-2">
                    <FollowUpCell
                      count={(lead.follow_up_count ?? 0) || 0}
                      onClick={() => onOpenFollowUp(lead)}
                    />
                  </div>
                </Field>
                <Field label="Survey">
                  <SurveyCell schedule={lead.schedule} />
                </Field>
              </div>

              <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  Dibuat {lead.cretime ? formatDate(lead.cretime, true) : "-"}{" "}
                  oleh {lead.creby_name || "-"}
                </p>
                <p>
                  Diubah {lead.modtime ? formatDate(lead.modtime, true) : "-"}{" "}
                  oleh {lead.modby_name || "-"}
                </p>
              </div>

              {hasFaqs && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">FAQ</p>
                    {hasUnansweredFaq && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      >
                        Ada yang belum dijawab
                      </Badge>
                    )}
                  </div>
                  <LeadFaqPanel lead={lead} />
                </div>
              )}

              <div className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onEdit(lead)}
                >
                  <Pencil className="mr-2 size-4" /> Edit lead
                </Button>
                <Button className="flex-1" onClick={() => onOpenTemplate(lead)}>
                  <Send className="mr-2 size-4" /> Follow-up WA
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// =============================================================
// KOMPONEN UTAMA
// =============================================================
const TableLead = () => {
  const { start, end } = useDateRange("this_month");

  // State Manual Follow Up
  const [followUpModalLead, setFollowUpModalLead] = useState(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpValue, setFollowUpValue] = useState(0);
  const [followUpNote, setFollowUpNote] = useState("");

  // Modal create & edit lead
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);

  // Modal template WhatsApp
  const [templateLead, setTemplateLead] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Panel detail (simpan ID saja, datanya diambil dari list supaya selalu fresh)
  const [detailLeadId, setDetailLeadId] = useState(null);

  const { user } = useAuthStore();
  const canExport = Number(user?.role_id) === 1;

  // Desktop: nomor HP sudah ada di bawah nama, jadi kolom Phone disembunyikan.
  // Mobile: kolom Phone tetap tampil di isi card.
  const [columnVisibility, setColumnVisibility] = useState({
    whatsapp_number: false,
  });

  useEffect(() => {
    if (window.innerWidth < 768) {
      setColumnVisibility((prev) => ({ ...prev, whatsapp_number: true }));
    }
  }, []);

  // -----------------------------
  // STATE API & FILTERING
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
    name: "",
    status: [],
    source: [],
    request_type: [],
    whatsapp_number: "",
    building_type: [],
    start_date: formatDateDb(start),
    end_date: formatDateDb(end),
    modtime_start: "",
    modtime_end: "",
    income: [],
    sort: "-date",
  });

  // Setiap kali filter data berubah, halaman kembali ke 1.
  const handleFilterChange = useCallback((updaterOrValue) => {
    setFilter((prev) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue;

      if (!next || next === prev) return prev;

      const dataFilterChanged = Object.keys(next).some(
        (key) => !PAGINATION_KEYS.includes(key) && next[key] !== prev[key],
      );

      // Kalau komponen filter sendiri sudah mengatur page, hormati itu.
      if (dataFilterChanged && next.page === prev.page) {
        return { ...next, page: 1 };
      }
      return next;
    });
  }, []);

  const handleStatusChips = useCallback(
    (status) => handleFilterChange((prev) => ({ ...prev, status })),
    [handleFilterChange],
  );

  // -----------------------------
  // ADAPTER TANSTACK TABLE: SORTING
  // -----------------------------
  const sortingState = useMemo(() => {
    const isDesc = filter.sort.startsWith("-");
    const id = filter.sort.replace("-", "");
    return [{ id, desc: isDesc }];
  }, [filter.sort]);

  const handleSortingChange = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sortingState)
        : updaterOrValue;

    if (!newSorting?.length) return;

    const { id, desc } = newSorting[0];
    setFilter((prev) => ({
      ...prev,
      page: 1,
      sort: desc ? `-${id}` : id,
    }));
  };

  // -----------------------------
  // ADAPTER TANSTACK TABLE: PAGINATION
  // -----------------------------
  const paginationState = useMemo(
    () => ({
      pageIndex: (filter.page || 1) - 1,
      pageSize: filter.paginate || 15,
    }),
    [filter.page, filter.paginate],
  );

  const handlePaginationChange = useCallback((updaterOrValue) => {
    setFilter((prev) => {
      const currentPagination = {
        pageIndex: (prev.page || 1) - 1,
        pageSize: prev.paginate || 15,
      };

      const nextPagination =
        typeof updaterOrValue === "function"
          ? updaterOrValue(currentPagination)
          : (updaterOrValue ?? currentPagination);

      const nextPageSize = Math.max(
        Number(nextPagination.pageSize ?? currentPagination.pageSize) || 15,
        1,
      );
      const nextPageIndex = Math.max(
        Number(nextPagination.pageIndex ?? currentPagination.pageIndex) || 0,
        0,
      );
      const pageSizeChanged = nextPageSize !== (prev.paginate || 15);
      const nextPage = pageSizeChanged ? 1 : nextPageIndex + 1;

      if (nextPage === prev.page && nextPageSize === prev.paginate) {
        return prev;
      }

      return { ...prev, page: nextPage, paginate: nextPageSize };
    });
  }, []);

  // -----------------------------
  // FETCH API
  // -----------------------------
  const baseFilter = {
    name: filter.name,
    status: filter.status.join(","),
    source: filter.source.join(","),
    request_type: filter.request_type.join(","),
    building_type: filter.building_type.join(","),
    date_between: { start: filter.start_date, end: filter.end_date },
    whatsapp_number: filter.whatsapp_number,
    income: filter.income.join(","),
  };

  const filterWithModtime =
    filter.modtime_start && filter.modtime_end
      ? {
          ...baseFilter,
          modtime_between: {
            start: filter.modtime_start,
            end: filter.modtime_end,
          },
        }
      : baseFilter;

  const query = {
    fields:
      "id,lead_code,name,whatsapp_number,request_type,building_type,building_area,source,location,date,income,status,client_id,schedule_id,notes,follow_up_count,cretime,creby,modtime,modby",
    include: "client,schedule,crebyUser,modbyUser,faqs",
    filter: filterWithModtime,
    sort: filter.sort,
    paginate: filter.paginate,
    page: filter.page,
  };

  const { data, isLoading, isFetching, refetch } = useApiFetch(
    ["leads", query],
    "/leads",
    query,
  );

  // Simpan hasil server terakhir yang valid supaya tabel tidak berkedip kosong.
  const serverPage = data?.data ?? null;
  const lastServerPageRef = useRef(null);
  if (serverPage) {
    lastServerPageRef.current = serverPage;
  }
  const pageData = serverPage ?? lastServerPageRef.current;

  const leads = pageData?.data ?? [];
  const lastPage = Math.max(Number(pageData?.last_page) || 1, 1);
  const totalCount = Number(pageData?.total) || 0;

  const isInitialLoading = Boolean(isLoading) && !pageData;
  const isPageFetching = Boolean(isFetching) && !isInitialLoading;

  // Kalau halaman saat ini melebihi last_page, mundur.
  useEffect(() => {
    if (!serverPage) return;
    if (Number(serverPage.current_page) !== filter.page) return;

    const maxPage = Math.max(Number(serverPage.last_page) || 1, 1);
    if (filter.page > maxPage) {
      setFilter((prev) =>
        prev.page > maxPage ? { ...prev, page: maxPage } : prev,
      );
    }
  }, [serverPage, filter.page]);

  const detailLead = useMemo(
    () => leads.find((l) => l.id === detailLeadId) ?? null,
    [leads, detailLeadId],
  );

  const { mutateAsync: updateFollowUpManual, isPending: isSavingFollowUp } =
    usePost("/leads/follow-up/manual");

  // -----------------------------
  // ACTIONS / HANDLERS
  // -----------------------------
  const handleOpenFollowUpModal = useCallback((lead) => {
    const value = (lead.follow_up_count ?? 0) || 0;
    setFollowUpModalLead(lead);
    setFollowUpValue(value);
    setFollowUpNote(lead.notes || "");
    setIsFollowUpModalOpen(true);
  }, []);

  const handleSaveFollowUp = async () => {
    if (!followUpModalLead) return;
    try {
      await updateFollowUpManual({
        lead_id: followUpModalLead.id,
        follow_up_count: followUpValue,
        notes: followUpNote,
      });
      toast.success("Follow-up berhasil diperbarui");
      setIsFollowUpModalOpen(false);
      setFollowUpModalLead(null);
      refetch();
    } catch (error) {
      toast.error("Gagal memperbarui follow-up");
      console.error(error);
    }
  };

  const handleEditLead = useCallback((lead) => {
    setDetailLeadId(null);
    setEditingLeadId(lead.id);
    setIsEditLeadOpen(true);
  }, []);

  const handleOpenTemplate = useCallback((lead) => {
    setDetailLeadId(null);
    setTemplateLead(lead);
    setIsTemplateModalOpen(true);
  }, []);

  const handleOpenDetail = useCallback((id) => setDetailLeadId(id), []);

  // Export (tidak diubah)
  const queryExport = {
    fields:
      "id,name,whatsapp_number,request_type,building_type,building_area,source,location,notes,date,status,follow_up_count",
    filter: {
      date_between: { start: filter.start_date, end: filter.end_date },
    },
    sort: "date",
  };
  const { data: reportLeads, isLoading: isLoadingReport } = useApiFetch(
    "leads",
    "/leads",
    queryExport,
  );

  const handleDownloadReport = () => {
    if (isLoadingReport) return;
    const message = formatDailyReportMessage(
      reportLeads?.data,
      filter.start_date,
      filter.end_date,
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const { mutate } = usePost(`/leads/row`, {
    invalidate: [["leads"]],
  });

  const handleFieldChange = useCallback(
    (selected, row, field) => {
      const payload = {
        id: row.original.id,
        request_type:
          field === "request_type" ? selected : row.original.request_type,
        building_type:
          field === "building_type" ? selected : row.original.building_type,
        source: field === "source" ? selected : row.original.source,
        status: field === "status" ? selected : row.original.status,
      };

      toast.promise(
        new Promise((resolve, reject) => {
          mutate(payload, {
            onSuccess: () => resolve(),
            onError: (err) => {
              if (err) reject(err?.response?.data.message);
            },
          });
        }),
        {
          loading: "Mengupdate...",
          success: "Lead berhasil diupdate!",
          error: (msg) => msg ?? "Gagal menyimpan data!",
        },
      );
    },
    [mutate],
  );

  // -----------------------------
  // DEFINISI KOLOM (14 kolom -> 9)
  // -----------------------------
  const columns = useMemo(
    () => [
      {
        id: "actions",
        header: "Action",
        enableHiding: false,
        enablePinning: true,
        size: 80,
        cell: ({ row }) => (
          <LeadActions
            lead={row.original}
            refetch={refetch}
            onEdit={handleEditLead}
          />
        ),
      },
      {
        // id "name" dipakai DataTable sebagai judul card mobile + anchor dot indikator
        accessorKey: "name",
        header: "Client",
        size: 260,
        cell: ({ row }) => (
          <ClientCell
            lead={row.original}
            onOpenDetail={handleOpenDetail}
            onOpenTemplate={handleOpenTemplate}
          />
        ),
      },
      {
        // Disembunyikan di desktop (nomor sudah di bawah nama), tampil di card mobile
        accessorKey: "whatsapp_number",
        header: "Phone",
        meta: { label: "Phone" },
        size: 180,
        cell: ({ row }) => (
          <PhoneCell lead={row.original} onOpenTemplate={handleOpenTemplate} />
        ),
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className={SORT_BUTTON}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={12} />
            ) : (
              <ArrowUpDown size={12} />
            )}
          </Button>
        ),
        meta: { label: "Tanggal" },
        size: 140,
        cell: ({ row }) => <DateCell lead={row.original} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 150,
        cell: ({ row }) => (
          <EditableCell
            variant="pill"
            options={statusLeads}
            value={row.original.status}
            match={normalizeLeadStatusValue}
            onChange={(v) => handleFieldChange(v, row, "status")}
          />
        ),
      },
      {
        // Kebutuhan + jenis bangunan + luas jadi satu
        accessorKey: "request_type",
        header: "Proyek",
        meta: { label: "Proyek" },
        size: 200,
        cell: ({ row }) => (
          <ProjectCell row={row} onFieldChange={handleFieldChange} />
        ),
      },
      {
        id: "location_notes",
        accessorFn: (row) => row.location,
        header: "Lokasi & Catatan",
        size: 300,
        cell: ({ row }) => (
          <LocationNotesCell
            location={row.original.location}
            notes={row.original.notes}
          />
        ),
      },
      {
        accessorKey: "follow_up_count",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className={cn(SORT_BUTTON, "mx-auto flex")}
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Follow-up
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={12} />
            ) : (
              <ArrowUpDown size={12} />
            )}
          </Button>
        ),
        meta: { label: "Follow-up" },
        size: 130,
        cell: ({ row }) => (
          <FollowUpCell
            count={(row.original.follow_up_count ?? 0) || 0}
            onClick={() => handleOpenFollowUpModal(row.original)}
          />
        ),
      },
      {
        id: "survey",
        header: "Survey",
        size: 190,
        cell: ({ row }) => <SurveyCell schedule={row.original.schedule} />,
      },
      {
        accessorKey: "source",
        header: "Source",
        size: 150,
        cell: ({ row }) => (
          <EditableCell
            options={sourceLeads}
            value={row.original.source}
            onChange={(v) => handleFieldChange(v, row, "source")}
          />
        ),
      },
    ],
    [
      refetch,
      handleFieldChange,
      handleOpenFollowUpModal,
      handleEditLead,
      handleOpenTemplate,
      handleOpenDetail,
    ],
  );

  // -----------------------------
  // RENDER UTAMA
  // -----------------------------
  return (
    <TooltipProvider delayDuration={200}>
      <Tabs defaultValue="Report_leads" className="mt-6 w-full space-y-6">
        <div className="overflow-x-auto overflow-y-hidden md:pe-8">
          <TabsContent value="Report_leads" className="mt-6 space-y-5">
            <FilterReportLeads filter={filter} setFilter={handleFilterChange} />

            {/* Toolbar: filter cepat di kiri, aksi di kanan */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <StatusChips value={filter.status} onChange={handleStatusChips} />

              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 hidden text-xs text-muted-foreground tabular-nums xl:inline">
                  {totalCount.toLocaleString("id-ID")} lead
                </span>

                {canExport && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <DownloadIcon className="mr-2 size-4" />
                        Export
                        <ChevronDown className="ml-2 size-3.5 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleExportReport(filter)}
                      >
                        <DownloadIcon className="mr-2 size-4" /> Export Data
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(filter)}>
                        <FileSpreadsheet className="mr-2 size-4" /> Export Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  disabled={isLoadingReport}
                >
                  <Send className="mr-2 size-4" /> Report via WA
                </Button>
                <Button onClick={() => setIsCreateLeadOpen(true)}>
                  <IconPlus size={16} className="mr-1" /> Add Lead
                </Button>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={leads}
              isLoading={isInitialLoading}
              isFetching={isPageFetching}
              enableColumnVisibility={true}
              enableSorting={true}
              enablePinning={true}
              enableColumnResizing={true}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              rowIndicator={LeadRowIndicator}
              // --- Server-side Sorting ---
              manualSorting={true}
              sorting={sortingState}
              onSortingChange={handleSortingChange}
              // --- Server-side Pagination ---
              enablePagination={true}
              manualPagination={true}
              pagination={paginationState}
              onPaginationChange={handlePaginationChange}
              pageCount={lastPage}
              totalCount={totalCount}
              paginationLabel="leads"
            />
          </TabsContent>
        </div>

        {/* PANEL DETAIL */}
        <LeadDetailSheet
          lead={detailLead}
          open={Boolean(detailLead)}
          onOpenChange={(open) => {
            if (!open) setDetailLeadId(null);
          }}
          onEdit={handleEditLead}
          onOpenTemplate={handleOpenTemplate}
          onOpenFollowUp={handleOpenFollowUpModal}
        />

        {/* MODAL FOLLOW UP MANUAL */}
        <Dialog
          open={isFollowUpModalOpen}
          onOpenChange={(open) => {
            setIsFollowUpModalOpen(open);
            if (!open) setFollowUpModalLead(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atur Follow-up</DialogTitle>
              <DialogDescription>
                {followUpModalLead ? `Lead: ${followUpModalLead.name}` : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Jumlah Follow-up</p>
                <Input
                  type="number"
                  min={0}
                  max={MAX_FOLLOW_UP}
                  value={followUpValue}
                  onChange={(e) => {
                    const raw = parseInt(e.target.value, 10);
                    if (Number.isNaN(raw)) {
                      setFollowUpValue(0);
                      return;
                    }
                    setFollowUpValue(Math.max(0, Math.min(MAX_FOLLOW_UP, raw)));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Nilai antara 0 sampai {MAX_FOLLOW_UP}.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Catatan Follow-up</p>
                <Textarea
                  rows={4}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Tulis catatan singkat untuk follow-up ini"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsFollowUpModalOpen(false);
                    setFollowUpModalLead(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSaveFollowUp}
                  disabled={isSavingFollowUp || !followUpModalLead}
                >
                  Simpan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL FOLLOW UP TEMPLATE WA */}
        <FollowUpTemplateModal
          open={isTemplateModalOpen}
          onOpenChange={setIsTemplateModalOpen}
          lead={templateLead}
          onFollowUp={async (leadId) => {
            try {
              await axiosInstance.post(`/leads/${leadId}/follow-up`);
              refetch();
              toast.success("Follow-up berhasil dicatat");
            } catch (error) {
              toast.error("Gagal mencatat follow-up");
              console.error(error);
            }
          }}
        />

        <CreateLeadModal
          open={isCreateLeadOpen}
          onOpenChange={setIsCreateLeadOpen}
        />

        <EditLeadModal
          open={isEditLeadOpen}
          onOpenChange={setIsEditLeadOpen}
          leadId={editingLeadId}
        />
      </Tabs>
    </TooltipProvider>
  );
};

export default TableLead;
