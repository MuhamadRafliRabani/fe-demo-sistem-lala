"use client";

import { useState } from "react";
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
import { WrapperTable } from "@/components/ui/wraper-table";

// 1. IMPORT TOOLTIP & ICON
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconInfoCircle } from "@tabler/icons-react"; // Atau 'lucide-react'

const TableDashboardSchedule = () => {
  // ... (STATE & API LOGIC TETAP SAMA) ...
  const [page, setPage] = useState(1);
  const [paginate, setPaginate] = useState(5);
  const [visibleCols, setVisibleCols] = useState({
    date: true,
    name: true,
    surveyor: true,
    address: true,
    status: false,
  });

  const query = {
    fields: "id,date,status,address,client_id",
    include: "client,surveyors",
    sort: "date",
    filter: { upcoming: "true" },
    paginate,
    page,
  };

  const { data, isLoading } = useApiFetch("schedules", "/schedules", query);
  const schedules = data?.data.data ?? [];

  const columns = [
    { key: "date", label: "Tanggal" },
    { key: "name", label: "Client name" },
    { key: "address", label: "Alamat" },
    { key: "surveyor", label: "Surveyor" },
    { key: "status", label: "Status" },
  ];

  const { activeColumns } = checkActiveColums(columns, visibleCols);

  return (
    <WrapperTable
      title={"UPCOMING SURVEY"}
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
        <ScrollArea className="w-full h-[400px] whitespace-nowrap rounded-none border-none">
          <Table className="w-full min-w-max">
            <TableHeader className="bg-muted sticky top-0 z-20 shadow-sm">
              <TableRow>
                {columns.map(
                  (col) =>
                    visibleCols[col.key] && (
                      <TableHead
                        key={col.key}
                        className="whitespace-nowrap first:ps-4 text-md 2xl:text-[23px]/1"
                      >
                        {col.label}
                      </TableHead>
                    )
                )}
              </TableRow>
            </TableHeader>

            {isLoading ? (
              <TableSkeleton columns={activeColumns} />
            ) : (
              <TableBody>
                {/* ... (BODY LOGIC TETAP SAMA) ... */}
                {schedules.length ? (
                  schedules.map((lead, i) => (
                    <TableRow key={lead.id} className="lg:h-14 2xl:h-18">
                      {visibleCols.date && (
                        <TableCell className="2xl:text-2xl text-sm ps-4 whitespace-nowrap">
                          {formatDate(lead.date)}
                        </TableCell>
                      )}
                      {visibleCols.name && (
                        <TableCell className="2xl:text-2xl text-sm whitespace-nowrap">
                          {lead?.client.name}
                        </TableCell>
                      )}
                      {visibleCols.address && (
                        <TableCell>
                          <div className="max-w-sm lg:max-w-lg">
                            <p className="whitespace-normal break-words 2xl:text-2xl text-sm">
                              {lead.address}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.surveyor && (
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {lead.surveyors?.length ? (
                              lead.surveyors.map((item) => (
                                <UserColorBadge
                                  key={item.id || item.name}
                                  userName={item.name}
                                />
                              ))
                            ) : (
                              <Badge variant="outline">-</Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleCols.status && (
                        <TableCell className="whitespace-nowrap">
                          <SurveyStatusBadge status={lead.status} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
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

          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </WrapperTable>
  );
};
export default TableDashboardSchedule;
