"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import { useDateRange } from "@/lib/date-range";
import { normalizeParams } from "@/lib/serialisasi-filter-leads";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ActionTable from "@/components/action-table";
import { SurveyStatusBadge } from "@/lib/survey-status-badge";
import FilterScheduleSurvey from "../filters/filter-schedule-surveys";
import { formatDateDb } from "@/lib/date-format-db";
import { checkActiveColums } from "@/lib/active-colums";
import { TableSkeleton } from "@/components/skeletn-item-table";

const TableClients = () => {
  const router = useRouter();
  // -----------------------------
  // STATE API + TABLE
  // -----------------------------
  const [page, setPage] = useState(1);
  const [paginate, setPaginate] = useState(15);
  const [filter, setFilter] = useState({
    // page: 1,
    name: "",
    schedule: "",
    not_schedule: "",
    task: "",
    not_task: "",
    uuid: "",
  });

  const [visibleCols, setVisibleCols] = useState({
    name: true,
    uuid: true,
    cretime: false,
    creby: false,
    modtime: false,
    modby: false,
    action: true,
  });

  // -----------------------------
  // FETCH API
  // -----------------------------
  const { data, isLoading, error, refetch } = useApiFetch(
    "clients",
    "/clients",
    {
      page: page,
      paginate: paginate,
      ...normalizeParams(filter),
    },
  );

  const schedules = data?.data ?? [];
  const lastPage = data?.meta?.last_page ?? 1;
  const totalCount = data?.meta?.total ?? data?.total ?? schedules.length;

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = [
    { key: "name", label: "Client" },
    { key: "uuid", label: "UUID" },
    { key: "cretime", label: "Cretime" },
    { key: "creby", label: "Creby" },
    { key: "modtime", label: "Modtime" },
    { key: "modby", label: "Modby" },
  ];

  const { activeColumns } = checkActiveColums(columns, visibleCols);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <Tabs defaultValue="clients" className="w-full">
      {/* <TabsList>
        <TabsTrigger value="clients">clients</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList> */}

      {/* MAIN TAB */}
      <div className="overflow-x-auto md:pe-8">
        <TabsContent value="clients" className=" mt-6 space-y-6">
          <FilterScheduleSurvey filter={filter} setFilter={setFilter} />
          {/* FILTER AREA */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            {/* Hide/Show Column */}
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="size-4" /> View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem>
                    Toggle columns
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  {columns.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      checked={visibleCols[col.key]}
                      onCheckedChange={(v) =>
                        setVisibleCols({ ...visibleCols, [col.key]: v })
                      }
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                className="flex gap-2"
                onClick={() =>
                  router.push("/dashboard/surveys/schedule-surveys/create")
                }
              >
                <IconPlus size={16} /> Add Survey
              </Button>
            </div>
          </div>

          {/* TABLE */}
          <div className="relative w-full">
            <div className="overflow-x-auto w-full">
              <div className="relative w-full overflow-x-auto">
                <Table className="w-full min-w-max">
                  <TableHeader className="bg-muted sticky top-0 z-20">
                    <TableRow>
                      <TableHead className="sticky left-0 bg-muted z-30 whitespace-nowrap">
                        Action
                      </TableHead>

                      {columns.map(
                        (col) =>
                          visibleCols[col.key] && (
                            <TableHead
                              key={col.key}
                              className={`whitespace-nowrap ${
                                col.key === "name" || col.key === "uuid"
                              }`}
                            >
                              {col.label}
                            </TableHead>
                          ),
                      )}
                    </TableRow>
                  </TableHeader>

                  {/* ================= LOADING ================= */}
                  {isLoading ? (
                    <TableSkeleton columns={activeColumns} />
                  ) : (
                    <TableBody>
                      {schedules.length ? (
                        schedules.map((survey) => (
                          <TableRow
                            key={survey.id}
                            onClick={() =>
                              router.push(
                                `/dashboard/surveys/schedule-surveys/edit/${survey.id}`,
                              )
                            }
                          >
                            {/* ACTION */}
                            <TableCell
                              className="sticky left-0 bg-background z-10 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ActionTable
                                id={survey.id}
                                url={`/surveys/schedule-surveys/`}
                                urlDelete={`/schedules/${survey.id}`}
                                isEdit
                                isDelete
                                refetch={refetch}
                              />
                            </TableCell>

                            {visibleCols.name && (
                              <TableCell>
                                <Badge variant="outline">
                                  {survey?.name ?? "-"}
                                </Badge>
                              </TableCell>
                            )}

                            {visibleCols.uuid && (
                              <TableCell>
                                <p variant="outline">{survey.uuid ?? "-"}</p>
                              </TableCell>
                            )}

                            {visibleCols.cretime && (
                              <TableCell>
                                {formatDate(survey.cretime)}
                              </TableCell>
                            )}

                            {visibleCols.creby && (
                              <TableCell>{survey.creby_name ?? "-"}</TableCell>
                            )}

                            {visibleCols.modtime && (
                              <TableCell>
                                {survey.modtime
                                  ? formatDate(survey.modtime)
                                  : "-"}
                              </TableCell>
                            )}

                            {visibleCols.modby && (
                              <TableCell>{survey.modby_name ?? "-"}</TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={activeColumns.length + 1}
                            className="text-center py-6"
                          >
                            No data found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  )}
                </Table>
              </div>
            </div>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">
              Showing {schedules?.length} of {totalCount} row(s)
            </span>

            <div className="flex items-center gap-4">
              <Select onValueChange={(value) => setPaginate(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder={paginate.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <IconChevronLeft />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage(page + 1)}
              >
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage(lastPage)}
              >
                <IconChevronRight />
              </Button>
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
};
export default TableClients;
