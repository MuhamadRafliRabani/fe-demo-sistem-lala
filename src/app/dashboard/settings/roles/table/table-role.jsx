"use client";

import { useMemo, useState } from "react";
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
import { IconPlus } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import { PaginationBar } from "@/components/pagination-bar";

const TableRoles = () => {
  const router = useRouter();

  // -----------------------------
  // STATE API + TABLE
  // -----------------------------
  const [nameFilter, setNameFilter] = useState("");
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
  });

  // Columns visible controller
  const [visibleCols, setVisibleCols] = useState({
    name: true,
    desc: true,
    cretime: true,
    creby: true,
    modtime: true,
    modby: true,
  });

  // -----------------------------
  // FETCH API
  // -----------------------------
  const { data, isLoading } = useApiFetch(["roles", filter, nameFilter], "/roles", {
    page: filter.page,
    paginate: filter.paginate,
    name: nameFilter, // FILTER ROLE
  });

  const roles = useMemo(() => {
    if (Array.isArray(data?.data)) return data.data;
    return data?.data?.data || [];
  }, [data]);
  const lastPage = data?.data?.last_page ?? data?.last_page ?? 1;
  const totalCount = data?.data?.total ?? data?.total ?? roles.length;

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = [
    { key: "name", label: "Name" },
    { key: "desc", label: "Description" },
    { key: "cretime", label: "Created Time" },
    { key: "creby", label: "Created By" },
    { key: "modtime", label: "Modified Time" },
    { key: "modby", label: "Modified By" },
  ];

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <Tabs defaultValue="roles" className="w-full">
      {/* <TabsList>
        <TabsTrigger value="roles">roles</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList> */}

      {/* MAIN TAB */}
      <div className="overflow-x-auto pe-8">
        <TabsContent value="roles" className=" mt-6 space-y-6">
          {/* FILTER AREA */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <Input
              placeholder="Filter name..."
              className="w-[250px]"
              value={nameFilter}
              onChange={(e) => {
                setFilter((prev) => ({ ...prev, page: 1 }));
                setNameFilter(e.target.value);
              }}
            />

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
                onClick={() => router.push("/dashboard/settings/roles/create")}
              >
                <IconPlus size={16} /> Add Role
              </Button>
            </div>
          </div>

          {/* TABLE */}
          <div className="border rounded-lg  ">
            <Table className="min-w-max">
              <TableHeader className="bg-muted sticky top-0">
                <TableRow>
                  <TableHead className="w-10">#</TableHead>

                  {columns.map(
                    (col) =>
                      visibleCols[col.key] && (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ),
                  )}
                </TableRow>
              </TableHeader>

              {isLoading ? (
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>

                      {visibleCols.name && (
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                      )}

                      {visibleCols.desc && (
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                      )}

                      {visibleCols.cretime && (
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      )}

                      {visibleCols.creby && (
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      )}

                      {visibleCols.modtime && (
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                      )}

                      {visibleCols.modby && (
                        <TableCell>
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <TableBody>
                  {roles.length ? (
                    roles.map((role, i) => {
                      return (
                        <TableRow
                          key={role.id}
                          onClick={() =>
                            router.push(
                              `/dashboard/settings/roles/edit/${role.id}`,
                            )
                          }
                        >
                          <TableCell>
                            {(filter.page - 1) * filter.paginate + (i + 1)}
                          </TableCell>

                          {visibleCols.name && (
                            <TableCell>
                              <div className="w-32">
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground px-1.5"
                                >
                                  {role.name}
                                </Badge>
                              </div>
                            </TableCell>
                          )}
                          {visibleCols.desc && (
                            <TableCell>{role.desc}</TableCell>
                          )}
                          {visibleCols.cretime && (
                            <TableCell>{formatDate(role.cretime)}</TableCell>
                          )}
                          {visibleCols.creby && (
                            <TableCell>{role.creby_name ?? "-"}</TableCell>
                          )}
                          {visibleCols.modtime && (
                            <TableCell>
                              {formatDate(role.modtime) ?? "-"}
                            </TableCell>
                          )}
                          {visibleCols.modby && (
                            <TableCell>{role.modby_name ?? "-"}</TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-6">
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
            currentData={roles.length}
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
export default TableRoles;
