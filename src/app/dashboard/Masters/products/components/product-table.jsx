"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownUp, ArrowUpDown, Copy, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ActionTable from "@/components/action-table";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { formatCurrency } from "@/lib/construction-estimator-utils";
import { formatDate } from "@/lib/date-format";
import { resolveImageUrl } from "@/lib/resolve-image-url";

const ProductTable = ({
  data,
  isLoading,
  sorting,
  onSortingChange,
  refetch,
}) => {
  const router = useRouter();

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
              url={`/Masters/products`}
              urlDelete={`/master/products/${row.original.id}`}
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
            Product Name
            {column.getIsSorted() === "desc" ?
              <ArrowDownUp size={14} />
            : <ArrowUpDown size={14} />}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.image && (
              <img
                src={resolveImageUrl(row.original.image)}
                alt={row.getValue("name")}
                className="w-8 h-8 rounded object-cover"
              />
            )}
            <span className="font-medium">{row.getValue("name")}</span>
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.getValue("sku") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.getValue("type") || "-"}</Badge>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <span>{row.getValue("category") || "-"}</span>,
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-mono">
            {formatCurrency(row.getValue("price"))}
          </span>
        ),
      },
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => <span>{row.getValue("unit") || "-"}</span>,
      },
      {
        accessorKey: "link",
        header: "Link",
        cell: ({ row }) => {
          const link = row.getValue("link");
          return link ?
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} /> Open
              </a>
            : "-";
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
      {
        accessorKey: "modby",
        header: "Last Updated By",
        cell: ({ row }) => {
          const modByUser = row.original?.user?.name;
          return modByUser || "-";
        },
      },
      {
        accessorKey: "modtime",
        header: "Last Updated",
        cell: ({ row }) => {
          const modTime = row.getValue("modtime");
          return formatDate(modTime, true) || "-";
        },
      },
    ],
    [refetch],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      enableColumnVisibility={true}
      enableSorting={true}
      enablePinning={true}
      enableColumnResizing={true}
      manualSorting={true}
      sorting={sorting}
      onSortingChange={onSortingChange}
      enablePagination={false}
      onRowClick={(row) =>
        router.push(`/dashboard/Masters/products/edit/${row.original.id}`)
      }
    />
  );
};

export default ProductTable;
