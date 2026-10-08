"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import { useDateRange } from "@/lib/date-range";
import ActionTable from "@/components/action-table";
import FilterScheduleDesigns from "../filters/filter-schedule-designs";
import { useAuthStore } from "@/hooks/auth-store";
import Link from "next/link";
import { getScheduleByStage } from "@/lib/get-schedule-stage";
import ResultFileModalLink from "@/components/result-file-modal-link";
import { PaginationBar } from "@/components/pagination-bar";
import { DataTable } from "@/components/tables/data-table";
import { ArrowDownUp, ArrowUpDown } from "lucide-react";
import { PaymentStatusBadge } from "@/app/dashboard/surveys/schedule-surveys/table/table-schedule";

// ============================================
// HELPER FUNCTIONS
// ============================================

const getActiveVersion = (task) => {
  if (task.active_version) return task.active_version;
  if (!task.versions || task.versions.length === 0) return null;
  return [...task.versions].sort((a, b) => b.id - a.id)[0];
};

const getResultFile = (task) => {
  const active = getActiveVersion(task);
  if (active?.result_file) return active.result_file;

  const sortedVersions = [...(task.versions || [])].sort((a, b) => b.id - a.id);
  return sortedVersions.find((v) => v.result_file)?.result_file;
};

const getStageBadgeColor = (label) => {
  if (!label) {
    return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100";
  }

  const text = label.toLowerCase();

  if (text.includes("townhall")) {
    return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
  }

  if (
    text.includes("design") ||
    text.includes("desain") ||
    text.includes("layout")
  ) {
    return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
  }

  if (text.includes("revisi")) {
    return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
  }

  if (
    text.includes("fix") ||
    text.includes("final") ||
    text.includes("finalisasi")
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
  }

  return "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100";
};

const getDeadlineBadgeColor = (endDate, status) => {
  if (status === "pending") {
    return "bg-slate-400 text-white hover:bg-slate-500 shadow-sm";
  }

  if (!endDate) {
    return "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm";
  }

  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "bg-red-600 text-white hover:bg-red-700 shadow-sm";
  }

  if (diffDays <= 2) {
    return "bg-red-500 text-white hover:bg-red-600 shadow-sm";
  }

  if (diffDays <= 5) {
    return "bg-amber-500 text-white hover:bg-amber-600 shadow-sm";
  }

  if (diffDays <= 10) {
    return "bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm";
  }

  return "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm";
};

const renderDeadline = (lead, schedule, activeVersion) => {
  const status = activeVersion?.status;

  // Townhall special case - Professional blue
  if (lead.detail_schedule?.townhall_date && lead.current_stage?.id === 10) {
    const badgeColor =
      status === "pending"
        ? "bg-slate-400 text-white hover:bg-slate-500 shadow-sm border-none"
        : "bg-blue-500 text-white hover:bg-blue-600 shadow-sm border-none";

    return (
      <Badge className={badgeColor}>
        {formatDate(lead.detail_schedule.townhall_date, true)}
      </Badge>
    );
  }

  // Regular deadline with date range
  if (schedule?.start && schedule?.end) {
    const badgeColor = getDeadlineBadgeColor(schedule.end, status);
    return (
      <Badge
        className={`${badgeColor} border-none whitespace-nowrap font-medium`}
      >
        {formatDate(schedule.start)} - {formatDate(schedule.end)}
      </Badge>
    );
  }

  return <span className="text-muted-foreground">-</span>;
};

// ============================================
// MAIN COMPONENT
// ============================================

