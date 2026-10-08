"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  ListTodo,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-format";
import { getScheduleByStage } from "@/lib/get-schedule-stage";
import {
  DashboardPipelineCard,
  DashboardTownhallCard,
  DashboardSurveyCard,
  DashboardDesignCard,
  DashboardExecutionCard,
} from "./cards";
import { TodoWidget } from "./cards/DashboardTodoCard";

const ThemeStyles = () => (
  <style>{`
    .custom-scroll::-webkit-scrollbar { width: 4px; }
    .custom-scroll::-webkit-scrollbar-track { background: var(--background); }
    .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; transition: background 0.3s ease; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--primary); }
    .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
    .count-up { animation: countUp 0.5s ease-out; }
    @keyframes countUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
    .progress-animate { animation: progressFill 1.5s ease-out; }
    @keyframes progressFill { from { width: 0%; } }
    .card-hover:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 0 10px var(--accent-alpha-20); }
    .card-hover > * { position: relative; z-index: 2; }
    .icon-pulse { animation: iconPulse 2s ease-in-out infinite; }
    @keyframes iconPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    .smooth-scale { transition: transform 0.2s ease; }
  `}</style>
);

const DesignerTasksList = () => {
  const [page] = useState(1);
  const [paginate] = useState(5);

  const query = useMemo(
    () => ({
      include: "currentStage,client,detailSchedule",
      filter: {},
      sort: "-priority_order",
      paginate,
      page,
    }),
    [paginate, page],
  );

  const queryKey = useMemo(
    () => ["designer-tasks-dashboard", paginate, page],
    [paginate, page],
  );

  const { data, isLoading, error } = useApiFetch(queryKey, "/tasks/v2", query);

  const tasks = data?.data?.data ?? [];

  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-destructive/30 p-5 flex flex-col shadow-lg min-h-[200px]">
        <p className="text-sm text-destructive">
          Gagal memuat daftar kerjaan design.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col shadow-lg min-h-[240px] transition-colors hover:border-primary/30">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-accent text-base md:text-lg">
            Kerjaan Design Saya
          </h3>
          <p className="text-[11px] text-muted-foreground/80">
            Daftar tugas aktif yang sedang kamu pegang
          </p>
        </div>
        {tasks.length > 0 && (
          <span className="text-[11px] px-2 py-1 rounded-full bg-background text-muted-foreground border border-border">
            {tasks.length} tugas
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 bg-[#0f1a22] rounded-lg border border-[#363430] animate-pulse"
            />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#cfc9bd] text-sm py-4">
          <p>Belum ada tugas design aktif.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scroll pr-1">
          {tasks.map((task) => {
            const schedule = getScheduleByStage({
              detailSchedule: task.detail_schedule,
              stageCode: task.current_stage?.code,
            });

            const hasPriority = typeof task.priority_order === "number";

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 bg-[#0f1a22] rounded-lg border px-3 py-2.5 ${
                  hasPriority
                    ? "border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                    : "border-[#363430]"
                }`}
              >
                <div className="mt-0.5">
                  {hasPriority ? (
                    <Badge className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500 text-white border-none">
                      P#{task.priority_order}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-[#cfc9bd]/70">
                      No-prio
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#fffdf5] truncate">
                      {task.client
                        ? `${task.client.name}-${task.client.uuid}`
                        : "Client tidak diketahui"}
                    </p>
                    {task.current_stage?.label && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#152733] text-[#cfc9bd] border border-[#363430] whitespace-nowrap">
                        {task.current_stage.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[11px] text-[#cfc9bd]/80 truncate">
                      {task.active_version?.status || "Status tidak tersedia"}
                    </span>
                    <span className="text-[11px] text-[#cfc9bd]/80 whitespace-nowrap">
                      {schedule && schedule.start && schedule.end
                        ? `${formatDate(schedule.start)} - ${formatDate(schedule.end)}`
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function DashboardDesigner({ currentTime }) {
  return (
    <div className="min-h-screen w-full text-[#fffdf5] font-sans py-4 md:p-6 overflow-x-hidden flex flex-col">
      <ThemeStyles />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#fffdf5] tracking-tight flex items-center gap-2 drop-shadow-md">
            <span className="text-[#fed818] drop-shadow-[0_0_8px_rgba(254,216,24,0.5)] transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(254,216,24,0.7)]">
              langit
            </span>
            langit.id
          </h1>
          <p className="text-xs md:text-sm text-[#cfc9bd] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fed818] animate-pulse shadow-[0_0_8px_#fed818] icon-pulse" />
            Live Dashboard - Designer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs md:text-sm bg-[#152733] px-4 py-2 rounded-full shadow-lg text-[#fed818] border border-[#363430] flex items-center gap-2 font-medium hover:border-[#fed818] transition-colors cursor-default">
            <Calendar size={16} className="text-[#135a86]" />
            <span className="hidden md:inline">
              {currentTime.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="md:hidden">
              {currentTime.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <div className="text-xs md:text-sm bg-[#152733] px-4 py-2 rounded-full shadow-lg text-[#fed818] border border-[#363430] flex items-center gap-2 font-medium hover:border-[#fed818] transition-colors cursor-default min-w-[100px] justify-center">
            <Clock size={16} className="text-[#fed818]" />
            {currentTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 shrink-0 xl:h-[220px]">
        <DashboardPipelineCard />
        <DashboardTownhallCard />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 min-h-0 mb-6">
        <div className="xl:col-span-4 shadow-lg min-h-[300px] card-hover">
          <TodoWidget />
        </div>
        <div className="xl:col-span-4 flex flex-col gap-6">
          <DashboardDesignCard />
          <DashboardSurveyCard />
        </div>
        <div className="xl:col-span-4 flex flex-col gap-6">
          <DesignerTasksList />
          <DashboardExecutionCard />
        </div>
      </div>
    </div>
  );
}
