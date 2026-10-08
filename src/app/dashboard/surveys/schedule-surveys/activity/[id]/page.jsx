"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import {
  Presentation,
  ClipboardList,
  Wrench,
  AlertCircle,
  Loader2,
  Zap,
  Calculator,
  Paperclip,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateCountdownStatus } from "@/lib/countdown-utils";

import { getTime } from "./utils";
import { HeaderCard } from "./components/HeaderCard";
import { MonitoringSteps } from "./components/MonitoringSteps";
import { TabKendala } from "./components/TabKendala";
import { TabAttachment } from "./components/TabAttachment";
import { TabUtility } from "./components/TabUtility";
import { TabPresentasi } from "./components/TabPresentasi";
import { TabEstimate } from "./components/TabEstimate";
import { SurveyReportGeneratorContent } from "./components/SurveyReportGeneratorContent";
import DesignEstimator from "@/components/tools/design-estimator";

const ActivityPage = () => {
  const params = useParams();
  const id = params.id;
  const { data: apiResponse, isLoading: isLoadingSchedule } = useApiFetch(
    ["schedule", id],
    `/schedules/${id}`,
    {
      include:
        "client,client.occupants,surveyors,region,surveyEvent,surveyReport",
    },
  );

  const schedule = apiResponse?.data;

  const {
    data: issuesData,
    isLoading: isLoadingIssues,
    mutate: mutateIssues,
    refetch: refetchIssues,
  } = useApiFetch(["issues", id], `/schedules/${id}/issues`);

  const issues = useMemo(() => issuesData || [], [issuesData]);

  const [activeTab, setActiveTab] = useState("presentasi");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([
    "survey_report",
    "survey_estimate",
    "design_estimate",
  ]);

  // Utility State
  const [eventData, setEventData] = useState(null);
  const { mutate: stopSurvey, isPending: isStopping } = usePost(
    `/survey-events/schedule/${id}/stop`,
    {
      invalidate: [["issues"], ["schedule"]],
    },
  );

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await axiosInstance.get(
          `/survey-events/schedule/${id}/countdown`,
        );
        if (response.data?.data) {
          setEventData(response.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (id) {
      fetchEventData();
      const interval = setInterval(fetchEventData, 30000);
      return () => clearInterval(interval);
    }
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const PROJECT_DATA = useMemo(() => {
    if (!schedule) return null;
    return {
      name: schedule.project_name || "Survey " + schedule.client?.name,
      sector: schedule.sub_district?.name || "Unknown Sector",
      id: schedule.id,
      location: schedule.region?.name || "Unknown Location",
      address: schedule.address || "-",
      link_address: schedule.link_address || "-",
      region_code: schedule.region?.code || "-",
      client: {
        name: schedule.client?.name || "Unknown Client",
        category: schedule.client?.category || "-",
        phone: schedule.client?.phone || "-",
      },
      team:
        schedule.surveyor?.map((s, idx) => ({
          name: s.name,
          initial: s.name.substring(0, 2).toUpperCase(),
          color: ["bg-cyan-400", "bg-amber-400", "bg-indigo-400"][idx % 3],
        })) || [],
      monitoring: {
        steps: [
          {
            label: "Estimasi Berangkat",
            est: getTime(schedule.survey_event?.departure_at),
            actual: getTime(schedule.survey_event?.departure_at),
            status: schedule.survey_event?.actual_departure_at
              ? "done"
              : "pending",
          },
          {
            label: "Mulai Survey",
            est: getTime(schedule.survey_event?.survey_start_at),
            actual: getTime(schedule.survey_event?.survey_start_at),
            status: "pending",
          },
          {
            label: "Selesai Survey",
            est: getTime(schedule.survey_event?.survey_end_at),
            actual: null,
            status: "pending",
          },
          {
            label: "Kembali Pada",
            est: getTime(schedule.survey_event?.return_end_at),
            actual: getTime(schedule.survey_event?.return_end_at),
            status: schedule.survey_event?.return_end_at ? "done" : "pending",
          },
        ],
        actualDeparture:
          getTime(schedule.survey_event?.actual_departure_at) === "--:--"
            ? "--:--"
            : getTime(schedule.survey_event?.actual_departure_at),
        actualCompletion:
          getTime(schedule.survey_event?.actual_return_at) === "--:--"
            ? "--:--"
            : getTime(schedule.survey_event?.actual_return_at),
      },
    };
  }, [schedule]);

  const countdown = useMemo(() => {
    if (!eventData) return null;
    return calculateCountdownStatus(eventData);
  }, [eventData]);

  const handleStop = () => {
    if (isStopping) return;

    stopSurvey(
      {},
      {
        invalidate: ["issues", id],
        onSuccess: (res) => {
          toast.success("Survey dihentikan");
          if (res.data) setEventData(res.data);
        },
        onError: () => toast.error("Gagal menghentikan survey"),
      },
    );
  };

  const { mutateAsync: sendPdfs, isPending: isSendingPdfs } = usePost(
    `/schedules/${id}/send-survey-pdfs`,
  );

  const toggleType = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleSendPdfs = async () => {
    if (!schedule?.id) return;
    if (!selectedTypes.length) {
      toast.error("Pilih minimal satu dokumen untuk dikirim.");
      return;
    }

    try {
      await sendPdfs(
        {
          types: selectedTypes,
          recipient: schedule?.client?.email,
        },
        {
          onSuccess: () => {
            toast.success("PDF survey berhasil dikirim ke email.");
            setIsSendDialogOpen(false);
          },
          onError: (error) => {
            const message =
              error?.response?.data?.message ||
              "Gagal mengirim PDF survey. Coba lagi.";
            toast.error(message);
          },
        },
      );
    } catch {
      toast.error("Gagal mengirim PDF survey. Coba lagi.");
    }
  };

  if (isLoadingSchedule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!PROJECT_DATA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        Data not found
      </div>
    );
  }

  const tabs = [
    {
      id: "presentasi",
      label: "Presentasi",
      icon: Presentation,
      sub: "Materi & Laporan",
      accent: "text-cyan-400",
      bg: "bg-cyan-400",
    },
    {
      id: "form",
      label: "Form Survey",
      icon: ClipboardList,
      sub: "Input Data Teknis",
      accent: "text-emerald-400",
      bg: "bg-emerald-400",
    },
    {
      id: "utility",
      label: "Utility",
      icon: Wrench,
      sub: "Manajemen Alat",
      accent: "text-amber-400",
      bg: "bg-amber-400",
    },
    {
      id: "estimate",
      label: "Estimate Rumah",
      icon: Calculator,
      sub: "Hitung Biaya",
      accent: "text-purple-400",
      bg: "bg-purple-400",
    },
    {
      id: "estimate-design",
      label: "Estimate Design",
      icon: Calculator,
      sub: "Hitung Biaya design",
      accent: "text-yellow-400",
      bg: "bg-yellow-400",
    },
    {
      id: "attachments",
      label: "Attachment",
      icon: Paperclip,
      sub: "Berkas Survey",
      accent: "text-sky-400",
      bg: "bg-sky-400",
    },
    {
      id: "kendala",
      label: "Kendala",
      icon: AlertCircle,
      sub: "Dokumentasi Isu",
      accent: "text-rose-400",
      bg: "bg-rose-400",
    },
  ];

  return (
    <DashboardLayout dashboard={true}>
      <div className="py-4 selection:bg-cyan-500 selection:text-white">
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[0%] right-[-5%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[150px]"></div>
        </div>

        <div className="relative z-10 space-y-6">
          <HeaderCard
            projectData={PROJECT_DATA}
            currentTime={currentTime}
            onTerminate={handleStop}
            onOpenSendDialog={() => setIsSendDialogOpen(true)}
          />

          <MonitoringSteps projectData={PROJECT_DATA} />

          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative overflow-hidden rounded-xl border p-3 md:p-6 flex items-center gap-2 md:gap-5 text-left transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] border-primary"
                    : "bg-card text-foreground border-border hover:bg-accent/5 hover:border-primary/20"
                }`}
              >
                <div
                  className={`p-3.5 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? "bg-primary-foreground/10 text-primary-foreground"
                      : "bg-muted text-primary shadow-inner group-hover:scale-110"
                  }`}
                >
                  <tab.icon size={22} className="size-5 md:size-6" />
                </div>
                <div className="relative z-10">
                  <h4
                    className={`text-xs font-black uppercase tracking-tight ${
                      activeTab === tab.id
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {tab.label}
                  </h4>
                  <p
                    className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                      activeTab === tab.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tab.sub}
                  </p>
                </div>
              </button>
            ))}
          </section>

          <main className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl min-h-[500px] shadow-lg shadow-black/5 overflow-hidden relative group/main">
            {activeTab === "presentasi" && <TabPresentasi />}

            {activeTab === "form" && (
              <SurveyReportGeneratorContent
                initialScheduleId={id}
                initialSchedule={schedule}
                initialSurveyReport={schedule?.survey_report}
                interiorInfoImage="/asset/survey/interior.jpeg"
                sipilInfoImage="/asset/survey/sipil.jpeg"
              />
            )}

            {activeTab === "utility" && (
              <TabUtility
                countdown={countdown}
                handleStop={handleStop}
                isStopping={isStopping}
                scheduleId={id}
                schedule={schedule}
              />
            )}

            {activeTab === "estimate" && <TabEstimate schedule={schedule} />}

            {activeTab === "estimate-design" && (
              <div className="md:p-6">
                <DesignEstimator
                  surveyReportId={schedule?.survey_report?.id}
                  clientId={schedule?.client_id || schedule?.client?.id}
                  initialData={{
                    clientName: schedule?.client?.name,
                    location: schedule?.address,
                    uuid: schedule?.client?.uuid,
                    commitment_fee: schedule?.commitment_fee ?? 0,
                  }}
                />
              </div>
            )}

            {activeTab === "attachments" && <TabAttachment scheduleId={id} />}
            {activeTab === "kendala" && (
              <TabKendala
                issues={issues}
                scheduleId={id}
                mutateIssues={mutateIssues}
                refetchIssues={refetchIssues}
              />
            )}
          </main>

          <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kirim PDF ke Siclicnet</DialogTitle>
                <DialogDescription>
                  Pilih dokumen yang ingin dikirim. Utility tidak akan ikut
                  dikirim.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTypes.includes("survey_report")}
                      onCheckedChange={() => toggleType("survey_report")}
                    />
                    <span className="text-sm">Form Survey (Survey Report)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTypes.includes("survey_estimate")}
                      onCheckedChange={() => toggleType("survey_estimate")}
                    />
                    <span className="text-sm">Estimate Rumah</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedTypes.includes("design_estimate")}
                      onCheckedChange={() => toggleType("design_estimate")}
                    />
                    <span className="text-sm">Estimate Design</span>
                  </label>
                  <label className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                    <Checkbox disabled checked={false} />
                    <span className="text-sm">
                      Utility (tidak dikirim via email)
                    </span>
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsSendDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSendPdfs}
                  disabled={isSendingPdfs || !selectedTypes.length}
                >
                  {isSendingPdfs ? "Mengirim..." : "Kirim PDF"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityPage;
