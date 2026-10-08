"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  getDay,
  isSameMonth,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useParams } from "next/navigation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { CalendarGrid } from "../../../components/calendar-grid";
import { DetailPanel } from "../../../components/detail-panel";
import { getDailyReportDateString } from "@/lib/report-daily-utility";

const LEGEND = [
  { color: "bg-amber-500", label: "Submitted" },
  { color: "bg-stone-300", label: "Draft" },
];

export default function DailyReportCalendarView() {
  const params = useParams();
  const siteId = params?.id ? String(params.id) : null;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  // NEW: which report (by id) is selected from the list on a given date
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Keep selectedDate inside the visible month
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentDate)) {
      setSelectedDate(startOfMonth(currentDate));
    }
  }, [currentDate, selectedDate]);

  // Reset selected report when date changes
  useEffect(() => {
    setSelectedReportId(null);
  }, [selectedDate]);

  // ── Derived date strings ───────────────────────────────────────────────────
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const monthStartStr = useMemo(
    () => format(monthStart, "yyyy-MM-dd"),
    [monthStart],
  );
  const monthEndStr = useMemo(() => format(monthEnd, "yyyy-MM-dd"), [monthEnd]);
  const selectedStr = useMemo(
    () => format(selectedDate, "yyyy-MM-dd"),
    [selectedDate],
  );

  // ── Calendar layout data ───────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayRaw = getDay(startOfMonth(currentDate));
  const leadingEmpties = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const days = useMemo(
    () =>
      Array.from(
        { length: daysInMonth },
        (_, i) =>
          new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1),
      ),
    [currentDate, daysInMonth],
  );

  // ── API: site metadata ─────────────────────────────────────────────────────
  const { data: siteProgressResponse } = useApiFetch(
    ["site-progress-detail", siteId],
    siteId ? `/site-progress/${siteId}` : null,
    undefined,
    !!siteId,
  );
  const siteProgress = siteProgressResponse?.data ?? null;

  // ── API: month report list (dot indicators) ────────────────────────────────
  const {
    data: monthReportsResponse,
    isLoading: isLoadingMonthReports,
    error: monthReportsError,
  } = useApiFetch(
    ["daily-reports-month", siteId, monthStartStr, monthEndStr],
    siteId ? `/site-progress/${siteId}/daily-reports` : null,
    siteId ? { start_date: monthStartStr, end_date: monthEndStr } : undefined,
    !!siteId,
  );

  // Normalise list shape and index by date string
  const monthReportByDate = useMemo(() => {
    const raw = monthReportsResponse?.data;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.items)
          ? raw.items
          : [];

    return list.reduce((map, r) => {
      const key = getDailyReportDateString(r);
      if (key) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r);
      }
      return map;
    }, new Map());
  }, [monthReportsResponse]);

  // ── Reports for selected date (the "project list") ─────────────────────────
  const {
    data: selectedDateReportsResponse,
    isLoading: isLoadingDateReports,
    error: selectedDateReportsError,
  } = useApiFetch(
    ["daily-reports-date", siteId, selectedStr],
    siteId ? `/site-progress/${siteId}/daily-reports` : null,
    siteId ? { date: selectedStr } : undefined,
    !!siteId,
  );

  const reportsForDate = useMemo(() => {
    const raw = selectedDateReportsResponse?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    // single-object fallback
    if (raw && typeof raw === "object") return [raw];
    return [];
  }, [selectedDateReportsResponse]);

  // Auto-select first report when list loads
  useEffect(() => {
    if (reportsForDate.length > 0 && selectedReportId === null) {
      const first = reportsForDate[0];
      setSelectedReportId(first?.id ?? first?.report_id ?? 0);
    }
  }, [reportsForDate, selectedReportId]);

  // The single report shown in the detail panel
  const selectedReport = useMemo(() => {
    if (!reportsForDate.length) return null;
    if (selectedReportId === null) return reportsForDate[0] ?? null;
    return (
      reportsForDate.find(
        (r) => (r?.id ?? r?.report_id) === selectedReportId,
      ) ?? reportsForDate[0]
    );
  }, [reportsForDate, selectedReportId]);

  // ── Month navigation ───────────────────────────────────────────────────────
  const handlePrevMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] font-sans text-stone-50">
        {/* ── LEFT: Calendar + selectors ── */}
        <div className="flex-1 lg:w-[60%] py-6 lg:p-10 flex flex-col gap-6 lg:border-r border-stone-200/70 overflow-y-auto ">
          {/* Header */}
          <header className="flex items-end justify-between">
            <div>
              <h1 className="text-[42px] leading-none font-black tracking-tight text-stone-50 font-[family-name:var(--font-playfair)]">
                {format(currentDate, "MMMM", { locale: id })}
              </h1>
              <p className="mt-2 text-[10px] tracking-[3px] text-stone-400 uppercase font-[family-name:var(--font-dm-mono)]">
                {format(currentDate, "yyyy")} — Arsip Laporan
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                aria-label="Bulan sebelumnya"
                className="w-8 h-8 flex items-center justify-center rounded-md border border-stone-300 text-stone-50 hover:bg-stone-100 hover:text-stone-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Bulan berikutnya"
                className="w-8 h-8 flex items-center justify-center rounded-md border border-stone-300 text-stone-50 hover:bg-stone-100 hover:text-stone-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Calendar grid */}
          <CalendarGrid
            days={days}
            leadingEmpties={leadingEmpties}
            selectedDate={selectedDate}
            monthReportByDate={monthReportByDate}
            onSelectDate={setSelectedDate}
          />

          {/* Legend */}
          <div className="flex gap-5 pt-4 border-t border-stone-200/70">
            {LEGEND.map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                <span className="text-[10px] tracking-[1.5px] text-stone-400 uppercase font-[family-name:var(--font-dm-mono)]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Inline feedback: loading & error for month */}
          {isLoadingMonthReports && (
            <p className="text-[10px] tracking-[2px] uppercase text-stone-400 font-[family-name:var(--font-dm-mono)]">
              Memuat laporan bulan ini...
            </p>
          )}
          {monthReportsError && (
            <p className="text-xs text-rose-500">
              Gagal memuat daftar laporan bulanan.
            </p>
          )}
        </div>

        {/* ── RIGHT: Detail panel ── */}
        <div className="lg:w-[40%] flex flex-col overflow-hidden ">
          <DetailPanel
            siteId={siteId}
            selectedDate={selectedDate}
            siteProgress={siteProgress}
            report={selectedReport}
            isLoading={isLoadingDateReports}
            error={selectedDateReportsError}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export function ReportSelector({
  reports,
  selectedReportId,
  onSelect,
  isLoading,
  error,
}) {
  if (isLoading) {
    return (
      <p className="text-[10px] tracking-[2px] uppercase text-stone-400 font-[family-name:var(--font-dm-mono)]">
        Memuat laporan...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-xs text-rose-500">
        Gagal memuat laporan untuk tanggal ini.
      </p>
    );
  }

  if (!reports.length) return null;

  // Unique project names (one report = one project, but guard duplicates)
  const uniqueProjects = Array.from(
    new Map(
      reports.map((r) => {
        const rid = r.id ?? r.report_id ?? 0;
        return [rid, r];
      }),
    ).values(),
  );

  // The currently selected report object
  const current =
    reports.find((r) => (r.id ?? r.report_id) === selectedReportId) ??
    reports[0];

  const currentId = current?.id ?? current?.report_id ?? 0;
  const supervisorLabel =
    current?.supervisor_name ?? current?.site_leader ?? "—";

  return (
    <div className="flex flex-col gap-3 pt-4 border-t border-stone-200/70">
      {/* Row 1: Project pills */}
      <div className="flex flex-wrap gap-2">
        {uniqueProjects.map((r) => {
          const rid = r.id ?? r.report_id ?? 0;
          const isSelected = rid === currentId;
          const projectName = r.project_name ?? `Laporan ${rid}`;
          return (
            <button
              key={String(rid)}
              onClick={() => onSelect(rid)}
              className={[
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-[family-name:var(--font-dm-mono)] tracking-[0.5px] transition-colors",
                isSelected
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-white border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-900",
              ].join(" ")}
            >
              {/* Status dot */}
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  r.status === "submitted"
                    ? isSelected
                      ? "bg-amber-400"
                      : "bg-amber-500"
                    : isSelected
                      ? "bg-white/40"
                      : "bg-stone-300",
                ].join(" ")}
              />
              {projectName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
