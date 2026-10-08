"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LabelList,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { RefreshCw, TrendingUp } from "lucide-react";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { formatDateDb } from "@/lib/date-format-db";
import { useApiFetch } from "@/hooks/use-api-fetch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

/* -------------------------------------------------------------------------- */
/* Konstanta                                                                  */
/* -------------------------------------------------------------------------- */

const COLOR_REPLIED = "var(--primary)";
const COLOR_UNREPLIED = "var(--chart-2)";
const PIE_COLORS = [COLOR_REPLIED, COLOR_UNREPLIED];

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 };

const formatShortDate = (date) =>
  date
    ? date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

/* -------------------------------------------------------------------------- */
/* Tooltip                                                                    */
/* -------------------------------------------------------------------------- */

const TooltipShell = ({ title, total, children }) => (
  <div className="rounded-xl border border-border bg-card px-4 py-3 text-foreground shadow-lg">
    <p className="mb-2 border-b border-border pb-2 text-[13px] font-bold text-primary">
      {title}
    </p>
    <div className="space-y-1.5 text-xs">{children}</div>
    <p className="mt-2 border-t border-border pt-2 text-xs font-bold">
      Total: {total}
    </p>
  </div>
);

const TooltipRow = ({ label, value, color }) => (
  <p className="flex items-center justify-between gap-6">
    <span className="flex items-center gap-2 text-muted-foreground">
      {color && (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
    <span className="font-bold text-foreground">{value}</span>
  </p>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, e) => sum + (e.value || 0), 0);

  return (
    <TooltipShell title={label} total={total}>
      {payload.map((entry) => (
        <TooltipRow
          key={entry.dataKey}
          label={entry.name}
          value={entry.value}
          color={entry.color || entry.stroke || entry.fill}
        />
      ))}
    </TooltipShell>
  );
};

const PieTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const value = d.payload?.value ?? d.value ?? 0;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

  return (
    <TooltipShell title={d.name} total={total}>
      <TooltipRow label="Jumlah" value={value} />
      <TooltipRow label="Persentase" value={`${pct}%`} />
    </TooltipShell>
  );
};

/* -------------------------------------------------------------------------- */
/* Helper data                                                                */
/* -------------------------------------------------------------------------- */

const getDefaultDateRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
};

const extractLeadsFromResponse = (apiData) => {
  if (apiData?.data?.data && Array.isArray(apiData.data.data)) {
    return apiData.data.data;
  }
  if (apiData?.data && Array.isArray(apiData.data)) {
    return apiData.data;
  }
  if (Array.isArray(apiData)) {
    return apiData;
  }
  return [];
};

const transformLeadsToMonthlyData = (leads) => {
  if (!Array.isArray(leads) || leads.length === 0) return [];

  const monthlyData = {};

  leads.forEach((lead) => {
    const dateStr = lead.date || lead.cretime;
    if (!dateStr) return;

    const dateKey = dateStr.split(" ")[0];
    if (!dateKey) return;

    const [year, month, day] = dateKey.split("-").map(Number);
    if (!year || !month || !day) return;

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return;

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: date.toLocaleDateString("id-ID", {
          month: "short",
          year: "numeric",
        }),
        monthKey,
        terbalas: 0,
        tidak_terbalas: 0,
        total: 0,
      };
    }

    monthlyData[monthKey].total++;

    // Status kosong atau "gajelas" dihitung tidak terbalas
    const status = lead.status?.trim().toLowerCase() || "";
    const isTerbalas = status && !["gajelas"].includes(status);

    if (isTerbalas) {
      monthlyData[monthKey].terbalas++;
    } else {
      monthlyData[monthKey].tidak_terbalas++;
    }
  });

  return Object.values(monthlyData).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey),
  );
};

/* -------------------------------------------------------------------------- */
/* Potongan UI yang dipakai ulang                                             */
/* -------------------------------------------------------------------------- */

const ChartMessage = ({ children, spinner = false }) => (
  <div className="flex h-full items-center justify-center text-center">
    <div>
      {spinner && (
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      )}
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  </div>
);

