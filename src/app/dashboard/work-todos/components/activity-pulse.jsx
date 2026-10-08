import React, { useMemo } from "react";
import { CheckCircle2, XCircle, Target } from "lucide-react";

// ==========================================
// FUNGSI HELPER: GENERATE RENTANG TANGGAL
// ==========================================
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// ==========================================
// 1. SUB-KOMPONEN: KARTU HEATMAP PER USER
// ==========================================
const UserHeatmapCard = ({ user }) => {
  // Hitung statistik user dari data activities
  const stats = useMemo(() => {
    let filled = 0;
    let missed = 0;
    let totalTasks = 0;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    user.activities.forEach((day) => {
      const isSunday = new Date(day.date).getDay() === 0;

      if (day.count > 0) {
        filled++;
        totalTasks += day.count;
      } else if (day.date <= todayStr && !isSunday) {
        missed++;
      }
    });

    return { filled, missed, totalTasks };
  }, [user.activities]);

  const paddedActivities = useMemo(() => {
    if (!user.activities || user.activities.length === 0) return [];

    const firstDate = new Date(user.activities[0].date);
    const dayOfWeek = firstDate.getDay();
    const shift = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const padding = Array.from({ length: shift }).map(() => ({
      date: "dummy",
      count: -1,
    }));

    return [...padding, ...user.activities];
  }, [user.activities]);

  return (
    <div className="bg-card rounded-2xl p-6 sm:p-7 border border-border shadow-sm flex flex-col w-full transition-all hover:border-primary/50">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-3.5 mb-8">
        <div>
          <h3 className="font-bold text-foreground text-[20px] tracking-tight capitalize">
            {user.user_name}
          </h3>
          <p className="text-muted-foreground text-[13px] font-medium mt-0.5">
            Activity Pulse
          </p>
        </div>

        {/* Badges Statistik menggunakan Semantic Colors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg border border-border">
            <Target className="w-4 h-4 text-secondary-foreground" />
            <span className="text-[12px] font-semibold text-secondary-foreground">
              {stats.totalTasks} Tasks
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-[12px] font-semibold text-primary">
              {stats.filled} Filled
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-[12px] font-semibold text-destructive">
              {stats.missed} Missed
            </span>
          </div>
        </div>
      </div>

      {/* --- HEATMAP AREA --- */}
      <div className="flex items-stretch gap-2.5 sm:gap-4 flex-1 w-full relative">
        <div className="grid grid-rows-7 gap-[4px] sm:gap-[6px] text-[10px] sm:text-[11px] font-medium text-muted-foreground pr-1 sm:pr-2 pt-14 -mt-14 pb-4 -mb-4">
          <div className="flex items-center justify-end h-full">Mon</div>
          <div className="flex items-center justify-end h-full">Tue</div>
          <div className="flex items-center justify-end h-full">Wed</div>
          <div className="flex items-center justify-end h-full">Thu</div>
          <div className="flex items-center justify-end h-full">Fri</div>
          <div className="flex items-center justify-end h-full">Sat</div>
          <div className="flex items-center justify-end h-full">Sun</div>
        </div>

        {/* Container Smooth Scroll & Bebas Background Clipping */}
        <div className="overflow-x-auto scroll-smooth pt-14 -mt-14 pb-4 -mb-4 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="grid grid-flow-col grid-rows-7 gap-[4px] sm:gap-[6px] w-max px-1">
            {paddedActivities.map((day, i) => {
              if (day.count === -1) {
                return (
                  <div
                    key={`pad-${i}`}
                    className="w-[18px] sm:w-[22px] xl:w-[26px] aspect-square rounded-sm bg-transparent"
                  ></div>
                );
              }

              // Konfigurasi Level Warna via CSS Variables Theme
              let bgColor = "bg-muted border border-border/50";
              let glowClass = "";

              if (day.count === 1 || day.count === 2) {
                bgColor = "bg-primary/40 border border-primary/20";
              } else if (day.count === 3 || day.count === 4) {
                bgColor = "bg-primary/80 border border-primary/50";
              } else if (day.count >= 5) {
                bgColor = "bg-primary border border-primary";
                glowClass =
                  "shadow-[0_0_12px_var(--color-primary)] ring-1 ring-primary/50";
              }

              return (
                <div
                  key={i}
                  className={`w-[18px] sm:w-[22px] xl:w-[26px] aspect-square rounded-sm ${bgColor} ${glowClass} hover:ring-2 ring-offset-2 ring-offset-background ring-primary transition-all duration-200 cursor-pointer relative group`}
                >
                  {/* Tooltip Dinamis berbasis warna popover */}
                  <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-[calc(100%+8px)] left-1/2 transform -translate-x-1/2 bg-popover border border-border text-popover-foreground text-[11px] sm:text-[12px] font-medium px-3 py-1.5 rounded-md whitespace-nowrap z-[999] shadow-xl drop-shadow-lg pointer-events-none">
                    <span className="font-bold text-primary">{day.count}</span>{" "}
                    tasks
                    <span className="text-muted-foreground ml-1">
                      on {day.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- LEGEND --- */}
      <div className="flex items-center justify-end gap-2 mt-6 text-[11px] font-semibold text-muted-foreground w-full pr-2">
        <span className="mr-1">Less</span>
        <div className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-sm bg-muted border border-border/50"></div>
        <div className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-sm bg-primary/40 border border-primary/20"></div>
        <div className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-sm bg-primary/80 border border-primary/50"></div>
        <div className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] rounded-sm bg-primary shadow-[0_0_6px_var(--color-primary)] border border-primary"></div>
        <span className="ml-1">More</span>
      </div>
    </div>
  );
};

// ==========================================
// 2. MAIN COMPONENT: LIST SEMUA USER
// ==========================================
export default function ActivityPulseBoard({
  dailyLogs = [],
  employeeDetails = [],
  startDate,
  endDate,
  dateRangeText = "Periode Terpilih",
}) {
  // Transformasi Data: Menghubungkan employeeDetails dan dailyLogs menjadi format Heatmap
  const pulseData = useMemo(() => {
    if (!startDate || !endDate || employeeDetails.length === 0) return [];

    const dates = getDatesInRange(startDate, endDate);

    return employeeDetails.map((emp) => {
      const activities = dates.map((dateStr) => {
        // Cari log aktivitas user untuk tanggal spesifik
        const log = dailyLogs.find(
          (l) => l.user_name === emp.user_name && l.date === dateStr,
        );

        // Hitung jumlah tasks dari item standalone (arsitektur baru)
        const count =
          log && log.has_todo_log && log.items ? log.items.length : 0;

        return { date: dateStr, count };
      });

      return {
        user_id: emp.user_id,
        user_name: emp.user_name,
        activities,
      };
    });
  }, [dailyLogs, employeeDetails, startDate, endDate]);

  if (!pulseData || pulseData.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-border">
        Data aktivitas belum tersedia untuk periode ini.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Team Activity Pulse
        </h2>
        <div className="inline-flex items-center">
          <span className="text-[13px] font-bold text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-lg whitespace-nowrap">
            {dateRangeText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        {pulseData.map((user) => (
          <UserHeatmapCard key={user.user_id} user={user} />
        ))}
      </div>
    </div>
  );
}
