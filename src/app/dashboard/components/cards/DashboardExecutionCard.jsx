"use client";

import React, { useState } from "react";
import { HardHat, Clock, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import StatusBadge from "./StatusBadge";

const ExecutionSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border min-h-[300px] animate-pulse flex flex-col">
    <div className="p-5 border-b border-border flex justify-between">
      <div className="h-5 w-24 bg-secondary rounded" />
      <div className="h-5 w-16 bg-secondary rounded" />
    </div>
    <div className="flex-1 p-5 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-secondary/50 rounded-lg" />
      ))}
    </div>
  </div>
);

const getProjectTheme = (status, isComplete, isOverdue) => {
  if (isComplete) {
    return {
      color: "#10B981", // Success Green tetap
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/40",
      text: "Done",
    };
  }
  if (status === "critical" || isOverdue) {
    return {
      color: "#EF4444", // Destructive Red tetap
      bg: "bg-destructive/10",
      border: "border-destructive/40",
      text: "Critical",
    };
  }
  if (status === "warning") {
    return {
      color: "#fed818", // Brand Gold
      bg: "bg-accent/10",
      border: "border-accent/40",
      text: "Warning",
    };
  }
  return {
    color: "#135a86", // Brand Blue
    bg: "bg-primary/10",
    border: "border-primary/40",
    text: "On Track",
  };
};

