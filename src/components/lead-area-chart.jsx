"use client";
const {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
} = require("recharts");
const { ChartTooltip, ChartTooltipContent } = require("./ui/chart");

export function LeadsAreaChart({ chartData, is2K, yAxisWidth, chartKey }) {
  return (
    <ResponsiveContainer key={chartKey} width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillTerbalas" x1="0" y1="0" x2="0" y2="1">
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

          <linearGradient id="fillTidakTerbalas" x1="0" y1="0" x2="0" y2="1">
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
          tick={{ fontSize: "clamp(14px, 1.2vw, 27px)", fontWeight: 600 }}
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          width={yAxisWidth}
          tick={{ fontSize: "clamp(14px, 1.2vw, 27px)", fontWeight: 600 }}
        />

        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

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
  );
}
