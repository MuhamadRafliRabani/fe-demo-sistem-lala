const { default: axiosInstance } = require("@/lib/axios");
const { toast } = require("sonner");

export const handleExport = async (filter) => {
  try {
    // Buat object parameter yang sudah dibersihkan (opsional: hilangkan yang kosong)
    const queryParams = {
      // Mapping start_date dan end_date menjadi from dan to sesuai API Anda
      from: filter.start_date || undefined,
      to: filter.end_date || undefined,

      // Parameter string
      name: filter.name || undefined,
      whatsapp_number: filter.whatsapp_number || undefined,
      modtime_start: filter.modtime_start || undefined,
      modtime_end: filter.modtime_end || undefined,
      sort: filter.sort || undefined,
      page: filter.page || undefined,

      // Parameter array (Digabung dengan koma jika ada isinya, misal: "status=hot,cold")
      status: filter.status?.length ? filter.status.join(",") : undefined,
      source: filter.source?.length ? filter.source.join(",") : undefined,
      request_type: filter.request_type?.length
        ? filter.request_type.join(",")
        : undefined,
      building_type: filter.building_type?.length
        ? filter.building_type.join(",")
        : undefined,
    };

    // Panggil Axios
    const promise = axiosInstance.get("/leads/export", {
      params: queryParams,
      responseType: "blob",
    });
    // const promise = axiosInstance.get(
    //   `/leads/export?from=${filter.start_date}&to=${filter.end_date}&name=${filter.name}&status=${filter.status}&source=${filter.source}&request_type`,
    //   { responseType: "blob" },
    // );

    toast.promise(promise, {
      loading: "Membuat file export...",
      success: "Export berhasil!",
      error: "Export gagal, coba lagi",
    });

    const res = await promise;

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "REPORT LEADS.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error(err);
  }
};

export const handleExportReport = async (filter) => {
  try {
    const promise = axiosInstance.get(
      `/leads/export/report-leads?from=${filter.start_date}&to=${filter.end_date}`,
      { responseType: "blob" },
    );

    toast.promise(promise, {
      loading: "Membuat file export data leads...",
      success: "Export berhasil!",
      error: "Export gagal, coba lagi",
    });

    const res = await promise;

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "REPORT LEADS.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error(err);
  }
};
