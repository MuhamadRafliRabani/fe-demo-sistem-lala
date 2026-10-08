"use client";

import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PaginationBar({
  total = 0,
  page = 1,
  perPage = 15,
  totalPages = 1,
  onPageChange,
  onPerPageChange,
  currentData,
  label = "Showing",
}) {
  // ------------------------------------------------------------------
  // 1. OPTIMISTIC & CACHING STATE (Anti Hilang saat Loading)
  // ------------------------------------------------------------------
  const [optimisticPage, setOptimisticPage] = React.useState(page);

  const [cachedTotal, setCachedTotal] = React.useState(total);
  const [cachedTotalPages, setCachedTotalPages] = React.useState(totalPages);
  const [cachedCurrentData, setCachedCurrentData] = React.useState(currentData);

  React.useEffect(() => {
    setOptimisticPage(page);
    if (total > 0 || (total === 0 && page === 1)) setCachedTotal(total);
    if (totalPages > 0 || (totalPages === 0 && page === 1))
      setCachedTotalPages(totalPages);
    if (
      currentData !== undefined &&
      (currentData > 0 || (currentData === 0 && page === 1))
    ) {
      setCachedCurrentData(currentData);
    }
  }, [page, total, totalPages, currentData]);

  const handlePageClick = (newPage) => {
    if (newPage === optimisticPage) return;
    setOptimisticPage(newPage);
    if (onPageChange) onPageChange(newPage);
  };

  // ------------------------------------------------------------------
  // 2. LOGIKA PAGINASI
  // ------------------------------------------------------------------
  const safeTotalPages = Math.max(cachedTotalPages, 1);
  const currentPage = Math.min(Math.max(optimisticPage, 1), safeTotalPages);

  const startItem = cachedTotal === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem =
    cachedCurrentData !== undefined
      ? startItem + cachedCurrentData - 1
      : Math.min(currentPage * perPage, cachedTotal);

  const siblingCount = 1;
  const maxVisible = siblingCount * 2 + 5;

  const getPages = () => {
    if (safeTotalPages <= maxVisible) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const left = Math.max(currentPage - siblingCount, 1);
    const right = Math.min(currentPage + siblingCount, safeTotalPages);

    if (left > 2) {
      pages.push(1);
      pages.push("dots-left");
    } else if (left === 2) {
      pages.push(1);
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < safeTotalPages - 1) {
      pages.push("dots-right");
      pages.push(safeTotalPages);
    } else if (right === safeTotalPages - 1) {
      pages.push(safeTotalPages);
    }

    return pages;
  };

  const pages = getPages();

  // ------------------------------------------------------------------
  // 3. ELEMEN UI (Dipecah agar mudah diatur layotnya untuk Mobile & Desktop)
  // ------------------------------------------------------------------
  const renderInfoText = (
    <div className="text-[13px] md:text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 transition-opacity duration-300 whitespace-nowrap">
      {cachedTotal > 0 ? (
        <>
          {label}
          <span className="text-zinc-900 dark:text-zinc-100 px-0.5 font-semibold">
            {startItem}-{endItem}
          </span>
          of
          <span className="text-zinc-900 dark:text-zinc-100 px-0.5 font-semibold">
            {cachedTotal}
          </span>
        </>
      ) : (
        "No results found"
      )}
    </div>
  );

  const renderPagination = (
    <Pagination className="mx-0 w-auto">
      {/* flex-nowrap agar angka tidak mematah ke bawah di mobile sempit */}
      <PaginationContent className="gap-0.5 sm:gap-1 flex-nowrap">
        {/* PREVIOUS BUTTON */}
        <PaginationItem>
          <button
            onClick={() => currentPage > 1 && handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center gap-1 sm:px-3 px-2 py-1.5 text-[13px] sm:text-sm font-medium transition-colors rounded-full",
              currentPage === 1
                ? "opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
        </PaginationItem>

        {/* PAGE NUMBERS */}
        {pages.map((item, index) =>
          typeof item === "string" ? (
            <PaginationItem key={`dots-${index}`}>
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm tracking-[0.2em]">
                ...
              </span>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <button
                onClick={() => handlePageClick(item)}
                className={cn(
                  "flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[13px] sm:text-sm font-semibold transition-all duration-200",
                  item === currentPage
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-md scale-105"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95",
                )}
              >
                {item}
              </button>
            </PaginationItem>
          ),
        )}

        {/* NEXT BUTTON */}
        <PaginationItem>
          <button
            onClick={() =>
              currentPage < safeTotalPages && handlePageClick(currentPage + 1)
            }
            disabled={currentPage === safeTotalPages || safeTotalPages === 0}
            className={cn(
              "flex items-center gap-1 sm:px-3 px-2 py-1.5 text-[13px] sm:text-sm font-medium transition-colors rounded-full",
              currentPage === safeTotalPages || safeTotalPages === 0
                ? "opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700",
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  const renderSelect = (
    <Select
      value={String(perPage)}
      onValueChange={(v) => {
        onPerPageChange(Number(v));
      }}
    >
      <SelectTrigger
        className={cn(
          "w-[70px] h-8 sm:h-9 rounded-full bg-zinc-100 dark:bg-zinc-800/50 border-transparent",
          "hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors",
          "focus:ring-0 focus:ring-offset-0 shadow-none",
          "text-[13px] sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl min-w-[5rem] overflow-hidden p-1 bg-white dark:bg-zinc-950"
        align="end"
      >
        {[10, 15, 20, 30, 50].map((n) => (
          <SelectItem
            key={n}
            value={String(n)}
            className="cursor-pointer text-[13px] sm:text-sm font-medium rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-900 focus:text-zinc-900 dark:focus:text-zinc-100 py-1.5 transition-colors"
          >
            {n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // ------------------------------------------------------------------
  // 4. MAIN RENDER LAYOUT
  // ------------------------------------------------------------------
  return (
    <div className="w-full py-4 select-none">
      {/* 💻 DESKTOP LAYOUT (Layar besar) */}
      <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between w-full gap-4">
        {renderInfoText}
        <div className="flex items-center gap-4">
          {renderPagination}
          {/* Garis pemisah vertical hanya ada di desktop */}
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
            {renderSelect}
          </div>
        </div>
      </div>

      {/* 📱 MOBILE LAYOUT (Layar kecil) */}
      <div className="flex flex-col gap-4 sm:hidden w-full">
        {/* Baris 1: Info di kiri, Select Paginasi di Kanan */}
        <div className="flex items-center justify-between w-full px-1">
          {renderInfoText}
          {renderSelect}
        </div>

        {/* Baris 2: Tombol Paginasi di Tengah */}
        {/* overflow-x-auto & no-scrollbar mengantisipasi jika HP layarnya sangat kecil (iPhone SE) */}
        <div className="flex justify-center w-full overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {renderPagination}
        </div>
      </div>
    </div>
  );
}
