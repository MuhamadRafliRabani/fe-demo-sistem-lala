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

/** Theme-aligned palette using the app design tokens */
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

const brightenColor = (color) => color;

const getDefaultDateRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
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
    const rawValue = lead[category];
    let key = rawValue;

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

    if (!categoryMap[key]) {
      categoryMap[key] = 0;
    }
    categoryMap[key]++;
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
    if (!apiData) {
      return [];
    }

    const leads = extractLeadsFromResponse(apiData);
    if (leads.length === 0) {
      return [];
    }

    return transformLeadsToPieData(leads, selectedCategory);
  }, [apiData, selectedCategory]);

  const categoryLabels = {
    request_type: "Kebutuhan",
    building_type: "Jenis Bangunan",
    status: "Status",
    source: "Sumber",
    location: "Alamat",
  };

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

  const totalLeads = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  const handleSegmentHover = (entry) => {
    if (entry) {
      setHoveredSegment(entry.name);
    }
  };

  const handleSegmentLeave = () => {
    setHoveredSegment(null);
  };

  const displayValue = hoveredSegment
    ? chartData.find((d) => d.name === hoveredSegment)?.value || totalLeads
    : totalLeads;
  const displayLabel = hoveredSegment || "Total";

  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col shadow-sm min-h-[400px] h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-4 shrink-0">
        <div>
          <h3 className="font-bold text-primary flex items-center gap-2 text-base md:text-lg">
            <PieChartIcon
              size={18}
              className="text-primary transition-transform duration-300 hover:scale-110"
            />
            Leads Analytics
          </h3>
          <p className="text-xs text-muted-foreground mt-1 wrap-break-word">
            {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
          </p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded shadow-sm bg-primary text-primary-foreground">
          {totalLeads} Leads
        </span>
      </div>

      {/* Controls */}
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
            value={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            className="rounded border border-border bg-background text-foreground text-xs px-2 py-1 focus:outline-primary focus:ring-primary"
          >
            <SelectTrigger className="w-full min-w-[150px] flex-1">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="request_type">Kebutuhan</SelectItem>
              <SelectItem value="building_type">Jenis Bangunan</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="source">Sumber</SelectItem>
              <SelectItem value="location">Alamat</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 min-w-0 w-full">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0 w-full">
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
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0 w-full">
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

      {/* Chart */}
      <div className="flex-1 w-full min-h-0 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground text-sm">Loading data...</p>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No data available for selected date range
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col" style={{ minHeight: "360px" }}>
            {/* Donut + center total overlay */}
            <div
              className="relative flex-1 w-full"
              style={{ minHeight: "280px", zIndex: 1 }}
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="38%"
                    outerRadius="72%"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="transparent"
                    label={false}
                    labelLine={false}
                    activeIndex={
                      hoveredSegment
                        ? chartData.findIndex((d) => d.name === hoveredSegment)
                        : -1
                    }
                    activeShape={(props) => {
                      const {
                        cx,
                        cy,
                        innerRadius,
                        outerRadius,
                        startAngle,
                        endAngle,
                        fill,
                      } = props;
                      const brightenedColor = brightenColor(fill, 50);
                      return (
                        <Sector
                          cx={cx}
                          cy={cy}
                          innerRadius={innerRadius}
                          outerRadius={outerRadius * 1.15}
                          startAngle={startAngle}
                          endAngle={endAngle}
                          fill={brightenedColor}
                          style={{
                            filter: "drop-shadow(0 0 12px rgba(0, 0, 0, 0.3))",
                            transition: "all 0.3s ease-out",
                          }}
                        />
                      );
                    }}
                    onMouseEnter={(_, index) => {
                      if (chartData[index]) {
                        handleSegmentHover(chartData[index]);
                      }
                    }}
                    onMouseLeave={handleSegmentLeave}
                  >
                    {chartData.map((entry, i) => {
                      // Segment terbesar (index 0 karena sudah sorted descending) pakai warna kuning
                      const isLargest = i === 0;
                      const fillColor = isLargest
                        ? "var(--primary)"
                        : CHART_COLORS[(i - 1) % CHART_COLORS.length];
                      return (
                        <Cell
                          key={entry.name}
                          fill={fillColor}
                          style={{
                            transition: "all 0.3s ease-out",
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center: Total + count */}
              <div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                aria-hidden
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {displayLabel}
                </span>
                <span className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {displayValue.toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-muted-foreground">leads</span>
              </div>
            </div>

            {/* Legend: 2 rows, colored squares + name (count, %) */}
            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border pt-4">
              {chartData.map((entry, i) => {
                const pct =
                  totalLeads > 0
                    ? Number(((entry.value / totalLeads) * 100).toFixed(1))
                    : 0;
                const isHovered = hoveredSegment === entry.name;
                // Segment terbesar (index 0) pakai warna utama tema
                const isLargest = i === 0;
                const color = isLargest
                  ? "var(--primary)"
                  : CHART_COLORS[(i - 1) % CHART_COLORS.length];
                const brightenedColor = isHovered
                  ? brightenColor(color, 50)
                  : color;
                return (
                  <div
                    key={entry.name}
                    className="flex items-center gap-2 transition-all duration-300 ease-out cursor-pointer"
                    style={{
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                    }}
                    onMouseEnter={() => handleSegmentHover(entry)}
                    onMouseLeave={handleSegmentLeave}
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-sm transition-all duration-300"
                      style={{
                        backgroundColor: brightenedColor,
                        boxShadow: isHovered
                          ? `0 0 8px ${brightenedColor}`
                          : "none",
                        transform: isHovered ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                    <span className="text-xs text-muted-foreground transition-all duration-300">
                      {entry.name}{" "}
                      <span className="font-semibold text-foreground">
                        ({pct}%)
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-center text-sm font-semibold text-primary">
              Distribusi {categoryLabels[selectedCategory]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
