"use client";
import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  addMonths,
  isWithinInterval,
  parseISO,
  getDay,
  isToday,
  differenceInDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const DAY_HEADERS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#06b6d4",
];
const getAvatarBg = (id) => PALETTE[(id || 0) % PALETTE.length];

function getDayRange(start, end) {
  if (!start || !end) return null;
  try {
    const diff = differenceInDays(
      parseISO(end + "T00:00:00"),
      parseISO(start + "T00:00:00"),
    );
    return diff >= 0 ? diff : null;
  } catch {
    return null;
  }
}

// ─── UserAvatar ────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 20, highlighted = false }) {
  const hasAvatar = user?.avatar && String(user.avatar).trim() !== "";
  const style = {
    width: size,
    height: size,
    minWidth: size,
    fontSize: size <= 16 ? 9 : size <= 24 ? 11 : 12,
  };
  const ringClass = highlighted
    ? "ring-[2px] ring-[#fed818] border-none"
    : "border-[#0f1a22]";

  if (hasAvatar)
    return (
      <img
        src={user.avatar}
        alt={user.name}
        title={user.name}
        style={style}
        className={`rounded-full object-cover flex-shrink-0 border ${ringClass} transition-all duration-200`}
      />
    );

  return (
    <div
      title={user?.name}
      style={{
        ...style,
        backgroundColor: highlighted ? "#e5c210" : getAvatarBg(user?.id),
      }}
      className={`rounded-full flex-shrink-0 flex items-center justify-center font-bold uppercase text-white border ${ringClass} transition-all duration-200`}
    >
      {user?.name?.charAt(0) || "?"}
    </div>
  );
}

