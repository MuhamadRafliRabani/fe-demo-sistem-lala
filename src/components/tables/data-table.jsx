"use client";
// Nonaktifkan React Compiler untuk file ini. Objek `table` dari TanStack Table
// stabil referensinya (isinya berubah, referensinya tidak), sehingga hasil
// `table.getXxx()` bisa ikut ter-memoize dan basi kalau compiler aktif.
// Direktif ini tidak berefek apa-apa kalau compiler memang tidak dipakai.
"use no memo";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Search,
  Settings2,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ----------------------
// CONSTANTS (dibuat di luar komponen supaya referensinya stabil)
// ----------------------
const EMPTY_DATA = [];
const NO_PINNING = {};
const PINNED_LEFT = { left: ["actions"] };
const DESKTOP_QUERY = "(min-width: 768px)"; // sama dengan breakpoint `md` Tailwind
const HOVER_QUERY = "(hover: hover)"; // perangkat dengan mouse (bukan layar sentuh)
const DEFAULT_PAGINATION = { pageIndex: 0, pageSize: 15 };
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

// Kolom yang tampil di header card mobile, bukan di daftar isi
const CARD_HEADER_COLUMNS = ["name", "client_name", "status", "actions"];

// Kolom yang jadi "anchor" untuk rowIndicator (dot notifikasi dsb).
// Diletakkan menempel di dalam cell ini, bukan absolute ke seluruh row,
// supaya tidak merusak layout <tr>.
const INDICATOR_ANCHOR_COLUMN = "name";

// Elemen yang kalau diklik TIDAK boleh membuka/menutup baris
const INTERACTIVE_SELECTOR =
  "a,button,input,textarea,select,label,[role='button'],[role='combobox'],[role='menuitem'],[role='checkbox'],[data-no-row-click]";

// Format angka gaya Indonesia (2080 -> 2.080)
const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

// ----------------------
// HOOKS
// ----------------------
// Pakai nilai dari parent kalau ada (controlled), kalau tidak pakai state internal.
function useControllableState(controlled, onChange, initialValue) {
  const [internal, setInternal] = React.useState(initialValue);
  return [
    controlled !== undefined ? controlled : internal,
    onChange || setInternal,
  ];
}

