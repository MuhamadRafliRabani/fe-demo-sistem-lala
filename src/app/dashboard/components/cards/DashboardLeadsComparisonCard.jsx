"use client";

import React from "react";
import { Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl p-4 min-w-[180px] backdrop-blur-md bg-card/90">
      <p className="text-foreground font-bold text-[13px] mb-3 border-b border-border pb-2 tracking-wide">
        Bulan: {label}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="flex justify-between items-center text-[12px] py-1.5 font-semibold"
        >
          <span className="text-muted-foreground mr-4">
            {entry.name === "terbalas" ? "Terbalas" : "Tidak Terbalas"}:
          </span>
          <span className="text-foreground font-bold">{entry.value}</span>
        </p>
      ))}
      <p className="text-foreground text-[12px] pt-2 mt-2 border-t border-border font-bold flex justify-between">
        <span>Total:</span>
        <span>
          {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)}
        </span>
      </p>
    </div>
  );
};

const LeadsComparisonSkeleton = () => (
  <div className="xl:col-span-4 bg-card rounded-2xl border border-border p-5 min-h-[300px] animate-pulse flex flex-col gap-4">
    <div className="flex justify-between">
      <div className="h-5 w-28 bg-secondary rounded" />
      <div className="h-6 w-12 bg-secondary rounded" />
    </div>
    <div className="flex-1 bg-secondary/30 rounded-lg" />
  </div>
);

export default function DashboardLeadsComparisonCard({ className = "" }) {
  const { leadsComparison, isLoading, error } = useDashboardData();

  if (error) {
    return (
      <div
        className={`xl:col-span-4 bg-card rounded-2xl border border-destructive/30 p-5 ${className}`}
      >
        <p className="text-destructive text-sm">Gagal memuat leads trend.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LeadsComparisonSkeleton />;
  }

  const { data, percentageChange } = leadsComparison;

  return (
    <div
      className={`xl:col-span-4 bg-card rounded-2xl border border-border p-5 flex flex-col shadow-lg min-h-[300px] transition-colors hover:border-primary/30 ${className}`}
    >
      <div className="flex justify-between items-start mb-2 shrink-0">
        <div>
          <h3 className="font-bold text-accent flex items-center gap-2 text-base md:text-lg">
            <Users
              size={18}
              className="text-accent transition-transform duration-300 hover:scale-110"
            />
            Leads Trend
          </h3>
          <p className="text-xs text-muted-foreground">
            Performa 3 Bulan Terakhir
          </p>
        </div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded shadow-sm ${
            percentageChange >= 0
              ? "bg-accent text-accent-foreground"
              : "bg-destructive text-destructive-foreground"
          }`}
        >
          {percentageChange >= 0 ? "+" : ""}
          {percentageChange}%
        </span>
      </div>

      <div className="flex-1 w-full min-h-0 flex flex-col">
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.5}
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
              />
              <RechartsTooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--secondary)", opacity: 0.3 }}
              />
              <Bar dataKey="terbalas" stackId="a" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`terbalas-${index}`}
                    fill="var(--primary)"
                    style={{
                      filter: "drop-shadow(0px 0px 4px rgba(19, 90, 134, 0.3))",
                      transition: "all 0.3s ease",
                    }}
                    className="hover:opacity-90"
                  />
                ))}
                <LabelList
                  dataKey="terbalas"
                  position="inside"
                  fill="var(--primary-foreground)"
                  fontSize={10}
                  fontWeight="bold"
                />
              </Bar>
              <Bar dataKey="tidak_terbalas" stackId="a" radius={[0, 0, 6, 6]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`tidak-terbalas-${index}`}
                    fill="var(--primary)"
                    fillOpacity={0.6}
                    style={{
                      filter: "drop-shadow(0px 0px 4px rgba(19, 90, 134, 0.2))",
                      transition: "all 0.3s ease",
                    }}
                    className="hover:opacity-90"
                  />
                ))}
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
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary" />
            <span className="text-xs text-muted-foreground">Terbalas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/60" />
            <span className="text-xs text-muted-foreground">
              Tidak Terbalas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
