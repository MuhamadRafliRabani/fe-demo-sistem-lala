"use client";

import React from "react";
import { PenTool } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const DesignSkeleton = () => (
  <div className="flex-1 bg-card rounded-[32px] border border-border p-8 flex flex-col min-h-[400px] animate-pulse">
    <div className="flex justify-between items-start mb-12">
      <div className="flex gap-4">
        <div className="w-12 h-12 bg-secondary rounded-2xl" />
        <div className="space-y-2 py-1">
          <div className="h-5 w-32 bg-secondary rounded-md" />
          <div className="h-3 w-24 bg-secondary rounded-md" />
        </div>
      </div>
      <div className="h-12 w-16 bg-secondary rounded-xl" />
    </div>
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-secondary rounded-md" />
            <div className="h-4 w-12 bg-secondary rounded-md" />
          </div>
          <div className="h-2 w-full bg-secondary rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export default function DashboardDesignCard({ className = "" }) {
  const { designActive, isLoading, error } = useDashboardData();

  if (error) {
    return (
      <div
        className={`bg-card rounded-xl border border-destructive/30 p-6 shadow-lg ${className}`}
      >
        <p className="text-destructive text-sm flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-destructive" /> Gagal memuat
          design aktif.
        </p>
      </div>
    );
  }

  if (isLoading) return <DesignSkeleton />;

  const { total, stages } = designActive;

  return (
    <div
      className={`flex-1 bg-card rounded-xl border border-border p-6 md:p-8 flex flex-col shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-colors hover:border-primary/30 relative z-10  group/card ${className}`}
    >
      {/* Subtle Background Glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.02] blur-[80px] rounded-full pointer-events-none group-hover/card:opacity-[0.04] transition-opacity duration-700" />

      {/* --- HEADER --- */}
      <div className="flex justify-between items-start mb-8 shrink-0 relative z-10 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div
              className={`absolute inset-0 blur-md opacity-30 rounded-xl ${total > 0 ? "bg-violet" : "bg-muted-foreground"}`}
            />
            <div className="relative p-2.5 bg-secondary border border-border rounded-xl flex items-center justify-center">
              <PenTool
                size={20}
                className={total > 0 ? "text-violet" : "text-muted-foreground"}
              />
            </div>
          </div>
          <div>
            <h3 className="font-extrabold text-violet text-base md:text-lg tracking-wide">
              Design Aktif
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5 tracking-wider uppercase">
              Breakdown by Stage
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground to-muted-foreground drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] leading-none">
            {total}
          </span>
          <span className="text-[10px] font-bold text-amber mt-1.5 uppercase tracking-widest bg-amber/10 px-2 py-0.5 rounded-full border border-amber/20">
            Total Active
          </span>
        </div>
      </div>

      {/* --- BODY: STAGES --- */}
      <div className="flex-1 flex flex-col justify-center gap-7 relative z-10">
        {stages.length > 0 ? (
          stages.map((stage, idx) => {
            const hasBreakdown = stage.breakdown && stage.breakdown.length > 0;
            return (
              <div key={idx} className="group relative z-10">
                {/* Stage Header Info */}
                <div className="flex items-end justify-between mb-2.5 px-0.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-sm rotate-45 transition-transform duration-300 group-hover:scale-125"
                      style={{
                        backgroundColor: stage.color,
                        boxShadow: `0 0 10px ${stage.color}80`,
                      }}
                    />
                    <span className="text-[12px] font-bold text-foreground/90 uppercase tracking-wider">
                      {stage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {stage.count} tasks
                    </span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                      style={{
                        color: stage.color,
                        backgroundColor: `${stage.color}15`,
                        border: `1px solid ${stage.color}30`,
                      }}
                    >
                      {stage.pct}%
                    </span>
                  </div>
                </div>

                {/* THE SLEEK DATA TRACK (Progress Bar) */}
                <div className="relative">
                  <div className="w-full bg-secondary h-[6px] rounded-full relative shadow-inner overflow-visible">
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-[6px] rounded-full flex transition-all duration-1000 ease-out group-hover:h-[10px]"
                      style={{ width: `${stage.pct}%` }}
                    >
                      {hasBreakdown ? (
                        stage.breakdown.map((item, breakdownIdx) => {
                          const segmentWidth =
                            stage.pct > 0 ? (item.pct / 100) * 100 : 0;
                          const segmentColor = item.color || stage.color;
                          const isLastSegment =
                            breakdownIdx === stage.breakdown.length - 1;
                          const isFirstSegment = breakdownIdx === 0;

                          return (
                            <div
                              key={breakdownIdx}
                              className="h-full relative group/segment transition-all duration-300 hover:brightness-125 cursor-pointer"
                              style={{
                                width: `${segmentWidth}%`,
                                backgroundColor: segmentColor,
                                boxShadow: `0 0 12px ${segmentColor}40`,
                                borderRight: !isLastSegment
                                  ? "2px solid var(--card)"
                                  : "none",
                                borderTopLeftRadius: isFirstSegment
                                  ? "9999px"
                                  : "0",
                                borderBottomLeftRadius: isFirstSegment
                                  ? "9999px"
                                  : "0",
                                borderTopRightRadius: isLastSegment
                                  ? "9999px"
                                  : "0",
                                borderBottomRightRadius: isLastSegment
                                  ? "9999px"
                                  : "0",
                              }}
                            >
                              {/* Highlight spec on top of the bar */}
                              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 rounded-full" />

                              {/* PREMIUM GLASSMORPHISM TOOLTIP */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover/segment:opacity-100 group-hover/segment:translate-y-0 translate-y-2 pointer-events-none transition-all duration-300 ease-out z-[99999] min-w-[220px]">
                                <div className="relative">
                                  <div
                                    className="absolute inset-0 blur-xl opacity-20"
                                    style={{ backgroundColor: segmentColor }}
                                  />

                                  <div className="relative bg-card/90 backdrop-blur-xl border border-white/10 rounded-[16px] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                        <div
                                          className="w-1.5 h-1.5 rounded-full"
                                          style={{
                                            backgroundColor: segmentColor,
                                            boxShadow: `0 0 8px ${segmentColor}`,
                                          }}
                                        />
                                        <span className="text-[11px] font-black text-foreground tracking-widest uppercase truncate">
                                          {item.name}
                                        </span>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                                            Tasks
                                          </span>
                                          <span className="text-sm font-bold text-foreground">
                                            {item.count}
                                          </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                                            Portion
                                          </span>
                                          <span
                                            className="text-sm font-black"
                                            style={{ color: segmentColor }}
                                          >
                                            {item.pct}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Pointer Arrow */}
                                  <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2">
                                    <div className="w-3 h-3 bg-card border-b border-r border-white/10 rotate-45" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          className="w-full h-full rounded-full relative"
                          style={{
                            backgroundColor: stage.color,
                            boxShadow: `0 0 12px ${stage.color}50`,
                          }}
                        >
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Micro Badges for Breakdowns under the track */}
                {hasBreakdown && stage.breakdown.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {stage.breakdown.map((item, breakdownIdx) => (
                      <div
                        key={breakdownIdx}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 cursor-default"
                        style={{
                          backgroundColor: `${item.color || stage.color}10`,
                          border: `1px solid ${item.color || stage.color}20`,
                        }}
                      >
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: item.color || stage.color }}
                        />
                        <span className="text-[#A89E94]">{item.name}</span>
                        <span style={{ color: item.color || stage.color }}>
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 opacity-60">
            <PenTool
              size={36}
              className="mx-auto text-muted-foreground mb-4 opacity-50"
            />
            <p className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest">
              Tidak ada design aktif
            </p>
            <p className="text-[10px] text-muted-foreground/80 mt-2 font-medium">
              Tugas design akan muncul di sini
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
