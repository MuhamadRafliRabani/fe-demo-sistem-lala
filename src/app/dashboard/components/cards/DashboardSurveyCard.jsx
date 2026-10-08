"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Clock,
  Play,
  CheckCheck,
  ChevronRight,
  User,
} from "lucide-react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAuthStore } from "@/hooks/auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import {
  formatCountdown,
  calculateCountdownStatus,
} from "@/lib/countdown-utils";

const SurveySkeleton = () => (
  <div className="bg-card rounded-2xl border border-border p-5 min-h-[250px] animate-pulse flex flex-col gap-4">
    <div className="h-5 w-36 bg-muted rounded" />
    <div className="flex-1 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-muted/80 rounded-lg" />
      ))}
    </div>
  </div>
);

export default function DashboardSurveyCard({ className = "" }) {
  const { upcomingSurveys, isLoading, error } = useDashboardData();
  const { user } = useAuthStore();
  const router = useRouter();
  const [eventDataMap, setEventDataMap] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());

  // === (LOGIKA CODE ASLI TIDAK DIUBAH) ===
  useEffect(() => {
    if (!upcomingSurveys || upcomingSurveys.length === 0) return;

    const fetchEventData = async () => {
      const promises = upcomingSurveys.map(async (survey) => {
        if (survey.survey_event) {
          return { id: survey.id, eventData: survey.survey_event };
        }
        try {
          const response = await axiosInstance.get(
            `/survey-events/schedule/${survey.id}/countdown`,
          );
          if (response.data?.data) {
            return { id: survey.id, eventData: response.data.data };
          }
        } catch (err) {}
        return { id: survey.id, eventData: null };
      });

      const results = await Promise.all(promises);
      const map = {};
      results.forEach(({ id, eventData }) => {
        if (eventData) map[id] = eventData;
      });
      setEventDataMap(map);
    };

    fetchEventData();
  }, [upcomingSurveys]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const countdowns = useMemo(() => {
    const result = {};
    Object.entries(eventDataMap).forEach(([id, eventData]) => {
      result[id] = calculateCountdownStatus(eventData, currentTime);
    });
    return result;
  }, [eventDataMap, currentTime]);

  const playSurvey = async (id, e) => {
    e?.stopPropagation();
    try {
      const response = await axiosInstance.post(`/survey-events/play/${id}`);
      if (response.data) {
        toast.success("Countdown survey dimulai!");
        await new Promise((resolve) => setTimeout(resolve, 300));
        try {
          const countdownResponse = await axiosInstance.get(
            `/survey-events/schedule/${id}/countdown`,
          );
          if (countdownResponse.data?.data) {
            const countdownData = countdownResponse.data.data;
            const updatedEventData = {
              status: countdownData.status,
              departure_at: countdownData.departure_at,
              actual_departure_at: countdownData.actual_departure_at,
              survey_start_at: countdownData.survey_start_at,
              survey_end_at: countdownData.survey_end_at,
              return_end_at: countdownData.return_end_at,
              actual_return_at: countdownData.actual_return_at,
              issue_image: countdownData.issue_image,
            };
            setEventDataMap((prev) => ({ ...prev, [id]: updatedEventData }));
            setCurrentTime(new Date());
            router.push(`/dashboard/surveys/schedule-surveys/activity/${id}`);
          }
        } catch (err) {
          console.error("Error refreshing countdown:", err);
        }
      }
    } catch (err) {
      console.error("Error playing survey:", err);
      toast.error(err.response?.data?.message || "Gagal memulai survey");
    }
  };

  const handleSurveyClick = (survey) => {
    const event = survey.survey_event || eventDataMap[survey.id];
    const hasDeparted = !!event?.actual_departure_at;
    const hasReturned = !!event?.actual_return_at;
    const isManager = Number(user?.role_id) === 1;

    if (!isManager) {
      if (!hasDeparted || hasReturned) return;
    }
    router.push(`/dashboard/surveys/schedule-surveys/activity/${survey.id}`);
  };
  // === (AKHIR LOGIKA ASLI) ===

  if (error) {
    return (
      <div
        className={`bg-card rounded-xl border border-destructive/30 p-6 ${className}`}
      >
        <p className="text-destructive text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive" /> Gagal memuat
          survey.
        </p>
      </div>
    );
  }

  if (isLoading) return <SurveySkeleton />;

  return (
    <div
      className={`flex-1 bg-card rounded-xl border border-border p-6 flex flex-col overflow-hidden shadow-2xl min-h-[300px] transition-colors hover:border-primary/30 ${className}`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-violet/10 rounded-lg">
            <MapPin size={16} className="text-violet" />
          </div>
          <h3 className="text-[13px] font-bold text-violet uppercase tracking-[0.15em]">
            Survey Upcoming
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {upcomingSurveys.length > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-60"></span>
            )}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber"></span>
          </span>
          <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
            {upcomingSurveys.length} Pending
          </span>
        </div>
      </div>

      {/* LIST SURVEYS */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative z-10">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--primary); opacity: 0.5; }
        `,
          }}
        />

        {upcomingSurveys.length > 0 ? (
          upcomingSurveys.map((survey, idx) => {
            const countdown = countdowns[survey.id] || {};
            const isActive = countdown.isActive || false;
            const remainingSeconds = countdown.remainingSeconds || 0;
            const overtimeSeconds = countdown.overtimeSeconds || 0;
            const displaySeconds =
              overtimeSeconds > 0 ? overtimeSeconds : remainingSeconds;
            const phaseMessage = countdown.phaseMessage || "";
            const isSurveyor = Number(user?.role_id) === 3;

            return (
              <div
                key={survey.id ?? idx}
                onClick={() => handleSurveyClick(survey)}
                className={`group relative flex items-center gap-4 px-4 py-4 rounded-xl border transition-all duration-300 ease-out overflow-hidden cursor-pointer
                  ${
                    isActive
                      ? "bg-secondary/40 border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                      : "bg-secondary/20 hover:bg-secondary/40 border-border hover:border-primary/40"
                  }`}
              >
                {/* Glowing Left Accent Line on Hover */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 
                  ${isActive ? "bg-emerald-500 opacity-100" : "bg-primary opacity-0 group-hover:opacity-100"}`}
                />

                {/* DATE BADGE (Sleek Calendar Look) */}
                <div className="flex flex-col items-center justify-center w-[52px] h-[52px] shrink-0 text-center rounded-lg bg-card border border-border shadow-inner group-hover:bg-secondary transition-colors">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                    {survey.month}
                  </span>
                  <span
                    className={`text-[19px] font-black leading-none ${isActive ? "text-emerald-500" : "text-foreground group-hover:text-violet transition-colors"}`}
                  >
                    {survey.date}
                  </span>
                </div>

                {/* INFO SECTION */}
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="text-[14px] font-bold text-foreground/90 truncate transition-colors group-hover:text-foreground mb-1.5">
                    {survey.client}
                  </p>

                  {/* Info Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background/50 border border-border/50 text-[10px] text-muted-foreground font-medium">
                      <Clock
                        size={10}
                        className={
                          isActive ? "text-emerald-500" : "text-violet"
                        }
                      />
                      {survey.time}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/80 border border-border text-[10px] text-muted-foreground font-medium truncate max-w-full">
                      <MapPin
                        size={10}
                        className={
                          isActive ? "text-emerald-500" : "text-primary"
                        }
                      />
                      {survey.region?.name || "-"}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/80 border border-border text-[10px] text-muted-foreground font-medium">
                      <User size={10} className="text-muted-foreground" />
                      {survey.pic}
                    </span>
                  </div>

                  {/* DIGITAL HUD COUNTDOWN (If Active) */}
                  {isActive && (
                    <div className="mt-2.5 flex items-center gap-0 w-fit rounded-md overflow-hidden border border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <span className="px-2.5 py-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wide bg-emerald-500/10">
                        {phaseMessage}
                      </span>
                      <span className="px-3 py-1 text-[11px] font-mono font-bold text-emerald-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {formatCountdown(displaySeconds)}
                      </span>
                    </div>
                  )}
                </div>

                {/* RIGHT ACTION/STATUS BADGE */}
                <div
                  className="shrink-0 pl-2 flex flex-col items-end justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isActive ? (
                    // ACTIVE STATE
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      LIVE
                    </span>
                  ) : isSurveyor ? (
                    // START BUTTON FOR SURVEYOR
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playSurvey(survey.id, e);
                      }}
                      className="group/btn relative px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(99,102,241,0.35)] overflow-hidden"
                      title="Klik untuk memulai survey"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                      <Play size={10} className="relative z-10" />
                      <span className="relative z-10">Start</span>
                    </button>
                  ) : (
                    // NORMAL TYPE BADGE (For Managers/Others viewing inactive)
                    <span className="px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground text-[10px] font-semibold tracking-wider uppercase group-hover:border-primary/30 group-hover:text-foreground transition-colors">
                      {survey.type}
                    </span>
                  )}

                  {/* Hover Hint Arrow */}
                  <div className="mt-2 h-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1 group-hover:translate-x-0">
                    <ChevronRight
                      size={14}
                      className={
                        isActive ? "text-emerald-500/60" : "text-primary/60"
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 opacity-60">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-50"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="text-[12px] uppercase tracking-widest font-medium">
              No Upcoming Surveys
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
