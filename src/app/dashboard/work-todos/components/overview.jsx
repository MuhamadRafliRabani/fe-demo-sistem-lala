"use client";
import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  MoreVertical,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  ChevronRight,
  Target,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

export const OverviewTab = ({ tasksData }) => {
  // === LOGIC DATA ===
  const allTasks = [
    ...(tasksData?.pending || []),
    ...(tasksData?.on_progress || []),
    ...(tasksData?.done || []),
  ];

  const totalTasks = allTasks.length;
  const completedTasks = tasksData?.done?.length || 0;
  const inProgressTasks = tasksData?.on_progress?.length || 0;
  const pendingTasks = tasksData?.pending?.length || 0;
  const conversionRate =
    totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : 0;

  // 1. DATA HEATMAP & TREND CALCULATION (35 Hari = 5 Minggu)
  const heatmapData = useMemo(() => {
    const countsByDate = allTasks.reduce((acc, t) => {
      const dateStr =
        t.parent_date ||
        t.cretime?.split(" ")[0] ||
        new Date().toISOString().split("T")[0];
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {});

    const days = [];
    const today = new Date();
    // Rentang 1 bulan (35 hari terakhir)
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        count: countsByDate[dateStr] || 0,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }
    return days;
  }, [allTasks]);

  // Data for Peak Task Chart (Last 7 Days)
  const peakChartData = useMemo(() => heatmapData.slice(-7), [heatmapData]);

  const { trendPercent, isTrendUp } = useMemo(() => {
    const l7 = peakChartData.reduce((a, b) => a + b.count, 0);
    const p7 = heatmapData.slice(-14, -7).reduce((a, b) => a + b.count, 0);
    const pct =
      p7 === 0 ? (l7 > 0 ? 100 : 0) : (((l7 - p7) / p7) * 100).toFixed(1);
    return {
      last7Total: l7,
      prev7Total: p7,
      trendPercent: pct,
      isTrendUp: pct >= 0,
    };
  }, [peakChartData, heatmapData]);

  const typeBreakdown = useMemo(() => {
    const types = ["quantity", "progress", "checklist", "on_progress"];
    const result = {};
    types.forEach((t) => (result[t] = { count: 0, done: 0, progressSum: 0 }));

    allTasks.forEach((task) => {
      const t = task.type || "checklist";
      if (result[t]) {
        result[t].count++;
        if (task.status === "done") result[t].done++;
        const prog =
          task.status === "done"
            ? 100
            : Math.min(
                100,
                Math.max(0, parseFloat(task.progress_percentage) || 0),
              );
        result[t].progressSum += prog;
      }
    });

    return Object.keys(result)
      .filter((k) => result[k].count > 0)
      .map((k) => ({
        type: k,
        ...result[k],
        avgProgress:
          result[k].count > 0
            ? Math.round(result[k].progressSum / result[k].count)
            : 0,
        completionRate:
          result[k].count > 0
            ? ((result[k].done / result[k].count) * 100).toFixed(1)
            : 0,
      }));
  }, [allTasks]);

  // CUSTOM TOOLTIP UNTUK SHADCN AREA CHART (DARK THEME)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border shadow-xl rounded-xl p-3 text-sm flex flex-col gap-1 z-50">
          <p className="text-muted-foreground font-medium mb-1">
            {payload[0].payload.fullDate}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="font-semibold text-foreground">Tasks:</span>
            <span className="font-bold text-accent">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="py-4 md:p-8 flex-1 overflow-auto bg-background space-y-6 custom-scrollbar text-foreground min-h-screen font-sans">
      {/* 1. KPI CARDS (DARK THEME) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Total Tasks",
            value: totalTasks,
            trend: `+${trendPercent}%`,
            trendUp: isTrendUp,
            desc: "from last week",
            icon: <Layers size={20} className="text-accent" />,
            bgColor: "bg-accent/10",
            trendColor: "text-accent",
          },
          {
            label: "Completed",
            value: completedTasks,
            trend: `${conversionRate}% rate`,
            trendUp: true,
            desc: "success rate",
            icon: <CheckCircle2 size={20} className="text-emerald-400" />,
            bgColor: "bg-emerald-400/10",
            trendColor: "text-emerald-400",
          },
          {
            label: "In Progress",
            value: inProgressTasks,
            trend: "Active",
            trendUp: true,
            desc: "currently working",
            icon: <Activity size={20} className="text-primary" />,
            bgColor: "bg-primary/10",
            trendColor: "text-primary",
          },
          {
            label: "To Do",
            value: pendingTasks,
            trend: "Pending",
            trendUp: false,
            desc: "in queue",
            icon: <Clock size={20} className="text-rose-400" />,
            bgColor: "bg-rose-400/10",
            trendColor: "text-rose-400",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="group rounded-[24px] bg-card p-6 border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div
                  className={`p-2.5 rounded-xl ${kpi.bgColor} transition-transform group-hover:scale-110`}
                >
                  {kpi.icon}
                </div>
              </div>

              <h3 className="text-[40px] font-extrabold text-foreground leading-none tracking-tight">
                {kpi.value}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[12px] font-bold ${kpi.trendColor}`}
                >
                  {kpi.trendUp &&
                    kpi.label !== "Completed" &&
                    kpi.label !== "In Progress" && (
                      <TrendingUp size={14} strokeWidth={2.5} />
                    )}
                  {kpi.trend}
                </span>
                <span className="text-[12px] font-medium text-muted-foreground">
                  {kpi.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2. CHARTS ROW (PEAK TASKS & SUCCESS GAUGE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PEAK TASKS (SHADCN AREA CHART STYLE - DARK) */}
        <div className="bg-card rounded-[28px] p-6 md:p-8 border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col lg:col-span-8 min-h-[320px]">
          <div className="flex items-center justify-between mb-6 z-10">
            <div>
              <h3 className="font-bold text-foreground text-[16px] tracking-wide flex items-center gap-2">
                <BarChart3 className="text-accent" size={18} />
                Task Volume Overview
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1">
                Peak task performance over the last 7 days
              </p>
            </div>
            <div className="bg-secondary text-muted-foreground text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-border">
              Last 7 days
            </div>
          </div>

          <div className="flex-1 w-full mt-2 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={peakChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--accent)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="dayName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <RechartsTooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "var(--border)",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  activeDot={{
                    r: 6,
                    fill: "var(--accent)",
                    stroke: "var(--card)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SUCCESS TARGET - DISCRETE SEGMENTED GAUGE (DARK) */}
        <div className="bg-card rounded-[28px] p-6 md:p-8 border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col items-center justify-between relative lg:col-span-4 min-h-[320px]">
          <div className="w-full flex items-center justify-between mb-4 z-10">
            <h3 className="font-bold text-foreground text-[16px] tracking-wide flex items-center gap-2">
              <Target className="text-emerald-400" size={18} />
              Success Target
            </h3>
            <button className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
              <MoreVertical size={18} />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full relative">
            <div className="relative w-[240px] h-[120px] overflow-hidden">
              <SegmentedGauge value={conversionRate} />

              <div className="absolute bottom-0 left-0 w-full flex flex-col items-center">
                <span className="text-[48px] font-extrabold text-foreground tracking-tighter leading-none">
                  {conversionRate}%
                </span>
                <span className="text-[12px] font-medium text-muted-foreground mt-2">
                  On track for 80% target
                </span>
              </div>
            </div>
          </div>

          <button className="mt-6 w-full py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]">
            Show details
          </button>
        </div>
      </div>

      {/* 3. ROW 3 (HEATMAP & TABLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ACTIVITY HEATMAP (DARK) */}
        <div className="bg-card rounded-[28px] p-6 md:p-8 border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col lg:col-span-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-foreground text-[16px] tracking-wide">
              Activity Pulse
            </h3>
            <span className="text-[11px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-lg">
              Last 35 days
            </span>
          </div>

          <div className="flex justify-center items-start gap-3 flex-1">
            {/* Y-Axis labels */}
            <div className="flex flex-col justify-between pt-[4px] pb-[4px] h-[160px] text-[10px] font-bold text-muted-foreground">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 sm:gap-2 h-[160px]">
              {heatmapData.map((day, i) => {
                let bgColor = "bg-secondary/40";

                if (day.count === 1 || day.count === 2) {
                  bgColor = "bg-accent/40";
                } else if (day.count === 3 || day.count === 4) {
                  bgColor = "bg-accent/80";
                } else if (day.count >= 5) {
                  bgColor = "bg-accent shadow-[0_0_8px_rgba(19,90,134,0.6)]";
                }

                return (
                  <div
                    key={i}
                    className={`w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] rounded-[4px] ${bgColor} hover:ring-2 ring-offset-1 ring-offset-card ring-primary transition-all duration-200 cursor-pointer relative group`}
                  >
                    {/* Tooltip */}
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-all duration-200 bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background border border-border text-foreground text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-lg">
                      <span className="font-bold text-accent">{day.count}</span>{" "}
                      tasks on {day.fullDate}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-border"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-bold text-muted-foreground w-full">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-secondary/40"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/40"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-primary/80"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-primary"></div>
            <span>More</span>
          </div>
        </div>

        {/* TASK DISTRIBUTION TABLE (DARK) */}
        <div className="bg-card rounded-[28px] border border-border shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden lg:col-span-8 flex flex-col">
          <div className="px-6 md:px-8 py-6 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-foreground text-[16px] tracking-wide">
              Task Type Distribution
            </h3>
          </div>
          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Channel
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Total
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Completion
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {typeBreakdown.length > 0 ? (
                  typeBreakdown.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-secondary/30 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TypeBadge type={row.type} />
                      </td>
                      <td className="px-6 py-4 text-[14px] font-bold text-foreground">
                        {row.count}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-semibold text-muted-foreground w-10">
                            {row.completionRate}%
                          </span>
                          <div className="w-24 md:w-32 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                              style={{ width: `${row.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-semibold text-muted-foreground w-10">
                            {row.avgProgress}%
                          </span>
                          <div className="w-24 md:w-32 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-1000"
                              style={{ width: `${row.avgProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <Activity size={32} className="mb-3 text-border" />
                      <span className="text-[13px] font-medium">
                        No data available yet
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[20px] border border-border shadow-sm flex flex-col lg:col-span-2">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground text-[14px] flex items-center gap-2">
            Need Attention
          </h3>
          <div className="text-[11px] font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-md border border-border">
            Pending
          </div>
        </div>
        <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-[300px] custom-scrollbar">
          {allTasks
            .filter((t) => t.status !== "done")
            .slice(0, 5)
            .map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100/60 bg-[#152733]/40 hover:border-gray-200 hover:shadow-sm transition-all cursor-default"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <div
                    className={`w-1.5 h-10 rounded-full flex-shrink-0 ${task.status === "on_progress" ? "bg-indigo-500" : "bg-rose-400"}`}
                  ></div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-[13px] text-gray-800 truncate leading-snug mb-1">
                      {task.task_name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {task.parent_date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {allTasks.filter((t) => t.status !== "done").length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
              <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
              <p className="text-[14px] font-bold text-gray-800">
                All caught up!
              </p>
              <p className="text-[12px] font-semibold text-gray-500 mt-1">
                No pending tasks found.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// KOMPONEN GAUGE CHART BERSEGMEN (DARK THEME)
const SegmentedGauge = ({ value }) => {
  const segments = 40; // Jumlah total garis/segment
  const activeCount = Math.floor((value / 100) * segments);

  const radius = 100;
  const centerX = 120;
  const centerY = 110;

  // Create ticks
  const ticks = Array.from({ length: segments }).map((_, i) => {
    const angleDeg = 180 - (i * 180) / (segments - 1);
    const angleRad = (angleDeg * Math.PI) / 180;

    const innerRadius = radius - 18;
    const x1 = centerX + innerRadius * Math.cos(angleRad);
    const y1 = centerY - innerRadius * Math.sin(angleRad);

    const x2 = centerX + radius * Math.cos(angleRad);
    const y2 = centerY - radius * Math.sin(angleRad);

    const isActive = i < activeCount;

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isActive ? "#10b981" : "#1e2f3b"} // Emerald for active, Muted Background for inactive
        strokeWidth="4"
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    );
  });

  return (
    <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
      {ticks}
    </svg>
  );
};

// BAGIAN BADGE DIBUAT UNTUK DARK THEME
export const TypeBadge = ({ type, className = "" }) => {
  const styles = {
    quantity: "bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/30",
    checklist: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30",
    on_progress: "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30",
    progress: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30",
  };

  const labels = {
    quantity: "Quantity",
    checklist: "Checklist",
    on_progress: "Progress",
    progress: "Progress",
  };

  return (
    <span
      className={`inline-flex items-center rounded-xl px-4 py-2 text-[12px] font-black tracking-widest uppercase ${
        styles[type] || styles.checklist
      } ${className}`}
    >
      <div
        className={`w-2 h-2 rounded-full mr-2.5 opacity-90 ${
          type === "quantity"
            ? "bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]"
            : type === "checklist"
              ? "bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.8)]"
              : "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]"
        }`}
      />
      {labels[type] || "Checklist"}
    </span>
  );
};
