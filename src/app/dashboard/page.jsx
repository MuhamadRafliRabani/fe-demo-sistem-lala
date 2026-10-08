"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/hooks/auth-store";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import DashboardPanel from "./components/dashboard-panel";
import DashboardManagement from "./components/dashboard-management";
import DashboardDefault from "./components/dashboard-default";
import DashboardMarketing from "./components/dashboard-marketing";
import DashboardDesigner from "./components/dashboard-designer";

export default function ConstructionDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <DashboardLayout dashboard={true}>
      {(() => {
        switch (Number(user?.role_id)) {
          case 1:
            return <DashboardManagement currentTime={currentTime} />;
          case 3:
            return <DashboardMarketing currentTime={currentTime} />;
          case 5:
            return <DashboardDesigner currentTime={currentTime} />;
          case 11:
            return <DashboardPanel currentTime={currentTime} />;
          default:
            return <DashboardDefault currentTime={currentTime} />;
        }
      })()}
    </DashboardLayout>
  );
}
