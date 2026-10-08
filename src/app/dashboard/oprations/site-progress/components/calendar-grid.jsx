"use client";

import React from "react";
import { format, isSameDay } from "date-fns";
import { getDailyReportStatus } from "@/lib/report-daily-utility";

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function DayCell({ date, reports, isSelected, isToday, onSelect }) {
  const hasSubmitted = reports.some(
    (r) => getDailyReportStatus(r) === "submitted",
  );
  const hasDraft = reports.some((r) => getDailyReportStatus(r) === "draft");
  const hasAny = reports.length > 0;

  // Show count badge when there are multiple reports on a day
  const showCount = reports.length > 1;

  return (
    <button
      onClick={onSelect}
      aria-label={`${format(date, "d MMMM yyyy")}${hasAny ? `, ${reports.length} laporan` : ""}`}
      aria-pressed={isSelected}
      className={[
        "relative flex flex-col items-center pt-2 pb-3 rounded-md cursor-pointer transition-all duration-150 group border",
        isSelected
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-200/70 bg-white/95 hover:border-stone-300 hover:bg-stone-50",
      ].join(" ")}
    >
      <span
        className={[
          "text-sm leading-none font-[family-name:var(--font-dm-mono)] font-medium",
          isSelected
            ? "text-white"
            : isToday
              ? "font-bold text-stone-900"
              : "text-stone-700 group-hover:text-stone-900",
        ].join(" ")}
      >
        {format(date, "d")}
      </span>

      {/* Dot indicators */}
      {hasAny && (
        <div className="flex gap-0.5 mt-2">
          {hasSubmitted && (
            <div
              className={[
                "w-1 h-1 rounded-full",
                isSelected ? "bg-amber-400" : "bg-amber-500",
              ].join(" ")}
            />
          )}
          {hasDraft && (
            <div
              className={[
                "w-1 h-1 rounded-full",
                isSelected ? "bg-white/40" : "bg-stone-300",
              ].join(" ")}
            />
          )}
        </div>
      )}

      {/* Count badge for multiple reports */}
      {showCount && (
        <span
          className={[
            "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
            "text-[8px] font-[family-name:var(--font-dm-mono)] font-medium",
            isSelected ? "bg-white text-stone-900" : "bg-stone-900 text-white",
          ].join(" ")}
        >
          {reports.length}
        </span>
      )}
    </button>
  );
}

export function CalendarGrid({
  days,
  leadingEmpties,
  selectedDate,
  monthReportByDate,
  onSelectDate,
}) {
  const today = new Date();

  return (
    <div className="flex flex-col gap-2 bg-white/95 border border-stone-200/70 rounded-md p-3">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center pb-2 text-[9px] font-[family-name:var(--font-dm-mono)] font-medium tracking-[2px] text-stone-500 uppercase border-b border-stone-200/70"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingEmpties }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const raw = monthReportByDate.get(dateStr);
          const reports = Array.isArray(raw) ? raw : raw ? [raw] : [];
          return (
            <DayCell
              key={dateStr}
              date={date}
              reports={reports}
              isSelected={isSameDay(date, selectedDate)}
              isToday={isSameDay(date, today)}
              onSelect={() => onSelectDate(date)}
            />
          );
        })}
      </div>
    </div>
  );
}
