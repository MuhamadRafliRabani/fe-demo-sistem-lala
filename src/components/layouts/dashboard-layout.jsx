"use client";

import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/hooks/auth-store";
import { ReminderSound } from "../reminder-sound";
import { useEffect, useState } from "react";
import { VolumeX } from "lucide-react";
import AppSidebar from "../app-sidebar";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
  title = "",
  desc = "",
  dashboard = false,
}) {
  const { theme } = useTheme();
  const { user, isHydrated, loadFromStorage } = useAuthStore();
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  useEffect(() => {
    const onPlay = () => setIsSoundPlaying(true);
    const onStop = () => setIsSoundPlaying(false);

    window.addEventListener("reminder-sound-played", onPlay);
    window.addEventListener("stop-reminder-sound", onStop);

    return () => {
      window.removeEventListener("reminder-sound-played", onPlay);
      window.removeEventListener("stop-reminder-sound", onStop);
    };
  }, []);

  const handleStopSound = () => {
    window.dispatchEvent(new Event("stop-reminder-sound"));
    setIsSoundPlaying(false);
  };

  if (!theme || !isHydrated) return null;

  if (isHydrated && !user) {
    return null; // Return null to avoid flashing dashboard before redirect
  }

  return (
    <AppSidebar variant="inset">
      <div
        className={`${
          dashboard ? "lg:p-6 lg:pt-0 xl:py-8 xl:px-4 2xl:p-0 p-0" : "py-8"
        } h-full w-full min-w-0`}
      >
        <CardHeader className="px-6">
          <CardTitle className="text-3xl font-semibold">{title}</CardTitle>
          <CardDescription className="text-base">{desc}</CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 flex-1 flex flex-col w-full min-w-0 ">
          {children}
        </CardContent>
      </div>
    </AppSidebar>
  );
}
