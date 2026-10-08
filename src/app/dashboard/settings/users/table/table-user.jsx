"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { IconCircleCheckFilled, IconPlus } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Settings2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { normalizeParams } from "@/lib/serialisasi-filter-leads";
import FilterUsers from "../filters/filter-users";
import ActionTable from "@/components/action-table";
import { TableSkeleton } from "@/components/skeletn-item-table";
import { PaginationBar } from "@/components/pagination-bar";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-format";

const getContractRemainingDays = (endDateValue) => {
  if (!endDateValue) return null;
  const endDate = new Date(endDateValue);
  if (Number.isNaN(endDate.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
};

const getContractBadge = (remainingDays) => {
  if (remainingDays === null) return null;
  if (remainingDays < 0)
    return "bg-[#c9372c]/10 text-[#f87168] border-[#c9372c]/30";
  if (remainingDays <= 30)
    return "bg-[#f5cd47]/10 text-[#f5cd47] border-[#f5cd47]/30";
  return "bg-[#4bce97]/10 text-[#4bce97] border-[#4bce97]/30";
};

const getStatusLabel = (status) => (status === "active" ? "Active" : "Initial");

const getSpLabel = (spLevel) => {
  const level = Number(spLevel || 0);
  if (!level) return "-";
  return `SP ${level}`;
};

const TableUsers = () => {
  const router = useRouter();
  const getShortAddress = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.split(",").slice(0, 2).join(",").trim();
  };
  const formatCoords = (lat, lng) => {
    if (!lat || !lng) return "-";
    const latNum = typeof lat === "number" ? lat : Number(lat);
    const lngNum = typeof lng === "number" ? lng : Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return "";
    return `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`;
  };

  // -----------------------------
  // STATE API + TABLE
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    name: "",
    status: [],
    role_id: [],
    contract_end_from: "",
    contract_end_to: "",
    paginate: 15,
  });

  // Columns visible controller
  const [visibleCols, setVisibleCols] = useState({
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    attendance_today: true,
    attendance_location_today: false,
    contract: true,
    contract_range: true,
    sp: true,
    last_login: true,
    last_login_ip: false,
    last_login_location: false,
  });

  // -----------------------------
  // FETCH API
  // -----------------------------
  const { data, isLoading, error, refetch } = useApiFetch("users", "/users", {
    page: filter.page,
    paginate: filter.paginate,
    filter: normalizeParams({
      name: filter.name,
      status: filter.status,
      role_id: filter.role_id,
      contract_end_from: filter.contract_end_from,
      contract_end_to: filter.contract_end_to,
    }),
  });

  const { data: roles } = useApiFetch(["roles", "user-filter"], "/roles", {
    paginate: 15,
  });

  const paginator = data?.data ?? {};
  const users = paginator?.data ?? [];
  const lastPage = paginator?.last_page ?? 1;
  const totalCount = paginator?.total ?? users.length;

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "attendance_today", label: "Attend Today" },
    { key: "attendance_location_today", label: "Attend Location" },
    { key: "contract", label: "Contract" },
    { key: "contract_range", label: "Contract Range" },
    { key: "sp", label: "SP" },
    { key: "last_login", label: "Last Login" },
    { key: "last_login_ip", label: "Login IP" },
    { key: "last_login_location", label: "Login Location" },
  ];

  const rolesList = Array.isArray(roles?.data)
    ? roles.data
    : roles?.data?.data || [];
  const rolesSelect = rolesList.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const contractToastKeyRef = useRef("");
  useEffect(() => {
    const toastKey = [
      filter.page,
      filter.name,
      (filter.status || []).join(","),
      (filter.role_id || []).join(","),
      filter.contract_end_from,
      filter.contract_end_to,
    ].join("|");

    const expiringCount = users.filter((u) => {
      const remaining = getContractRemainingDays(u.contract_end_date);
      return remaining !== null && remaining <= 30;
    }).length;

    if (expiringCount > 0 && contractToastKeyRef.current !== toastKey) {
      contractToastKeyRef.current = toastKey;
      toast.warning(
        `Ada ${expiringCount} kontrak yang akan habis dalam 30 hari`,
      );
    }
  }, [
    users,
    filter.page,
    filter.name,
    filter.status,
    filter.role_id,
    filter.contract_end_from,
    filter.contract_end_to,
  ]);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <Tabs defaultValue="users" className="w-full">
      {/* MAIN TAB */}
      <div className="overflow-x-auto pe-8">
        <TabsContent value="users" className="mt-6 space-y-6">
          {/* FILTER AREA */}
          <FilterUsers
            filter={filter}
            setFilter={setFilter}
            roles={rolesSelect}
          />

          <div className="flex flex-wrap items-center gap-4">
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
                onClick={() => router.push("/dashboard/settings/users/create")}
              >
                <IconPlus size={16} /> Add User
              </Button>
            </div>
          </div>

          {/* TABLE */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted sticky top-0">
                <TableRow>
                  <TableHead className="sticky left-0 bg-muted z-30 whitespace-nowrap w-20">
                    Action
                  </TableHead>

                  {columns.map(
                    (col) =>
                      visibleCols[col.key] && (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ),
                  )}
                </TableRow>
              </TableHeader>

              {isLoading ? (
                <TableSkeleton
                  rows={5}
                  columns={[
                    { key: "action", label: "Action" },
                    { key: "index", label: "#" },
                    ...columns.filter((col) => visibleCols[col.key]),
                  ]}
                  includeAction={true}
                />
              ) : (
                <TableBody>
                  {users.length ? (
                    users.map((data, i) => (
                      <TableRow
                        key={data?.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell
                          className="sticky left-0 bg-background z-10 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ActionTable
                            id={data?.id}
                            url="/settings/users"
                            urlDelete={`/users/${data?.id}`}
                            isEdit={true}
                            isDelete={true}
                            refetch={refetch}
                          />
                        </TableCell>

                        {visibleCols.name && (
                          <TableCell>{data?.name}</TableCell>
                        )}
                        {visibleCols.email && (
                          <TableCell>{data?.email}</TableCell>
                        )}
                        {visibleCols.phone && (
                          <TableCell>{data?.phone}</TableCell>
                        )}
                        {visibleCols.role && (
                          <TableCell>
                            <div className="w-32">
                              <Badge
                                variant="outline"
                                className="text-muted-foreground px-1.5"
                              >
                                {
                                  rolesList.find(
                                    (role) => Number(role.id) == data?.role_id,
                                  )?.name
                                }
                              </Badge>
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.status && (
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-muted-foreground px-1.5"
                            >
                              {data?.status === "active" ? (
                                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
                              ) : (
                                <X />
                              )}
                              {getStatusLabel(data?.status)}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleCols.attendance_today && (
                          <TableCell>
                            {data?.today_attendance_time ?? "-"}
                          </TableCell>
                        )}
                        {visibleCols.attendance_location_today && (
                          <TableCell className="max-w-[260px]">
                            <span
                              className="block truncate"
                              title={String(
                                data?.today_attendance_address || "",
                              )}
                            >
                              {data?.today_attendance_address
                                ? getShortAddress(
                                    data?.today_attendance_address,
                                  )
                                : formatCoords(
                                    data?.today_attendance_lat,
                                    data?.today_attendance_lng,
                                  ) || "-"}
                            </span>
                          </TableCell>
                        )}
                        {visibleCols.contract && (
                          <TableCell>
                            {data?.contract_file ? (
                              <a
                                href={resolveImageUrl(data.contract_file)}
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Contract
                              </a>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        )}
                        {visibleCols.contract_range && (
                          <TableCell>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span>
                                {formatDate(data?.contract_start_date) || "-"} -{" "}
                                {formatDate(data?.contract_end_date) || "-"}
                              </span>
                              {(() => {
                                const remaining = getContractRemainingDays(
                                  data?.contract_end_date,
                                );
                                const badge = getContractBadge(remaining);
                                if (!badge) return null;
                                return (
                                  <span
                                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${badge}`}
                                  >
                                    {remaining < 0
                                      ? "Expired"
                                      : `H-${remaining}`}
                                  </span>
                                );
                              })()}
                            </div>
                          </TableCell>
                        )}
                        {visibleCols.sp && (
                          <TableCell>{getSpLabel(data?.sp_level)}</TableCell>
                        )}
                        {visibleCols.last_login && (
                          <TableCell>
                            {formatDate(data?.last_login_at, true) ?? "-"}
                          </TableCell>
                        )}
                        {visibleCols.last_login_ip && (
                          <TableCell className="font-mono text-xs">
                            {data?.last_login_ip || "-"}
                          </TableCell>
                        )}
                        {visibleCols.last_login_location && (
                          <TableCell className="max-w-[260px]">
                            <span
                              className="block truncate"
                              title={String(data?.last_login_address || "")}
                            >
                              {data?.last_login_address
                                ? getShortAddress(data?.last_login_address)
                                : formatCoords(
                                    data?.last_login_lat,
                                    data?.last_login_lng,
                                  ) || "-"}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 2}
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

          {/* PAGINATION */}
          <PaginationBar
            total={totalCount}
            page={filter.page}
            perPage={String(filter.paginate)}
            totalPages={lastPage}
            currentData={users.length}
            onPageChange={(nextPage) =>
              setFilter({ ...filter, page: nextPage })
            }
            onPerPageChange={(nextPerPage) => {
              setFilter({ ...filter, paginate: nextPerPage, page: 1 });
            }}
            label="Total Users"
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};
export default TableUsers;
