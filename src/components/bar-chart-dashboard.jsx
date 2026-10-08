"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTheme } from "next-themes";
import { useBreakpoints } from "@/hooks/use-break-point";
import { useApiFetch } from "@/hooks/use-api-fetch";
import Loader from "./ui/loader";
import { useEffect, useMemo, useState } from "react";
import { WrapperTable } from "./ui/wraper-table";

const chartData = [
  { browser: "dicky", visitors: 42, fill: "var(--secondary-langit-langit)" },
  { browser: "wiranda", visitors: 56, fill: "var(--secondary-langit-langit)" },
  { browser: "ega", visitors: 39, fill: "var(--secondary-langit-langit)" },
  { browser: "shinta", visitors: 84, fill: "var(--secondary-langit-langit)" },
];

const chartConfig = {
  visitors: { label: "Visitors" },
  dicky: { label: "Dicky", color: "var(--chart-1)" },
  wiranda: { label: "Wiranda", color: "var(--chart-2)" },
  ega: { label: "Ega", color: "var(--chart-3)" },
  shinta: { label: "Shinta", color: "var(--chart-4)" },
};

export function ChartBarMixed() {
  const { theme } = useTheme();
  const { is2K } = useBreakpoints();
  const [yAxisWidth, setYAxisWidth] = useState(80);

  const { data, isLoading, error, refetch } = useApiFetch(
    "site-progress",
    "/site-progress",
    {
      page: 1,
      paginate: 7,
    }
  );

  const siteProgress = data?.data ?? [];

  const chartData = useMemo(() => {
    return siteProgress.map((item) => ({
      name: item.project_name,
      progress: Number(
        parseFloat(
          item?.kpi_dts?.[item?.kpi_dts?.length - 1]?.progress ?? 0,
        ).toFixed(1),
      ),
      type: item.building_type,
      fill: "var(--secondary-langit-langit)",
    }));
  }, [siteProgress]);

  const calcYAxisWidth = (width) => {
    if (width < 480) return 65;
    if (width < 768) return 70;
    if (width < 1280) return 70;
    if (width < 1440) return 75; // Laptop
    if (width < 1920) return 100;
    return 150;
  };

  useEffect(() => {
    let raf;

    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setYAxisWidth(calcYAxisWidth(window.innerWidth));
      });
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    // Parent Card harus h-full agar mengisi GridItem
    <WrapperTable title={"PROGRESS ON GOING"} desc={"Januari - Desember 2025"}>
      <div className="border-main-langit-langit w-full h-full flex flex-col overflow-hidden gap-4">
        {/* 
         KUNCI RESPONSIVE VERTICAL: 
         1. flex-1: Ambil sisa ruang vertikal yang ada.
         2. min-h-0: Izinkan flex item mengecil (shrink) tanpa batas konten minimum.
      */}
        {isLoading ? (
          <div className="flex-1 animate-pulse bg-muted m-4 rounded-md" />
        ) : (
          <div className="flex-1 min-h-0 w-full px-2 ">
            <ChartContainer
              config={chartConfig}
              className="w-full h-full aspect-auto "
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barCategoryGap="20%"
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={yAxisWidth}
                    tick={{
                      fontSize: "clamp(14px, 1.1vw, 27px)",
                      fontWeight: 600,
                    }}
                  />

                  <XAxis type="number" hide domain={[0, 100]} />

                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Client
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {data.name}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Type
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {data.type ?? "-"}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Progress
                                </span>
                                <span className="font-bold text-muted-foreground">
                                  {data.progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Bar dataKey="progress" radius={6}>
                    <LabelList
                      dataKey="progress"
                      position="right"
                      formatter={(v) => `${v}%`}
                      style={{
                        fontSize: "clamp(11px, 1vw, 20px)",
                        fill: theme === "dark" ? "#fff" : "#000",
                        fontWeight: 600,
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </div>
    </WrapperTable>
  );
}
