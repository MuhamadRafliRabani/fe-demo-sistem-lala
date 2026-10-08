"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconCalendar,
  IconMail,
  IconPhone,
  IconDownload,
  IconClock,
  IconVideo,
  IconCube,
  IconPresentation,
  IconTarget,
  IconHourglass,
  IconUserCircle,
  IconBriefcase,
  IconLayoutDashboardFilled,
  IconBuildingStore,
} from "@tabler/icons-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { formatDate } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import { useApiFetch } from "@/hooks/use-api-fetch";
import Loader from "@/components/ui/loader";
import { toast } from "sonner";

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

// Helper: Item Jadwal (Versi Lite untuk di dalam Card Parent)
const ScheduleItem = ({ title, start, end, icon: Icon, colorClass }) => (
  <div className="flex flex-col p-4 rounded-xl border group bg-background hover:bg-muted/30 transition-colors relative overflow-hidden">
    <div
      className={cn(
        "absolute -right-2.5 -top-2.5 opacity-5 group-hover:opacity-25  rotate-12",
        colorClass
      )}
    >
      <Icon size={80} />
    </div>

    <div className="flex items-center gap-2 mb-3 z-10">
      <div
        className={cn(
          "p-1.5 rounded-md bg-opacity-10",
          colorClass.replace("text-", "bg-")
        )}
      >
        <Icon size={18} className={colorClass} />
      </div>
      <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
    </div>

    <div className="mt-auto space-y-1 z-10 text-xs font-medium">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">Start</span>
        <span>{formatDate(start)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">End</span>
        <span>{formatDate(end)}</span>
      </div>
    </div>
  </div>
);

// Komponen Card Statistik Atas
const StatCard = ({ label, value, subtext, icon: Icon, colorClass }) => (
  <Card
    className={cn(
      "shadow-sm hover:border-l-4 hover:shadow-md transition-shadow",
      colorClass.replace("text-", "hover:border-")
    )}
  >
    <CardContent className="p-5 flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xxs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <h4 className={cn("text-xl font-bold tracking-tight", colorClass)}>
          {value || "-"}
        </h4>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
      <div
        className={cn(
          "p-3 rounded-full bg-opacity-10",
          colorClass.replace("text-", "bg-")
        )}
      >
        <Icon size={24} className={colorClass} />
      </div>
    </CardContent>
  </Card>
);
// ----------------------------------------------------------------------
// MASTER DATA
// ----------------------------------------------------------------------
const WORKFLOW_STAGES = {
  1: { label: "LAYOUT 1", color: "blue" },
  2: { label: "RESULT LAYOUT 1", color: "indigo" },
  3: { label: "LAYOUT 2", color: "blue" },
  4: { label: "RESULT LAYOUT 2", color: "indigo" },
  5: { label: "3D 1", color: "purple" },
  6: { label: "RESULT 3D 1", color: "purple" },
  7: { label: "3D 2", color: "purple" },
  8: { label: "RESULT 3D 2", color: "purple" },
  9: { label: "ZOOM MEETING", color: "pink" },
  10: { label: "TOWNHALL", color: "orange" },
  11: { label: "FINALISASI", color: "green" },
  12: { label: "SELESAI", color: "emerald" },
  // 13: { label: "WAITING LIST", color: "slate" },
};

// ----------------------------------------------------------------------
// DUMMY DATA
// ----------------------------------------------------------------------
const DUMMY_TASK = {
  id: 27,
  code: "LL231023",
  current_status: "FINALISASI",
  progress_percent: 90,
  client: {
    name: "Alexia",
    phone: "085695703592",
    email: "muhamadraflirabani@gmail.com",
  },
  schedule: {
    layout_start: "2025-01-01",
    layout_end: "2025-01-03",
    zoom_meeting_start: "2025-01-04",
    zoom_meeting_end: "2025-01-04",
    "3d_non_render_start": "2025-01-05",
    "3d_non_render_end": "2025-01-07",
    "3d_render_start": "2025-01-08",
    "3d_render_end": "2025-01-10",
    townhall_start: "2025-01-15",
    townhall_end: "2025-01-15",
  },
  histories: [
    {
      id: 64,
      task_id: 27,
      stage_id: 3,
      designer_name: "Siti",
      status: "working",
      feedback: null,
      result_file: null,
      cretime: "2025-01-06 10:00:00",
    },
    {
      id: 63,
      task_id: 27,
      stage_id: 2,
      designer_name: "Siti",
      status: "submitted",
      feedback: "Revisi bagian atap kurang miring",
      result_file: '["https://trello.com/b/zvXdLCLo/langit-langit-dashboard"]',
      cretime: "2025-01-05 14:30:00",
    },
    {
      id: 59,
      task_id: 27,
      stage_id: 1,
      designer_name: "Rafi",
      status: "submitted",
      feedback: null,
      result_file: '["https://google.com"]',
      cretime: "2025-01-02 09:00:00",
    },
  ],
};

const ViewScheduleDesign = () => {
  const router = useRouter();
  const pathname = usePathname();
  const TaskID = pathname.split("/").pop();
  const data = DUMMY_TASK;

  const getFileLink = (jsonString) => {
    try {
      if (!jsonString) return null;
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch (e) {
      return null;
    }
  };

  const query = {
    // fields:
    //   "id,name,whatsapp_number,request_type,building_type,source,location,date,status,client_id,schedule_id",
    include:
      "client,detailSchedule,versions,currentStage,assignedDesigner,versions.designer",
    // filter: {
    // },
    // sort: filter.sort,
    // paginate,
    // page,
  };

  const {
    data: response, // Response wrapper
    isLoading,
  } = useApiFetch("tasks", `tasks/v2/${TaskID}`, query);

  const task = response?.data;

  if (isLoading) return <Loader />;

  const totalStage = Object.keys(WORKFLOW_STAGES).length;
  const progressPercent = Math.min(
    100,
    Math.round((task.current_stage_id / totalStage) * 100)
  );

  return (
    <DashboardLayout>
      <div className="w-full space-y-8 p-2 md:px-8 pb-20 animate-in fade-in zoom-in-95 duration-500">
        {/* --- CARD 1: OVERVIEW (Client + Progress) --- */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1: Current Status */}
          <StatCard
            label="Current Stage"
            value={task.current_stage?.label}
            subtext="Workflow Position"
            icon={IconLayoutDashboardFilled}
            colorClass="text-blue-500"
          />
          {/* Metric 2: Assigned Designer */}
          <StatCard
            label="Assigned Designer"
            value={task.assigned_designer?.name}
            subtext="Lead Creative"
            icon={IconUserCircle}
            colorClass="text-purple-500"
          />
          {/* Metric 3: Project Deadline */}
          <StatCard
            label="Project Deadline"
            value={formatDate(task.end_date)}
            subtext="Overall Due Date"
            icon={IconHourglass}
            colorClass={
              new Date(task.end_date) < new Date()
                ? "text-red-500"
                : "text-orange-500"
            }
          />
          {/* Metric 4: Current Owner (Bola ada di siapa) */}
          <StatCard
            label="Current Owner"
            value={task.current_owner?.toUpperCase()}
            subtext="Action Required By"
            icon={IconBriefcase}
            colorClass="text-emerald-500"
          />
        </div>

        <Card className="overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row">
            {/* LEFT SIDE: Client Info */}
            <div className="flex-1 p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                    Client Information
                  </p>
                  <h2 className="text-3xl font-bold text-foreground">
                    {task.client.name}
                  </h2>
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-sm border-primary/20 bg-primary/5 text-primary"
                >
                  {task.client.uuid}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!task.client.phone) return;

                    navigator.clipboard.writeText(task.client.phone);
                    toast.success("Nomor WhatsApp disalin");
                  }}
                  className="cursor-pointer flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <div className="p-2 bg-background rounded-full border shadow-sm text-blue-500">
                    <IconPhone size={18} />
                  </div>
                  <div>
                    <p className="text-xxs text-muted-foreground uppercase font-semibold">
                      Whatsapp
                    </p>
                    <p className="text-sm font-medium">{task.client.phone}</p>
                  </div>
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!task.client.email) return;

                    navigator.clipboard.writeText(task.client.email);
                    toast.success("Email disalin");
                  }}
                  className="cursor-pointer flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <div className="p-2 bg-background rounded-full border shadow-sm text-orange-500">
                    <IconMail size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xxs text-muted-foreground uppercase font-semibold">
                      Email
                    </p>
                    <p
                      className="text-sm font-medium truncate"
                      title={task.client.email}
                    >
                      {task.client.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SEPARATOR (Vertical on Desktop, Horizontal on Mobile) */}
            <div className="w-px bg-border hidden md:block" />
            <div className="h-px bg-border md:hidden" />

            {/* RIGHT SIDE: Progress Status */}
            <div className="flex-1 p-6 md:p-8 bg-slate-50 dark:bg-slate-900/20 flex flex-col justify-center relative overflow-hidden">
              {/* Decorative Icon */}
              <div className="absolute -right-5 -bottom-5 opacity-[0.03] text-foreground rotate-[-15deg]">
                <IconTarget size={200} />
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-600 hover:bg-blue-700">
                      Active Project
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated Today
                    </span>
                  </div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                    {task.current_stage.label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current workflow stage
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/30"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* --- CARD 2: JADWAL KERJA --- */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <IconCalendar size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Jadwal Kerja</CardTitle>
                <CardDescription>
                  Timeline pengerjaan per tahap project.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <ScheduleItem
                title="Layout"
                start={task.detail_schedule.layout_start}
                end={task.detail_schedule.layout_end}
                icon={IconLayoutDashboardFilled}
                colorClass="text-blue-500"
              />
              <ScheduleItem
                title="Zoom Meeting"
                start={task.detail_schedule.zoom_meeting_start}
                end={task.detail_schedule.zoom_meeting_end}
                icon={IconVideo}
                colorClass="text-pink-500"
              />
              <ScheduleItem
                title="3D Non-Render"
                start={task.detail_schedule["3d_non_render_start"]}
                end={task.detail_schedule["3d_non_render_end"]}
                icon={IconCube}
                colorClass="text-purple-500"
              />
              <ScheduleItem
                title="3D Render"
                start={task.detail_schedule["3d_render_start"]}
                end={task.detail_schedule["3d_render_end"]}
                icon={IconPresentation}
                colorClass="text-indigo-500"
              />
              <ScheduleItem
                title="Townhall"
                start={task.detail_schedule.townhall_start}
                end={task.detail_schedule.townhall_end}
                icon={IconBuildingStore}
                colorClass="text-orange-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* --- CARD 3: HISTORICAL --- */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <IconClock size={20} />
              </div>
              <div>
                <CardTitle className="text-lg">Historical</CardTitle>
                <CardDescription>
                  Riwayat aktivitas dan revisi design.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[180px] pl-6">Designer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[35%]">Feedback</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {task.versions?.map((item) => {
                  const fileUrl = getFileLink(item.result_file);
                  const stage = WORKFLOW_STAGES[item.stage_id] || {
                    label: "Unknown",
                    color: "gray",
                  };

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      <TableCell className="pl-6">
                        <div className="font-medium text-foreground">
                          {item.designer?.name || "Unknown"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          {item.cretime ? formatDate(item.cretime) : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`font-semibold border-${stage.color}-200 bg-${stage.color}-50 text-${stage.color}-700 shadow-none`}
                        >
                          {stage.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "uppercase text-xxs font-bold tracking-wider border-0 shadow-none",
                            item.status === "submitted"
                              ? "bg-green-100 text-green-700"
                              : item.status === "working"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.feedback ? (
                          <div className="flex items-start gap-2">
                            <div className="mt-1 min-w-[3px] h-3 bg-orange-400 rounded-full" />
                            <p className="text-sm text-muted-foreground italic line-clamp-2">
                              {item.feedback}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground opacity-30 select-none">
                            - No feedback -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {fileUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Link href={fileUrl} target="_blank">
                              <IconDownload size={16} /> File
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xxs font-bold text-muted-foreground opacity-30 uppercase">
                            Pending
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ViewScheduleDesign;
