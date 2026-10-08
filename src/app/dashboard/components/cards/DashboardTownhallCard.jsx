"use client";

import React from "react";
import { Building2, Clock, MapPin, User } from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";

const TownhallSkeleton = () => (
  <div className="xl:col-span-4 bg-card rounded-2xl border border-border p-5 min-h-[180px] animate-pulse flex flex-col gap-3">
    <div className="h-5 w-32 bg-secondary rounded" />
    <div className="flex-1 space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="h-16 bg-secondary/50 rounded-lg" />
      ))}
    </div>
  </div>
);

export default function DashboardTownhallCard({ className = "" }) {
  const { townhallData, isLoading, error } = useDashboardData();

  if (error) {
    return (
      <div
        className={`xl:col-span-4 bg-card rounded-2xl border border-destructive/30 p-5 ${className}`}
      >
        <p className="text-destructive text-sm">Gagal memuat townhall.</p>
      </div>
    );
  }

  if (isLoading) {
    return <TownhallSkeleton />;
  }

  return (
    <div
      className={`xl:col-span-4 overflow-hidden h-full min-h-[180px] ${className}`}
    >
      <div
        className={`flex-1 bg-card rounded-xl border border-border p-5 md:p-6 flex flex-col shadow-lg transition-colors hover:border-primary/30 relative z-10 overflow-hidden group/card min-h-full`}
      >
        {/* --- AMBIENT GLOW --- */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-primary opacity-[0.03] blur-[80px] rounded-full pointer-events-none group-hover/card:opacity-[0.06] transition-opacity duration-700" />

        {/* --- HEADER (Compact & Sleek) --- */}
        <div className="flex justify-between items-start mb-4 shrink-0 z-10 border-b border-border/50 pb-4 relative">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary opacity-20 blur-lg rounded-xl" />
              <div className="relative p-2.5 bg-secondary border border-primary/30 rounded-[14px] flex items-center justify-center shadow-inner">
                <Building2 size={18} className="text-primary" />
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-[15px] md:text-base font-bold text-primary tracking-wide">
                Townhall Schedule
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold tracking-widest uppercase">
                Internal Events
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.14)]" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
              Confirmed
            </span>
          </div>
        </div>

        {/* --- LIST CARDS (Compact & Sleek) --- */}
        <div className="flex flex-col gap-2.5 flex-1 relative z-10">
          {townhallData.length > 0 ? (
            townhallData.map((data, idx) => (
              <div
                key={data.id ?? idx}
                className="group/item relative bg-secondary/20 hover:bg-secondary/40 border border-border hover:border-primary/20 p-3 md:p-3.5 rounded-xl transition-all duration-300 ease-out flex items-center gap-3.5 cursor-pointer"
              >
                {/* Vertical Line Indicator (Left edge) */}
                <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300 opacity-60 group-hover/item:opacity-100 group-hover/item:w-[4px] bg-primary shadow-[0_0_8px_rgba(0,0,0,0.12)]" />

                {/* DATE CALENDAR BLOCK */}
                <div className="flex flex-col items-center justify-center w-[52px] h-[52px] shrink-0 text-center rounded-lg border border-border bg-card group-hover/item:border-primary/20 transition-colors ml-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                    {data.month}
                  </span>
                  <span className="text-[18px] font-black leading-none text-foreground group-hover/item:text-primary transition-colors">
                    {data.date}
                  </span>
                </div>

                {/* MAIN CONTENT BLOCK */}
                <div className="flex-1 min-w-0 py-0.5">
                  <h4 className="text-[13px] md:text-[14px] font-bold text-foreground/90 truncate group-hover/item:text-foreground transition-colors mb-1.5">
                    {data.client || data.event || "Townhall Meeting"}
                  </h4>

                  {/* Pills Metadata */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/50 border border-border text-[9px] text-muted-foreground font-medium group-hover/item:border-primary/20 transition-colors">
                      <Clock size={10} className="text-primary" />
                      {data.time}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-background/50 border border-border text-[9px] text-muted-foreground font-medium max-w-[140px] truncate group-hover/item:border-primary/20 transition-colors">
                      <MapPin size={10} className="text-primary" />
                      {data.location}
                    </span>
                  </div>
                </div>

                {/* RIGHT ACTION/PIC BLOCK */}
                <div className="shrink-0 flex flex-col items-end justify-center pr-1">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">
                      PIC
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground/80 bg-secondary/40 px-2 py-1 rounded-md border border-border group-hover/item:border-primary/30 transition-colors">
                      <User
                        size={10}
                        className="text-muted-foreground group-hover/item:text-primary transition-colors"
                      />
                      {data.pic}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 opacity-60">
              <Building2 size={32} className="mb-3 text-muted-foreground/30" />
              <h4 className="text-foreground font-bold text-[11px] uppercase tracking-widest mb-1">
                No Schedule
              </h4>
              <p className="text-muted-foreground text-[9px] font-medium">
                Tidak ada townhall dalam waktu dekat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
