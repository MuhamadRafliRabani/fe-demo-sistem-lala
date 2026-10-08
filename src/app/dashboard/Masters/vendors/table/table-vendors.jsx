"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Copy, ArrowDownUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ActionTable from "@/components/action-table";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { useAuthStore } from "@/hooks/auth-store";

const TableVendors = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = Number(user?.role_id) === 1 || Number(user?.role_id) === 2;

  // -----------------------------
  // STATE API + TABLE
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    name: "",
    paginate: 15,
    sort: "-id",
  });

  // -----------------------------
  // FETCH API
  // -----------------------------
  const queryVendor = useMemo(
    () => ({
      fields: isAdmin
        ? "id,name,code,type,pic_name,phone,email,status,address,npwp,bank_account,bank_name"
        : "id,name,code,type,pic_name,phone,email,status",
      filter: {
        name: filter.name,
      },
      sort: filter.sort,
      paginate: filter.paginate,
      page: filter.page,
    }),
    [filter, isAdmin],
  );

  const { data, isLoading, isFetching, refetch } = useApiFetch(
    ["vendors", queryVendor],
    "/master/vendors",
    queryVendor,
  );

  // [PAGINATION] Simpan hasil server terakhir yang valid supaya total &
  // jumlah halaman tidak hilang saat query key berganti (pindah halaman).
  const serverPage = data?.data ?? null;
  const lastServerPageRef = useRef(null);
  if (serverPage) {
    lastServerPageRef.current = serverPage;
  }
  const pageData = serverPage ?? lastServerPageRef.current;

  const vendors = pageData?.data ?? [];
  const lastPage = Math.max(Number(pageData?.last_page) || 1, 1);
  const totalCount = Number(pageData?.total) || 0;

  // Skeleton hanya untuk load PERTAMA. Pindah halaman cukup meredup.
  const isInitialLoading = Boolean(isLoading) && !pageData;
  const isPageFetching = Boolean(isFetching) && !isInitialLoading;

  // [PAGINATION] Kalau halaman saat ini melebihi last_page (misal setelah
  // hapus data), kembalikan ke halaman terakhir yang valid.
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
  // TABLE COLUMNS
  // -----------------------------
  const columns = useMemo(() => {
    const baseColumns = [
      {
        id: "actions",
        header: "Action",
        enablePinning: true,
        size: 80,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionTable
              id={row.original.id}
              url={`/Masters/vendors`}
              urlDelete={`/master/vendors/${row.original.id}`}
              isEdit
              isDelete
              refetch={refetch}
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
            Vendor Name
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
        accessorKey: "code",
        header: "Kode",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("code") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Kategori",
        cell: ({ row }) => <span>{row.getValue("type") || "-"}</span>,
      },
      {
        accessorKey: "pic_name",
        header: "Contact Person",
        cell: ({ row }) => {
          return <span>{row.getValue("pic_name") || "-"}</span>;
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
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status");
          return (
            <Badge variant={status ? "default" : "destructive"}>
              {status ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
    ];

    if (isAdmin) {
      baseColumns.push(
        {
          accessorKey: "address",
          header: "Alamat",
          cell: ({ row }) => (
            <span
              className="truncate max-w-[200px] block"
              title={row.getValue("address")}
            >
              {row.getValue("address") || "-"}
            </span>
          ),
        },
        {
          accessorKey: "npwp",
          header: "NPWP",
          cell: ({ row }) => <span>{row.getValue("npwp") || "-"}</span>,
        },
        {
          accessorKey: "bank_name",
          header: "Bank",
          cell: ({ row }) => <span>{row.getValue("bank_name") || "-"}</span>,
        },
        {
          accessorKey: "bank_account",
          header: "No. Rekening",
          cell: ({ row }) => <span>{row.getValue("bank_account") || "-"}</span>,
        },
      );
    }

    return baseColumns;
  }, [refetch, isAdmin]);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <Tabs defaultValue="vendors" className="w-full">
      <div className="overflow-x-auto md:pe-8">
        <TabsContent value="vendors" className=" mt-6 space-y-6">
          <div className="flex justify-end items-center">
            <Button
              className="flex gap-2"
              onClick={() => router.push("/dashboard/Masters/vendors/create")}
            >
              <IconPlus size={16} /> Add Vendor
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={vendors}
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
            paginationLabel="vendors"
            // Optional chaining: baris skeleton memanggil onRowClick tanpa row asli
            onRowClick={(row) => {
              const id = row?.original?.id;
              if (id) router.push(`/dashboard/Masters/vendors/edit/${id}`);
            }}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default TableVendors;
