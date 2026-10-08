"use client";

import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from "recharts";
import { RefreshCw, PieChart as PieChartIcon } from "lucide-react";
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

/** Palet dari design token. Index 0 = primary, jadi tidak boleh diulang. */
const CHART_COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--secondary)",
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--destructive)",
  "var(--indigo)",
  "var(--violet)",
];

const getColor = (index) => CHART_COLORS[index % CHART_COLORS.length];

const CATEGORY_LABELS = {
  request_type: "Kebutuhan",
  building_type: "Jenis Bangunan",
  status: "Status",
  source: "Sumber",
  location: "Alamat",
};

const formatShortDate = (date) =>
  date
    ? date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

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

const transformLeadsToPieData = (leads, category) => {
  if (!Array.isArray(leads) || leads.length === 0) return [];

  const categoryMap = {};

  leads.forEach((lead) => {
    let key = lead[category];

    if (
      key === null ||
      key === undefined ||
      (typeof key === "string" && key.trim() === "")
    ) {
      key = "-";
    } else {
      key = String(key).trim();
      if (category === "location") {
        key = key.toLowerCase();
      }
    }

    categoryMap[key] = (categoryMap[key] || 0) + 1;
  });

  return Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);
};

export default function LeadsPieChartManagement() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [selectedCategory, setSelectedCategory] = useState("request_type");
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const query = useMemo(() => {
    if (!startDate || !endDate) return {};

    return {
      fields: "id,request_type,building_type,status,source,location",
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
    return transformLeadsToPieData(leads, selectedCategory);
  }, [apiData, selectedCategory]);

  const totalLeads = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData],
  );

  const handleReset = () => {
    const range = getDefaultDateRange();
    setStartDate(range.start);
    setEndDate(range.end);
  };

  const hoveredIndex = hoveredSegment
    ? chartData.findIndex((d) => d.name === hoveredSegment)
    : -1;

  const displayValue =
    hoveredIndex >= 0 ? chartData[hoveredIndex].value : totalLeads;
  const displayLabel = hoveredIndex >= 0 ? hoveredSegment : "Total";

  return (
    // @container: semua breakpoint (@md, @2xl) mengikuti LEBAR CARD, bukan layar.
    <div className="@container h-full">
      <div className="flex h-full min-h-[400px] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm @md:p-5">
        {/* Header */}
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-base font-bold text-primary @md:text-lg">
              <PieChartIcon size={18} className="shrink-0" />
              <span className="truncate">Leads Analytics</span>
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatShortDate(startDate)} - {formatShortDate(endDate)}
            </p>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground shadow-sm">
            {totalLeads} Leads
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
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="min-w-0 flex-1">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tanggal: bertumpuk di card sempit, berdampingan mulai @md */}
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

        {/* Chart */}
        <div className="flex min-h-0 w-full flex-1 flex-col">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-sm text-muted-foreground">
                Tidak ada data pada rentang tanggal ini
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              {/* Donut + total di tengah. Tinggi mengikuti lebar card. */}
              <div className="relative h-56 w-full min-w-0 @md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="45%"
                      outerRadius="75%"
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="transparent"
                      label={false}
                      labelLine={false}
                      activeIndex={hoveredIndex}
                      activeShape={(props) => (
                        <Sector
                          cx={props.cx}
                          cy={props.cy}
                          innerRadius={props.innerRadius}
                          outerRadius={props.outerRadius * 1.08}
                          startAngle={props.startAngle}
                          endAngle={props.endAngle}
                          fill={props.fill}
                        />
                      )}
                      onMouseEnter={(_, index) =>
                        chartData[index] &&
                        setHoveredSegment(chartData[index].name)
                      }
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {chartData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={getColor(i)}
                          className="cursor-pointer outline-none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12"
                  aria-hidden
                >
                  <span className="max-w-full truncate text-xs font-medium text-muted-foreground">
                    {displayLabel}
                  </span>
                  <span className="text-2xl font-bold tracking-tight text-foreground @md:text-3xl">
                    {displayValue.toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-muted-foreground">leads</span>
                </div>
              </div>

              {/* Legend: membungkus otomatis, tanpa scale agar tidak meluber */}
              <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-border pt-4">
                {chartData.map((entry, i) => {
                  const pct =
                    totalLeads > 0
                      ? Number(((entry.value / totalLeads) * 100).toFixed(1))
                      : 0;
                  const dimmed = hoveredIndex >= 0 && hoveredIndex !== i;

                  return (
                    <li
                      key={entry.name}
                      className={`flex min-w-0 cursor-pointer items-center gap-2 transition-opacity duration-200 ${
                        dimmed ? "opacity-40" : "opacity-100"
                      }`}
                      onMouseEnter={() => setHoveredSegment(entry.name)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      <span
                        className="size-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: getColor(i) }}
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.name}{" "}
                        <span className="font-semibold text-foreground">
                          ({pct}%)
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-3 text-center text-sm font-semibold text-primary">
                Distribusi {CATEGORY_LABELS[selectedCategory]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
