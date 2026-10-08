"use client";

import DashboardLayout from "@/components/layouts/dashboard-layout";
import { SurveyReportGeneratorContent } from "../../surveys/schedule-surveys/activity/[id]/components/SurveyReportGeneratorContent";

export default function SurveyReportGeneratorPage() {
  return (
    <DashboardLayout
      title="Generator Report Survey"
      desc="Buat dan generate report survey dengan preview PDF real-time. Isi form di kiri dan lihat preview di kanan."
    >
      <SurveyReportGeneratorContent />
    </DashboardLayout>
  );
}