const ChartLegend = ({ items }) => (
  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border pt-3">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-sm"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-xs text-muted-foreground">{item.label}</span>
        {item.extra && (
          <span className="text-xs font-bold text-foreground">
            {item.extra}
          </span>
        )}
      </div>
    ))}
  </div>
);

const hideZero = (v) => (v > 0 ? v : "");

/* -------------------------------------------------------------------------- */
/* Komponen utama                                                             */
/* -------------------------------------------------------------------------- */

export default function LeadsChartManagement() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [selectedChart, setSelectedChart] = useState("bar");

  const query = useMemo(() => {
    if (!startDate || !endDate) return {};

    return {
      fields: "id,status,date",
      sort: "date",
      filter: {
        date_between: {
          start: formatDateDb(startDate),
          end: formatDateDb(endDate),
        },
      },
    };
  }, [startDate, endDate]);

  const { data: apiData, isLoading } = useApiFetch("leads", "/leads", query);

  const chartData = useMemo(() => {
    if (!apiData) return [];
    const leads = extractLeadsFromResponse(apiData);
    return transformLeadsToMonthlyData(leads);
  }, [apiData]);

  const pieChartData = useMemo(() => {
    if (!chartData.length) return [];
    const terbalas = chartData.reduce((s, r) => s + r.terbalas, 0);
    const tidakTerbalas = chartData.reduce((s, r) => s + r.tidak_terbalas, 0);
    const out = [];
    if (terbalas > 0) out.push({ name: "Terbalas", value: terbalas });
    if (tidakTerbalas > 0)
      out.push({ name: "Tidak Terbalas", value: tidakTerbalas });
    return out;
  }, [chartData]);

  const pieTotal = useMemo(
    () => pieChartData.reduce((s, r) => s + r.value, 0),
    [pieChartData],
  );

  const percentageChange = useMemo(() => {
    if (chartData.length < 2) return 0;

    const lastMonth = chartData[chartData.length - 1]?.total || 0;
    const previousMonth = chartData[chartData.length - 2]?.total || 0;

    if (previousMonth === 0) return lastMonth > 0 ? 100 : 0;

    return Math.round(((lastMonth - previousMonth) / previousMonth) * 100);
  }, [chartData]);

  const handleReset = () => {
    const range = getDefaultDateRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const hasData =
    selectedChart === "pie" ? pieChartData.length > 0 : chartData.length > 0;

  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: AXIS_TICK,
  };

  const grid = (
    <CartesianGrid
      strokeDasharray="3 3"
      vertical={false}
      stroke="var(--border)"
    />
  );

  const legendItems =
    selectedChart === "pie"
      ? pieChartData.map((d, i) => ({
          label: d.name,
          color: PIE_COLORS[i % PIE_COLORS.length],
          extra: `${d.value} (${((d.value / pieTotal) * 100).toFixed(1)}%)`,
        }))
      : [
          { label: "Terbalas", color: COLOR_REPLIED },
          { label: "Tidak Terbalas", color: COLOR_UNREPLIED },
        ];

  const renderChart = () => {
    switch (selectedChart) {
      case "line":
        return (
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            {grid}
            <XAxis dataKey="name" dy={10} {...axisProps} />
            <YAxis width={40} allowDecimals={false} {...axisProps} />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border)" }}
            />
            <Line
              name="Terbalas"
              dataKey="terbalas"
              type="monotone"
              stroke={COLOR_REPLIED}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              name="Tidak Terbalas"
              dataKey="tidak_terbalas"
              type="monotone"
              stroke={COLOR_UNREPLIED}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          >
            {grid}
            <XAxis dataKey="name" dy={10} {...axisProps} />
            <YAxis width={40} allowDecimals={false} {...axisProps} />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--border)" }}
            />
            <Area
              name="Terbalas"
              dataKey="terbalas"
              type="monotone"
              stackId="a"
              stroke={COLOR_REPLIED}
              fill={COLOR_REPLIED}
              fillOpacity={0.35}
            />
            <Area
              name="Tidak Terbalas"
              dataKey="tidak_terbalas"
              type="monotone"
              stackId="a"
              stroke={COLOR_UNREPLIED}
              fill={COLOR_UNREPLIED}
              fillOpacity={0.35}
            />
          </AreaChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {pieChartData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<PieTooltip total={pieTotal} />} />
          </PieChart>
        );

      case "bar":
      default:
        return (
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            barCategoryGap="20%"
          >
            {grid}
            <XAxis dataKey="name" dy={10} {...axisProps} />
            <YAxis width={40} allowDecimals={false} {...axisProps} />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--muted)", opacity: 0.35 }}
            />
            <Bar
              name="Terbalas"
              dataKey="terbalas"
              stackId="a"
              radius={[0, 0, 6, 6]}
              fill={COLOR_REPLIED}
            >
              <LabelList
                dataKey="terbalas"
                position="inside"
                formatter={hideZero}
                fill="var(--primary-foreground)"
                fontSize={10}
                fontWeight="bold"
              />
            </Bar>
            <Bar
              name="Tidak Terbalas"
              dataKey="tidak_terbalas"
              stackId="a"
              radius={[6, 6, 0, 0]}
              fill={COLOR_UNREPLIED}
            >
              <LabelList
                dataKey="tidak_terbalas"
                position="inside"
                formatter={hideZero}
                fill="var(--primary-foreground)"
                fontSize={10}
                fontWeight="bold"
              />
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    // Wrapper container: semua breakpoint (@md, @2xl) mengikuti LEBAR CARD,
    // bukan lebar layar. Ini yang membuat filter tidak kepotong di kolom sempit.
    <div className="@container h-full">
      <div className="flex h-full min-h-[400px] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm @md:p-5">
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-bold text-primary @md:text-lg">
              <TrendingUp size={18} className="shrink-0" />
              <span className="truncate">Leads Trend</span>
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatShortDate(startDate)} - {formatShortDate(endDate)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded px-2 py-1 text-xs font-bold shadow-sm ${
              percentageChange >= 0
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {percentageChange >= 0 ? "+" : ""}
            {percentageChange}%
          </span>
        </div>

        {/* Filter: kolom di card sempit, satu baris di card lebar */}
        <div className="mb-4 flex shrink-0 flex-col gap-2 @2xl:flex-row @2xl:items-center">
          <div className="flex min-w-0 items-center gap-2 @2xl:w-64 @2xl:shrink-0">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              aria-label="Reset filter tanggal"
              className="shrink-0 border-border bg-background text-foreground hover:border-primary hover:bg-accent/10"
            >
              <RefreshCw className="size-4" />
            </Button>
            <Select value={selectedChart} onValueChange={setSelectedChart}>
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue placeholder="Pilih tipe chart" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal: tumpuk di card sempit, berdampingan mulai @md */}
          <div className="grid min-w-0 grid-cols-1 gap-2 @md:grid-cols-[1fr_auto_1fr] @md:items-center @2xl:flex-1">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder=""
              label=""
              className="w-full min-w-0"
              format={formatShortDate}
            />
            <span className="hidden text-muted-foreground @md:block">-</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder=""
              label=""
              className="w-full min-w-0"
              format={formatShortDate}
            />
          </div>
        </div>

        {/* Area chart: tinggi mengikuti lebar card */}
        <div className="relative h-64 w-full min-w-0 flex-1 @md:h-80">
          {isLoading ? (
            <ChartMessage spinner>Loading data...</ChartMessage>
          ) : !hasData ? (
            <ChartMessage>Tidak ada data pada rentang tanggal ini</ChartMessage>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>

              {selectedChart === "pie" && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-3xl font-bold text-foreground">
                    {pieTotal}
                  </span>
                  <span className="text-xs text-muted-foreground">leads</span>
                </div>
              )}
            </>
          )}
        </div>

        {!isLoading && hasData && <ChartLegend items={legendItems} />}
      </div>
    </div>
  );
}
