"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  MapPin,
  PenTool,
  HardHat,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import LeadsChartManagement from "@/components/leads-chart-management";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- THEME STYLES (Langit Langit Brand Colors) ---
const ThemeStyles = () => (
  <style>{`
    .custom-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: var(--background);
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    .custom-scroll::-webkit-scrollbar-thumb:hover {
      background: var(--accent);
    }

    .animate-pulse-slow {
      animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .7; }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
    }
    .fade-in-up-delay-1 {
      animation: fadeInUp 0.6s ease-out 0.1s forwards;
    }
    .fade-in-up-delay-2 {
      animation: fadeInUp 0.6s ease-out 0.2s forwards;
    }
    .fade-in-up-delay-3 {
      animation: fadeInUp 0.6s ease-out 0.3s forwards;
    }

    .gradient-border {
      background: linear-gradient(90deg, var(--primary), var(--accent), var(--primary));
      background-size: 200% 100%;
      animation: gradient-border 3s ease infinite;
    }

    @keyframes countUp {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .count-up {
      animation: countUp 0.5s ease-out;
    }

    @keyframes progressFill {
      from {
        width: 0%;
      }
    }
    .progress-animate {
      animation: progressFill 1.5s ease-out;
    }

    .card-hover:hover {
      transform: translateY(-4px);
      border-color: var(--accent);
      box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 35%, transparent);
    }
    .card-hover > * {
      position: relative;
      z-index: 2;
    }

    @keyframes iconPulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
    .icon-pulse {
      animation: iconPulse 2s ease-in-out infinite;
    }

    @keyframes gradientShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
    .gradient-bg {
      background: linear-gradient(-45deg, var(--background), var(--card), var(--background), var(--muted));
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
    }
  `}</style>
);

// --- HELPER COMPONENTS ---

const StatusBadge = ({ status }) => {
  switch (status) {
    case "done":
      return (
        <span className="flex items-center gap-1 bg-[#60a5fa]/10 text-[#60a5fa] px-2 py-0.5 rounded-full border border-[#60a5fa]/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(96,165,250,0.1)]">
          <CheckCircle2 size={10} /> Done
        </span>
      );
    case "critical":
      return (
        <span className="flex items-center gap-1 bg-[#f87171]/10 text-[#f87171] px-2 py-0.5 rounded-full border border-[#f87171]/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(248,113,113,0.1)]">
          <AlertCircle size={10} /> Critical
        </span>
      );
    case "warning":
      return (
        <span className="flex items-center gap-1 bg-[#fed818]/10 text-[#fed818] px-2 py-0.5 rounded-full border border-[#fed818]/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(254,216,24,0.1)]">
          <AlertTriangle size={10} /> Warning
        </span>
      );
    case "on-track":
      return (
        <span className="flex items-center gap-1 bg-[#10b981]/10 text-[#10b981] px-2 py-0.5 rounded-full border border-[#10b981]/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          <CheckCircle2 size={10} /> On Track
        </span>
      );
    default:
      return null;
  }
};

// --- DATA TRANSFORMATION HELPERS ---
const transformDesignActive = (designData) => {
  if (!designData) {
    return { total: 0, stages: [] };
  }

  const stages = [];

  if (designData.stages && Array.isArray(designData.stages)) {
    designData.stages.forEach((stage) => {
      if (stage.breakdown && stage.breakdown.length > 0) {
        const breakdownItems = stage.breakdown.map((item) => ({
          name: item.name,
          count: item.count || 0,
          pct: item.pct || 0,
          color: item.color || stage.color,
        }));

        stages.push({
          name: stage.name.toLowerCase(),
          count: stage.total_count || 0,
          pct: stage.total_pct || 0,
          color: stage.color,
          breakdown: breakdownItems,
        });
      } else {
        stages.push({
          name: stage.name.toLowerCase(),
          count: stage.total_count || stage.count || 0,
          pct: stage.total_pct || stage.pct || 0,
          color: stage.color,
          breakdown: [],
        });
      }
    });
  }

  return {
    total: designData.total || 0,
    stages,
  };
};

