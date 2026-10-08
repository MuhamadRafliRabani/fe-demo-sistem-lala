"use client";

import { useMemo, useState } from "react";
import { IconPlus, IconSearch } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { useApiFetch } from "@/hooks/use-api-fetch";
import ActionTable from "@/components/action-table";
import EditFaqModal from "../modal/edit-faq";
import CreateFaqModal from "../modal/create-faq";
import ViewFaqModal from "../modal/view-faq";
import { stripToPlainText } from "@/components/faq-answer";

export default function TableFaqs() {
  const [filter, setFilter] = useState({
    page: 1,
    search: "",
    paginate: 15,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingFaq, setViewingFaq] = useState(null);

  const query = useMemo(
    () => ({
      page: filter.page,
      per_page: filter.paginate,
      search: filter.search || undefined,
    }),
    [filter],
  );

  const { data, isLoading, refetch } = useApiFetch(
    ["faqs", query],
    "/master/faqs",
    query,
  );

  const items = data?.data?.data ?? [];
  const totalCount = data?.data?.total ?? 0;
  const lastPage = data?.data?.last_page ?? 1;

  const openCreateDialog = () => setCreateOpen(true);
  const openEditDialog = (faq) => {
    setEditingId(faq.id);
    setEditOpen(true);
  };
  const openViewDialog = (faq) => {
    setViewingFaq(faq);
    setViewOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        id: "actions",
        header: "Action",
        enablePinning: true,
        size: 64,
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ActionTable
              id={row.original.id}
              urlDelete={`/master/faqs/${row.original.id}`}
              isEdit
              isDelete
              onEdit={() => openEditDialog(row.original)}
              refetch={refetch}
            />
          </div>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        size: 110,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className="rounded-md font-mono text-[11px] font-normal"
          >
            {row.getValue("code") || "-"}
          </Badge>
        ),
      },
      {
        accessorKey: "question",
        header: "Question",
        size: 340,
        cell: ({ row }) => (
          <div className="line-clamp-2 max-w-[340px] whitespace-normal text-sm font-medium leading-6">
            {row.getValue("question")}
          </div>
        ),
      },
      {
        accessorKey: "answer",
        header: "Answer",
        size: 480,
        cell: ({ row }) => (
          <p className="line-clamp-2 max-w-[480px] whitespace-normal text-sm leading-6 text-muted-foreground">
            {stripToPlainText(row.getValue("answer")) || "-"}
          </p>
        ),
      },
    ],
    [refetch],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">FAQ</h1>
        <p className="text-sm text-muted-foreground">
          Kelola daftar pertanyaan dan jawaban di sini.
        </p>
      </div> */}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-8">
        <div className="relative w-full max-w-sm">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter.search}
            onChange={(event) =>
              setFilter((prev) => ({
                ...prev,
                search: event.target.value,
                page: 1,
              }))
            }
            placeholder="Cari code, question, atau answer..."
            className="pl-9"
          />
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <IconPlus size={16} />
          Add FAQ
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        enableColumnVisibility
        enablePinning
        enableColumnResizing
        onRowClick={(row) => openViewDialog(row.original)}
        enablePagination
        manualPagination
        pageCount={lastPage}
        totalCount={totalCount}
        paginationLabel="FAQ"
        pagination={{
          pageIndex: filter.page - 1,
          pageSize: filter.paginate,
        }}
        onPaginationChange={(updater) => {
          setFilter((prev) => {
            const current = {
              pageIndex: prev.page - 1,
              pageSize: prev.paginate,
            };
            const next =
              typeof updater === "function" ? updater(current) : updater;
            return {
              ...prev,
              page: next.pageIndex + 1,
              paginate: next.pageSize,
            };
          });
        }}
      />

      <CreateFaqModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />

      <EditFaqModal
        open={editOpen}
        onOpenChange={setEditOpen}
        faqId={editingId}
        onSuccess={refetch}
      />

      <ViewFaqModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        faq={viewingFaq}
        onEdit={() => {
          if (viewingFaq) openEditDialog(viewingFaq);
        }}
      />
    </div>
  );
}
