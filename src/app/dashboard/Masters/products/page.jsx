"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { IconPlus, IconLayoutGrid, IconList } from "@tabler/icons-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Pagination } from "@/components/tables/data-table";
import ProductTable from "./components/product-table";
import ProductMarketplace from "./components/product-marketplace";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DownloadIcon } from "lucide-react";
import { handleExportProducts } from "./libs/export-excel";
import { usePost } from "@/hooks/use-api-mutation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Key filter yang BUKAN bagian dari "filter data" (tidak perlu reset halaman)
const PAGINATION_KEYS = ["page", "paginate"];

// Opsi page-size ramah grid marketplace (kelipatan 12)
const PRODUCT_PAGE_SIZE_OPTIONS = [12, 24, 36, 48];

const ProductPage = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'marketplace'

  // -----------------------------
  // STATE API & FILTERING
  // -----------------------------
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 12, // Marketplace needs grid friendly number
    name: "",
    type: "",
    sku: "",
    category: "",
    sort: "-id",
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
  // HANDLER PAGINATION (dipakai komponen <Pagination> milik DataTable)
  // -----------------------------
  const handlePageChange = useCallback((pageIndex) => {
    setFilter((prev) => ({ ...prev, page: pageIndex + 1 }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize) => {
    setFilter((prev) => ({ ...prev, paginate: pageSize, page: 1 }));
  }, []);

  // -----------------------------
  // FETCH API
  // -----------------------------
  const queryProduct = useMemo(
    () => ({
      fields:
        "id,name,sku,type,category,price,unit,status,image,link,description",
      include: "user",
      filter: {
        name: filter.name,
        type: filter.type,
        category: filter.category,
        sku: filter.sku,
      },
      sort: filter.sort,
      paginate: filter.paginate,
      page: filter.page,
    }),
    [filter],
  );

  const { data, isLoading, isFetching, refetch } = useApiFetch(
    ["products", queryProduct],
    "/master/products",
    queryProduct,
  );
  const { data: categoriesData } = useApiFetch(
    ["product-categories"],
    "/master/products/categories",
    {},
  );
  const categories = categoriesData?.data ?? [];

  // [PAGINATION FIX] Simpan hasil server terakhir yang valid.
  const serverPage = data?.data ?? null;
  const lastServerPageRef = useRef(null);
  if (serverPage) {
    lastServerPageRef.current = serverPage;
  }
  const pageData = serverPage ?? lastServerPageRef.current;

  const products = pageData?.data ?? [];
  const lastPage = Math.max(Number(pageData?.last_page) || 1, 1);
  const totalCount = Number(pageData?.total) || 0;

  // Skeleton hanya untuk load PERTAMA. Pindah halaman/filter cukup meredup.
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
  // IMPORT / EXPORT
  // -----------------------------
  const { mutateAsync: importProducts } = usePost("/master/products/import", {
    invalidate: [["products"]],
  });

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleSubmitImport = async () => {
    if (!importFile) return;
    const fd = new FormData();
    fd.append("file", importFile);
    try {
      await importProducts(fd);
      toast.success("Import berhasil");
      setIsImportOpen(false);
      setImportFile(null);
      refetch();
    } catch (err) {
      toast.error("Import gagal");
      console.error(err);
    }
  };

  const handleSubmitExport = async () => {
    await handleExportProducts(filter);
    setIsExportOpen(false);
  };

  // -----------------------------
  // RENDER UTAMA
  // -----------------------------
  return (
    <DashboardLayout
      title="Products"
      desc="Manage your construction & design products catalog."
    >
      <div className="flex flex-col space-y-4">
        {/* Actions & Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-col w-full md:w-auto md:gap-3">
            <Input
              placeholder="Search product..."
              value={filter.name}
              onChange={(e) =>
                handleFilterChange((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full md:w-64"
            />
            <Input
              placeholder="Search sku..."
              value={filter.sku}
              onChange={(e) =>
                handleFilterChange((prev) => ({ ...prev, sku: e.target.value }))
              }
              className="w-full md:w-64"
            />
            <Select
              value={filter.type}
              onValueChange={(val) =>
                handleFilterChange((prev) => ({
                  ...prev,
                  type: val === "all" ? "" : val,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Material">Material</SelectItem>
                <SelectItem value="Service">Service</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filter.category || ""}
              onValueChange={(val) =>
                handleFilterChange((prev) => ({
                  ...prev,
                  category: val === "all" ? "" : val,
                }))
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 items-center justify-between">
            <Tabs
              value={viewMode}
              onValueChange={setViewMode}
              className="w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">
                  <IconList className="w-4 h-4 mr-2" /> Table
                </TabsTrigger>
                <TabsTrigger value="marketplace">
                  <IconLayoutGrid className="w-4 h-4 mr-2" /> Marketplace
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsExportOpen(true)}>
                <DownloadIcon className="w-4 h-4 mr-2" /> Export Excel
              </Button>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <DownloadIcon className="w-4 h-4 mr-2" /> Import Excel
              </Button>
              <Button
                onClick={() =>
                  router.push("/dashboard/Masters/products/create")
                }
              >
                <IconPlus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>
          </div>

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Products</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>File (.xlsx, .xls, .csv)</Label>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button onClick={handleSubmitImport} disabled={!importFile}>
                    Import
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Products</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Nama: {filter.name || "-"}</div>
                  <div>SKU: {filter.sku || "-"}</div>
                  <div>Type: {filter.type || "-"}</div>
                  <div>Category: {filter.category || "-"}</div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsExportOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button onClick={handleSubmitExport}>Export</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content: ganti tampilan, pagination di bawah tetap sama */}
        <div
          className={cn(
            "min-h-[500px] transition-opacity duration-150",
            isPageFetching && "pointer-events-none opacity-60",
          )}
          aria-busy={isPageFetching || isInitialLoading}
        >
          {viewMode === "table" ? (
            <ProductTable
              data={products}
              isLoading={isInitialLoading}
              sorting={sortingState}
              onSortingChange={handleSortingChange}
              refetch={refetch}
            />
          ) : (
            <ProductMarketplace
              data={products}
              isLoading={isInitialLoading}
              refetch={refetch}
            />
          )}
        </div>

        {/* Pagination: komponen yang SAMA dengan DataTable, dipakai di kedua view */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Pagination
            pageIndex={Math.max((filter.page || 1) - 1, 0)}
            pageSize={filter.paginate}
            pageCount={lastPage}
            rowsOnPage={products.length}
            total={totalCount}
            label="products"
            pageSizeOptions={PRODUCT_PAGE_SIZE_OPTIONS}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductPage;
