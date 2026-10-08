"use client";

import { useState } from "react";
// 1. Import ScrollArea & ScrollBar
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-format";
import { SurveyStatusBadge } from "@/lib/survey-status-badge";
import { UserColorBadge } from "@/lib/user-badge";
import { checkActiveColums } from "@/lib/active-colums";
import { TableSkeleton } from "@/components/skeletn-item-table";
import { getScheduleByStage } from "@/lib/get-schedule-stage";
import { WrapperTable } from "@/components/ui/wraper-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconInfoCircle } from "@tabler/icons-react";

const TableDashboardTownhall = () => {
  // -----------------------------
  // STATE API + TABLE
  // -----------------------------
  const [page, setPage] = useState(1);
  const [paginate, setPaginate] = useState(5);
  const [visibleCols, setVisibleCols] = useState({
    date: true,
    name: true,
    stage: true,
    designer_id: true,
  });

  // -----------------------------
  // FETCH API
  // -----------------------------

  const { data, isLoading: isLoadingTaks } = useApiFetch("tasks", "/tasks", {
    page: page,
    paginate: paginate,
    stage_id: 10,
    latest: "latest",
  });

  const tasks = data?.data ?? [];
  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = [
    { key: "name", label: "Client name" },
    { key: "stage", label: "Stage" },
    { key: "date", label: "Tanggal" },
    { key: "designer_id", label: "Designer" },
  ];

  const { activeColumns } = checkActiveColums(columns, visibleCols);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <WrapperTable
      title={"UPCOMING TOWNHALL"}
      action={
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help text-muted-foreground hover:text-foreground transition-colors p-1">
                <IconInfoCircle size={20} stroke={1.5} />
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="text-xs bg-popover text-popover-foreground border shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">
                  Scroll Horizontal:
                </span>
                {/* Styling tombol keyboard (kbd) agar terlihat clean */}
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⇧</span> Shift
                </kbd>
                <span className="text-muted-foreground">+</span>
                <span className="font-medium">Scroll</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    >
      <div className="relative w-full">
        {/* 2. Implementasi ScrollArea dengan fixed height */}
        <ScrollArea className="w-full h-[400px] whitespace-nowrap rounded-none border-none">
          <Table className="w-full min-w-max">
            {/* Header Sticky */}
            <TableHeader className="bg-muted sticky top-0 z-20 text-md 2xl:text-[23px]/1 shadow-sm">
              <TableRow>
                {columns.map(
                  (col) =>
                    visibleCols[col.key] && (
                      <TableHead
                        key={col.key}
                        className="whitespace-nowrap first:ps-4"
                      >
                        {col.label}
                      </TableHead>
                    )
                )}
              </TableRow>
            </TableHeader>

            {isLoadingTaks ? (
              <TableSkeleton columns={activeColumns} />
            ) : (
              <TableBody>
                {tasks.length ? (
                  tasks.map((lead, i) => {
                    const stageCode = lead?.currentStage.code;

                    const schedule = getScheduleByStage({
                      detailSchedule: lead?.detailSchedule,
                      stageCode,
                    });

                    return (
                      <TableRow key={lead.id} className="lg:h-14 2xl:h-18">
                        {visibleCols.name && (
                          <TableCell className="2xl:text-2xl ps-4 whitespace-nowrap">
                            {lead?.client.name}
                          </TableCell>
                        )}

                        {visibleCols.stage && (
                          <TableCell>
                            <div className="max-w-sm lg:max-w-lg">
                              <p className="whitespace-normal break-words 2xl:text-2xl">
                                {lead.currentStage.label}
                              </p>
                            </div>
                          </TableCell>
                        )}

                        {visibleCols.date && (
                          <TableCell>
                            <p className="2xl:text-2xl">
                              {schedule
                                ? formatDate(schedule?.start) +
                                  " - " +
                                  formatDate(schedule?.end)
                                : "-"}
                            </p>
                          </TableCell>
                        )}

                        {visibleCols.designer_id && (
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              <UserColorBadge
                                key={lead?.assignedDesigner?.id}
                                userName={lead?.assignedDesigner.name ?? "-"}
                              />
                            </div>
                          </TableCell>
                        )}

                        {visibleCols.status && (
                          <TableCell className="whitespace-nowrap">
                            <SurveyStatusBadge status={lead.status} />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-6 2xl:text-2xl"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>

          {/* 3. ScrollBars */}
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </WrapperTable>
  );
};
export default TableDashboardTownhall;