// ─── StatusBadge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    done: { dot: "bg-[#4ade80]", label: "Done", text: "text-[#4ade80]" },
    on_progress: {
      dot: "bg-[#fbbf24]",
      label: "In Progress",
      text: "text-[#fbbf24]",
    },
    pending: { dot: "bg-[#cfc9bd]", label: "Pending", text: "text-[#cfc9bd]" },
  }[status] ?? { dot: "bg-[#6b7280]", label: status, text: "text-[#9ca3af]" };

  return (
    <span
      className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function TaskCalendarSidebar({ selectedUsers, onEditTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [month, setMonth] = useState(new Date());
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const [hoveredRange, setHoveredRange] = useState(null);
  const [mobilePreviewTaskId, setMobilePreviewTaskId] = useState(null);

  const { data: apiResponse } = useApiFetch(
    ["work-tasks-calendar", month, selectedUsers],
    "/work-tasks/calendar",
    {
      start_date: format(startOfMonth(month), "yyyy-MM-dd"),
      end_date: format(endOfMonth(month), "yyyy-MM-dd"),
      user_id: selectedUsers,
    },
  );
  const calendarData = apiResponse?.data || {};

  // Avatar hanya muncul di tanggal cretime (range_start)
  const createdOnDate = useMemo(() => {
    const map = {};
    Object.entries(calendarData).forEach(([dateStr, userGroups]) => {
      userGroups.forEach(({ user, tasks }) => {
        tasks.forEach((task) => {
          if (task.range_start === dateStr) {
            if (!map[dateStr]) map[dateStr] = [];
            if (!map[dateStr].find((e) => e.user.id === user.id))
              map[dateStr].push({ user });
          }
        });
      });
    });
    return map;
  }, [calendarData]);

  const isInRange = (dateStr) => {
    if (!hoveredRange?.range_start || !hoveredRange?.range_end) return false;
    try {
      return isWithinInterval(parseISO(dateStr), {
        start: parseISO(hoveredRange.range_start),
        end: parseISO(hoveredRange.range_end),
      });
    } catch {
      return false;
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const startPad = getDay(startOfMonth(month));

  // ─── FIX: hanya task yang DIBUAT (range_start) di tanggal yang diklik ───
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return [];
    return (calendarData[selectedDate] ?? [])
      .map(({ user, tasks }) => ({
        user,
        // filter: hanya task yang cretime-nya = tanggal yang dipilih
        tasks: tasks.filter((t) => t.range_start === selectedDate),
      }))
      .filter(({ tasks }) => tasks.length > 0);
  }, [selectedDate, calendarData]);

  const MAX_CARDS = 20;
  const visibleCards = selectedDayData.slice(0, MAX_CARDS);
  const hiddenCount = Math.max(0, selectedDayData.length - MAX_CARDS);

  return (
    <Sheet modal={false} open={isOpen} onOpenChange={setIsOpen}>
      {/* ── Trigger tab ── */}
      <SheetTrigger asChild>
        <button
          className="
            absolute right-0 top-6 z-30
            flex flex-col items-center gap-1.5 px-2 py-3
            rounded-l-xl border border-r-0 border-[#1e3040]
            bg-[#0d1b24] shadow-lg
            text-[#cfc9bd] hover:text-[#fed818] hover:border-[#fed818]/40
            transition-all duration-200 group
          "
          title="Buka Kalender"
        >
          <Calendar size={14} className="text-[#fed818]" />
          <span className="text-[9px] font-bold tracking-widest uppercase [writing-mode:vertical-rl] rotate-180 leading-none text-[#cfc9bd] group-hover:text-[#fed818] transition-colors">
            Kalender
          </span>
        </button>
      </SheetTrigger>

      {/* ── Sheet panel ── */}
      <SheetContent
        side="right"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="
          w-[360px] p-0 flex flex-col
          bg-[#0d1b24] border-l border-[#1e3040]
          text-[#fffdf5]
          [&>button]:text-[#cfc9bd] [&>button]:hover:text-[#fffdf5]
          [&>button]:top-4 [&>button]:right-4
        "
      >
        {/* ── Sticky: header + kalender ── */}
        <div className="flex-shrink-0 bg-[#0d1b24]">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-[#1e3040]">
            <SheetTitle className="flex items-center gap-2 text-[12px] font-extrabold text-[#fffdf5] tracking-widest uppercase">
              <Calendar size={14} className="text-[#fed818]" />
              Task Calendar
            </SheetTitle>
          </SheetHeader>

          {/* Navigasi bulan */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <button
              onClick={() => setMonth(subMonths(month, 1))}
              className="size-7 flex items-center justify-center rounded-lg text-[#cfc9bd] hover:text-[#fed818] hover:bg-[#1e2732] transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[12px] font-bold text-[#fffdf5] tracking-wider">
              {format(month, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setMonth(addMonths(month, 1))}
              className="size-7 flex items-center justify-center rounded-lg text-[#cfc9bd] hover:text-[#fed818] hover:bg-[#1e2732] transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Grid kalender */}
          <div className="px-3 pb-2">
            <div className="grid grid-cols-7 mb-1">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="flex items-center justify-center h-5">
                  <span className="text-[10px] font-bold text-[#5a6570] uppercase tracking-widest">
                    {d}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} className="h-[44px]" />
              ))}

              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const usersHere = createdOnDate[dateStr] || [];
                const inRange = isInRange(dateStr);
                const isStart = hoveredRange?.range_start === dateStr;
                const isEnd = hoveredRange?.range_end === dateStr;
                const isSelected = selectedDate === dateStr;
                const today = isToday(day);

                const visibleUsers = hoveredRange
                  ? usersHere.filter((u) => u.user?.id === hoveredRange.userId)
                  : usersHere;

                let cellBg = "",
                  cellRounded = "rounded-md";
                if (inRange && !isStart && !isEnd) {
                  cellBg = "bg-[#1e2732]/70";
                  cellRounded = "rounded-none";
                } else if (isStart) {
                  cellBg = "bg-[#1e2732] rounded-l-md";
                  cellRounded = "";
                } else if (isEnd) {
                  cellBg = "bg-[#1e2732] rounded-r-md";
                  cellRounded = "";
                } else if (isSelected) {
                  cellBg = "bg-[#fed818]/15 ring-1 ring-[#fed818]/50";
                }

                return (
                  <button
                    key={dateStr}
                    onClick={() =>
                      setSelectedDate(dateStr === selectedDate ? null : dateStr)
                    }
                    className={`relative h-[44px] flex flex-col items-center justify-start pt-1.5 transition-all duration-150 cursor-pointer
                      ${cellBg} ${cellRounded}
                      ${!inRange && !isSelected ? "hover:bg-[#1e2732] hover:rounded-md" : ""}
                    `}
                  >
                    <span
                      className={`text-[13px] font-semibold leading-none transition-colors duration-150 ${
                        today && !inRange
                          ? "text-[#fed818] font-extrabold"
                          : isStart || isEnd || inRange
                            ? "text-[#fffdf5] font-bold"
                            : isSelected
                              ? "text-[#fed818]"
                              : "text-[#cfc9bd]"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {today && (
                      <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#fed818]" />
                    )}

                    {/* Avatar — FIXED HEIGHT agar tidak loncat */}
                    {visibleUsers.length > 0 ? (
                      <div className="flex -space-x-1.5 mt-1">
                        {visibleUsers.slice(0, 2).map(({ user }) => (
                          <UserAvatar
                            key={user.id}
                            user={user}
                            size={17}
                            highlighted={inRange}
                          />
                        ))}
                        {visibleUsers.length > 2 && (
                          <div
                            style={{ width: 15, height: 15, fontSize: 7 }}
                            className="rounded-full bg-[#363430] border border-[#0f1a22] flex items-center justify-center text-[#cfc9bd] font-bold z-10"
                          >
                            +{visibleUsers.length - 2}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ height: 17 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hover range hint — fixed height, no layout shift */}
          <div
            className={`mx-3 mb-2 rounded-lg border px-3 py-2 flex items-center gap-2 transition-all duration-200
              ${hoveredRange ? "opacity-100 bg-[#1e2732] border-[#363430]" : "opacity-0 bg-transparent border-transparent pointer-events-none"}`}
            style={{ minHeight: 38 }}
          >
            <Clock size={10} className="text-[#fed818] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#fffdf5] leading-tight line-clamp-1">
                {hoveredRange?.task_name ?? "—"}
              </p>
              <div className="flex items-center justify-between gap-1.5 mt-0.5">
                <p className="text-[9px] text-[#cfc9bd] font-mono">
                  {hoveredRange
                    ? `${hoveredRange.range_start} → ${hoveredRange.range_end}`
                    : "—"}
                </p>
                <span
                  className={`text-[10px] font-bold text-[#cfc9bd] ${hoveredRange ? "opacity-100" : "opacity-0"}`}
                >
                  {hoveredRange
                    ? getDayRange(
                        hoveredRange.range_start,
                        hoveredRange.range_end,
                      )
                    : "—"}{" "}
                  hari
                </span>
              </div>
            </div>
          </div>

          <div className="mx-3 h-px bg-[#1e3040]" />
        </div>

        {/* ── Scrollable task list ── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-50">
                <Calendar size={26} className="text-[#cfc9bd]" />
                <p className="text-[11px] text-[#cfc9bd] text-center leading-relaxed">
                  Klik tanggal di kalender
                  <br />
                  untuk lihat tugas yang dibuat
                </p>
              </div>
            ) : selectedDayData.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-50">
                <Calendar size={26} className="text-[#cfc9bd]" />
                <p className="text-[11px] text-[#cfc9bd] text-center leading-relaxed">
                  Tidak ada tugas yang
                  <br />
                  dibuat di tanggal ini
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[12px] font-bold text-[#fed818] tracking-wide">
                    {format(
                      new Date(selectedDate + "T00:00:00"),
                      "dd MMMM yyyy",
                    )}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1e2732] text-[#cfc9bd]">
                    {selectedDayData.reduce(
                      (acc, g) => acc + g.tasks.length,
                      0,
                    )}{" "}
                    Tugas
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {visibleCards.map(({ user, tasks }) => (
                    <UserTaskCard
                      key={user.id}
                      user={user}
                      tasks={tasks}
                      hoveredTaskId={hoveredTaskId}
                      mobilePreviewTaskId={mobilePreviewTaskId}
                      setMobilePreviewTaskId={setMobilePreviewTaskId}
                      onEditTask={onEditTask}
                      onHoverTask={(task) => {
                        setHoveredTaskId(task?.id ?? null);
                        setHoveredRange(
                          task
                            ? {
                                taskId: task.id,
                                userId: user.id,
                                task_name: task.task_name,
                                range_start: task.range_start,
                                range_end: task.range_end,
                              }
                            : null,
                        );
                      }}
                    />
                  ))}
                  {hiddenCount > 0 && (
                    <p className="text-[11px] text-[#cfc9bd] text-center py-2 font-medium">
                      +{hiddenCount} orang lainnya
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ─── UserTaskCard ──────────────────────────────────────────────────────────
function UserTaskCard({
  user,
  tasks,
  hoveredTaskId,
  mobilePreviewTaskId,
  setMobilePreviewTaskId,
  onHoverTask,
  onEditTask,
}) {
  const isMobile =
    typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
  return (
    <div className="bg-[#1e2732]/50 rounded-xl border border-[#363430] overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#363430]/60 bg-[#1e2732]">
        <UserAvatar user={user} size={26} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-[#fffdf5] truncate leading-none">
            {user.name}
          </p>
          <p className="text-[10px] text-[#cfc9bd] mt-0.5">
            {tasks.length} Tugas dibuat
          </p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[#363430]/40">
        {tasks.map((task) => {
          const isHov = hoveredTaskId === task.id;
          const isMobilePreview = mobilePreviewTaskId === task.id;
          return (
            <div
              key={task.id}
              className={`relative flex flex-col gap-1.5 px-3 py-2.5 cursor-pointer select-none transition-colors duration-150
                ${isHov ? "bg-[#fed818]/10" : "hover:bg-[#1e2732]"}`}
              onMouseEnter={() => onHoverTask(task)}
              onMouseLeave={() => onHoverTask(null)}
              onClick={() => {
                if (isMobile) {
                  if (mobilePreviewTaskId === task.id) {
                    onEditTask?.(task);
                  } else {
                    setMobilePreviewTaskId(task.id);
                    onHoverTask(task);
                  }
                } else {
                  onEditTask?.(task);
                }
              }}
              title="Klik untuk edit tugas"
            >
              {/* Left accent bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-200
                  ${task.status === "done" ? "bg-[#4ade80]" : isHov ? "bg-[#fed818]" : "bg-transparent"}`}
              />

              {/* Nama tugas */}
              <span
                className={`text-[12px] font-medium leading-snug transition-colors duration-150
                  ${task.status === "done" ? "line-through text-[#8b8882]" : isHov ? "text-[#fed818]" : "text-[#fffdf5]"}`}
              >
                {task.task_name}
              </span>

              {/* Rentang tanggal + status */}
              <div className="flex items-center gap-2 flex-wrap">
                {(task.range_start || task.range_end) && (
                  <span className="flex items-center gap-1 text-[10.5px] font-mono text-[#696c70]">
                    <span>{task.range_start ?? "—"}</span>
                    <ArrowRight size={8} className="text-[#363430]" />
                    <span>{task.range_end ?? "—"}</span>
                  </span>
                )}
                <div
                  className={`ml-auto transition-opacity duration-200 ${isHov ? "opacity-100" : "opacity-40"}`}
                >
                  <StatusBadge status={task.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
