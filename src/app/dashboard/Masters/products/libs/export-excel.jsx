import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

export const handleExportProducts = async (filter) => {
  try {
    const params = {
      name: filter.name || undefined,
      sku: filter.sku || undefined,
      type: filter.type || undefined,
      category: filter.category || undefined,
      sub_category: filter.sub_category || undefined,
      brand: filter.brand || undefined,
      status: filter.status || undefined,
    };

    const promise = axiosInstance.get("/master/products/export", {
      params,
      responseType: "blob",
    });

    toast.promise(promise, {
      loading: "Membuat file export produk...",
      success: "Export berhasil!",
      error: "Export gagal, coba lagi",
    });

    const res = await promise;
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "PRODUCTS-LANGIT-LANGIT.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error(err);
  }
};
