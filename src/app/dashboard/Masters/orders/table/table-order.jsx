"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import ActionTable from "@/components/action-table";
import { OrderStatusBadge } from "@/lib/order-status-badge";
import { formatDateDb } from "@/lib/date-format-db";
import { useDateRange } from "@/lib/date-range";
import FilterOrders from "../filters/filter-orders";
import { DataTable } from "@/components/tables/data-table";
import { ArrowDownUp, ArrowUpDown } from "lucide-react";

// Key filter yang BUKAN bagian dari "filter data" (tidak perlu reset halaman)
const PAGINATION_KEYS = ["page", "paginate"];

const TableOrders = () => {
  const router = useRouter();
  const { start, end } = useDateRange("this_month");

  // -----------------------------
  // STATE API & FILTERING
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
    name: "",
    start_date: formatDateDb(start),
    end_date: formatDateDb(end),
    status: [],
    sort: "-cretime",
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
  // ADAPTER SORTING (Tanstack)
  // -----------------------------
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

    if (!newSorting?.length) return;

    const { id, desc } = newSorting[0];
    setFilter((prev) => ({
      ...prev,
      page: 1,
      sort: desc ? `-${id}` : id,
    }));
  };

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
  const queryOrder = useMemo(
    () => ({
      filter: {
        date_between: {
          start: filter.start_date,
          end: filter.end_date,
        },
        status: filter.status.length ? filter.status.join(",") : null,
        name: filter.name,
      },
      sort: filter.sort,
      paginate: filter.paginate,
      page: filter.page,
    }),
    [filter],
  );

  const { data, isLoading, isFetching, refetch } = useApiFetch(
    ["orders", queryOrder],
    "/orders",
    queryOrder,
  );

  // [PAGINATION FIX] Simpan hasil server terakhir yang valid.
  const serverResponse = data ?? null;
  const lastServerResponseRef = useRef(null);
  if (serverResponse) {
    lastServerResponseRef.current = serverResponse;
  }
  const pageData = serverResponse ?? lastServerResponseRef.current;
  const pageMeta = pageData?.meta ?? pageData;

  const orders = pageData?.data ?? [];
  const lastPage = Math.max(Number(pageMeta?.last_page) || 1, 1);
  const totalCount = Number(pageMeta?.total) || 0;

  const isInitialLoading = Boolean(isLoading) && !pageData;
  const isPageFetching = Boolean(isFetching) && !isInitialLoading;

  // [PAGINATION FIX] Kalau page melebihi last_page, mundur ke halaman valid.
  useEffect(() => {
    if (!serverResponse) return;
    const meta = serverResponse.meta ?? serverResponse;
    if (Number(meta.current_page) !== filter.page) return;

    const maxPage = Math.max(Number(meta.last_page) || 1, 1);
    if (filter.page > maxPage) {
      setFilter((prev) =>
        prev.page > maxPage ? { ...prev, page: maxPage } : prev,
      );
    }
  }, [serverResponse, filter.page]);

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
              url={`/Masters/orders`}
              urlDelete={`/orders/${row.original.id}`}
              isShowInvoice={`https://langitlangit.id/client/success/?order_id=${row.original.order_code}&status_code=200&transaction_status=${row.original.payment_transaction_status}`}
              isEdit={false}
              isDelete
              invalidateKeys={[["orders"]]}
              refetch={refetch}
            />
          </div>
        ),
      },
      {
        accessorKey: "order_code",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent flex gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order Code
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.getValue("order_code") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "client_name",
        header: "Client",
        cell: ({ row }) => row.original.client_name || "-",
      },
      {
        accessorKey: "payment_channel",
        header: "Payment",
        cell: ({ row }) => row.original.payment_channel || "-",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) =>
          new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: row.original.currency ?? "IDR",
          }).format(row.getValue("amount")),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <OrderStatusBadge status={row.getValue("status")} />,
      },
      {
        accessorKey: "paid_at",
        header: "Paid",
        cell: ({ row }) =>
          row.getValue("paid_at")
            ? formatDate(row.getValue("paid_at"), true)
            : "-",
      },
      {
        accessorKey: "due_date",
        header: "Expired",
        cell: ({ row }) =>
          row.getValue("due_date")
            ? formatDate(row.getValue("due_date"), true)
            : "-",
      },
      {
        accessorKey: "marketing.name",
        header: "Marketing",
        cell: ({ row }) => row.original.marketing?.name || "-",
      },
      {
        accessorKey: "cretime",
        header: "Created At",
        cell: ({ row }) => formatDate(row.getValue("cretime")),
      },
    ],
    [refetch],
  );

  // -----------------------------
  // RENDER UTAMA
  // -----------------------------
  return (
    <Tabs defaultValue="orders" className="w-full">
      <div className="overflow-x-auto overflow-y-hidden md:pe-8">
        <TabsContent value="orders" className="mt-6 space-y-6">
          <FilterOrders filter={filter} setFilter={handleFilterChange} />

          <div className="flex justify-end items-center">
            <Button
              className="flex gap-2"
              onClick={() => router.push("/dashboard/Masters/orders/create")}
            >
              <IconPlus size={16} /> Add Order
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={orders}
            isLoading={isInitialLoading}
            isFetching={isPageFetching}
            enableColumnVisibility={true}
            enableSorting={true}
            enablePinning={true}
            enableColumnResizing={true}
            // --- Server-side Sorting ---
            manualSorting={true}
            sorting={sortingState}
            onSortingChange={handleSortingChange}
            // --- Server-side Pagination (bawaan DataTable) ---
            enablePagination={true}
            manualPagination={true}
            pagination={paginationState}
            onPaginationChange={handlePaginationChange}
            pageCount={lastPage}
            totalCount={totalCount}
            paginationLabel="orders"
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default TableOrders;
