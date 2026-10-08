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
  Area,
  AreaChart,
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        padding: "14px 18px",
        color: "var(--foreground)",
      }}
    >
      <p
        style={{
          color: "var(--primary)",
          fontWeight: "bold",
          fontSize: "13px",
          marginBottom: "10px",
          borderBottom: "2px solid var(--border)",
          paddingBottom: "8px",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          style={{
            color: entry.color || "var(--muted-foreground)",
            fontSize: "12px",
            padding: "6px 0",
            fontWeight: "600",
          }}
        >
          <span
            style={{ color: "var(--muted-foreground)", marginRight: "8px" }}
          >
            {entry.name}:
          </span>
          <span style={{ color: "var(--foreground)", fontWeight: "bold" }}>
            {entry.value}
          </span>
        </p>
      ))}
      <p
        style={{
          color: "var(--foreground)",
          fontSize: "12px",
          paddingTop: "8px",
          marginTop: "8px",
          borderTop: "1px solid var(--border)",
          fontWeight: "bold",
        }}
      >
        Total: {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)}
      </p>
    </div>
  );
};

const PIE_COLORS = ["var(--primary)", "var(--chart-2)"];

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = payload.reduce(
    (sum, e) => sum + (e.payload?.value ?? e.value ?? 0),
    0,
  );
  const pct =
    total > 0
      ? (((d.payload?.value ?? d.value ?? 0) / total) * 100).toFixed(1)
      : 0;
  return (
    <div
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        padding: "14px 18px",
        color: "var(--foreground)",
      }}
    >
      <p
        style={{
          color: "var(--primary)",
          fontWeight: "bold",
          fontSize: "13px",
          marginBottom: "10px",
          borderBottom: "2px solid var(--border)",
          paddingBottom: "8px",
        }}
      >
        {d.name}
      </p>
      <p
        style={{
          color: "var(--muted-foreground)",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        <span style={{ marginRight: "8px" }}>Jumlah:</span>
        <span style={{ color: "var(--foreground)", fontWeight: "bold" }}>
          {d.payload?.value ?? d.value ?? 0}
        </span>
      </p>
      <p
        style={{
          color: "var(--muted-foreground)",
          fontSize: "12px",
          fontWeight: "600",
        }}
      >
        <span style={{ marginRight: "8px" }}>Persentase:</span>
        <span style={{ color: "var(--foreground)", fontWeight: "bold" }}>
          {pct}%
        </span>
      </p>
      <p
        style={{
          color: "var(--foreground)",
          fontSize: "12px",
          paddingTop: "8px",
          marginTop: "8px",
          borderTop: "1px solid var(--border)",
          fontWeight: "bold",
        }}
      >
        Total: {total}
      </p>
    </div>
  );
};

const getDefaultDateRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  endDate.setHours(23, 59, 59, 999);

  return { start: startDate, end: endDate };
};

