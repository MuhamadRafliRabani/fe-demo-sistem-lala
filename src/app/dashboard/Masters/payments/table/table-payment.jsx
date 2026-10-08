"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
} from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkActiveColums } from "@/lib/active-colums";
import { TableSkeleton } from "@/components/skeletn-item-table";
import { FilterPayment } from "../filters/filter-payment";
import { TransactionStatusBadge } from "@/lib/transaction-status-badge";
import { FraudStatusBadge } from "@/lib/fraud-status-badge";

const TablePayments = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // -----------------------------
  // STATE API + TABLE
  // -----------------------------
  const [page, setPage] = useState(1);
  const [paginate, setPaginate] = useState(15);

  const [visibleCols, setVisibleCols] = useState({
    order_code: true,
    midtrans_transaction_id: true,
    payment_type: true,
    gross_amount: true,
    transaction_status: true,
    fraud_status: true,
    paid_at: true,
    cretime: false,
  });

  const queryParams = {
    page: page,
    paginate: paginate,
    search: searchParams.get("search"),
    date_from: searchParams.get("date_from"),
    date_to: searchParams.get("date_to"),
    transaction_status: searchParams.get("transaction_status"),
    fraud_status: searchParams.get("fraud_status"),
  };

  // -----------------------------
  // FETCH API
  // -----------------------------
  const { data, isLoading } = useApiFetch(
    "payments",
    "/payments",
    queryParams
  );

  const payments = data?.data ?? [];
  const lastPage = data?.meta?.last_page ?? 1;
  const totalCount = data?.meta?.total ?? data?.total ?? payments.length;

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = [
    { key: "order_code", label: "Order Code" },
    { key: "midtrans_transaction_id", label: "Transaction ID" },
    { key: "payment_type", label: "Payment Type" },
    { key: "gross_amount", label: "Gross Amount" },
    { key: "transaction_status", label: "Transaction Status" },
    { key: "fraud_status", label: "Fraud Status" },
    { key: "paid_at", label: "Paid At" },
    { key: "cretime", label: "Created At" },
  ];

  const { activeColumns } = checkActiveColums(columns, visibleCols);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <Tabs defaultValue="payments" className="w-full">
      <div className="overflow-x-auto md:pe-8">
        <TabsContent value="payments" className=" mt-6 space-y-6">
          <FilterPayment />
          {/* FILTER AREA */}
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
            </div>
          </div>

          {/* TABLE */}
          <div className="relative w-full">
            <div className="overflow-x-auto w-full">
              <div className="relative w-full overflow-x-auto">
                <Table className="w-full min-w-max">
                  <TableHeader className="bg-muted sticky top-0 z-20">
                    <TableRow>
                      {columns.map(
                        (col) =>
                          visibleCols[col.key] && (
                            <TableHead
                              key={col.key}
                              className='whitespace-nowrap'
                            >
                              {col.label}
                            </TableHead>
                          )
                      )}
                    </TableRow>
                  </TableHeader>

                  {/* ================= LOADING ================= */}
                  {isLoading ? (
                    <TableSkeleton columns={activeColumns} />
                  ) : (
                    <TableBody>
                      {payments.length ? (
                        payments.map((payment) => (
                          <TableRow
                            key={payment.id}
                            onClick={() =>
                              router.push(
                                `/dashboard/Masters/orders/edit/${payment.order_id}`
                              )
                            }
                          >
                            {visibleCols.order_code && (
                                <TableCell>{payment?.order?.order_code ?? "-"}</TableCell>
                            )}
                            {visibleCols.midtrans_transaction_id && (
                                <TableCell>{payment?.midtrans_transaction_id ?? "-"}</TableCell>
                            )}
                            {visibleCols.payment_type && (
                                <TableCell>{payment?.payment_type ?? "-"}</TableCell>
                            )}
                            {visibleCols.gross_amount && (
                                <TableCell>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(payment.gross_amount)}</TableCell>
                            )}
                            {visibleCols.transaction_status && (
                                <TableCell><TransactionStatusBadge status={payment.transaction_status} /></TableCell>
                            )}
                             {visibleCols.fraud_status && (
                                <TableCell><FraudStatusBadge status={payment.fraud_status} /></TableCell>
                            )}
                            {visibleCols.paid_at && (
                              <TableCell>{payment.paid_at ? formatDate(payment.paid_at) : '-'}</TableCell>
                            )}
                            {visibleCols.cretime && (
                              <TableCell>
                                {formatDate(payment.cretime)}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={activeColumns.length}
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
              Showing {payments?.length} of {totalCount} row(s)
            </span>

            <div className="flex items-center gap-4">
              <Select onValueChange={(value) => setPaginate(Number(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder={paginate.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <IconChevronLeft />
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage(page + 1)}
              >
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= lastPage}
                onClick={() => setPage(lastPage)}
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
export default TablePayments;
