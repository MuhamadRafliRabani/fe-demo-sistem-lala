"use client";
import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  Award,
  ArrowUpRight,
  Search,
  ChevronDown,
  Star,
  Clock,
  MessageSquare,
  X,
  ChevronRight,
  BarChart2,
  Zap,
  RefreshCw,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { UserSelection } from "@/components/user-selection";
import { useAuthStore } from "@/hooks/auth-store";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DeltaBadge = ({ value, className = "" }) => {
  if (value === null || value === undefined) return null;
  const abs = Math.abs(value).toFixed(1);
  if (value > 0)
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 ${className}`}
      >
        <TrendingUp className="w-2.5 h-2.5" />
        {abs}
      </span>
    );
  if (value < 0)
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 ${className}`}
      >
        <TrendingDown className="w-2.5 h-2.5" />
        {abs}
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground ${className}`}
    >
      <Minus className="w-2.5 h-2.5" />0
    </span>
  );
};

const ScoreBar = ({ value, prev }) => {
  const color =
    value >= 90
      ? "bg-primary"
      : value >= 70
        ? "bg-muted-foreground"
        : "bg-destructive";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden relative">
        {prev !== null && prev !== undefined && (
          <div
            className="absolute top-0 h-full w-0.5 bg-border z-10 opacity-60"
            style={{ left: `${Math.min(prev, 100)}%` }}
          />
        )}
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-foreground w-8 text-right">
        {parseFloat(value).toFixed(0)}
      </span>
    </div>
  );
};

// ─── Trend Chart Tooltip ────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-sm text-xs min-w-[140px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-medium" style={{ color: entry.color }}>
            {parseFloat(entry.value).toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Employee Detail Drawer ─────────────────────────────────────────────────────

function EmployeeDrawer({ employee, onClose }) {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!employee) return;
    setLoading(true);
    axiosInstance
      .get(`/user-kpis/${employee.ll_st_user_id}/trend`)
      .then((res) => setTrendData(res.data?.data || []))
      .catch(() => setTrendData([]))
      .finally(() => setLoading(false));
  }, [employee?.ll_st_user_id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!employee) return null;

  const tasks = employee.tasks_summary || {};
  const totalTasks =
    (tasks.easy || 0) +
    (tasks.medium || 0) +
    (tasks.hard || 0) +
    (tasks.veryHard || 0);

  const taskConfig = [
    {
      key: "easy",
      label: "Easy",
      pts: "1pt",
      color: "bg-sky-400",
      textColor: "text-sky-700 dark:text-sky-300",
    },
    {
      key: "medium",
      label: "Medium",
      pts: "3pt",
      color: "bg-violet-400",
      textColor: "text-violet-700 dark:text-violet-300",
    },
    {
      key: "hard",
      label: "Hard",
      pts: "7pt",
      color: "bg-amber-400",
      textColor: "text-amber-700 dark:text-amber-300",
    },
    {
      key: "veryHard",
      label: "Very Hard",
      pts: "12pt",
      color: "bg-rose-500",
      textColor: "text-rose-700 dark:text-rose-300",
    },
  ];

  const metricCards = [
    {
      label: "Output Kerja",
      value: employee.score_output,
      prev: employee.prev_score_output,
      icon: <BarChart2 className="w-3.5 h-3.5" />,
      weight: "70%",
    },
    {
      label: "Absensi",
      value: employee.score_absensi,
      prev: employee.prev_score_absensi,
      icon: <Clock className="w-3.5 h-3.5" />,
      weight: "10%",
    },
    {
      label: "Perilaku",
      value: employee.score_perilaku,
      prev: employee.prev_score_perilaku,
      icon: <Users className="w-3.5 h-3.5" />,
      weight: "10%",
    },
    {
      label: "Komunikasi",
      value: employee.score_komunikasi,
      prev: employee.prev_score_komunikasi,
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      weight: "10%",
    },
  ];

  const chartLines = [
    { key: "final_score", name: "Final", color: "#6366f1" },
    { key: "score_output", name: "Output", color: "#10b981" },
    { key: "score_absensi", name: "Absensi", color: "#f59e0b" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-[480px] z-50 bg-background border-l border-border shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                employee.user_avatar
                  ? resolveImageUrl(employee.user_avatar)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.user_name)}&background=random`
              }
              alt={employee.user_name}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">
                {employee.user_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {employee.role_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${employee.statusStyle.bg} ${employee.statusStyle.color} ${employee.statusStyle.border}`}
            >
              {employee.status}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Final Score Hero */}
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Skor Akhir Bulan Ini
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {parseFloat(employee.final_score).toFixed(1)}
                </span>
                <DeltaBadge
                  value={employee.delta_final_score}
                  className="text-xs"
                />
              </div>
              {employee.prev_final_score !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Bulan lalu:{" "}
                  <span className="font-medium text-foreground">
                    {parseFloat(employee.prev_final_score).toFixed(1)}
                  </span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1.5">
                Poin Output
              </p>
              <p className="text-lg font-bold text-foreground">
                {employee.achieved_points}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {employee.target_points}
                </span>
              </p>
              {employee.bonus_points > 0 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                  <Zap className="w-3 h-3" />+{employee.bonus_points} bonus
                </p>
              )}
              <DeltaBadge value={employee.delta_achieved_points} />
            </div>
          </div>

          {/* Metric Breakdown */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Breakdown Skor
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {metricCards.map(({ label, value, prev, icon, weight }) => {
                const delta =
                  prev !== null && prev !== undefined
                    ? +(value - prev).toFixed(1)
                    : null;
                return (
                  <div
                    key={label}
                    className="bg-card border border-border rounded-xl p-3.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {icon}
                        <span className="text-[11px] font-medium">{label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {weight}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-foreground">
                        {parseFloat(value).toFixed(0)}
                      </span>
                      <DeltaBadge value={delta} />
                    </div>
                    {prev !== null && prev !== undefined && (
                      <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(value, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6-Month Trend Chart */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tren 6 Bulan Terakhir
            </p>
            <div className="bg-card border border-border rounded-2xl p-4">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : trendData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                  Belum ada data historis
                </div>
              ) : (
                <>
                  {/* Legend manual */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    {chartLines.map(({ key, name, color }) => (
                      <span
                        key={key}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <span
                          className="w-3 h-0.5 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        {name}
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart
                      data={trendData.map((d) => ({
                        ...d,
                        name: d.month_label,
                      }))}
                      margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(128,128,128,0.12)"
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                      <ReferenceLine
                        y={90}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      {chartLines.map(({ key, name, color }) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={name}
                          stroke={color}
                          strokeWidth={2}
                          dot={{ r: 3, fill: color, strokeWidth: 0 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    Garis kuning = batas Warning (70), garis hijau = batas
                    Excellent (90)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Task Breakdown */}
          {totalTasks > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Komposisi Task Bulan Ini
              </p>
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                {/* Stacked bar */}
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  {taskConfig.map(({ key, color }) => {
                    const count = tasks[key] || 0;
                    const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={key}
                        className={`${color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    );
                  })}
                </div>
                {/* Legend rows */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                  {taskConfig.map(({ key, label, pts, color, textColor }) => {
                    const count = tasks[key] || 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${color}`} />
                          <span className={`text-xs font-medium ${textColor}`}>
                            {label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({pts})
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {(tasks.rev || 0) > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 border-t border-border pt-2 mt-1">
                    ⚠ {tasks.rev} task revisi (−15% per poin)
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
                  Total task selesai:{" "}
                  <span className="font-semibold text-foreground">
                    {totalTasks}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function App() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterEmployeeId, setFilterEmployeeId] = useState([]);
  const { isAdmin } = useAuthStore();

  const { data: apiData, isLoading } = useApiFetch(
    ["user-kpis", year, month, filterEmployeeId],
    `/user-kpis?year=${year}&month=${month}&employee_id=${filterEmployeeId.join(",")}`,
  );

  const { mutate: generateKPI } = usePost((payload) => `/user-kpis/generate`, {
    invalidateKey: ["user-kpis", year, month],
  });

  const queryClient = useQueryClient();

  const { mutate: updateQualitative } = usePut(
    (payload) => `/user-kpis/${payload.id}/qualitative`,
    {
      onMutate: async (newData) => {
        const queryKey = ["user-kpis", year, month];
        await queryClient.cancelQueries({ queryKey });
        const previousKpis = queryClient.getQueryData(queryKey);
        if (previousKpis?.data) {
          queryClient.setQueryData(queryKey, (old) => ({
            ...old,
            data: old.data.map((item) =>
              item.id === newData.id ? { ...item, ...newData } : item,
            ),
          }));
        }
        return { previousKpis, queryKey };
      },
      onError: (err, _newData, context) => {
        if (context?.previousKpis) {
          queryClient.setQueryData(
            ["user-kpis", year, month],
            context.previousKpis,
          );
        }
        toast.error(err?.response?.data?.message || "Gagal menyimpan nilai");
      },
      onSuccess: (res) => {
        if (res?.data) {
          queryClient.setQueryData(["user-kpis", year, month], (old) => ({
            ...old,
            data: old.data.map((item) =>
              item.id === res.data.id ? { ...item, ...res.data } : item,
            ),
          }));
        }
        toast.success("Berhasil diperbarui");
      },
    },
  );

  const handleUpdateField = useCallback(
    (id, field, value) => {
      const val = parseFloat(value);
      if (isNaN(val)) return;
      updateQualitative({ id, [field]: val });
    },
    [updateQualitative],
  );

  const handleExportExcel = async () => {
    try {
      const promise = axiosInstance.get(
        `/user-kpis/export?year=${year}&month=${month}&employee_id=${filterEmployeeId.join(",")}`,
        { responseType: "blob" },
      );
      toast.promise(promise, {
        loading: "Menyiapkan file Excel KPI...",
        success: "Export Excel berhasil!",
        error: "Export Excel gagal, silakan coba lagi.",
      });
      const res = await promise;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `KPI-REPORT-${year}-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal export excel:", err);
    }
  };

  const rawData = apiData?.data || [];

  const data = useMemo(() => {
    return rawData
      .filter((d) => {
        if (!searchQuery) return true;
        return String(d.user_name)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      })
      .map((d) => {
        let statusColor = "text-rose-600 dark:text-rose-400";
        let statusBg = "bg-rose-50 dark:bg-rose-500/10";
        let statusBorder = "border-rose-200 dark:border-rose-500/20";
        if (d.status === "Excellent") {
          statusColor = "text-emerald-700 dark:text-emerald-400";
          statusBg = "bg-emerald-50 dark:bg-emerald-500/10";
          statusBorder = "border-emerald-200 dark:border-emerald-500/20";
        } else if (d.status === "Good") {
          statusColor = "text-blue-700 dark:text-blue-400";
          statusBg = "bg-blue-50 dark:bg-blue-500/10";
          statusBorder = "border-blue-200 dark:border-blue-500/20";
        } else if (d.status === "Fair") {
          statusColor = "text-indigo-700 dark:text-indigo-400";
          statusBg = "bg-indigo-50 dark:bg-indigo-500/10";
          statusBorder = "border-indigo-200 dark:border-indigo-500/20";
        } else if (d.status === "Warning") {
          statusColor = "text-amber-700 dark:text-amber-400";
          statusBg = "bg-amber-50 dark:bg-amber-500/10";
          statusBorder = "border-amber-200 dark:border-amber-500/20";
        }
        return {
          ...d,
          statusStyle: {
            color: statusColor,
            bg: statusBg,
            border: statusBorder,
          },
        };
      });
  }, [rawData, searchQuery]);

  // ─── Summary stats ──────────────────────────────────────────────────────────
  const avgCompanyKPI =
    data.length > 0
      ? (
          data.reduce((acc, d) => acc + parseFloat(d.final_score), 0) /
          data.length
        ).toFixed(1)
      : "0.0";

  const prevData = data.filter((d) => d.prev_final_score !== null);
  const avgPrevKPI =
    prevData.length > 0
      ? (
          prevData.reduce((acc, d) => acc + parseFloat(d.prev_final_score), 0) /
          prevData.length
        ).toFixed(1)
      : null;

  const companyDelta =
    avgPrevKPI !== null
      ? +(parseFloat(avgCompanyKPI) - parseFloat(avgPrevKPI)).toFixed(1)
      : null;

  const excellentCount = data.filter(
    (d) => parseFloat(d.final_score) >= 90,
  ).length;
  const warningCount = data.filter(
    (d) => parseFloat(d.final_score) < 70,
  ).length;
  const prevExcellent = data.filter(
    (d) => d.prev_final_score !== null && parseFloat(d.prev_final_score) >= 90,
  ).length;
  const prevWarning = data.filter(
    (d) => d.prev_final_score !== null && parseFloat(d.prev_final_score) < 70,
  ).length;
  const excellentDelta =
    prevData.length > 0 ? excellentCount - prevExcellent : null;
  const warningDelta = prevData.length > 0 ? warningCount - prevWarning : null;

  // const handleGenerateKPI = async () => {
  //   toast.promise(generateKPI({ year, month }), {
  //     loading: "Menghitung KPI karyawan...",
  //     success: "KPI berhasil dihitung!",
  //     error: "Gagal menghitung KPI, silakan coba lagi.",
  //   });
  // };

  return (
    <DashboardLayout>
      <div className="min-h-screen font-sans bg-background text-foreground transition-colors duration-300">
        <main className="md:px-6 py-8 space-y-8">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Company Overview
              </h1>
              <p className="text-muted-foreground mt-1">
                Laporan metrik performa karyawan (KPI) bulan ini.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-2">
                <Select
                  value={year?.toString()}
                  onValueChange={(v) => setYear(parseInt(v))}
                >
                  <SelectTrigger className="w-[120px] rounded-lg bg-background">
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={month?.toString()}
                  onValueChange={(v) => setMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-[180px] rounded-lg bg-background">
                    <SelectValue placeholder="Pilih Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2000, i, 1).toLocaleString("id-ID", {
                          month: "long",
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && (
                <>
                  <UserSelection
                    value={filterEmployeeId}
                    onChange={setFilterEmployeeId}
                  />
                  <button
                    onClick={() =>
                      toast.promise(
                        axiosInstance
                          .post(`/user-kpis/generate`, { year, month })
                          .then(() =>
                            queryClient.invalidateQueries({
                              queryKey: ["user-kpis", year, month],
                            }),
                          ),
                        {
                          loading: "Refresh KPI...",
                          success: "Data diperbarui!",
                          error: "Gagal refresh",
                        },
                      )
                    }
                    className="p-2 rounded-lg hover:bg-muted bg-accent text-muted hover:text-foreground transition-colors"
                    title="Refresh KPI manual"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg shadow-sm hover:opacity-90 flex items-center gap-2 transition-opacity text-sm"
                  >
                    Export Report
                    <ChevronDown className="w-4 h-4 text-primary-foreground/70" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Summary Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Main Metric */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Rata-rata KPI Perusahaan
                  </p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-5xl font-bold tracking-tighter text-foreground">
                      {avgCompanyKPI}
                    </h2>
                    {companyDelta !== null ? (
                      <span
                        className={`flex items-center text-sm font-medium px-2 py-0.5 rounded-md gap-0.5 ${
                          companyDelta >= 0
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                            : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10"
                        }`}
                      >
                        {companyDelta >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        {Math.abs(companyDelta)} vs bulan lalu
                      </span>
                    ) : (
                      <span className="flex items-center text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md gap-0.5">
                        <Minus className="w-3.5 h-3.5" /> —
                      </span>
                    )}
                  </div>
                  {avgPrevKPI && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Bulan lalu:{" "}
                      <span className="font-medium text-foreground">
                        {avgPrevKPI}
                      </span>
                    </p>
                  )}
                </div>
                <div className="p-3 bg-muted rounded-xl border border-border">
                  <TrendingUp className="w-6 h-6 text-foreground" />
                </div>
              </div>
              <div className="mt-6 flex gap-8 text-sm">
                <div>
                  <span className="block text-muted-foreground font-medium mb-0.5">
                    Target Rata-rata
                  </span>
                  <input
                    defaultValue="85.0"
                    className="w-16 bg-transparent font-semibold text-foreground rounded py-0.5 px-2 -ml-2 focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all leading-tight"
                  />
                </div>
                <div>
                  <span className="block text-muted-foreground font-medium mb-0.5">
                    Total Karyawan
                  </span>
                  <span className="font-semibold text-foreground">
                    {data.length} Orang
                  </span>
                </div>
              </div>
            </div>

            {/* Excellent Card */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg w-fit">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="flex items-baseline gap-2 mt-4">
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {excellentCount}
                  </h3>
                  {excellentDelta !== null && (
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        excellentDelta >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {excellentDelta >= 0 ? "↑" : "↓"}
                      {Math.abs(excellentDelta)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Kategori Excellent (≥90)
                </p>
              </div>
            </div>

            {/* Warning Card */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg w-fit">
                <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-baseline gap-2 mt-4">
                  <h3 className="text-3xl font-bold tracking-tight text-foreground">
                    {warningCount}
                  </h3>
                  {warningDelta !== null && (
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        warningDelta <= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {warningDelta > 0 ? "↑" : warningDelta < 0 ? "↓" : "—"}
                      {Math.abs(warningDelta)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Perlu Evaluasi (&lt;70)
                </p>
              </div>
            </div>
          </div>

          {/* ── Table ───────────────────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Performa Individu
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klik baris untuk melihat detail &amp; tren 6 bulan
                </p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-background border border-input text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-64 transition-shadow"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Karyawan
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Poin Output
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground w-48">
                      Skor Output (70%)
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground">
                      Kualitatif (30%)
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground text-right">
                      Skor Akhir
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 font-medium text-muted-foreground text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-10 text-muted-foreground"
                      >
                        Loading data...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-10 text-muted-foreground"
                      >
                        Tidak ada data KPI. Silakan klik Generate untuk
                        menghitung KPI bulan ini.
                        {/* <button
                          className="text-primary hover:underline"
                          onClick={handleGenerateKPI}
                        >
                          Generate
                        </button> */}
                        {/* . */}
                      </td>
                    </tr>
                  ) : (
                    data.map((row, idx) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedEmployee(row)}
                        className="hover:bg-muted/40 transition-colors group cursor-pointer"
                      >
                        {/* Karyawan */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={
                                  row.user_avatar
                                    ? resolveImageUrl(row.user_avatar)
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user_name)}&background=random`
                                }
                                alt={row.user_name}
                                className="w-10 h-10 rounded-full object-cover border border-border"
                              />
                              {idx === 0 && (
                                <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-0.5 border-2 border-white dark:border-card">
                                  <Star className="w-3 h-3 fill-current" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {row.user_name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {row.role_name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Poin Output */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-foreground flex items-center gap-1">
                              {row.achieved_points}
                              <span className="text-muted-foreground font-normal text-xs">
                                /
                              </span>
                              <input
                                defaultValue={row.target_points}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                  if (e.target.value != row.target_points) {
                                    handleUpdateField(
                                      row.id,
                                      "target_points",
                                      e.target.value,
                                    );
                                  }
                                }}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && e.target.blur()
                                }
                                className="w-12 bg-transparent text-muted-foreground font-normal text-xs rounded py-0.5 px-1 -ml-1 focus:bg-muted focus:text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all leading-tight"
                              />
                            </span>
                            {/* Delta poin */}
                            {row.delta_achieved_points !== null && (
                              <DeltaBadge value={row.delta_achieved_points} />
                            )}
                            <div className="flex gap-1.5 text-[10px] font-medium text-muted-foreground">
                              {[
                                { k: "easy", l: "E" },
                                { k: "medium", l: "M" },
                                { k: "hard", l: "H" },
                                { k: "veryHard", l: "V" },
                              ].map(({ k, l }) => (
                                <span
                                  key={k}
                                  className="bg-muted border border-border/50 px-1.5 py-0.5 rounded"
                                  title={k}
                                >
                                  {row.tasks_summary?.[k] || 0}
                                  {l}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>

                        {/* Skor Output */}
                        <td className="px-6 py-4">
                          <ScoreBar
                            value={row.score_output}
                            prev={row.prev_score_output}
                          />
                          <DeltaBadge
                            value={row.delta_score_output}
                            className="mt-1"
                          />
                        </td>

                        {/* Kualitatif */}
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <Clock
                                className={`w-4 h-4 ${row.score_absensi < 80 ? "text-amber-500" : "text-muted-foreground"}`}
                              />
                              <input
                                readOnly
                                defaultValue={parseFloat(
                                  row.score_absensi,
                                ).toFixed(0)}
                                className="w-10 text-center bg-transparent text-xs font-medium text-foreground rounded py-0.5 px-1 cursor-default focus:outline-none"
                              />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <Users
                                className={`w-4 h-4 ${row.score_perilaku < 80 ? "text-amber-500" : "text-muted-foreground"}`}
                              />
                              <input
                                defaultValue={parseFloat(
                                  row.score_perilaku,
                                ).toFixed(0)}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                  if (
                                    parseFloat(e.target.value) !==
                                    parseFloat(row.score_perilaku)
                                  ) {
                                    handleUpdateField(
                                      row.id,
                                      "score_perilaku",
                                      e.target.value,
                                    );
                                  }
                                }}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && e.target.blur()
                                }
                                className="w-10 text-center bg-transparent text-xs font-medium text-foreground rounded py-0.5 px-1 focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all leading-tight"
                              />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <MessageSquare
                                className={`w-4 h-4 ${row.score_komunikasi < 80 ? "text-amber-500" : "text-muted-foreground"}`}
                              />
                              <input
                                defaultValue={parseFloat(
                                  row.score_komunikasi,
                                ).toFixed(0)}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                  if (
                                    parseFloat(e.target.value) !==
                                    parseFloat(row.score_komunikasi)
                                  ) {
                                    handleUpdateField(
                                      row.id,
                                      "score_komunikasi",
                                      e.target.value,
                                    );
                                  }
                                }}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && e.target.blur()
                                }
                                className="w-10 text-center bg-transparent text-xs font-medium text-foreground rounded py-0.5 px-1 focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all leading-tight"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Skor Akhir */}
                        <td className="px-6 py-4 text-right">
                          <span className="text-lg font-bold tracking-tight text-foreground">
                            {parseFloat(row.final_score).toFixed(1)}
                          </span>
                          <div className="flex justify-end mt-0.5">
                            <DeltaBadge value={row.delta_final_score} />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${row.statusStyle.bg} ${row.statusStyle.color} ${row.statusStyle.border}`}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Chevron hint */}
                        <td className="px-3 py-4 text-center">
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Menampilkan{" "}
                <span className="font-medium text-foreground">
                  {data.length}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-foreground">
                  {data.length}
                </span>{" "}
                karyawan
              </p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm font-medium text-muted-foreground bg-background border border-border rounded-md shadow-sm opacity-50 cursor-not-allowed">
                  Prev
                </button>
                <button className="px-3 py-1 text-sm font-medium text-muted-foreground bg-background border border-border rounded-md shadow-sm opacity-50 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Employee Detail Drawer ─────────────────────────────────────────── */}
      {selectedEmployee && (
        <EmployeeDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </DashboardLayout>
  );
}
