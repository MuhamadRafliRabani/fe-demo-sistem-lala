"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ActionTable from "@/components/action-table";
import FilterScheduleSurvey from "../filters/filter-schedule-surveys";
import { toast } from "sonner";
import EditClientSheet from "../components/edit-client-sheet";
import { DataTable } from "@/components/tables/data-table";
import { ArrowDownUp, ArrowUpDown } from "lucide-react";

// Key filter yang BUKAN bagian dari "filter data" (tidak perlu reset halaman)
const PAGINATION_KEYS = ["page", "paginate"];

const TableClients = () => {
  const router = useRouter();

  // -----------------------------
  // STATE API + TABLE
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    name: "",
    schedule: "",
    not_schedule: "",
    task: "",
    not_task: "",
    uuid: "",
    email: "",
    phone: "",
    start_date: "",
    end_date: "",
    paginate: 15,
    sort: "-id",
  });

  // State for Edit Client Sheet
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  // [PAGINATION] Setiap filter data berubah (nama, uuid, email, tanggal, dsb)
  // halaman otomatis kembali ke 1. Dipakai sebagai pengganti `setFilter`
  // untuk komponen filter.
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

      // Kalau komponen filter sendiri sudah mengatur page, hormati itu.
      if (dataFilterChanged && next.page === prev.page) {
        return { ...next, page: 1 };
      }
      return next;
    });
  }, []);

  // -----------------------------
  // FETCH API
  // -----------------------------
  const queryClient = useMemo(
    () => ({
      fields: "id,name,uuid,phone,email",
      filter: {
        date_between: {
          start: filter.start_date,
          end: filter.end_date,
        },
        schedule: filter.schedule,
        not_schedule: filter.not_schedule,
        task: filter.task,
        not_task: filter.not_task,
        name: filter.name,
        uuid: filter.uuid,
        phone: filter.phone,
        email: filter.email,
      },
      sort: filter.sort,
      paginate: filter.paginate,
      page: filter.page,
    }),
    [filter],
  );

  const { data, isLoading, isFetching, refetch } = useApiFetch(
    ["clients", queryClient],
    "/clients",
    queryClient,
  );

  // [PAGINATION] Simpan hasil server terakhir yang valid. Tiap ganti
  // halaman/filter = query key baru -> `data` sempat undefined. Tanpa ini
  // total & jumlah halaman jatuh ke 0/1 dan tabel berkedip jadi skeleton.
  const serverPage = data?.data ?? null;
  const lastServerPageRef = useRef(null);
  if (serverPage) {
    lastServerPageRef.current = serverPage;
  }
  const pageData = serverPage ?? lastServerPageRef.current;

  const clients = pageData?.data ?? [];
  const lastPage = Math.max(Number(pageData?.last_page) || 1, 1);
  const totalCount = Number(pageData?.total) || 0;

  // Skeleton hanya untuk load PERTAMA. Pindah halaman/filter cukup meredup.
  const isInitialLoading = Boolean(isLoading) && !pageData;
  const isPageFetching = Boolean(isFetching) && !isInitialLoading;

  // [PAGINATION] Kalau halaman saat ini melebihi last_page (misal data
  // berkurang setelah hapus/filter), kembalikan ke halaman terakhir yang valid.
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
  // ADAPTER UNTUK TANSTACK TABLE
  // -----------------------------
  // Sorting Handler
  const sortingState = useMemo(() => {
    const isDesc = filter.sort.startsWith("-");
    const id = filter.sort.replace("-", "");
    return [{ id, desc: isDesc }];
  }, [filter.sort]);

  // Ganti sorting -> kembali ke halaman 1
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

  // Pagination Handler
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

      // Tidak ada perubahan -> jangan bikin re-render / refetch sia-sia
      if (nextPage === prev.page && nextPageSize === prev.paginate) {
        return prev;
      }

      return { ...prev, page: nextPage, paginate: nextPageSize };
    });
  }, []);

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = useMemo(
    () => [
      {
        id: "actions",
        header: "Action",
        enablePinning: true,
        size: 80,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionTable
              id={row.original.id}
              url={`/Masters/clients/`}
              urlDelete={`/clients/${row.original.id}`}
              isEdit
              isDelete
              refetch={refetch}
              onEdit={() => {
                setEditingClientId(row.original.id);
                setEditSheetOpen(true);
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent flex gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Client
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline">{row.getValue("name") || "-"}</Badge>
        ),
      },
      {
        accessorKey: "uuid",
        header: "CLIENT ID",
        cell: ({ row }) => {
          const val = row.getValue("uuid");
          return (
            <div
              className="inline-flex items-center gap-1 cursor-pointer select-none text-muted-foreground hover:text-foreground group"
              onClick={(e) => {
                e.stopPropagation();
                if (!val) return;
                navigator.clipboard.writeText(val);
                toast.success("CLIENT ID disalin");
              }}
            >
              <span>{val || "-"}</span>
              <Copy
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const val = row.getValue("phone");
          return (
            <div
              className="inline-flex items-center gap-1 cursor-pointer select-none text-muted-foreground hover:text-foreground group"
              onClick={(e) => {
                e.stopPropagation();
                if (!val) return;
                navigator.clipboard.writeText(val);
                toast.success("Phone disalin");
              }}
            >
              <span>{val || "-"}</span>
              <Copy
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          const val = row.getValue("email");
          return (
            <div
              className="inline-flex items-center gap-1 cursor-pointer select-none text-muted-foreground hover:text-foreground group"
              onClick={(e) => {
                e.stopPropagation();
                if (!val) return;
                navigator.clipboard.writeText(val);
                toast.success("Email disalin");
              }}
            >
              <span className="truncate max-w-[150px]">{val || "-"}</span>
              <Copy
                size={14}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          );
        },
      },
    ],
    [refetch],
  );

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <Tabs defaultValue="clients" className="w-full">
      <div className="overflow-x-auto md:pe-8">
        <TabsContent value="clients" className=" mt-6 space-y-6">
          {/* [PAGINATION] pakai handleFilterChange agar page reset ke 1 */}
          <FilterScheduleSurvey
            filter={filter}
            setFilter={handleFilterChange}
          />

          <div className="flex justify-end items-center gap-4">
            <Button
              className="flex gap-2"
              onClick={() => router.push("/dashboard/Masters/clients/create")}
            >
              <IconPlus size={16} /> Add client
            </Button>
            <Button
              className="flex gap-2"
              onClick={() =>
                router.push("/dashboard/surveys/schedule-surveys/create")
              }
            >
              <IconPlus size={16} /> Add Survey
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={clients}
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
            paginationLabel="clients"
            // Optional chaining: baris skeleton memanggil onRowClick tanpa row asli
            onRowClick={(row) => {
              const id = row?.original?.id;
              if (id) router.push(`/dashboard/Masters/clients/edit/${id}`);
            }}
          />
        </TabsContent>
      </div>

      <EditClientSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        clientId={editingClientId}
        onSuccess={refetch}
      />
    </Tabs>
  );
};

export default TableClients;