function useMediaQuery(query, serverValue) {
  const subscribe = React.useCallback(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

// ----------------------
// HELPERS
// ----------------------
// Urutan label: columnDef.meta.label -> header string -> id kolom yang dirapikan
function getColumnLabel(column) {
  const { header, meta } = column.columnDef;
  if (meta?.label) return meta.label;
  if (typeof header === "string") return header;
  return column.id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Lebar kolom + style kolom yang di-pin (sticky). Dipakai header, body, dan skeleton.
function getColumnLayout(column, zIndex) {
  const side = column.getIsPinned();
  return {
    className: cn(
      side === "left" && "border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]",
      side === "right" && "border-l shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]",
    ),
    style: {
      width: column.getSize(),
      ...(side === "left" && {
        position: "sticky",
        left: column.getStart("left"),
        zIndex,
      }),
      ...(side === "right" && {
        position: "sticky",
        right: column.getAfter("right"),
        zIndex,
      }),
    },
  };
}

const renderCell = (cell) =>
  flexRender(cell.column.columnDef.cell, cell.getContext());

// Buka/tutup satu baris. singleExpand = gaya FAQ (hanya satu yang terbuka).
function toggleExpandedRow(table, row) {
  if (table.options.meta?.singleExpand) {
    table.setExpanded(row.getIsExpanded() ? {} : { [row.id]: true });
  } else {
    row.toggleExpanded();
  }
}

// Menentukan apakah klik memang "klik baris" (bukan klik tombol/link/select/drag).
// `start` = posisi mouse saat ditekan (opsional, untuk mendeteksi drag / blok teks).
function isPlainRowClick(e, start) {
  // Klik dari portal (menu, dialog, popover) ikut bubble di React tree -> abaikan
  if (!e.currentTarget.contains(e.target)) return false;

  const interactive = e.target.closest(INTERACTIVE_SELECTOR);
  if (interactive && e.currentTarget.contains(interactive)) return false;

  // Double/triple click = user sedang memilih teks -> jangan toggle lagi
  if (e.detail > 1) return false;

  // Mouse digeser saat klik (drag / blok teks) -> bukan klik
  if (
    start &&
    (Math.abs(e.clientX - start.x) > 5 || Math.abs(e.clientY - start.y) > 5)
  ) {
    return false;
  }

  return true;
}

function handleRowClick({
  event,
  row,
  table,
  onRowClick,
  expandOnRowClick,
  pointerStart,
}) {
  if (!isPlainRowClick(event, pointerStart)) return;

  if (expandOnRowClick) {
    toggleExpandedRow(table, row);
  }

  onRowClick?.(row);
}

// ----------------------
// KOLOM ACTIONS + CARET
// Ikon menu (⋮) berubah jadi caret saat baris di-hover.
// Arahkan mouse langsung ke kolom action -> ⋮ muncul lagi supaya menu bisa dipakai.
// ----------------------
function ActionCellWithCaret({ ctx, baseCell }) {
  const { row, table } = ctx;
  const [isCellHovered, setIsCellHovered] = React.useState(false);
  const expanded = row.getIsExpanded();
  const content = flexRender(baseCell, ctx);

  // Layar sentuh / mobile: tidak ada hover, tampilkan menu biasa
  if (!table.options.meta?.showCaret) return content;

  return (
    <div
      className="relative flex size-8 items-center justify-center"
      onMouseEnter={() => setIsCellHovered(true)}
      onMouseLeave={() => setIsCellHovered(false)}
    >
      {/* Menu asli (⋮): tersembunyi saat row di-hover atau terbuka, kecuali mouse tepat di kolom ini */}
      <div
        className={cn(
          "transition-opacity duration-150",
          isCellHovered
            ? "opacity-100"
            : expanded
              ? "opacity-0"
              : "group-hover:opacity-0",
        )}
      >
        {content}
      </div>

      {/* Caret: penanda baris bisa dibuka; berputar ke bawah saat terbuka */}
      <ChevronRight
        aria-hidden
        className={cn(
          "pointer-events-none absolute size-4 text-muted-foreground transition-all duration-200",
          expanded && "rotate-90",
          isCellHovered
            ? "opacity-0"
            : expanded
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100",
        )}
      />
    </div>
  );
}

// Tombol buka/tutup untuk card mobile (tidak ada hover di layar sentuh)
function MobileExpandToggle({ row, table }) {
  const expanded = row.getIsExpanded();
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-label={expanded ? "Tutup detail" : "Buka detail"}
      onClick={() => toggleExpandedRow(table, row)}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <ChevronRight
        className={cn(
          "size-4 transition-transform duration-200",
          expanded && "rotate-90",
        )}
      />
    </button>
  );
}

// ----------------------
// SUB COMPONENTS
// ----------------------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
      <Inbox className="size-6 opacity-50" />
      <p>Tidak ada data yang ditemukan.</p>
    </div>
  );
}