export default function DashboardExecutionCard({ className = "" }) {
  const { activeProjects, isLoading, error } = useDashboardData();
  const [hideCompleted, setHideCompleted] = useState(true);

  if (error) {
    return (
      <div
        className={`bg-card rounded-[24px] border border-destructive/30 p-6 ${className}`}
      >
        <p className="text-destructive text-sm flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          Gagal memuatkan data execution.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <ExecutionSkeleton />;
  }

  const sortedProjects = [...activeProjects].sort((a, b) => {
    const progressA = a.progress || 0;
    const progressB = b.progress || 0;
    const isCompleteA = progressA === 100;
    const isCompleteB = progressB === 100;
    if (isCompleteA && isCompleteB) {
      return (a.customer || "").localeCompare(b.customer || "");
    }
    if (isCompleteA) return 1;
    if (isCompleteB) return -1;
    return progressB - progressA;
  });

  const visibleProjects =
    hideCompleted
      ? sortedProjects.filter((p) => (p.progress || 0) !== 100)
      : sortedProjects;

  const completedCount = sortedProjects.filter(
    (p) => (p.progress || 0) === 100,
  ).length;

  return (
    <div
      className={`flex-1 bg-card rounded-xl border border-border flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden group/card min-h-[350px] ${className}`}
    >
      {/* --- AMBIENT GLOW --- */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-primary opacity-[0.02] blur-[80px] rounded-full pointer-events-none group-hover/card:opacity-[0.04] transition-opacity duration-700" />

      {/* --- HEADER --- */}
      <div className="p-5 md:p-6 border-b border-border/80 flex justify-between items-center bg-secondary/30 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-accent opacity-20 blur-lg rounded-xl" />
            <div className="relative p-2.5 bg-secondary border border-accent/30 rounded-[14px] flex items-center justify-center shadow-inner">
              <HardHat size={18} className="text-accent" />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-[16px] md:text-lg font-bold text-accent tracking-wide leading-tight">
              Execution
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {completedCount > 0 && (
                <button
                  onClick={() => setHideCompleted((v) => !v)}
                  className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  {hideCompleted ? "Sembunyikan Selesai" : "Papar Semua"}
                  {hideCompleted ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]" />
          <span className="text-[9px] font-bold text-accent uppercase tracking-widest">
            {visibleProjects.length} Aktif
          </span>
        </div>
      </div>

      {/* --- JADUAL (TABLE LAYOUT) --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-1">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); }
        `,
          }}
        />

        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-card/95 backdrop-blur-md">
            <tr>
              <th className="px-5 py-3 text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                Projek & Progress
              </th>
              <th className="px-5 py-3 text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border text-right">
                Status & Deadline
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {visibleProjects.length > 0 ?
              visibleProjects.map((proj) => {
                const progress = proj.progress || 0;
                const isComplete = progress === 100;
                const isOverdue = proj.daysLeft < 0 || proj.isOverdue;
                const shouldShowOverdue = isOverdue && !isComplete;
                const daysValue = Math.floor(
                  Math.abs(proj.daysLeft ?? proj.absoluteDays ?? 0),
                );

                const daysDisplay =
                  shouldShowOverdue ? `Lewat ${daysValue} hr`
                  : isComplete ? "Siap"
                  : `${daysValue} hr lagi`;
                const theme = getProjectTheme(
                  proj.status,
                  isComplete,
                  isOverdue,
                );

                return (
                  <tr
                    key={proj.id}
                    className="group relative hover:bg-secondary/40 transition-all duration-300 cursor-pointer w-full"
                  >
                    {/* SEL KIRI: Nama, Jenis & Bar Progress */}
                    <td className="px-5 py-4 align-top w-[60%]">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-[13px] md:text-[14px] truncate group-hover:text-foreground transition-colors">
                            {proj.customer}
                          </p>
                          <p className="text-[10px] md:text-[11px] text-muted-foreground mt-0.5 group-hover:text-foreground/80 transition-colors truncate">
                            {proj.type}
                          </p>
                        </div>

                        <div className="shrink-0 ml-3">
                          <div
                            className={`flex items-center justify-center min-w-[48px] text-[13px] font-black px-2.5 py-1 rounded-lg border-2 shadow-md transition-all duration-300`}
                            style={{
                              backgroundColor: `${theme.color}20`,
                              color: theme.color,
                              borderColor: `${theme.color}40`,
                            }}
                          >
                            {progress}%
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden shadow-inner border border-border/50 relative">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out relative group-hover:brightness-125"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: theme.color,
                            boxShadow: `0 0 10px ${theme.color}60`,
                          }}
                        >
                          <div className="absolute top-0 left-0 w-full h-[10px] bg-white/30 rounded-full" />
                        </div>
                      </div>
                    </td>

                    {/* SEL KANAN: Status & Deadline */}
                    <td className="px-5 py-4 align-top text-right w-[40%]">
                      <div className="flex flex-col items-end gap-2.5">
                        {/* Lencana Status */}
                        <div
                          className={`px-2.5 py-0.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-widest border ${theme.bg}`}
                          style={{
                            color: theme.color,
                            borderColor: theme.border,
                          }}
                        >
                          {isOverdue && !isComplete ? "Critical" : theme.text}
                        </div>

                        {/* Detail Tarikh */}
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${shouldShowOverdue ? "text-[#EF4444]" : "text-[#A89E94]"}`}
                          >
                            {daysDisplay}
                          </span>
                          <span className="text-[9px] md:text-[10px] text-[#71717A] flex items-center gap-1">
                            <Clock
                              size={9}
                              className="opacity-60 hidden sm:block"
                            />
                            {proj.deadline || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 pointer-events-none transition-all duration-300 ease-out z-[9999]">
                        <div className="bg-[#1A1613]/95 backdrop-blur-xl border border-[#3E352C] text-[#EBE3DB] px-3 py-2 rounded-xl shadow-[0_15px_30px_rgba(0,0,0,0.8)] flex flex-col gap-1 w-max">
                          <div className="flex items-center gap-1.5 border-b border-[#3E352C]/50 pb-1.5">
                            <Clock className="w-3 h-3 text-[#F59E0B]" />
                            <span className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest">
                              Terakhir Diubah
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-[#A89E94]">
                            {proj.modtime || "Belum pernah diubah"}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            : <tr>
                <td colSpan={2} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center justify-center opacity-60">
                    <div className="w-12 h-12 rounded-full border border-[#2B2621] bg-[#1A1613] flex items-center justify-center mb-3">
                      <HardHat size={20} className="text-[#867B71]" />
                    </div>
                    <h4 className="text-[#EBE3DB] font-bold text-[12px] uppercase tracking-widest mb-1">
                      Tiada Projek Aktif
                    </h4>
                    <p className="text-[#867B71] text-[10px] font-medium">
                      Semua projek pelaksanaan telah diselesaikan.
                    </p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
