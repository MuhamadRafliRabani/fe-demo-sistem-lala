"use client";

import { useState } from "react";
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
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import { Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/skeletn-item-table";
import ActionTable from "@/components/action-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { checkActiveColums } from "@/lib/active-colums";
import FilterJenisPembangunan from "../filters/filter-jenis-pembangunan";

const TableJenisPembangunan = () => {
  const router = useRouter();
  const [paginate, setPaginate] = useState(15);
  const [filter, setFilter] = useState({
    page: 1,
    search: "",
    is_active: null,
  });

  const [visibleCols, setVisibleCols] = useState({
    name: true,
    value: true,
    order: true,
    is_active: true,
    action: true,
  });

  const { data, isLoading, refetch } = useApiFetch(
    "jenis-pembangunan",
    "/master/jenis-pembangunan",
    {
      page: filter.page,
      per_page: paginate,
      search: filter.search || undefined,
      is_active: filter.is_active !== null ? filter.is_active : undefined,
    }
  );

  const items = data?.data?.data ?? [];
  const lastPage = data?.data?.last_page ?? 1;
  const totalCount = data?.data?.total ?? items.length;

  const columns = [
    { key: "name", label: "Name" },
    { key: "value", label: "Value" },
    { key: "order", label: "Order" },
    { key: "is_active", label: "Status" },
  ];

  const { activeColumns } = checkActiveColums(columns, visibleCols);

  return (
    <Tabs defaultValue="jenis-pembangunan" className="mt-6 space-y-6 w-full">
      <div className="overflow-x-auto overflow-y-hidden md:pe-8">
        <TabsContent value="jenis-pembangunan" className="mt-6 space-y-6">
          <FilterJenisPembangunan filter={filter} setFilter={setFilter} />

          {/* FILTER AREA */}
          <div className="flex flex-wrap items-center gap-4">
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
                  router.push("/dashboard/Masters/jenis-pembangunan/create")
                }
              >
                <IconPlus size={16} /> Add New
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
                              className="whitespace-nowrap"
                            >
                              {col.label}
                            </TableHead>
                          )
                      )}
                    </TableRow>
                  </TableHeader>

                  {isLoading ? (
                    <TableSkeleton
                      columns={activeColumns}
                      includeAction={visibleCols.action}
                    />
                  ) : (
                    <TableBody>
                      {items.length ? (
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell
                              className="sticky left-0 bg-background z-10 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ActionTable
                                id={item.id}
                                url={`/Masters/jenis-pembangunan`}
                                urlDelete={`/master/jenis-pembangunan/${item.id}`}
                                isEdit
                                isDelete
                                refetch={refetch}
                              />
                            </TableCell>
                            {visibleCols.name && (
                              <TableCell className="font-medium whitespace-nowrap">
                                {item.name}
                              </TableCell>
                            )}
                            {visibleCols.value && (
                              <TableCell className="whitespace-nowrap">
                                {item.value}
                              </TableCell>
                            )}
                            {visibleCols.order && (
                              <TableCell className="whitespace-nowrap">
                                {item.order}
                              </TableCell>
                            )}
                            {visibleCols.is_active && (
                              <TableCell className="whitespace-nowrap">
                                <Badge
                                  variant={
                                    item.is_active ? "default" : "secondary"
                                  }
                                >
                                  {item.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
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
              Showing {items?.length} of {totalCount} row(s)
            </span>

            <div className="flex items-center gap-4">
              <Select
                onValueChange={(value) => {
                  setPaginate(Number(value));
                  setFilter({ ...filter, page: 1 });
                }}
              >
                <SelectTrigger className="w-[100px] hidden md:inline-block">
                  <SelectValue placeholder={paginate.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={filter.page <= 1}
                onClick={() => setFilter({ ...filter, page: 1 })}
              >
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={filter.page <= 1}
                onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
              >
                <IconChevronLeft />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled={filter.page >= lastPage}
                onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
              >
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={filter.page >= lastPage}
                onClick={() => setFilter({ ...filter, page: lastPage })}
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

export default TableJenisPembangunan;
