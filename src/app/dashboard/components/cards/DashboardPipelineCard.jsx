"use client";

import React, { useState } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const PipelineSkeleton = () => (
  <div className="xl:col-span-8 bg-card rounded-2xl border border-border px-6 md:px-10 py-6 flex flex-col justify-center min-h-[180px] animate-pulse">
    <div className="h-4 w-40 bg-secondary rounded mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-secondary" />
          <div className="h-3 w-16 bg-secondary rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default function DashboardPipelineCard({ className = "" }) {
  const { pipelineStages, isLoading, error } = useDashboardData();

  // State untuk melacak stage mana yang sedang di-hover
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (error) {
    return (
      <div
        className={`xl:col-span-8 bg-card rounded-[20px] border border-destructive/30 p-6 ${className}`}
      >
        <p className="text-destructive text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive"></span>
          Gagal memuat pipeline.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <PipelineSkeleton />;
  }

  // Menghitung panjang garis (trail) berdasarkan index yang di-hover
  let trailWidth = "0%";
  if (hoveredIndex === 1) trailWidth = "33.33%";
  else if (hoveredIndex === 2) trailWidth = "66.66%";
  else if (hoveredIndex === 3) trailWidth = "100%";

  return (
    <section
      className={`xl:col-span-8 bg-card rounded-xl border border-border relative flex flex-col justify-center px-6 md:px-10 shadow-2xl overflow-visible z-10 py-6 xl:py-8 transition-all hover:border-primary/30 ${className}`}
      onMouseLeave={() => setHoveredIndex(null)} // Reset trail saat mouse keluar dari card
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h2 className="text-[11px] font-bold text-accent uppercase tracking-[0.2em]">
            Pipeline Health{" "}
            <span className="text-muted-foreground font-medium">
              (4 Stages)
            </span>
          </h2>
        </div>
        <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-2 font-medium bg-secondary py-1 px-2.5 rounded-full border border-border">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]" />
          Real-time
        </span>
      </div>

      {/* Pipeline Diagram */}
      <div className="relative w-full  flex items-center justify-center mt-2">
        {/* --- CONNECTING LINES --- */}
        <div className="hidden md:block absolute top-1/2 left-[12.5%] w-[75%] h-[2px] -translate-y-1/2 z-0">
          {/* Garis Putus-putus Background */}
          <div className="absolute inset-0 border-t border-dashed border-border" />

          {/* Garis Trail (Animated Glow Line) */}
          <div
            className="absolute top-[-1px] left-0 h-[3px] bg-gradient-to-r from-primary/20 via-primary to-accent rounded-full transition-all duration-500 ease-out z-10"
            style={{ width: trailWidth }}
          >
            {/* Titik cahaya di ujung garis (Laser Tip) */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_12px_3px_var(--primary)] transition-opacity duration-300"
              style={{
                opacity: hoveredIndex && hoveredIndex > 0 ? 1 : 0,
                transform: "translate(50%, -50%)",
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 relative z-20 w-full h-full items-center justify-items-center content-center">
          {pipelineStages.map((stage, index) => {
            const hasBreakdown =
              stage.breakdown &&
              (stage.name === "Surveys" || stage.name === "Desains");
            const currentMonthPct =
              hasBreakdown ? stage.breakdown.current_month_pct || 0 : 0;
            const lastMonthPct =
              hasBreakdown && stage.name === "Surveys" ?
                stage.breakdown.last_month_pct || 0
              : 0;
            const twoMonthsAgoPct =
              hasBreakdown ? stage.breakdown.two_months_ago_pct || 0 : 0;

            // COLOR LOGIC BASED ON STAGE
            const isLeads = index === 0;
            const isSurveys = index === 1;
            const isDesains = index === 2;
            const isExecution = index === 3;

            let stageColor = "var(--primary)";
            let stageBg = "bg-primary";
            let stageBorder = "border-primary";
            let stageShadow = "shadow-[0_0_30px_rgba(19,90,134,0.3)]";
            let stageHoverShadow = "shadow-[0_0_40px_rgba(19,90,134,0.5)]";

            if (isLeads) {
              stageColor = "var(--indigo)";
              stageBg = "bg-indigo";
              stageBorder = "border-indigo";
              stageShadow = "shadow-[0_0_30px_rgba(99,102,241,0.2)]";
              stageHoverShadow = "shadow-[0_0_40px_rgba(99,102,241,0.4)]";
            } else if (isSurveys) {
              stageColor = "var(--amber)";
              stageBg = "bg-amber";
              stageBorder = "border-amber";
              stageShadow = "shadow-[0_0_30px_rgba(245,158,11,0.2)]";
              stageHoverShadow = "shadow-[0_0_40px_rgba(245,158,11,0.4)]";
            } else if (isDesains) {
              stageColor = "var(--violet)";
              stageBg = "bg-violet";
              stageBorder = "border-violet";
              stageShadow = "shadow-[0_0_30px_rgba(139,92,246,0.2)]";
              stageHoverShadow = "shadow-[0_0_40px_rgba(139,92,246,0.4)]";
            }

            const yellowDegrees = (currentMonthPct / 100) * 360;
            const orangeDegrees = isSurveys ? (lastMonthPct / 100) * 360 : 0;
            const blueStartDegrees = yellowDegrees + orangeDegrees;

            const showProportionalBorder =
              hasBreakdown &&
              (currentMonthPct > 0 ||
                lastMonthPct > 0 ||
                twoMonthsAgoPct > 0) &&
              currentMonthPct + lastMonthPct + twoMonthsAgoPct > 0;

            const colorCurrent = stageColor;
            const colorLast = "var(--accent)";
            const colorTwoMonths = "var(--muted-foreground)";

            const getBorderStyle = () => {
              if (!showProportionalBorder) return {};
              return isSurveys ?
                  {
                    background: `conic-gradient(from 0deg, ${colorCurrent} 0deg ${yellowDegrees}deg, ${colorLast} ${yellowDegrees}deg ${blueStartDegrees}deg, ${colorTwoMonths} ${blueStartDegrees}deg 360deg)`,
                    padding: "2px",
                    borderRadius: "50%",
                    display: "inline-block",
                  }
                : {
                    background: `conic-gradient(from 0deg, ${colorCurrent} 0deg ${yellowDegrees}deg, ${colorTwoMonths} ${yellowDegrees}deg 360deg)`,
                    padding: "2px",
                    borderRadius: "50%",
                    display: "inline-block",
                  };
            };

            return (
              <div
                key={index}
                className="flex flex-col items-center justify-center group relative cursor-pointer w-full"
                onMouseEnter={() => setHoveredIndex(index)} // Trigger Trail Line ke posisi ini
              >
                {/* TOOLTIP / HOVER CARD */}
                {hasBreakdown && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-99999 w-[280px]">
                    <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-5 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                      <div className="text-[11px] font-bold text-foreground/80 mb-4 uppercase tracking-[0.15em] border-b border-border pb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: stageColor }}
                          />
                          {stage.name} Breakdown
                        </span>
                        <span className="text-muted-foreground font-normal tracking-normal text-[10px]">
                          Details
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Current Month */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary border border-border transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: stageColor,
                                boxShadow: `0 0 8px ${stageColor}80`,
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">
                                Dari Bulan Ini
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                {stage.name === "Surveys" ?
                                  "Survey bulan ini"
                                : "Design leads bulan ini"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-foreground block">
                              {stage.breakdown.current_month || 0}
                            </span>
                            <span
                              className="text-[10px] font-medium"
                              style={{ color: stageColor }}
                            >
                              {currentMonthPct}%
                            </span>
                          </div>
                        </div>

                        {/* Last Month (Surveys Only) */}
                        {stage.name === "Surveys" &&
                          stage.breakdown.last_month !== undefined && (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary border border-border transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-foreground">
                                    Dari Bulan Kemarin
                                  </span>
                                  <span className="text-[10px] text-muted-foreground mt-0.5">
                                    Survey bulan ini
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-bold text-foreground block">
                                  {stage.breakdown.last_month || 0}
                                </span>
                                <span className="text-[10px] text-accent font-medium">
                                  {lastMonthPct}%
                                </span>
                              </div>
                            </div>
                          )}

                        {/* Two Months Ago */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary border border-border transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-muted-foreground shadow-[0_0_8px_var(--muted-foreground)]" />
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-foreground">
                                Dari 2 Bulan Lalu
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                {stage.name === "Surveys" ?
                                  "Survey bulan ini"
                                : "Design 2 bulan lalu"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-foreground block">
                              {stage.breakdown.two_months_ago || 0}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {twoMonthsAgoPct}%
                            </span>
                          </div>
                        </div>

                        {/* Total Footer */}
                        <div className="pt-3 mt-1">
                          <div className="flex items-center justify-between bg-secondary/50 px-3 py-2 rounded-lg border border-border/50">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Total {stage.name}
                            </span>
                            <span
                              className="text-sm font-bold"
                              style={{ color: stageColor }}
                            >
                              {stage.count}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tooltip Arrow */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-4 h-4 bg-card border-b border-r border-border -rotate-135" />
                      </div>
                    </div>
                  </div>
                )}

                {/* CIRCLE INDICATOR */}
                <div className="relative transition-all duration-500 ease-out flex items-center justify-center mb-4">
                  <div
                    className={`relative transition-transform duration-300 ease-out group-hover:-translate-y-1 ${
                      showProportionalBorder ? "p-[2px]" : ""
                    }`}
                  >
                    {showProportionalBorder && (
                      <div
                        className="absolute inset-0 opacity-80 group-hover:opacity-100 transition-opacity duration-300 ease-in-out rounded-full"
                        style={getBorderStyle()}
                      />
                    )}

                    <div
                      className={`w-[60px] h-[60px] md:w-[68px] md:h-[68px] rounded-full flex flex-col items-center justify-center font-medium text-2xl transition-all duration-300 ease-out relative z-10 
                      ${
                        showProportionalBorder ?
                          "bg-card text-foreground group-hover:bg-secondary"
                        : isLeads ?
                          "bg-indigo/10 border border-indigo/30 text-indigo group-hover:bg-indigo/30 group-hover:text-indigo-foreground shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        : isSurveys ?
                          "bg-amber/10 border border-amber/30 text-amber group-hover:bg-amber group-hover:text-amber-foreground shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        : isDesains ?
                          "bg-violet/10 border border-violet/30 text-violet group-hover:bg-violet/30 group-hover:text-violet-foreground shadow-[0_0_15px_rgba(139,92,246,0.1)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                        : isExecution ?
                          "bg-primary text-primary-foreground font-bold shadow-[0_0_24px_var(--primary)] group-hover:shadow-[0_0_32px_var(--primary)] scale-105"
                        : "bg-card border border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-foreground"
                      }`}
                    >
                      <span>{stage.count ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* STAGE LABEL */}
                <span
                  className={`text-[11px] md:text-xs font-semibold tracking-[0.1em] uppercase text-center transition-colors ${
                    isExecution ? "text-primary font-bold"
                    : isLeads ? "text-indigo/80 group-hover:text-indigo"
                    : isSurveys ? "text-amber/80 group-hover:text-amber"
                    : isDesains ? "text-violet/80 group-hover:text-violet"
                    : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