function Toolbar({
  table,
  enableSearch,
  enableColumnVisibility,
  value,
  onChange,
}) {
  if (!enableSearch && !enableColumnVisibility) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {enableSearch && (
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari data..."
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-full pl-9"
          />
        </div>
      )}

      {enableColumnVisibility && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full sm:ml-auto sm:w-auto"
            >
              <Settings2 className="size-4 text-muted-foreground" />
              View Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[400px] w-52 overflow-y-auto"
          >
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="cursor-pointer"
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  // menu tetap terbuka supaya bisa toggle beberapa kolom sekaligus
                  onSelect={(e) => e.preventDefault()}
                >
                  {getColumnLabel(column)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function DesktopTable({
  table,
  isLoading,
  enableColumnResizing,
  expandable,
  onRowClick = null,
  expandOnRowClick,
  renderSubComponent,
  rowIndicator,
}) {
  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length;
  // Posisi mouse saat ditekan, untuk membedakan klik biasa vs drag/blok teks
  const pointerStart = React.useRef(null);

  return (
    // container-type: agar panel expand bisa selebar area yang terlihat (100cqw)
    <div
      className="overflow-hidden rounded-xl border bg-card shadow-sm"
      style={{ containerType: "inline-size" }}
    >
      <ScrollArea className="w-full">
        <Table
          className="w-full text-sm tabular-nums"
          style={{
            minWidth: enableColumnResizing
              ? table.getCenterTotalSize()
              : undefined,
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const layout = getColumnLayout(header.column, 30);
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "relative h-11 select-none whitespace-nowrap bg-muted px-4 text-xs font-medium text-muted-foreground",
                        layout.className,
                      )}
                      style={layout.style}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}

                      {/* Handle untuk melebarkan kolom (aktif kalau enableColumnResizing) */}
                      {!header.isPlaceholder &&
                        header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none hover:bg-primary/40",
                              header.column.getIsResizing() && "bg-primary",
                            )}
                          />
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIndex) => {
                return (
                  <TableRow
                    key={rowIndex}
                    onClick={
                      typeof onRowClick === "function"
                        ? (event) => onRowClick(event, null)
                        : undefined
                    }
                    className="hover:bg-transparent overflow-hidden"
                  >
                    {table.getVisibleLeafColumns().map((column) => {
                      const layout = getColumnLayout(column, 20);
                      return (
                        <TableCell
                          key={column.id}
                          className={cn(
                            "px-4 py-4 overflow-hidden",
                            column.getIsPinned() && "bg-card",
                            layout.className,
                          )}
                          style={layout.style}
                        >
                          <div className="h-4 w-4/5 animate-pulse overflow-hidden rounded bg-muted" />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : rows.length ? (
              rows.map((row) => {
                const isExpanded = expandable && row.getIsExpanded();
                // rowIndicator sekarang dirender MENEMPEL DI DALAM cell
                // INDICATOR_ANCHOR_COLUMN (default: "name" / Client Name),
                // bukan absolute ke seluruh <tr> — itu yang bikin row rusak sebelumnya.
                const indicator = rowIndicator ? rowIndicator({ row }) : null;
                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      data-expanded={isExpanded ? "true" : undefined}
                      onMouseDown={(e) => {
                        if (expandOnRowClick || onRowClick) {
                          pointerStart.current = {
                            x: e.clientX,
                            y: e.clientY,
                          };
                        }
                      }}
                      onClick={(e) => {
                        if (!onRowClick && !expandOnRowClick) return;
                        handleRowClick({
                          event: e,
                          row,
                          table,
                          onRowClick,
                          expandOnRowClick,
                          pointerStart: pointerStart.current,
                        });
                      }}
                      className={cn(
                        "group hover:bg-transparent data-[state=selected]:bg-transparent",
                        (expandOnRowClick || onRowClick) && "cursor-pointer",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const layout = getColumnLayout(cell.column, 20);
                        const isIndicatorAnchor =
                          cell.column.id === INDICATOR_ANCHOR_COLUMN;
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "relative whitespace-nowrap px-4 py-3 text-foreground/90 transition-colors group-hover:bg-muted/40 group-data-[expanded=true]:bg-muted/30 group-data-[state=selected]:bg-muted/60",
                              cell.column.getIsPinned() && "bg-card",
                              isIndicatorAnchor && indicator && "pl-6",
                              layout.className,
                            )}
                            style={layout.style}
                          >
                            {isIndicatorAnchor && indicator && (
                              <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2">
                                {indicator}
                              </span>
                            )}
                            {renderCell(cell)}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {isExpanded && renderSubComponent && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columnCount}
                          className="border-b bg-muted/20 p-0"
                        >
                          {/* sticky + 100cqw: panel selalu selebar area yang terlihat,
                              walau tabelnya sangat lebar dan bisa di-scroll horizontal */}
                          <div
                            className="animate-in fade-in slide-in-from-top-1 sticky left-0 duration-200"
                            style={{ width: "100cqw" }}
                          >
                            {renderSubComponent({ row })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="p-0">
                  <EmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function MobileCard({
  table,
  row,
  expandable,
  expandOnRowClick,
  onRowClick,
  renderSubComponent,
  rowIndicator,
}) {
  const cells = row.getVisibleCells();
  const statusCell = cells.find((c) => c.column.id === "status");
  const actionCell = cells.find((c) => c.column.id === "actions");
  const fieldCells = cells.filter(
    (c) => !CARD_HEADER_COLUMNS.includes(c.column.id),
  );
  const title = row.getValue("name") || row.original.client?.name || "Client";
  const isExpanded = expandable && row.getIsExpanded();
  const indicator = rowIndicator ? rowIndicator({ row }) : null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header: dot (kalau ada) + nama, status, aksi, dan tombol buka/tutup selalu terlihat tanpa scroll */}
      <div
        onClick={(e) => {
          if (!onRowClick && !expandOnRowClick) return;
          handleRowClick({
            event: e,
            row,
            table,
            onRowClick,
            expandOnRowClick,
            pointerStart: null,
          });
        }}
        className={cn(
          "flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3",
          (expandOnRowClick || onRowClick) && "cursor-pointer",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {indicator}
          <p className="min-w-0 truncate text-sm font-semibold">{title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {statusCell && renderCell(statusCell)}
          {actionCell && renderCell(actionCell)}
          {expandOnRowClick && <MobileExpandToggle row={row} table={table} />}
        </div>
      </div>

      {/* Isi: label di kiri, nilai di kanan */}
      <dl className="divide-y px-4">
        {fieldCells.map((cell) => (
          <div
            key={cell.id}
            className="flex items-start justify-between gap-4 py-2.5"
          >
            <dt className="w-2/5 shrink-0 text-xs text-muted-foreground">
              {getColumnLabel(cell.column)}
            </dt>
            {/* [&_p] : teks panjang (alamat/notes) boleh wrap, tidak terpotong */}
            <dd className="flex w-3/5 min-w-0 justify-end text-right text-sm [&_p]:max-w-full [&_p]:min-w-0">
              {renderCell(cell)}
            </dd>
          </div>
        ))}
      </dl>

      {isExpanded && renderSubComponent && (
        <div className="animate-in fade-in border-t bg-muted/20 duration-200">
          {renderSubComponent({ row })}
        </div>
      )}
    </div>
  );
}

function MobileCards({ table, isLoading, ...cardProps }) {
  const rows = table.getRowModel().rows;

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl border bg-card"
          >
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between gap-4">
                  <div className="h-3 w-1/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border bg-card">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <MobileCard key={row.id} table={table} row={row} {...cardProps} />
      ))}
    </div>
  );
}

function PageButton({ label, className, ...props }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("size-8", className)}
      aria-label={label}
      {...props}
    />
  );
}

// Select page-size. MURNI berbasis props (tidak membaca objek `table`).
function PageSizeSelect({ pageSize, options, onChange }) {
  // Pastikan nilai yang sedang aktif selalu ada di daftar opsi,
  // supaya Select tidak tampil kosong kalau pageSize di luar default.
  const safeOptions = options.includes(pageSize)
    ? options
    : [...options, pageSize].sort((a, b) => a - b);

  return (
    <Select
      value={String(pageSize)}
      onValueChange={(value) => onChange(Number(value))}
    >
      <SelectTrigger
        className="h-8 w-[112px] text-xs"
        aria-label="Jumlah data per halaman"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {safeOptions.map((opt) => (
          <SelectItem key={opt} value={String(opt)} className="text-xs">
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Pagination MURNI berbasis props. Semua angka (halaman, total, jumlah baris)
// dihitung di DataTable dari state/props, bukan dibaca dari objek `table`,
// jadi selalu sinkron dengan data server dan tidak bisa basi.
export function Pagination({
  pageIndex,
  pageSize,
  pageCount,
  rowsOnPage,
  total,
  label = "data",
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}) {
  // Rentang data yang sedang tampil, contoh: "16–30 dari 2.080"
  const from = rowsOnPage === 0 ? 0 : pageIndex * pageSize + 1;
  const to = rowsOnPage === 0 ? 0 : pageIndex * pageSize + rowsOnPage;

  const hasPrevious = pageIndex > 0;
  const hasNext = pageIndex + 1 < pageCount;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t bg-card px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground" aria-live="polite">
          Menampilkan{" "}
          <span className="font-medium text-foreground">
            {formatNumber(from)}–{formatNumber(to)}
          </span>{" "}
          dari{" "}
          <span className="font-medium text-foreground">
            {formatNumber(total)}
          </span>{" "}
          {label}
        </span>
        <PageSizeSelect
          pageSize={pageSize}
          options={pageSizeOptions}
          onChange={onPageSizeChange}
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          Halaman{" "}
          <span className="font-medium text-foreground">
            {formatNumber(pageIndex + 1)}
          </span>{" "}
          dari {formatNumber(pageCount)}
        </span>
        <div className="flex items-center gap-1">
          <PageButton
            label="Halaman pertama"
            className="hidden lg:inline-flex"
            onClick={() => onPageChange(0)}
            disabled={!hasPrevious}
          >
            <ChevronsLeft className="size-4" />
          </PageButton>
          <PageButton
            label="Halaman sebelumnya"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="size-4" />
          </PageButton>
          <PageButton
            label="Halaman berikutnya"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={!hasNext}
          >
            <ChevronRight className="size-4" />
          </PageButton>
          <PageButton
            label="Halaman terakhir"
            className="hidden lg:inline-flex"
            onClick={() => onPageChange(pageCount - 1)}
            disabled={!hasNext}
          >
            <ChevronsRight className="size-4" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

// ----------------------
// MAIN COMPONENT
// ----------------------
export function DataTable({
  columns,
  data,
  // isLoading = load PERTAMA (belum ada data sama sekali) -> tampil skeleton.
  isLoading = false,
  // isFetching = sedang ambil data baru (ganti halaman/filter) sementara data
  // lama masih tampil -> tabel diredupkan, bukan diganti skeleton.
  isFetching = false,
  onRowClick = null,
  // --- 1. FITUR UMUM ---
  enableSearch = false,
  enableColumnVisibility = true,
  enableSorting = true,
  enablePagination = false,

  // --- 2. FITUR ADVANCED ---
  enableRowSelection = false,
  enableRowExpansion = false,
  enableGrouping = false,
  enableColumnResizing = false,
  enablePinning = true,

  // --- 3. SERVER-SIDE / MANUAL CONTROL ---
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
  pageCount,
  totalCount, // total data asli dari server (untuk label "X dari Y") saat manualPagination
  paginationLabel = "data",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,

  // --- 4. CONTROLLED STATES ---
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  rowSelection,
  onRowSelectionChange,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,

  // --- 5. RENDERER TAMBAHAN ---
  renderSubComponent,
  rowIndicator = null,

  // --- 6. EXPAND ON ROW CLICK ---
  expandOnRowClick = false,
  singleExpand = false,
}) {
  const [currentSorting, setSorting] = useControllableState(
    sorting,
    onSortingChange,
    [],
  );
  const [currentVisibility, setVisibility] = useControllableState(
    columnVisibility,
    onColumnVisibilityChange,
    {},
  );
  const [currentSelection, setSelection] = useControllableState(
    rowSelection,
    onRowSelectionChange,
    {},
  );
  const [currentGlobalFilter, setGlobalFilter] = useControllableState(
    globalFilter,
    onGlobalFilterChange,
    "",
  );
  const [currentPagination, setPagination] = useControllableState(
    pagination,
    onPaginationChange,
    DEFAULT_PAGINATION,
  );

  const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
  const canHover = useMediaQuery(HOVER_QUERY, true);
  const expandable = enableRowExpansion || expandOnRowClick;

  // Bungkus kolom "actions" supaya ikonnya bisa berubah jadi caret (tanpa kolom baru)
  const tableColumns = React.useMemo(() => {
    if (!expandOnRowClick) return columns;
    return columns.map((column) =>
      column.id === "actions"
        ? {
            ...column,
            cell: (ctx) => (
              <ActionCellWithCaret ctx={ctx} baseCell={column.cell} />
            ),
          }
        : column,
    );
  }, [expandOnRowClick, columns]);

  const table = useReactTable({
    data: data ?? EMPTY_DATA,
    columns: tableColumns,
    state: {
      sorting: currentSorting,
      columnVisibility: currentVisibility,
      rowSelection: currentSelection,
      globalFilter: currentGlobalFilter,
      columnPinning: enablePinning ? PINNED_LEFT : NO_PINNING,
      pagination: currentPagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setVisibility,
    onRowSelectionChange: setSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    meta: {
      singleExpand,
      showCaret: expandOnRowClick && isDesktop && canHover,
    },

    // Saat expandOnRowClick: pakai id data sebagai id baris dan jangan auto-tutup
    // waktu data di-refetch, supaya baris yang sedang dibaca tidak mendadak menutup.
    getRowId: expandOnRowClick
      ? (row, index) => String(row.id ?? index)
      : undefined,
    autoResetExpanded: expandOnRowClick ? false : undefined,
    // WAJIB dimatikan untuk server-side (manual) pagination: default tanstack
    // adalah `true`, artinya setiap kali `data` berganti referensi (misal
    // setelah refetch atau update baris apa pun), halaman otomatis di-reset
    // ke 0 tanpa diminta. Itu bikin page/pageSize kelihatan "nyangkut" /
    // ke-reset sendiri secara tidak terduga.
    autoResetPageIndex: false,

    manualPagination,
    manualSorting,
    manualFiltering,
    // Jangan pernah 0 / NaN / undefined saat server-side pagination
    pageCount: manualPagination
      ? Math.max(Number(pageCount) || 1, 1)
      : undefined,
    enableRowSelection,
    enableColumnResizing,
    columnResizeMode: "onChange",

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel:
      enableSorting && !manualSorting ? getSortedRowModel() : undefined,
    getPaginationRowModel:
      enablePagination && !manualPagination
        ? getPaginationRowModel()
        : undefined,
    getExpandedRowModel: expandable ? getExpandedRowModel() : undefined,
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
  });

  // ----------------------
  // PAGINATION: semua angka dihitung dari props/state, BUKAN dari objek `table`
  // ----------------------
  const safePageSize = Math.max(
    Number(currentPagination?.pageSize) || DEFAULT_PAGINATION.pageSize,
    1,
  );
  const safePageIndex = Math.max(Number(currentPagination?.pageIndex) || 0, 0);

  // Total seluruh data (semua halaman)
  const totalRows = manualPagination
    ? Math.max(Number(totalCount ?? data?.length ?? 0) || 0, 0)
    : table.getFilteredRowModel().rows.length;

  // Jumlah halaman
  const resolvedPageCount = manualPagination
    ? Math.max(Number(pageCount) || 1, 1)
    : Math.max(Math.ceil(totalRows / safePageSize), 1);

  // Jumlah baris yang sedang tampil di halaman ini
  const rowsOnPage = manualPagination
    ? (data?.length ?? 0)
    : Math.max(
        Math.min(safePageSize, totalRows - safePageIndex * safePageSize),
        0,
      );

  const handlePageChange = (nextIndex) => {
    const clamped = Math.min(
      Math.max(Number(nextIndex) || 0, 0),
      resolvedPageCount - 1,
    );
    setPagination((prev) => ({
      pageIndex: clamped,
      pageSize: Number(prev?.pageSize) || safePageSize,
    }));
  };

  const handlePageSizeChange = (nextSize) => {
    const size = Math.max(Number(nextSize) || DEFAULT_PAGINATION.pageSize, 1);
    // Ganti ukuran halaman -> selalu kembali ke halaman pertama
    setPagination({ pageIndex: 0, pageSize: size });
  };

  const expandProps = {
    expandable,
    expandOnRowClick,
    onRowClick,
    renderSubComponent,
    rowIndicator,
  };

  return (
    <div className="w-full space-y-4">
      <Toolbar
        table={table}
        enableSearch={enableSearch}
        enableColumnVisibility={enableColumnVisibility}
        value={currentGlobalFilter}
        onChange={setGlobalFilter}
      />

      <div
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
        aria-busy={isFetching || isLoading}
      >
        {/* Saat pindah halaman/filter: data lama tetap tampil tapi diredupkan */}
        <div
          className={cn(
            "transition-opacity duration-150",
            isFetching && "pointer-events-none opacity-60",
          )}
        >
          {isDesktop ? (
            <DesktopTable
              table={table}
              isLoading={isLoading}
              enableColumnResizing={enableColumnResizing}
              onRowClick={onRowClick}
              {...expandProps}
            />
          ) : (
            <MobileCards table={table} isLoading={isLoading} {...expandProps} />
          )}
        </div>

        {enablePagination && (
          <Pagination
            pageIndex={safePageIndex}
            pageSize={safePageSize}
            pageCount={resolvedPageCount}
            rowsOnPage={rowsOnPage}
            total={totalRows}
            label={paginationLabel}
            pageSizeOptions={pageSizeOptions}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {enableRowSelection && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {table.getFilteredSelectedRowModel().rows.length}
          </span>{" "}
          dari {table.getFilteredRowModel().rows.length} baris dipilih.
        </div>
      )}
    </div>
  );
}