const TableScheduleDesign = () => {
  const router = useRouter();
  const { start, end } = useDateRange("last_2_years_to_this_year_end");
  const { user } = useAuthStore();

  // State
  const [paginate, setPaginate] = useState(15);
  const [filter, setFilter] = useState({
    name: "",
    start_date: start,
    end_date: end,
    stage_id: [],
    assigned_designer_id: [],
    current_status: [],
    created_by: [],
    sort: "-priority_order",
    page: 1,
  });

  // Build query with memoized params
  const query = useMemo(() => {
    const filterObj = {};
    if (filter.name?.trim()) filterObj["client.name"] = filter.name.trim();
    if (filter.stage_id?.length > 0)
      filterObj.current_stage_id = filter.stage_id.join(",");
    if (filter.assigned_designer_id?.length > 0)
      filterObj.assigned_designer_id = filter.assigned_designer_id.join(",");
    if (filter.current_status?.length > 0)
      filterObj.current_status = filter.current_status.join(",");
    if (filter.created_by?.length > 0)
      filterObj.created_by = filter.created_by.join(",");
    if (filter.start_date && filter.end_date) {
      filterObj.date_between = {
        start: filter.start_date,
        end: filter.end_date,
      };
    }

    return {
      include:
        "currentStage,assignedDesigner,detailSchedule,client,creator,versions,order,order.payment",
      filter: filterObj,
      sort: filter.sort,
      paginate,
      page: filter.page,
    };
  }, [filter, paginate]);

  const { data, isLoading, refetch } = useApiFetch(
    ["tasks-v2", query],
    "/tasks/v2",
    query,
  );

  const tasks = data?.data?.data ?? [];
  const lastPage = data?.data?.last_page ?? 1;
  const totalCount = data?.data?.total ?? 0;

  // Sorting Handler for DataTable
  const sortingState = useMemo(() => {
    const isDesc = filter.sort.startsWith("-");
    const id = filter.sort.replace("-", "");
    return [{ id, desc: isDesc }];
  }, [filter.sort]);

  const handleSortingChange = (updaterOrValue) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sortingState)
        : updaterOrValue;
    if (newSorting.length > 0) {
      const { id, desc } = newSorting[0];
      setFilter({ ...filter, sort: desc ? `-${id}` : id });
    }
  };

  // Table Columns Definition
  const columns = useMemo(
    () => [
      {
        id: "actions",
        header: "Action",
        enableHiding: false,
        enablePinning: true,
        size: 80,
        cell: ({ row }) => {
          const task = row.original;
          const activeVersion = getActiveVersion(task);
          const schedule = getScheduleByStage({
            detailSchedule: task.detail_schedule,
            stageCode: task.current_stage?.code,
          });
          const isRevisiStageEligible =
            (activeVersion?.version_number !== 2 &&
              activeVersion?.stage_id !== 2) ||
            activeVersion?.stage_id !== 4;

          const canManageDesign =
            Number(user.id) == 10 ||
            Number(user.role_id) == 1 ||
            Number(user.role_id) == 3;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ActionTable
                id={task.id}
                url="/designs/schedule-designs"
                isDelete
                isView
                isTaskSubmit={canManageDesign || Number(user.role_id) === 5}
                isTaskRevisi={canManageDesign}
                isTaskPending={canManageDesign || Number(user.role_id) === 5}
                schedule={schedule}
                isNextStage={canManageDesign}
                urlDelete={`/tasks/${task.id}`}
                refetch={refetch}
                isPriority={canManageDesign}
                currentPriority={task.priority_order}
                useTasksInvalidation
                updatePayment={true}
                order_id={task?.order?.id}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "priority_order",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent flex gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Priority
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
          </Button>
        ),
        cell: ({ row }) =>
          row.original.priority_order ? (
            <Badge className="px-2 py-1 text-xs font-semibold bg-amber-500 text-white border-none whitespace-nowrap">
              Priority #{row.original.priority_order}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "payment.status",
        header: "Payment Status",
        cell: ({ row }) => {
          const status =
            row.original.payment?.status || row.original.order?.status;

          return <PaymentStatusBadge status={status} />;
        },
      },
      {
        accessorKey: "client.name",
        header: "Client",
        cell: ({ row }) =>
          row.original.client ? (
            <Badge
              variant="outline"
              className="text-muted-foreground px-2 py-1 whitespace-nowrap"
            >
              {`${row.original.client.name}-${row.original.client.uuid}`}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "current_stage.label",
        header: "Stage",
        cell: ({ row }) =>
          row.original.current_stage?.label ? (
            <Badge
              variant="outline"
              className={`px-2.5 py-1 font-medium text-xs whitespace-nowrap ${getStageBadgeColor(row.original.current_stage.label)}`}
            >
              {row.original.current_stage.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "version",
        header: "Revisi",
        cell: ({ row }) => {
          const activeVersion = getActiveVersion(row.original);
          return (
            <Badge
              variant="outline"
              className="text-muted-foreground px-2 py-1"
            >
              {activeVersion?.version_number === 2 ? "Revisi" : "-"}
            </Badge>
          );
        },
      },
      {
        id: "feedback",
        header: "Feedback",
        cell: ({ row }) => {
          const activeVersion = getActiveVersion(row.original);
          return activeVersion?.feedback ? (
            <Link
              href={activeVersion.feedback}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              Lihat feedback
            </Link>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: "assigned_designer.name",
        header: "Designer",
        cell: ({ row }) =>
          row.original.assigned_designer?.name ? (
            <Badge
              variant="outline"
              className="text-muted-foreground px-2 py-1 whitespace-nowrap"
            >
              {row.original.assigned_designer.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "creator.name",
        header: "Marketing",
        cell: ({ row }) =>
          row.original.creator?.name ? (
            <Badge
              variant="outline"
              className="text-muted-foreground px-2 py-1 whitespace-nowrap"
            >
              {row.original.creator.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const task = row.original;
          const activeVersion = getActiveVersion(task);
          const status = activeVersion?.status;
          const stageName = task.current_stage?.label || "-";

          if (status === "pending") {
            return (
              <div className="flex flex-col gap-1">
                <Badge className={getStageBadgeColor(stageName)}>
                  {stageName}
                </Badge>
                <Badge className="bg-slate-400 text-white border-none w-fit text-[10px] py-0 px-1.5">
                  PENDING
                </Badge>
              </div>
            );
          }

          if (status === "submitted") {
            return (
              <div className="flex flex-col gap-1">
                <Badge className={getStageBadgeColor(stageName)}>
                  {stageName}
                </Badge>
                <Badge className="bg-emerald-500 text-white border-none w-fit text-[10px] py-0 px-1.5">
                  SUBMITTED
                </Badge>
              </div>
            );
          }

          return (
            <Badge className={getStageBadgeColor(stageName)}>{stageName}</Badge>
          );
        },
      },
      {
        id: "deadline",
        header: "Deadline",
        cell: ({ row }) => {
          const task = row.original;
          const activeVersion = getActiveVersion(task);
          const schedule = getScheduleByStage({
            detailSchedule: task.detail_schedule,
            stageCode: task.current_stage?.code,
          });
          return renderDeadline(task, schedule, activeVersion);
        },
      },
      {
        id: "file",
        header: "File",
        cell: ({ row }) => (
          <ResultFileModalLink resultFile={getResultFile(row.original)} />
        ),
      },
    ],
    [user, refetch],
  );

  return (
    <Tabs defaultValue="list" className="w-full">
      <div className="overflow-x-auto pe-8">
        <TabsContent value="list" className="mt-6 space-y-6">
          <FilterScheduleDesigns filter={filter} setFilter={setFilter} />

          <div className="flex justify-end items-center">
            <Button
              onClick={() =>
                router.push("/dashboard/designs/schedule-designs/create")
              }
              className="flex items-center gap-2"
            >
              <IconPlus size={16} /> Add Tasks
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={tasks}
            isLoading={isLoading}
            enableColumnVisibility={true}
            enableSorting={true}
            enablePinning={true}
            enableColumnResizing={true}
            manualSorting={true}
            sorting={sortingState}
            onSortingChange={handleSortingChange}
            enablePagination={false}
            onRowClick={(row) =>
              router.push(
                `/dashboard/designs/schedule-designs/activity/${row.original.id}`,
              )
            }
          />

          <PaginationBar
            total={totalCount}
            page={filter.page}
            perPage={paginate}
            totalPages={lastPage}
            currentData={tasks.length}
            onPageChange={(p) => setFilter({ ...filter, page: p })}
            onPerPageChange={(p) => {
              setPaginate(p);
              setFilter({ ...filter, page: 1 });
            }}
            label="Total tugas design"
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default TableScheduleDesign;
