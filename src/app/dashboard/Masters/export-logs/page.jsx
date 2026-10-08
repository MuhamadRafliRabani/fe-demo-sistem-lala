"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { DataTable } from "@/components/tables/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Key filter yang BUKAN bagian dari "filter data" (tidak perlu reset halaman)
const PAGINATION_KEYS = ["page", "paginate"];

const EXPORT_TYPE_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "user_activity_export", label: "Analytics Todo" },
  { value: "leads_export", label: "Leads Export" },
  { value: "leads_report", label: "Leads Report" },
  { value: "products_export", label: "Products Export" },
];

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function ExportLogsPage() {
  // -----------------------------
  // STATE API & FILTERING
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
    sort: "-creby",
    include: "user",
    filter: {
      export_type: "all",
    },
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
  const query = useMemo(() => {
    const exportType = filter?.filter?.export_type;
    const next = {
      page: filter.page,
      paginate: filter.paginate,
      sort: filter.sort,
      include: filter.include,
      filter: {},
    };
    if (exportType && exportType !== "all") {
      next.filter.export_type = exportType;
    }
    return next;
  }, [filter]);

  const { data, isLoading, isFetching } = useApiFetch(
    ["export-logs", query],
    "/export-logs",
    query,
    true,
  );

  // [PAGINATION FIX] Simpan hasil server terakhir yang valid.
  // Di endpoint ini data list ada di `data.data.data`, meta di `data.data.meta`.
  const serverPage = data?.data ?? null;
  const lastServerPageRef = useRef(null);
  if (serverPage) {
    lastServerPageRef.current = serverPage;
  }
  const pageData = serverPage ?? lastServerPageRef.current;
  const pageMeta = pageData?.meta ?? pageData;

  const logs = pageData?.data ?? [];
  const lastPage = Math.max(Number(pageMeta?.last_page) || 1, 1);
  const totalCount = Number(pageMeta?.total) || 0;

  const isInitialLoading = Boolean(isLoading) && !pageData;
  const isPageFetching = Boolean(isFetching) && !isInitialLoading;

  // [PAGINATION FIX] Kalau page melebihi last_page, mundur ke halaman valid.
  useEffect(() => {
    if (!serverPage) return;
    const meta = serverPage.meta ?? serverPage;
    if (Number(meta.current_page) !== filter.page) return;

    const maxPage = Math.max(Number(meta.last_page) || 1, 1);
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
        accessorKey: "creby",
        header: "Tanggal",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.getValue("creby"))}
          </span>
        ),
      },
      {
        // id "name" => di mobile jadi judul card (DataTable memakai kolom ini)
        id: "name",
        accessorFn: (row) => row.user?.name,
        header: "User",
        meta: { label: "User" },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.user?.name || "-"}</span>
        ),
      },
      {
        accessorKey: "export_type",
        header: "Tipe",
        cell: ({ row }) => row.original.export_type || "-",
      },
      {
        accessorKey: "file_name",
        header: "File",
        cell: ({ row }) => row.original.file_name || "-",
      },
      {
        accessorKey: "filters",
        header: "Filter",
        size: 360,
        cell: ({ row }) => (
          <pre className="max-w-[360px] whitespace-pre-wrap break-words text-xs">
            {row.original.filters
              ? JSON.stringify(row.original.filters, null, 2)
              : "-"}
          </pre>
        ),
      },
      {
        accessorKey: "ip_address",
        header: "IP",
        cell: ({ row }) => row.original.ip_address || "-",
      },
    ],
    [],
  );

  // -----------------------------
  // RENDER UTAMA
  // -----------------------------
  return (
    <DashboardLayout
      title="Report Log Excel"
      desc="Riwayat export Excel (siapa yang export dan kapan)."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-[260px]">
            <Select
              value={filter.filter.export_type}
              onValueChange={(value) =>
                handleFilterChange((prev) => ({
                  ...prev,
                  filter: { ...prev.filter, export_type: value },
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe export" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          isLoading={isInitialLoading}
          isFetching={isPageFetching}
          enableColumnVisibility={true}
          enableSorting={false}
          enablePinning={false}
          enableColumnResizing={true}
          // --- Server-side Pagination (bawaan DataTable) ---
          enablePagination={true}
          manualPagination={true}
          pagination={paginationState}
          onPaginationChange={handlePaginationChange}
          pageCount={lastPage}
          totalCount={totalCount}
          paginationLabel="log"
        />
      </div>
    </DashboardLayout>
  );
}
