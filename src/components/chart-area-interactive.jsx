"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// import { useDateRange } from "@/lib/date-range"; // Tidak dipakai di logic ini
import { normalizeParams } from "@/lib/serialisasi-filter-leads";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBreakpoints } from "@/hooks/use-break-point";

import { useEffect, useMemo, useState } from "react";
import { WrapperTable } from "./ui/wraper-table";

export default function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const { is2K } = useBreakpoints();
  const [yAxisWidth, setYAxisWidth] = useState(80);

  // State utama untuk filter (7 atau 30)
  const [activeDays, setActiveDays] = useState(7);
  const [fade, setFade] = useState(false);

  // Toggle antara 7 atau 30 hari
  const toggleRange = () => {
    setFade(true);
    setTimeout(() => {
      setActiveDays((prev) => (prev === 7 ? 30 : 7));
      setFade(false);
    }, 200);
  };

  /* ================= API QUERY ================= */
  // Kita kirim 'last_active_days' ke backend.
  // Backend yang akan mengurus logika "mundur tanggal" jika ada hari kosong.
  const query = {
    fields: "id,status,date",
    sort: "date", // Data harus urut tanggal
    filter: {
      last_active_days: activeDays, // Mengirim angka 7 atau 30
    },
    paginate: 1000, // Ambil cukup banyak untuk mencakup range hari
  };

  const { data: apiData, isLoading } = useApiFetch("leads", "/leads", query);

  /* ================= HELPERS ================= */
  const isTerbalas = (status) => {
    if (!status) return false;
    return status.trim().toLowerCase() !== "gajelas";
  };

  /* ================= CHART DATA ================= */
  const chartData = useMemo(() => {
    const leads = Array.isArray(apiData?.data.data)
      ? apiData?.data.data
      : Array.isArray(apiData)
      ? apiData
      : [];

    const map = new Map();

    // Logic: Kita HANYA memetakan data yang dikembalikan Backend.
    // Kita TIDAK mengisi tanggal kosong (fill gaps) secara manual,
    // karena tujuannya adalah menampilkan "X Hari Aktif Terakhir".
    for (const item of leads) {
      // Ambil tanggal YYYY-MM-DD
      const dateKey = item.date
        ? item.date.split(" ")[0]
        : item.cretime?.split(" ")[0];

      if (!dateKey) continue;

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: dateKey,
          Terbalas: 0,
          "Tidak-Terbalas": 0,
        });
      }

      const entry = map.get(dateKey);

      if (isTerbalas(item.status)) {
        entry.Terbalas += 1;
      } else {
        entry["Tidak-Terbalas"] += 1;
      }
    }

    // Sort hasil akhir berdasarkan tanggal
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [apiData]);

  /* ================= MOBILE DEFAULT ================= */
  // Jika mobile, paksa ke 7 hari (activeDays)
  useEffect(() => {
    if (isMobile && activeDays === 30) {
      setActiveDays(7);
    }
  }, [isMobile, activeDays]);

  /* ================= RESPONSIVE Y-AXIS ================= */
  const calcYAxisWidth = (width) => {
    if (width < 480) return 35;
    if (width < 768) return 40;
    if (width < 1280) return 20;
    if (width < 1440) return 25; // Laptop
    if (width < 1920) return 100;
    return 70;
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

  /* ================= RENDER ================= */
  return (
    <WrapperTable
      title={"TOTAL LEADS"}
      action={
        // VALUE SELECT HARUS STRING, KITA CONVERT BOLAK BALIK KE INT
        <Select
          value={activeDays.toString()}
          onValueChange={(val) => setActiveDays(parseInt(val))}
        >
          <SelectTrigger className="w-[140px] 2xl:w-60 h-8 2xl:py-4 2xl:text-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Hapus opsi bulan/range manual, fokus ke Active Days */}
            <SelectItem value="30">30 Hari Aktif</SelectItem>
            <SelectItem value="7">7 Hari Aktif</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 animate-pulse bg-muted m-4 rounded-md" />
        ) : (
          <div className="flex-1 min-h-0 pe-2 2xl:pe-4 py-3 sm:px-4 sm:py-4">
            <ChartContainer
              config={{
                "Tidak-Terbalas": {
                  label: "Tidak Terbalas",
                  color: "var(--main-langit-langit)",
                },
                Terbalas: {
                  label: "Terbalas",
                  color: "var(--secondary-langit-langit)",
                },
              }}
              className="h-full w-full"
            >
              <div
                onClick={toggleRange}
                className={`h-full w-full transition-opacity duration-200 cursor-pointer ${
                  fade ? "opacity-0" : "opacity-100"
                }`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="fillTerbalas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--secondary-langit-langit)"
                          stopOpacity={1}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--secondary-langit-langit)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>

                      <linearGradient
                        id="fillTidakTerbalas"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--main-langit-langit)"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--main-langit-langit)"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />

                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) =>
                        new Date(v).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })
                      }
                      tick={{
                        fontSize: "clamp(14px, 1.2vw, 27px)",
                        fontWeight: 600,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={yAxisWidth}
                      tick={{
                        fontSize: "clamp(14px, 1.2vw, 27px)",
                        fontWeight: 600,
                      }}
                    />

                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="mb-1 text-sm font-semibold">
                                {new Date(label).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </div>
                              {payload.map((entry, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-muted-foreground">
                                    {entry.name}:
                                  </span>
                                  <span className="font-bold">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* BASE AREA (HARUS DULUAN) */}
                    <Area
                      dataKey="Tidak-Terbalas"
                      stackId="1"
                      type="natural"
                      strokeWidth={is2K ? 3 : 2}
                      stroke="var(--main-langit-langit)"
                      fill="var(--main-langit-langit)"
                      fillOpacity={0.4}
                      isAnimationActive={false}
                    />

                    {/* TOP AREA */}
                    <Area
                      dataKey="Terbalas"
                      stackId="1"
                      type="natural"
                      strokeWidth={is2K ? 3 : 2}
                      stroke="var(--secondary-langit-langit)"
                      fill="var(--secondary-langit-langit)"
                      fillOpacity={0.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="absolute top-2 right-2 text-xs text-muted-foreground pointer-events-none">
                  Klik chart untuk ganti range
                </div>
              </div>
            </ChartContainer>
          </div>
        )}
      </div>
    </WrapperTable>
  );
}
