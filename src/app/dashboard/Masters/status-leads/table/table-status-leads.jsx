"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ActionTable from "@/components/action-table";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { DataTable } from "@/components/tables/data-table";
import FilterStatusLeads from "../filters/filter-status-leads";

// Key filter yang BUKAN bagian dari "filter data" (tidak perlu reset halaman)
const PAGINATION_KEYS = ["page", "paginate"];

const TableStatusLeads = () => {
  const router = useRouter();

  // -----------------------------
  // STATE API & FILTERING
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
    search: "",
    is_active: null,
  });

  // [PAGINATION FIX] Setiap filter data berubah, page otomatis kembali ke 1.
  const handleFilterChange = useCallback((updaterOrValue) => {
    setFilter((prev) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue;

      if (!next || next === prev) return prev;

      const dataFilterChanged = Object.keys(next).some(
        (key) => !PAGINATION_KEYS.includes(key) && next[key] !== prev[key],
      );

      if (dataFilterChanged && next.page === prev.page) {
        return { ...next, page: 1 };
      }
      return next;
    });
  }, []);

  // -----------------------------
  // ADAPTER PAGINATION (Tanstack)
  // -----------------------------
  const paginationState = useMemo(
    () => ({
      pageIndex: (filter.page || 1) - 1,
      pageSize: filter.paginate || 15,
    }),
    [filter.page, filter.paginate],
  );

  const handlePaginationChange = useCallback((updaterOrValue) => {
    setFilter((prev) => {
      const currentPagination = {
        pageIndex: (prev.page || 1) - 1,
        pageSize: prev.paginate || 15,
      };

      const nextPagination =
        typeof updaterOrValue === "function"
          ? updaterOrValue(currentPagination)
          : (updaterOrValue ?? currentPagination);

      const nextPageSize = Math.max(
        Number(nextPagination.pageSize ?? currentPagination.pageSize) || 15,
        1,
      );
      const nextPageIndex = Math.max(
        Number(nextPagination.pageIndex ?? currentPagination.pageIndex) || 0,
        0,
      );
      const pageSizeChanged = nextPageSize !== (prev.paginate || 15);
      const nextPage = pageSizeChanged ? 1 : nextPageIndex + 1;

      if (nextPage === prev.page && nextPageSize === prev.paginate) {
        return prev;
      }

      return { ...prev, page: nextPage, paginate: nextPageSize };
    });
  }, []);

  // -----------------------------
  // FETCH API
  // -----------------------------
  const params = useMemo(
    () => ({
      page: filter.page,
      per_page: filter.paginate,
      search: filter.search || undefined,
      is_active: filter.is_active !== null ? filter.is_active : undefined,
    }),
    [filter],
  );

  const { data, isLoading, isFetching, refetch } = useApiFetch(
    ["status-leads", params],
    "/master/status-leads",
    params,
  );

  // [PAGINATION FIX] Simpan hasil server terakhir yang valid.
  const serverPage = data?.data ?? null;
  const lastServerPageRef = useRef(null);
  if (serverPage) {
    lastServerPageRef.current = serverPage;
  }
  const pageData = serverPage ?? lastServerPageRef.current;

  const items = pageData?.data ?? [];
  const lastPage = Math.max(Number(pageData?.last_page) || 1, 1);
  const totalCount = Number(pageData?.total) || 0;

  const isInitialLoading = Boolean(isLoading) && !pageData;
  const isPageFetching = Boolean(isFetching) && !isInitialLoading;

  // [PAGINATION FIX] Kalau page melebihi last_page, mundur ke halaman valid.
  useEffect(() => {
    if (!serverPage) return;
    if (Number(serverPage.current_page) !== filter.page) return;

    const maxPage = Math.max(Number(serverPage.last_page) || 1, 1);
    if (filter.page > maxPage) {
      setFilter((prev) =>
        prev.page > maxPage ? { ...prev, page: maxPage } : prev,
      );
    }
  }, [serverPage, filter.page]);

  // -----------------------------
  // DEFINISI KOLOM
  // -----------------------------
  const columns = useMemo(
    () => [
      {
        id: "actions",
        header: "Action",
        enableHiding: false,
        enablePinning: true,
        size: 80,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionTable
              id={row.original.id}
              url={`/Masters/status-leads`}
              urlDelete={`/master/status-leads/${row.original.id}`}
              isEdit
              isDelete
              refetch={refetch}
            />
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "value",
        header: "Value",
        cell: ({ row }) => row.getValue("value") ?? "-",
      },
      {
        accessorKey: "order",
        header: "Order",
        cell: ({ row }) => row.getValue("order") ?? "-",
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
          const active = row.getValue("is_active");
          return (
            <Badge variant={active ? "default" : "secondary"}>
              {active ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
    ],
    [refetch],
  );

  // -----------------------------
  // RENDER UTAMA
  // -----------------------------
  return (
    <Tabs defaultValue="status-leads" className="mt-6 space-y-6 w-full">
      <div className="overflow-x-auto overflow-y-hidden md:pe-8">
        <TabsContent value="status-leads" className="mt-6 space-y-6">
          <FilterStatusLeads filter={filter} setFilter={handleFilterChange} />

          <div className="flex justify-end items-center">
            <Button
              className="flex gap-2"
              onClick={() =>
                router.push("/dashboard/Masters/status-leads/create")
              }
            >
              <IconPlus size={16} /> Add New
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={items}
            isLoading={isInitialLoading}
            isFetching={isPageFetching}
            enableColumnVisibility={true}
            enableSorting={false}
            enablePinning={true}
            enableColumnResizing={true}
            // --- Server-side Pagination (bawaan DataTable) ---
            enablePagination={true}
            manualPagination={true}
            pagination={paginationState}
            onPaginationChange={handlePaginationChange}
            pageCount={lastPage}
            totalCount={totalCount}
            paginationLabel="status leads"
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default TableStatusLeads;