// --- MAIN COMPONENT ---
export default function ManagementDashboard() {
  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data using useApiFetch hook
  const {
    data: apiResponse,
    isLoading,
    error,
  } = useApiFetch("dashboard", "/dashboard", {}, true);

  // Transform and memoize dashboard data
  const dashboardData = useMemo(() => {
    if (!apiResponse?.data) {
      return {
        pipelineStages: [
          { name: "Leads", count: 0, rate: null },
          { name: "Surveys", count: 0, rate: null },
          { name: "Desains", count: 0, rate: null },
          { name: "Execution", count: 0, rate: null },
        ],
        upcomingSurveys: [],
        designActive: { total: 0, stages: [] },
        activeProjects: [],
        townhallData: [],
      };
    }

    const data = apiResponse.data;

    return {
      pipelineStages:
        Array.isArray(data.pipeline_stages) && data.pipeline_stages.length > 0
          ? data.pipeline_stages
          : [
              { name: "Leads", count: 0, rate: null },
              { name: "Surveys", count: 0, rate: null },
              { name: "Desains", count: 0, rate: null },
              { name: "Execution", count: 0, rate: null },
            ],
      upcomingSurveys: Array.isArray(data.upcoming_surveys)
        ? data.upcoming_surveys
        : [],
      designActive: transformDesignActive(data.design_active),
      activeProjects: Array.isArray(data.active_projects)
        ? data.active_projects
        : [],
      townhallData: Array.isArray(data.townhall_data) ? data.townhall_data : [],
    };
  }, [apiResponse]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground font-sans p-4 md:p-6 overflow-x-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground animate-pulse">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground font-sans p-4 md:p-6 overflow-x-hidden flex items-center justify-center">
        <div className="text-center max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-lg">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-muted-foreground mb-4">
            {error.message || "Failed to load dashboard data"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg transition-colors border border-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    pipelineStages,
    upcomingSurveys,
    designActive,
    activeProjects,
    townhallData,
  } = dashboardData;

  return (
    <DashboardLayout dashboard={true}>
      <div className="min-h-screen w-full bg-background text-foreground font-sans p-4 md:p-6 overflow-x-hidden flex flex-col">
        <ThemeStyles />

        {/* 1. HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight flex items-center gap-2 drop-shadow-md">
              <span className="text-accent drop-shadow-[0_0_8px_rgba(254,216,24,0.5)] transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(254,216,24,0.7)]">
                langit
              </span>
              langit.id
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent)] icon-pulse"></span>
              Live Dashboard - Tim Management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs md:text-sm bg-card px-4 py-2 rounded-full shadow-lg text-accent border border-border flex items-center gap-2 font-medium hover:border-accent transition-colors cursor-default">
              <Calendar size={16} className="text-primary" />
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
            <div className="text-xs md:text-sm bg-card px-4 py-2 rounded-full shadow-lg text-accent border border-border flex items-center gap-2 font-medium hover:border-accent transition-colors cursor-default min-w-[100px] justify-center">
              <Clock size={16} className="text-accent" />
              {currentTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </header>

        {/* 2. TOP SECTION: Pipeline + Townhall */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6 shrink-0 xl:h-[220px]">
          {/* PIPELINE (8 Columns) */}
          <section className="xl:col-span-8 bg-card rounded-2xl border border-border relative flex flex-col justify-center px-6 md:px-10 shadow-xl overflow-visible z-10 py-6 xl:py-0 card-hover">
            <div className="flex justify-between items-center mb-2 z-10">
              <h2 className="text-xs font-bold text-accent uppercase tracking-[0.2em] drop-shadow-sm">
                Pipeline Health (4 Stages)
              </h2>
              <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></span>
                Real-time
              </span>
            </div>

            <div className="relative w-full xl:h-[140px] flex items-center justify-center">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-[#1e2f3b] border-t border-dashed border-[#363430] z-0"></div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10 w-full h-full items-center justify-items-center content-center">
                {pipelineStages.map((stage, index) => {
                  const hasBreakdown =
                    stage.breakdown &&
                    (stage.name === "Surveys" || stage.name === "Desains");
                  const currentMonthPct = hasBreakdown
                    ? stage.breakdown.current_month_pct || 0
                    : 0;
                  const lastMonthPct =
                    hasBreakdown && stage.name === "Surveys"
                      ? stage.breakdown.last_month_pct || 0
                      : 0;
                  const twoMonthsAgoPct = hasBreakdown
                    ? stage.breakdown.two_months_ago_pct || 0
                    : 0;

                  const isSurveys = stage.name === "Surveys";
                  const yellowDegrees = (currentMonthPct / 100) * 360;
                  const orangeDegrees = isSurveys
                    ? (lastMonthPct / 100) * 360
                    : 0;
                  const blueStartDegrees = yellowDegrees + orangeDegrees;
                  const blueDegrees = 360 - blueStartDegrees;

                  const showProportionalBorder =
                    hasBreakdown &&
                    (currentMonthPct > 0 ||
                      lastMonthPct > 0 ||
                      twoMonthsAgoPct > 0) &&
                    currentMonthPct + lastMonthPct + twoMonthsAgoPct > 0;

                  const getBorderStyle = () => {
                    if (!showProportionalBorder) return {};
                    return isSurveys
                      ? {
                          background: `conic-gradient(
                            from 0deg,
                            #fed818 0deg ${yellowDegrees}deg,
                            #ff8c42 ${yellowDegrees}deg ${blueStartDegrees}deg,
                            #135a86 ${blueStartDegrees}deg 360deg
                          )`,
                          padding: "3px",
                          borderRadius: "50%",
                          display: "inline-block",
                        }
                      : {
                          background: `conic-gradient(
                            from 0deg,
                            #fed818 0deg ${yellowDegrees}deg,
                            #135a86 ${yellowDegrees}deg 360deg
                          )`,
                          padding: "3px",
                          borderRadius: "50%",
                          display: "inline-block",
                        };
                  };

                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center justify-center group relative cursor-pointer w-full"
                    >
                      {stage.rate && (
                        <div className="hidden md:flex absolute -left-[50%] top-1/2 transform -translate-y-1/2 translate-x-1/2 bg-[#0f1a22] border border-[#363430] text-[10px] text-[#fed818] px-2 py-0.5 rounded-full z-20 items-center gap-1 shadow-md whitespace-nowrap group-hover:border-[#fed818] transition-colors">
                          <ArrowRight size={10} /> {stage.rate}
                        </div>
                      )}

                      <div className="relative transition-all duration-500 ease-out smooth-scale count-up flex items-center justify-center mb-3">
                        <div
                          className={`relative transition-all duration-300 ease-in-out group-hover:scale-110 ${
                            showProportionalBorder ? "p-[3px]" : ""
                          }`}
                          style={
                            showProportionalBorder
                              ? {
                                  background: "transparent",
                                  borderRadius: "50%",
                                }
                              : {}
                          }
                        >
                          {showProportionalBorder && (
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out rounded-full"
                              style={getBorderStyle()}
                            />
                          )}
                          <div
                            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex flex-col items-center justify-center font-bold text-2xl md:text-3xl transition-all duration-500 ease-out shadow-lg relative z-10 ${
                              showProportionalBorder
                                ? "bg-[#0f1a22] text-[#cfc9bd] group-hover:text-[#fffdf5] group-hover:shadow-[0_0_15px_rgba(254,216,24,0.3)] group-hover:bg-[#1e2f3b]"
                                : index === 0
                                  ? "border-4 border-[#135a86]/80 bg-[#135a86] text-[#fffdf5] shadow-[#135a86]/30 group-hover:shadow-[0_0_20px_rgba(19,90,134,0.5)]"
                                  : index === 3
                                    ? "border-4 border-[#fed818]/80 bg-[#fed818] text-[#363430] shadow-[#fed818]/30 scale-105 group-hover:scale-115 group-hover:shadow-[0_0_25px_rgba(254,216,24,0.6)]"
                                    : "border-4 border-[#363430] bg-[#0f1a22] text-[#cfc9bd] group-hover:border-[#fed818] group-hover:text-[#fffdf5] group-hover:shadow-[0_0_15px_rgba(254,216,24,0.3)] group-hover:bg-[#1e2f3b]"
                            }`}
                          >
                            <span className="transition-all duration-300 group-hover:scale-110">
                              {stage.count ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs md:text-sm font-bold tracking-wide uppercase text-center transition-colors ${
                          index === 3
                            ? "text-[#fed818] drop-shadow-[0_0_5px_rgba(254,216,24,0.3)]"
                            : index === 0
                              ? "text-[#135a86]"
                              : "text-[#cfc9bd] group-hover:text-[#fed818]"
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

          {/* TOWNHALL (4 Columns) */}
          <div className="xl:col-span-4 bg-card rounded-2xl border border-border p-5 flex flex-col shadow-lg overflow-hidden h-full min-h-[180px] card-hover">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h3 className="font-bold text-accent flex items-center gap-2 text-sm md:text-base">
                <Building2
                  size={18}
                  className="text-accent transition-transform duration-300 hover:scale-110"
                />{" "}
                Townhall Schedule
              </h3>
              <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/30 animate-pulse-slow">
                Confirmed
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-1">
              {townhallData.length > 0 ? (
                townhallData.map((data, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-5 px-5 py-3 rounded-lg bg-[#0e1922] border border-[#1f2a33] hover:border-[#fed818]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center w-14 shrink-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#cfc9bd]/70">
                        {data.month}
                      </span>
                      <span className="text-xl font-bold text-[#fed818] leading-tight">
                        {data.date}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#fffdf5] truncate">
                        {data.client || data.event || "Townhall Meeting"}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#cfc9bd]/80">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-[#fed818]" />
                          {data.time}
                        </span>

                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <MapPin size={11} className="text-[#fed818]" />
                          {data.location}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 uppercase tracking-wide whitespace-nowrap">
                        {data.pic}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#cfc9bd] text-sm py-8">
                  No townhall scheduled
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. BOTTOM SECTION: Leads Chart (Management Version), Survey/Design, Execution */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 min-h-0 mb-6">
          {/* COL 1: LEADS CHART MANAGEMENT (4 Cols) */}
          <div className="xl:col-span-4">
            <LeadsChartManagement />
          </div>

          {/* COL 2: SURVEY & DESIGN (4 Cols) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Survey Card */}
            <div className="flex-1 bg-card rounded-2xl border border-border p-5 flex flex-col overflow-hidden shadow-lg min-h-[250px] card-hover">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-accent flex items-center gap-2 text-base md:text-lg">
                  <MapPin
                    size={18}
                    className="text-accent transition-transform duration-300 hover:scale-110"
                  />{" "}
                  Survey Upcoming
                </h3>
                <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded border border-accent/30 count-up">
                  {upcomingSurveys.length} Pending
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scroll">
                {upcomingSurveys.length > 0 ? (
                  upcomingSurveys.map((survey, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center gap-5 px-5 py-4 rounded-lg bg-gradient-to-r from-card to-secondary border border-border transition-all duration-200 ease-out hover:border-accent/40 hover:bg-background hover:shadow-[0_6px_18px_rgba(0,0,0,0.35)] cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center w-14 shrink-0 text-center">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                          {survey.month}
                        </span>
                        <span className="text-xl font-bold text-accent leading-tight">
                          {survey.date}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-base font-semibold text-foreground truncate transition-colors group-hover:text-accent">
                          {survey.client}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/80">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-accent" />
                            {survey.time}
                          </span>

                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin size={12} className="text-accent" />
                            {survey.location}
                          </span>
                        </div>

                        <div className="mt-1 text-[11px] text-accent/80">
                          PIC: {survey.pic}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/30 uppercase tracking-wide transition-colors group-hover:bg-accent/20">
                          {survey.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No upcoming surveys
                  </div>
                )}
              </div>
            </div>

            {/* Design Card */}
            <div className="bg-card rounded-2xl border border-border p-5 flex flex-col shadow-lg min-h-[200px] card-hover relative z-10">
              <div className="flex justify-between items-center mb-5 shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: `${designActive.total > 0 ? "var(--accent)" : "var(--muted)"}20`,
                      border: `1px solid ${designActive.total > 0 ? "var(--accent)" : "var(--border)"}40`,
                    }}
                  >
                    <PenTool
                      size={18}
                      className="text-accent transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-accent text-base md:text-lg">
                      Design Aktif
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Breakdown by Stage
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-foreground drop-shadow-[0_0_8px_rgba(254,216,24,0.4)] count-up">
                    {designActive.total}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Total Active
                  </span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-5">
                {designActive.stages.length > 0 ? (
                  designActive.stages.map((stage, idx) => {
                    const hasBreakdown =
                      stage.breakdown && stage.breakdown.length > 0;

                    return (
                      <div key={idx} className="group relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg"
                              style={{
                                backgroundColor: stage.color,
                                boxShadow: `0 0 8px ${stage.color}60`,
                              }}
                            />
                            <span className="text-xs font-semibold text-[#fffdf5] uppercase tracking-wider">
                              {stage.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#cfc9bd]">
                              {stage.count} tasks
                            </span>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-md"
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

                        <div className="relative">
                          <div className="w-full bg-[#0f1a22] h-3 rounded-full overflow-hidden relative shadow-inner border border-[#363430]/50">
                            <div
                              className="h-full rounded-full relative flex transition-all duration-1000 ease-out progress-animate group-hover:shadow-lg"
                              style={{
                                width: `${stage.pct}%`,
                              }}
                            >
                              {hasBreakdown ? (
                                stage.breakdown.map((item, breakdownIdx) => {
                                  const segmentWidth =
                                    stage.pct > 0
                                      ? (item.pct / 100) * stage.pct
                                      : 0;

                                  const segmentColor =
                                    item.color || stage.color;
                                  const isLastSegment =
                                    breakdownIdx === stage.breakdown.length - 1;

                                  return (
                                    <div
                                      key={breakdownIdx}
                                      className="h-full relative group/segment transition-all duration-300 hover:brightness-110"
                                      style={{
                                        width: `${segmentWidth}%`,
                                        backgroundColor: segmentColor,
                                        boxShadow: `inset 0 0 10px ${segmentColor}40`,
                                        borderRight: !isLastSegment
                                          ? "1px solid rgba(255,255,255,0.15)"
                                          : "none",
                                      }}
                                    />
                                  );
                                })
                              ) : (
                                <div
                                  className="h-full rounded-full relative"
                                  style={{
                                    width: "100%",
                                    backgroundColor: stage.color,
                                    boxShadow: `0 0 12px ${stage.color}50, inset 0 0 10px ${stage.color}30`,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <PenTool
                      size={32}
                      className="mx-auto text-[#363430] mb-3"
                    />
                    <p className="text-sm text-[#cfc9bd] font-medium">
                      No active designs
                    </p>
                    <p className="text-xs text-[#cfc9bd]/60 mt-1">
                      Design tasks will appear here when created
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COL 3: EXECUTION (4 Cols) */}
          <div className="xl:col-span-4 bg-[#152733] rounded-2xl border border-[#363430] flex flex-col overflow-hidden shadow-lg h-full min-h-[300px] card-hover">
            <div className="p-5 border-b border-[#363430] flex justify-between items-center bg-[#0f1a22]/50 shrink-0">
              <h3 className="font-bold text-[#fed818] flex items-center gap-2 text-base md:text-lg">
                <HardHat
                  size={20}
                  className="text-[#fed818] transition-transform duration-300 hover:scale-110"
                />
                Execution
              </h3>
              <div className="text-[10px] font-bold bg-[#fed818] text-[#363430] px-2 py-0.5 rounded-full shadow-lg shadow-[#fed818]/30 animate-pulse-slow count-up">
                {activeProjects.length} Aktif
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#0f1a22] text-[#cfc9bd] font-medium text-[10px] uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3">Proyek & Progress</th>
                    <th className="px-5 py-3 text-right">Deadline & Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#363430]/50">
                  {activeProjects.length > 0 ? (
                    [...activeProjects]
                      .sort((a, b) => {
                        const progressA = a.progress || 0;
                        const progressB = b.progress || 0;
                        const isCompleteA = progressA === 100;
                        const isCompleteB = progressB === 100;

                        if (isCompleteA && isCompleteB) {
                          return (a.customer || "").localeCompare(
                            b.customer || "",
                          );
                        }

                        if (isCompleteA) return 1;
                        if (isCompleteB) return -1;

                        return progressB - progressA;
                      })
                      .map((proj) => {
                        const progress = proj.progress || 0;
                        const isComplete = progress === 100;
                        const isOverdue = proj.daysLeft < 0 || proj.isOverdue;
                        const shouldShowOverdue = isOverdue && !isComplete;

                        const daysValue = Math.floor(
                          Math.abs(proj.daysLeft || proj.absoluteDays || 0),
                        );
                        const daysDisplay = shouldShowOverdue
                          ? `Terlambat ${daysValue} hari`
                          : `${daysValue} hari lagi`;

                        return (
                          <Tooltip key={proj.id}>
                            <TooltipTrigger asChild>
                              <tr className="hover:bg-[#1e2f3b]/50 transition-all duration-300 group cursor-pointer smooth-scale">
                                <td className="px-5 py-3 align-top">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-[#fffdf5] text-xs md:text-sm truncate group-hover:text-[#fed818] transition-colors">
                                        {proj.customer}
                                      </p>
                                      <p className="text-[10px] text-[#135a86] mt-0.5 group-hover:text-[#1e6fa8] transition-colors">
                                        {proj.type}
                                      </p>
                                    </div>
                                    <div className="shrink-0">
                                      {(() => {
                                        const isError =
                                          proj.status === "critical" &&
                                          !isComplete;

                                        if (isError) {
                                          return (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-[#f87171]/10 text-[#f87171] border-[#f87171]/40">
                                              {progress}%
                                            </span>
                                          );
                                        } else if (isComplete) {
                                          return (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-[#60a5fa]/10 text-[#60a5fa] border-[#60a5fa]/40">
                                              {progress}%
                                            </span>
                                          );
                                        } else {
                                          return (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/40">
                                              {progress}%
                                            </span>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                  <div className="w-full bg-[#0f1a22] h-2 rounded-full overflow-hidden shadow-inner relative">
                                    {(() => {
                                      const progressValue = Math.min(
                                        100,
                                        Math.max(0, proj.progress || 0),
                                      );
                                      const isCompleteValue =
                                        progressValue === 100;
                                      const isError =
                                        proj.status === "critical" &&
                                        !isCompleteValue;

                                      let barColor, shadowColor;
                                      if (isError) {
                                        barColor = "#f87171";
                                        shadowColor = "#f87171";
                                      } else if (isCompleteValue) {
                                        barColor = "#60a5fa";
                                        shadowColor = "#60a5fa";
                                      } else {
                                        barColor = "#4ade80";
                                        shadowColor = "#4ade80";
                                      }

                                      return (
                                        <div
                                          className="h-full rounded-full transition-all duration-1000 ease-out progress-animate"
                                          style={{
                                            width: `${progress}%`,
                                            backgroundColor: barColor,
                                            boxShadow: `0 0 8px ${shadowColor}`,
                                          }}
                                        ></div>
                                      );
                                    })()}
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-right align-top">
                                  <div className="flex flex-col items-end gap-2">
                                    <div className="flex justify-end">
                                      <StatusBadge status={proj.status} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span
                                        className={`text-[10px] md:text-xs font-bold ${
                                          shouldShowOverdue
                                            ? "text-[#f87171]"
                                            : proj.status === "warning" &&
                                                !isComplete
                                              ? "text-[#fed818]"
                                              : "text-[#cfc9bd]"
                                        }`}
                                      >
                                        {daysDisplay}
                                      </span>
                                      <span className="text-[9px] text-[#cfc9bd]/70">
                                        {proj.deadline || "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="bg-[#0f1a22] border border-[#363430] text-[#fffdf5] px-3 py-2 rounded-lg shadow-lg max-w-xs"
                              sideOffset={8}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="size-3.5 text-[#fed818] shrink-0" />
                                  <span className="text-xs font-semibold text-[#fed818]">
                                    Terakhir Diubah
                                  </span>
                                </div>
                                <p className="text-xs text-[#cfc9bd] ml-[22px]">
                                  {proj.modtime || "Belum pernah diubah"}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-5 py-8 text-center text-[#cfc9bd] text-sm"
                      >
                        No active projects
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
