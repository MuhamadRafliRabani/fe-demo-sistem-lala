"use client";

import { useEffect, useRef, useState } from "react";
import { GridStack } from "gridstack";
import "gridstack/dist/gridstack.min.css";

import ChartAreaInteractive from "./chart-area-interactive";
import TableDashboardSchedule from "@/app/dashboard/table/table-dashboard-schedule";
import { GridItem } from "./GridItem";
import { ChartBarMixed } from "./bar-chart-dashboard";
import TableDashboardTownhall from "@/app/dashboard/table/table-dashboard-townhall";
import Loader from "./ui/loader";

// Definisi Layout Default
const defaultLayout = [
  { id: "chart-main", x: 0, y: 0, w: 6, h: 4 },
  { id: "table", x: 8, y: 0, w: 6, h: 4 },
  { id: "chart-area", x: 0, y: 4, w: 6, h: 4 },
  { id: "summary", x: 8, y: 0, w: 6, h: 2 },
];

export default function DashboardGrid() {
  const gridRef = useRef(null);
  const containerRef = useRef(null);

  const [widgets, setWidgets] = useState(defaultLayout);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Load layout dari LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("dashboard-layout-gs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        const merged = defaultLayout.map((def) => {
          const savedItem = parsed.find((p) => p.id === def.id);
          return savedItem ? { ...def, ...savedItem } : def;
        });

        setWidgets(merged);
      } catch (e) {
        console.error("Gagal load layout", e);
      }
    }
    setIsMounted(true);
  }, []);

  const getColumnByWidth = (width) => {
    if (width >= 1200) return 12; // desktop
    if (width >= 768) return 6; // tablet
    return 1; // mobile
  };

  // 2. Init GridStack
  useEffect(() => {
    if (!isMounted || !containerRef.current) return;
    if (gridRef.current) return;

    const grid = GridStack.init(
      {
        column: getColumnByWidth(window.innerWidth),
        cellHeight: 100,
        margin: 10,
        float: true,
        animate: true,
        disableOneColumnMode: false,
      },
      containerRef.current
    );

    gridRef.current = grid;

    const isMobile = () => window.innerWidth < 768;

    const onResize = () => {
      const newColumn = getColumnByWidth(window.innerWidth);

      if (grid.getColumn() !== newColumn) {
        grid.column(newColumn);
      }

      if (isMobile()) {
        grid.enableMove(false); // ❌ drag off
        grid.enableResize(true); // ✅ resize on
      } else {
        grid.enableMove(true);
        grid.enableResize(true);
      }
    };

    onResize();

    window.addEventListener("resize", onResize);

    grid.on("change", () => {
      const layout = grid.save(false).map((item) => ({
        id: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));

      localStorage.setItem("dashboard-layout-gs", JSON.stringify(layout));
    });

    // Resize chart
    grid.on("resize", () => {
      window.dispatchEvent(new Event("resize"));
    });

    return () => {
      window.removeEventListener("resize", onResize);
      grid.destroy(false);
      gridRef.current = null;
    };
  }, [isMounted]);

  const renderContent = (id) => {
    switch (id) {
      case "chart-main":
        return <ChartBarMixed />;
      case "table":
        return <TableDashboardSchedule />;
      case "chart-area":
        return <ChartAreaInteractive />;
      case "summary":
        return <TableDashboardTownhall />;
      default:
        return null;
    }
  };

  if (!isMounted) return <Loader />;

  return (
    <div className="w-full min-h-screen md:p-4">
      <div className="grid-stack " ref={containerRef}>
        {widgets.map((widget) => (
          <GridItem
            key={widget.id}
            id={widget.id}
            x={widget.x}
            y={widget.y}
            w={widget.w}
            h={widget.h}
          >
            {renderContent(widget.id)}
          </GridItem>
        ))}
      </div>
    </div>
  );
}
