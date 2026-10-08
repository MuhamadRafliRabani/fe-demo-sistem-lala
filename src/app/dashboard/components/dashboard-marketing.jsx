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
import { useAuthStore } from "@/hooks/auth-store";
import { startOfWeek, endOfWeek, format, parseISO, subDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatDateDb } from "@/lib/date-format-db";
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

export default function DashboardMarketing({ currentTime }) {
  return (
    <div className="min-h-screen w-full text-foreground font-sans py-4 md:p-6 overflow-x-hidden flex flex-col">
      <ThemeStyles />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight flex items-center gap-2 drop-shadow-md">
            <span className="text-accent drop-shadow-[0_0_8px_rgba(254,216,24,0.5)] transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(254,216,24,0.7)]">
              langit
            </span>
            langit.id
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent)] icon-pulse" />
            Live Dashboard - Marketing
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
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
        </div> */}
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
          <DashboardSurveyCard />
          <DashboardDesignCard />
        </div>
        <div className="xl:col-span-4">
          <DashboardExecutionCard />
        </div>
      </div>
    </div>
  );
}
