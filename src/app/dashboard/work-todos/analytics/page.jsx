"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { DatePicker } from "@/components/date-picker";
import { formatDateDb } from "@/lib/date-format-db";
import { useDateRange } from "@/lib/date-range";
import { formatDate } from "@/lib/date-format";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  IconChevronDown,
  IconChevronRight,
  IconCheck,
  IconTrophy,
  IconTrendingUp,
  IconUserX,
  IconCalendarStats,
  IconListCheck,
  IconClock,
  IconUserOff,
  IconLoader,
  IconChartBar,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityPulseBoard from "../components/activity-pulse";
import { toTitleCase } from "@/lib/to-title-case";

const SummaryCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  bgClass,
  borderClass,
}) => (
  <Card
    className={`hover:shadow-md transition-all duration-200 border ${borderClass}`}
  >
    <CardContent className="p-5 flex items-start justify-between">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {value ? (
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground h-12">
            <span className="text-sm italic">Data belum tersedia</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`p-3 rounded-xl ${bgClass} ${colorClass} shrink-0 bg-opacity-10 border border-opacity-20`}
        >
          <Icon className="w-5 h-5" stroke={2.5} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const getInitials = (name) => {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function AnalyticsPage() {
  const { start, end } = useDateRange("this_month");
  const { start: today } = useDateRange("today");

  const [filter, setFilter] = useState({
    start_date: formatDateDb(start),
    end_date: formatDateDb(today),
  });

  const [expandedDates, setExpandedDates] = useState(new Set());
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [expandedMissingDates, setExpandedMissingDates] = useState(new Set());
  const [activeTab, setActiveTab] = useState("logs");

  const { data, isLoading } = useApiFetch(
    ["work-tasks-analytics", filter],
    "/work-tasks-analytics",
    filter,
    true,
  );

  const analytics = data?.data || {};
  const activityPulse = analytics?.activity_pulse || [];
  const summaryCards = analytics?.summary_cards || {};
  const employeeDetails = analytics?.employee_details || [];
  const dailyLogs = analytics?.daily_logs || [];
  const usersWithoutTodoByDate = analytics?.users_without_todo_by_date || [];

  const dateRangeText = `${formatDate(filter.start_date)} - ${formatDate(filter.end_date)}`;

  // Mapping optimasi frontend: Penggabungan data daily log yang direstrukturisasi backend
  const dailyLogsByDate = useMemo(() => {
    const grouped = {};
    dailyLogs.forEach((log) => {
      const dateKey = log.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, users: {} };
      }
      if (!grouped[dateKey].users[log.user_name]) {
        grouped[dateKey].users[log.user_name] = {
          user_name: log.user_name,
          todos: [],
          attendance: log.attendance,
        };
      }
      // Kita langsung mem-push seluruh block log karena 1 log = 1 item pada arsitektur baru
      grouped[dateKey].users[log.user_name].todos.push(log);
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((dateKey) => {
        const dateData = grouped[dateKey];
        const users = Object.values(dateData.users);
        let totalTasks = 0,
          totalDone = 0;

        users.forEach((user) => {
          user.todos.forEach((todo) => {
            const tasks = todo.items || [];
            totalTasks += tasks.length;
            totalDone += tasks.filter((item) => item.status === "done").length;
          });
        });

        return {
          date: dateKey,
          users,
          totalUsers: users.length,
          totalTodos: totalTasks,
          totalTasks,
          totalDone,
          completionRate:
            totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
        };
      });
  }, [dailyLogs]);
  console.log("🚀 ~ AnalyticsPage ~ dailyLogsByDate:", dailyLogsByDate);

  const toggleSet = (setter, value) => {
    setter((prev) => {
      const newSet = new Set(prev);
      newSet.has(value) ? newSet.delete(value) : newSet.add(value);
      return newSet;
    });
  };

  return (
    <DashboardLayout
      title="Performance Analytics"
      desc="Monitor produktivitas tim dan penyelesaian tugas harian."
    >
      <div className="space-y-8 pb-10">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#135a86]/10 rounded-lg text-[#135a86]">
              <IconCalendarStats className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Periode Laporan</h2>
              <p className="text-xs text-muted-foreground">
                Filter berdasarkan rentang waktu tugas aktif
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <DatePicker
              value={filter.start_date}
              onChange={(date) =>
                setFilter({ ...filter, start_date: formatDateDb(date) })
              }
              label="Start Date"
              className="w-full sm:w-[150px]"
            />
            <span className="text-muted-foreground hidden sm:inline">→</span>
            <DatePicker
              value={filter.end_date}
              onChange={(date) =>
                setFilter({ ...filter, end_date: formatDateDb(date) })
              }
              label="End Date"
              className="w-full sm:w-[150px]"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Top Performer"
            value={toTitleCase(summaryCards.most_tasks_done?.user_name ?? "")}
            subtext={`${summaryCards.most_tasks_done?.done_items || 0} tasks selesai`}
            icon={IconTrophy}
            colorClass="text-[#fed818] dark:text-[#fed818]"
            bgClass="bg-[#fed818]/20 dark:bg-[#fed818]/10"
            borderClass="border-[#fed818]/40 dark:border-[#fed818]/30"
          />
          <SummaryCard
            title="Highest Efficiency"
            value={toTitleCase(
              summaryCards.highest_completion_rate?.user_name ?? "",
            )}
            subtext={
              summaryCards.highest_completion_rate
                ? `${summaryCards.highest_completion_rate.completion_rate || 0}% dari ${summaryCards.highest_completion_rate.total_items || 0} tasks`
                : "0% rate"
            }
            icon={IconTrendingUp}
            colorClass="text-emerald-600 dark:text-emerald-500"
            bgClass="bg-emerald-100 dark:bg-emerald-900/20"
            borderClass="border-emerald-200/60 dark:border-emerald-800/60"
          />
          <SummaryCard
            title="Most Active"
            value={toTitleCase(summaryCards.most_work_days?.user_name ?? "")}
            subtext="Konsistensi kehadiran terbaik"
            icon={IconListCheck}
            colorClass="text-[#135a86] dark:text-blue-500"
            bgClass="bg-[#135a86]/10 dark:bg-blue-900/20"
            borderClass="border-[#135a86]/30 dark:border-blue-800/60"
          />
          <SummaryCard
            title="Ghost Users"
            value={`${summaryCards.ghost_user?.count || 0} Users`}
            subtext="Belum membuat tasks sama sekali"
            icon={IconUserX}
            colorClass="text-rose-600 dark:text-rose-500"
            bgClass="bg-rose-100 dark:bg-rose-900/20"
            borderClass="border-rose-200/60 dark:border-rose-800/60"
          />
        </div>

        {/* Main Content Splitting */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Leaderboard Table (Kiri) */}
          <Card className="xl:col-span-1 h-fit shadow-sm border border-border">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
              <CardTitle className="text-base font-semibold">
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/10">
                    <TableHead className="pl-6">Karyawan</TableHead>
                    <TableHead className="text-right pr-6">Performa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={2}>
                          <Skeleton className="h-12 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : employeeDetails.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        Belum ada data KPI
                      </TableCell>
                    </TableRow>
                  ) : (
                    employeeDetails.map((emp, idx) => (
                      <TableRow
                        key={emp.user_id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 border 
                              ${idx === 0 ? "bg-[#fed818]/20 text-yellow-700 border-[#fed818]/50" : "bg-muted text-muted-foreground border-border"}`}
                            >
                              {idx + 1}
                            </div>
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {getInitials(emp.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm capitalize">
                                {toTitleCase(emp.user_name)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {emp.done_items}
                                </span>{" "}
                                done / {emp.total_items} total
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6 align-middle">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-muted text-foreground">
                              {emp.completion_rate}%
                            </span>
                            <Progress
                              value={emp.completion_rate}
                              className="h-1.5 w-20 bg-muted"
                              indicatorclassname={
                                emp.completion_rate >= 80
                                  ? "bg-[#4bce97]"
                                  : emp.completion_rate >= 50
                                    ? "bg-[#135a86]"
                                    : "bg-rose-500"
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activity Tabs (Kanan) */}
          <Card className="xl:col-span-2 shadow-sm border border-border overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="bg-card border-b border-border py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                      Distribusi Tugas & Status
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Detail pekerjaan berdasarkan rentang pengerjaan
                      (Standalone Item)
                    </CardDescription>
                  </div>
                </div>
                <TabsList className="w-full justify-start h-10 bg-muted/30">
                  <TabsTrigger value="logs" className="gap-2">
                    <IconListCheck className="w-4 h-4" /> Log Aktivitas Harian
                  </TabsTrigger>
                  <TabsTrigger value="missing" className="gap-2">
                    <IconUserOff className="w-4 h-4" /> Belum Terisi
                    {usersWithoutTodoByDate.length > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-1 h-5 px-1.5 text-xs"
                      >
                        {usersWithoutTodoByDate[0]?.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="activity_pulse" className="gap-2">
                    <IconChartBar className="w-4 h-4" /> Pulse Chart
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="p-0 min-h-[400px]">
                {/* Tab: Daily Logs */}
                <TabsContent value="logs" className="m-0">
                  <div className="divide-y divide-border">
                    {isLoading ? (
                      <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : dailyLogsByDate.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <p className="text-sm font-medium">
                          Tidak ada log aktivitas.
                        </p>
                      </div>
                    ) : (
                      dailyLogsByDate.map((dateData) => {
                        const isExpanded = expandedDates.has(dateData.date);
                        return (
                          <div key={dateData.date} className="group">
                            <div
                              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 ${isExpanded ? "bg-muted/30 border-b border-dashed" : ""}`}
                              onClick={() =>
                                toggleSet(setExpandedDates, dateData.date)
                              }
                            >
                              <div className="flex items-center gap-4">
                                <button
                                  className={`p-1.5 rounded-md border ${isExpanded ? "bg-background text-primary shadow-sm" : "bg-transparent border-transparent"}`}
                                >
                                  {isExpanded ? (
                                    <IconChevronDown className="w-4 h-4" />
                                  ) : (
                                    <IconChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                                <div>
                                  <p className="font-semibold text-sm">
                                    {formatDate(dateData.date)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {dateData.totalUsers} User |{" "}
                                    {dateData.totalTasks} Tasks Aktif
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <div className="text-xs font-medium mb-1">
                                    {dateData.completionRate}%{" "}
                                    <span className="font-normal text-muted-foreground">
                                      Selesai
                                    </span>
                                  </div>
                                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-emerald-500`}
                                      style={{
                                        width: `${dateData.completionRate}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Render Task Details per User */}
                            {isExpanded && (
                              <div className="bg-muted/10 pb-2">
                                {dateData.users.map((user) => {
                                  const userKey = `${dateData.date}-${user.user_name}`;
                                  const isUserExpanded =
                                    expandedUsers.has(userKey);
                                  return (
                                    <div
                                      key={userKey}
                                      className="border-b border-dashed border-border/60 last:border-0"
                                    >
                                      <div
                                        className={`flex justify-between py-3 pr-4 pl-13 cursor-pointer hover:bg-muted/40 ${isUserExpanded ? "bg-muted/40" : ""}`}
                                        onClick={() =>
                                          toggleSet(setExpandedUsers, userKey)
                                        }
                                      >
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-7 w-7">
                                            <AvatarFallback className="text-[10px]">
                                              {getInitials(user.user_name)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                              {user.user_name}
                                            </span>
                                            <span className="text-xs font-medium">
                                              {formatDate(
                                                user.attendance?.date,
                                                true,
                                              )}
                                            </span>
                                            <IconChevronDown
                                              className={`w-3 h-3 text-muted-foreground transition-transform ${isUserExpanded ? "rotate-180" : ""}`}
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {isUserExpanded && (
                                        <div className="py-2 pr-4 pl-13 bg-muted/20">
                                          <div className="grid gap-2 pl-3 border-l-2 border-border/60">
                                            {user.todos.flatMap((todo, tIdx) =>
                                              (todo.items || []).map(
                                                (item, iIdx) => (
                                                  <div
                                                    key={`${tIdx}-${iIdx}`}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border text-sm shadow-sm ${item.status === "done" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-card"}`}
                                                  >
                                                    <div
                                                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${item.status === "done" ? "bg-emerald-500 text-white" : "border-muted-foreground/30 text-transparent"}`}
                                                    >
                                                      <IconCheck
                                                        className="w-3 h-3"
                                                        stroke={3}
                                                      />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <p
                                                        className={`font-medium ${item.status === "done" ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                                                      >
                                                        {toTitleCase(
                                                          item.task_name,
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ),
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
                {/* Tab Content: Users Without Todo (Yang ga isi) */}
                <TabsContent value="missing" className="m-0 min-h-[400px]">
                  <div className="divide-y divide-border">
                    {isLoading ? (
                      <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                      </div>
                    ) : usersWithoutTodoByDate.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground h-full">
                        <div className="p-4 rounded-full bg-muted mb-3 border border-border">
                          <IconCheck className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-medium">
                          Semua user sudah mengisi todo.
                        </p>
                        <p className="text-xs mt-1">
                          Tidak ada user yang terlewat dalam periode ini.
                        </p>
                      </div>
                    ) : (
                      usersWithoutTodoByDate.map((dateData) => {
                        const isExpanded = expandedMissingDates.has(
                          dateData.date,
                        );

                        return (
                          <div
                            key={dateData.date}
                            className="group transition-all duration-200"
                          >
                            {/* Date Row Header */}
                            <div
                              className={`
                                flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors
                                ${isExpanded ? "bg-muted/30 border-b border-dashed border-border" : ""}
                              `}
                              onClick={() =>
                                setExpandedMissingDates((prev) => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(dateData.date)) {
                                    newSet.delete(dateData.date);
                                  } else {
                                    newSet.add(dateData.date);
                                  }
                                  return newSet;
                                })
                              }
                            >
                              <div className="flex items-center gap-4">
                                <button
                                  className={`
                                  p-1.5 rounded-md transition-all duration-200 border
                                  ${
                                    isExpanded
                                      ? "bg-background text-rose-600 border-rose-200/20 shadow-sm"
                                      : "bg-transparent text-muted-foreground border-transparent group-hover:bg-background group-hover:shadow-sm"
                                  }
                                `}
                                >
                                  {isExpanded ? (
                                    <IconChevronDown className="w-4 h-4" />
                                  ) : (
                                    <IconChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                                <div>
                                  <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                                    {formatDate(dateData.date)}
                                    <Badge
                                      variant="destructive"
                                      className="h-5 px-2 text-xs font-semibold"
                                    >
                                      {dateData.count}
                                    </Badge>
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {dateData.count} user belum mengisi todo
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="h-7 px-3 font-normal text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
                                >
                                  <IconUserOff className="w-3.5 h-3.5 mr-1.5" />
                                  Belum Isi
                                </Badge>
                              </div>
                            </div>

                            {/* Expanded Date Details - Users List */}
                            {isExpanded && (
                              <div className="bg-muted/10 pb-4">
                                <div className="px-4 pt-3 pb-2">
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                    Daftar User:
                                  </p>
                                </div>
                                <div className="px-4 pl-13">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {dateData.users.map((user) => (
                                      <div
                                        key={user.user_id}
                                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background border border-border/60 hover:border-rose-300 hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-all"
                                      >
                                        <Avatar className="h-7 w-7 border border-border bg-muted">
                                          <AvatarFallback className="text-[10px] text-muted-foreground bg-muted">
                                            {getInitials(user.user_name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-foreground truncate">
                                          {user.user_name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity_pulse">
                  <ActivityPulseBoard
                    dailyLogs={dailyLogs}
                    employeeDetails={employeeDetails}
                    startDate={filter.start_date}
                    endDate={filter.end_date}
                    dateRangeText={dateRangeText}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