const extractLeadsFromResponse = (apiData) => {
  // API response: { data: { data: [...] } } → use apiData.data.data
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
    let dateStr = lead.date;
    if (!dateStr && lead.cretime) {
      dateStr = lead.cretime;
    }

    if (!dateStr) return;

    const dateKey = dateStr.split(" ")[0];
    if (!dateKey) return;

    const [year, month, day] = dateKey.split("-").map(Number);
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day))
      return;

    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return;

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const monthName = date.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: monthName,
        monthKey,
        terbalas: 0,
        tidak_terbalas: 0,
        total: 0,
      };
    }

    monthlyData[monthKey].total++;

    // Check status - "No Respon" atau "No Response" atau "Gajelas" = tidak terbalas
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
    if (leads.length === 0) return [];
    return transformLeadsToMonthlyData(leads);
  }, [apiData]);

  const pieChartData = useMemo(() => {
    if (!chartData?.length) return [];
    const terbalas = chartData.reduce((s, r) => s + (r.terbalas ?? 0), 0);
    const tidakTerbalas = chartData.reduce(
      (s, r) => s + (r.tidak_terbalas ?? 0),
      0,
    );
    const out = [];
    if (terbalas > 0) out.push({ name: "Terbalas", value: terbalas });
    if (tidakTerbalas > 0)
      out.push({ name: "Tidak Terbalas", value: tidakTerbalas });
    return out;
  }, [chartData]);

  const percentageChange = useMemo(() => {
    if (chartData.length < 2) return 0;

    const lastMonth = chartData[chartData.length - 1]?.total || 0;
    const previousMonth = chartData[chartData.length - 2]?.total || 0;

    if (previousMonth === 0) return lastMonth > 0 ? 100 : 0;

    return Math.round(((lastMonth - previousMonth) / previousMonth) * 100);
  }, [chartData]);

  const formatDateDisplay = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleReset = () => {
    const range = getDefaultDateRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col shadow-sm min-h-[400px] h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 shrink-0">
        <div>
          <h3 className="font-bold text-primary flex items-center gap-2 text-base md:text-lg">
            <TrendingUp
              size={18}
              className="text-primary transition-transform duration-300 hover:scale-110"
            />
            Leads Trend
          </h3>
          <p className="text-xs text-muted-foreground mt-1 wrap-break-word">
            {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded shadow-sm ${
            percentageChange >= 0
              ? "bg-primary text-primary-foreground"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {percentageChange >= 0 ? "+" : ""}
          {percentageChange}%
        </span>
      </div>

      {/* Controls - responsive: wrap on small screens, date inputs stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-2 shrink-0 flex-1">
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-background border-border text-foreground hover:bg-accent/10 hover:border-primary"
            size="sm"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Select
            id="chart-select"
            value={selectedChart}
            onValueChange={(value) => setSelectedChart(value)}
            className="rounded border border-border bg-background text-foreground text-xs px-2 py-1 focus:outline-primary focus:ring-primary"
          >
            <SelectTrigger className="w-full min-w-[100px] flex-1">
              <SelectValue placeholder="Pilih Tipe Chart" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder=""
              label=""
              className="w-full min-w-0 sm:w-[130px] md:w-[150px]"
              format={(date) =>
                date
                  ? date.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : ""
              }
            />
            <span className="text-muted-foreground shrink-0 hidden sm:inline">
              -
            </span>
          </div>
          <span className="text-muted-foreground shrink-0 sm:hidden self-center">
            sampai
          </span>
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder=""
              label=""
              className="w-full min-w-0 sm:w-[130px] md:w-[150px]"
              format={(date) =>
                date
                  ? date.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : ""
              }
            />
          </div>
        </div>
      </div>

      {selectedChart === "bar" && (
        <>
          <div className="flex-1 w-full min-h-0 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">
                    Loading data...
                  </p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No data available for selected date range
                </p>
              </div>
            ) : (
              <div
                className="flex-1 w-full"
                style={{ minHeight: "300px", height: "100%" }}
              >
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: -25, bottom: 40 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      width={40}
                    />
                    <RechartsTooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                    />
                    <Bar
                      dataKey="terbalas"
                      stackId="a"
                      radius={[6, 6, 0, 0]}
                      fill="var(--primary)"
                    >
                      <LabelList
                        dataKey="terbalas"
                        position="inside"
                        fill="var(--primary-foreground)"
                        fontSize={10}
                        fontWeight="bold"
                      />
                    </Bar>
                    <Bar
                      dataKey="tidak_terbalas"
                      stackId="a"
                      radius={[0, 0, 6, 6]}
                      fill="var(--chart-2)"
                    >
                      <LabelList
                        dataKey="tidak_terbalas"
                        position="inside"
                        fill="var(--primary-foreground)"
                        fontSize={10}
                        fontWeight="bold"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {chartData.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "var(--primary)" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Terbalas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: "var(--chart-2)" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Tidak Terbalas
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedChart === "line" && (
        <>
          <div className="flex-1 w-full min-h-0 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">
                    Loading data...
                  </p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No data available for selected date range
                </p>
              </div>
            ) : (
              <div
                className="flex-1 w-full"
                style={{ minHeight: "300px", height: "100%" }}
              >
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      width={40}
                    />
                    <RechartsTooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                    />
                    <Line
                      dataKey="terbalas"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="tidak_terbalas"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {selectedChart === "area" && (
        <>
          <div className="flex-1 w-full min-h-0 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">
                    Loading data...
                  </p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No data available for selected date range
                </p>
              </div>
            ) : (
              <div
                className="flex-1 w-full"
                style={{ minHeight: "300px", height: "100%" }}
              >
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      width={40}
                    />
                    <RechartsTooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                    />
                    <Area
                      dataKey="terbalas"
                      stackId="a"
                      radius={[6, 6, 0, 0]}
                      fill="var(--primary)"
                    />
                    <Area
                      dataKey="tidak_terbalas"
                      stackId="a"
                      radius={[0, 0, 6, 6]}
                      fill="var(--chart-2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {selectedChart === "pie" && (
        <>
          <div className="flex-1 w-full min-h-0 flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">
                    Loading data...
                  </p>
                </div>
              </div>
            ) : pieChartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No data available for selected date range
                </p>
              </div>
            ) : (
              <div
                className="flex-1 w-full"
                style={{ minHeight: "300px", height: "100%" }}
              >
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="25%"
                      outerRadius="70%"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {pieChartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {pieChartData.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "var(--primary)" }}
                />
                <span className="text-xs text-muted-foreground">Terbalas</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: "var(--chart-2)" }}
                />
                <span className="text-xs text-muted-foreground">
                  Tidak Terbalas
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
