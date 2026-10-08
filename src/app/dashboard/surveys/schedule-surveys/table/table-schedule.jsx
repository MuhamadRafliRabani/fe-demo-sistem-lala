"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useApiFetch } from "@/hooks/use-api-fetch";
import {
  ArrowDownUp,
  ArrowUpDown,
  DownloadIcon,
  PieChart as PieChartIcon,
  Calendar,
  MessageCircle,
  Activity,
  CreditCard,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  Wallet,
  XCircle,
  Ban,
  AlertCircle,
  Newspaper,
  Banknote,
  MapPin,
  StickyNote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-format";
import { useDateRange } from "@/lib/date-range";
import { formatDateDb } from "@/lib/date-format-db";
import { toast } from "sonner";
import { useAuthStore } from "@/hooks/auth-store";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import FilterScheduleSurvey from "../filters/filter-schedule-surveys";
import { UserColorBadge } from "@/lib/user-badge";
import { calculateCountdownStatus } from "@/lib/countdown-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRemove, usePost, usePut } from "@/hooks/use-api-mutation";
import EditScheduleSheet from "../activity/[id]/components/edit-schedule-sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPlus } from "@tabler/icons-react";
import axiosInstance from "@/lib/axios";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import generateInvoice from "../libs/generate-invoice-survey";
import { generateQuitansiSurvey } from "../libs/generate-quitansi-survey";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";

// --- HELPERS ---
const buildWhatsAppScheduleMessage = (schedule) => {
  const clientName = schedule?.client?.name || "-";
  const email = schedule?.client?.email || "-";
  const phone = schedule?.client?.phone || "-";
  const address = schedule?.address || "-";
  const linkAddress = schedule?.link_address || "-";
  const noteSurvey = schedule?.note_survey || "-";

  let tanggalSurvei = "-";
  let jamSurvei = "-";

  if (schedule?.date) {
    const dateObj = new Date(schedule.date);
    if (!Number.isNaN(dateObj.getTime())) {
      tanggalSurvei = dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = dateObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      jamSurvei = timeStr.replace(":", ".");
    }
  }

  return (
    `Nama : ${clientName}\n` +
    `Alamat : ${address}\n` +
    `Email : ${email}\n` +
    `No Hp : ${phone}\n` +
    `Tanggal survei : ${tanggalSurvei}\n` +
    `Jam survei : ${jamSurvei}\n\n` +
    `Sharelok alamat : ${linkAddress}\n\n` +
    `Note Renovasi :\n${noteSurvey}`
  );
};

// Format angka jadi "Rp 500.000". Dipakai kolom Order.
function formatRupiah(value) {
  if (value === null || value === undefined || value === "") return "-";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

function getPaymentUrlFromResponse(response) {
  if (!response) return null;

  const candidates = [
    response.payment_url,
    response.redirect_url,
    response.url,
    response.data?.payment_url,
    response.data?.redirect_url,
    response.data?.url,
    response.data?.data?.payment_url,
    response.data?.data?.redirect_url,
  ];

  return candidates.find((value) => typeof value === "string" && value.trim());
}

function openPaymentLinkSafely(url) {
  if (!url) {
    toast.error("Link pembayaran tidak tersedia");
    return false;
  }

  try {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (popup) {
      popup.opener = null;
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    window.location.href = url;
    return true;
  }
}

const ANALYTICS_COLORS = [
  "#135a86",
  "#fed818",
  "#1e6fa8",
  "#2d8ec4",
  "#10b981",
  "#f97316",
];

// Key filter yang BUKAN bagian dari "filter data" (tidak perlu reset halaman)
const PAGINATION_KEYS = ["page", "paginate"];

// Dipertahankan (dan tetap di-export) karena kemungkinan dipakai di tempat lain
// (invoice, halaman detail order, dst). Kolom "Payment Status" sendiri di tabel
// ini sudah digabung ke dalam status gabungan (lihat scheduleStatusConfig).
const paymentStatusConfig = {
  paid: {
    label: "Paid",
    style: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: CheckCircle2,
  },
  waiting_payment: {
    label: "Waiting Payment",
    style: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Wallet,
  },
  pending: {
    label: "Pending",
    style: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: Clock,
  },
  failed: {
    label: "Failed",
    style: "bg-rose-50 text-rose-700 border-rose-200",
    Icon: XCircle,
  },
  canceled: {
    label: "Canceled",
    style: "bg-slate-50 text-slate-600 border-slate-200",
    Icon: Ban,
  },
};

export const PaymentStatusBadge = ({ status }) => {
  // Fallback jika status tidak dikenali atau null
  const config = paymentStatusConfig[status] || {
    label: status || "Unknown",
    style: "bg-gray-50 text-gray-600 border-gray-200",
    Icon: AlertCircle,
  };

  const { Icon, label, style } = config;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
  );
};

// --- STATUS GABUNGAN (Payment + Status jadwal jadi satu badge) ---
// Urutan pengecekan (dari yang paling menentukan):
// 1. Belum bayar            -> "Menunggu Pembayaran"
// 2. Sudah bayar, sedang di lokasi/dalam window survey -> "Sedang Berlangsung"
// 3. Sudah bayar, sudah ditandai selesai   -> "Selesai"
// 4. Sudah bayar, belum waktunya           -> "Akan Datang"
const scheduleStatusConfig = {
  process: {
    label: "Menunggu Pembayaran...",
    description: "Menunggu pembayaran dari client",
    style:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/25",
    Icon: Spinner,
  },
  upcoming: {
    label: "Akan Datang",
    description: "Sudah dibayar, menunggu jadwal survey",
    style:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25",
    Icon: Calendar,
  },
  ongoing: {
    label: "Sedang Berlangsung",
    description: "Survey sedang berjalan",
    style:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25",
    Icon: Activity,
  },
  done: {
    label: "Selesai",
    description: "Survey sudah selesai",
    style:
      "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/25",
    Icon: CheckCircle2,
  },
};

function getScheduleStatusKey(schedule) {
  const isPaid = schedule?.order?.status === "paid";
  if (!isPaid) return "process";

  const countdown = calculateCountdownStatus(schedule?.survey_event);
  if (countdown?.isActive) return "ongoing";

  const rawStatus = (schedule?.status || "").toLowerCase();
  if (rawStatus.includes("selesai")) return "done";

  return "upcoming";
}

const ScheduleStatusBadge = ({ schedule }) => {
  const key = getScheduleStatusKey(schedule);
  const { label, description, style, Icon } = scheduleStatusConfig[key];

  return (
    <div
      title={description}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {key === "ongoing" ? (
        // Titik "live" berdenyut biar kelihatan aktif sekarang juga, bukan cuma teks statis
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      <span>{label}</span>
    </div>
  );
};

// --- ANALYTICS COMPONENT ---
const SurveyAnalyticsView = ({ filter }) => {
  const filterParams = {};
  if (filter.status && filter.status.length > 0) {
    filterParams.status = filter.status.join(",");
  }
  if (filter.surveyors && filter.surveyors.length > 0) {
    filterParams.surveyors = filter.surveyors.join(",");
  }
  if (filter.start_date) filterParams.start_date = filter.start_date;
  if (filter.end_date) filterParams.end_date = filter.end_date;

  const { data, isLoading } = useApiFetch(
    ["schedules-analytics-leads-month", filter],
    "/schedules/analytics/leads-by-month",
    { filter: filterParams },
  );

  const chartData = useMemo(() => {
    const rawItems = data?.data ?? [];
    return rawItems
      .map((item) => ({
        name: item.label,
        value: Number(item.count ?? 0),
      }))
      .filter((item) => item.name && item.value > 0);
  }, [data]);

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData],
  );

  if (isLoading)
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Mengambil data analitik...
      </div>
    );
  if (chartData.length === 0)
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Belum ada data untuk periode ini.
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="h-64 w-full md:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={ANALYTICS_COLORS[index % ANALYTICS_COLORS.length]}
                />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {chartData.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor:
                    ANALYTICS_COLORS[index % ANALYTICS_COLORS.length],
                }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-bold">
              {item.value} ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN TABLE COMPONENT ---
const TableSchedule = () => {
  const router = useRouter();
  const { start, end } = useDateRange("next_30_days");
  const { user } = useAuthStore();
  const canExport = Number(user?.role_id) === 1;

  // State Management
  // [PAGINATION] `paginate` (per halaman) sekarang digabung ke dalam filter,
  // sama seperti TableLead, supaya satu sumber kebenaran untuk page & paginate.
  const [filter, setFilter] = useState({
    page: 1,
    paginate: 15,
    name: "",
    start_date: formatDateDb(start),
    end_date: formatDateDb(end),
    status: [],
    surveyors: [],
    sort: "-date",
  });

  // Modal States
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [designOrderOpen, setDesignOrderOpen] = useState(false);
  const [UpdatePaymentOpen, setUpdatePaymentOpen] = useState(false);
  const [selectedScheduleForDesign, setSelectedScheduleForDesign] =
    useState(null);
  const [designPrice, setDesignPrice] = useState("");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  // Tambahkan di bawah state modal yang lain
  const [selectedScheduleForPayment, setSelectedScheduleForPayment] =
    useState(null);
  const isMobile = useIsMobile();

  // [PAGINATION] Setiap filter data berubah (nama, status, surveyor, tanggal)
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

  // Mutations
  const { mutate: deleteSchedule, isPending: isDeleting } = useRemove(
    (payload) => `/schedules/${payload.id}`,
    { invalidate: [["schedules"]] },
  );
  const { mutate: createDesignOrder, isPending: isCreatingDesignOrder } =
    usePost("/orders/design");
  const {
    mutateAsync: regeneratePaymentLink,
    isPending: isRegeneratingPaymentLink,
  } = usePost("/orders/regenerate-payment");

  const { mutate: updatePayment, isPending: isUpdatingPayment } = usePut(
    (payload) => `/orders/update-order/${payload.id}`,
    { invalidate: [["schedules"]] },
  );

  // Fetch Data
  // [PAGINATION] deps dibuat spesifik (bukan seluruh `filter`) supaya params
  // tidak dihitung ulang setiap kali cuma page/paginate yang berubah.
  const filterParams = useMemo(() => {
    const p = {};
    if (filter.name) p["client.name"] = filter.name;
    if (filter.status?.length) p.status = filter.status.join(",");
    if (filter.surveyors?.length) p.surveyors = filter.surveyors.join(",");
    if (filter.start_date) p.start_date = filter.start_date;
    if (filter.end_date) p.end_date = filter.end_date;
    return p;
  }, [
    filter.name,
    filter.status,
    filter.surveyors,
    filter.start_date,
    filter.end_date,
  ]);

  const query = {
    fields:
      "id,date,status,address,client_id,link_address,note_survey,order_id,cretime,modtime",
    include:
      "client,surveyors,surveyEvent,lead,order,order.payment,estimateDesign",
    filter: filterParams,
    sort: filter.sort,
    paginate: filter.paginate,
    page: filter.page,
  };

  const { data, isLoading, isFetching, refetch } = useApiFetch(
    ["schedules", query],
    "/schedules",
    query,
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

  const schedules = pageData?.data ?? [];
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

  // Filter untuk analitik: tanpa page/paginate, supaya chart tidak
  // di-fetch ulang setiap kali pindah halaman.
  const analyticsFilter = useMemo(
    () => ({
      status: filter.status,
      surveyors: filter.surveyors,
      start_date: filter.start_date,
      end_date: filter.end_date,
    }),
    [filter.status, filter.surveyors, filter.start_date, filter.end_date],
  );

  // -----------------------------
  // ADAPTER UNTUK TANSTACK TABLE
  // -----------------------------
  const sortingState = useMemo(
    () => [
      {
        id: filter.sort.replace("-", ""),
        desc: filter.sort.startsWith("-"),
      },
    ],
    [filter.sort],
  );

  // Ganti sorting -> kembali ke halaman 1
  const handleSortingChange = (updaterOrValue) => {
    const sorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sortingState)
        : updaterOrValue;

    if (!sorting?.length) return;

    const { id, desc } = sorting[0];
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

      // Tidak ada perubahan -> jangan bikin re-render / refetch sia-sia
      if (nextPage === prev.page && nextPageSize === prev.paginate) {
        return prev;
      }

      return { ...prev, page: nextPage, paginate: nextPageSize };
    });
  }, []);

  // Handlers
  const handleDelete = () => {
    if (!deleteId) return;
    deleteSchedule(
      { id: deleteId },
      {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
          toast.success("Jadwal berhasil dihapus");
        },
        onError: () => toast.error("Gagal menghapus jadwal"),
      },
    );
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(filterParams);
      const res = await axiosInstance.get(
        `/schedules/export?${params.toString()}`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `JADWAL_SURVEY_${new Date().getTime()}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export berhasil");
    } catch (err) {
      toast.error("Export gagal");
    }
  };

  const handleCreateDesignOrder = () => {
    if (!selectedScheduleForDesign?.estimate_design?.total_amount)
      return toast.error("Masukkan harga design");
    createDesignOrder(
      {
        survey_id: selectedScheduleForDesign?.id,
        price: selectedScheduleForDesign?.estimate_design?.total_amount,
      },
      {
        onSuccess: (res) => {
          setDesignOrderOpen(false);
          setDesignPrice("");
          const url = getPaymentUrlFromResponse(res);
          if (url) {
            openPaymentLinkSafely(url);
          }
          toast.success("Order design berhasil dibuat");
        },
        onError: (err) =>
          toast.error(
            err.response?.data?.message || "Gagal membuat order design",
          ),
      },
    );
  };

  const handleGeneratePaymentLink = useCallback(
    async (schedule) => {
      if (!schedule?.order?.id) {
        toast.error("Data order tidak ditemukan untuk jadwal ini");
        return;
      }

      try {
        const res = await regeneratePaymentLink({
          order_id: schedule.order.id,
        });
        const url = getPaymentUrlFromResponse(res);

        if (url) {
          openPaymentLinkSafely(url);
          toast.success("Link pembayaran berhasil dibuat ulang");
        } else {
          toast.error("Link pembayaran tidak tersedia untuk order ini");
        }
      } catch (err) {
        const message =
          err?.response?.data?.message || "Gagal membuat ulang link pembayaran";
        toast.error(message);
      }
    },
    [regeneratePaymentLink],
  );

  const handlePaymentUpdate = (schedule) => {
    // Validasi jaga-jaga jika order id tidak ada
    if (!schedule?.order?.id) {
      toast.error("Data order tidak ditemukan untuk jadwal ini");
      return;
    }

    updatePayment(
      {
        id: schedule.order.id,
        status: "paid",
        payment_status: "paid",
        payment_type: "bank_transfer",
        transaction_status: "settlement",
      },
      {
        onSuccess: (res) => {
          toast.success("Payment berhasil diupdate");
          // Tutup modal dan reset state setelah sukses
          setUpdatePaymentOpen(false);
          setSelectedScheduleForPayment(null);
        },
        onError: (err) =>
          toast.error(
            err.response?.data?.message || "Gagal mengupdate payment",
          ),
      },
    );
  };

  // Column Definitions
  const columns = useMemo(
    () => [
      {
        id: "actions",
        header: "Action",
        enablePinning: true,
        size: 80,
        cell: ({ row }) => {
          const item = row.original;
          const countdown = calculateCountdownStatus(item.survey_event);
          if (countdown.isActive) {
            return (
              <Badge
                variant="outline"
                className="text-xs text-emerald-500 border-emerald-500"
              >
                Aktif
              </Badge>
            );
          }

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isMobile ? "end" : "right"}>
                {row.original.order?.status === "paid" ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/dashboard/surveys/schedule-surveys/activity/${item.id}`,
                        );
                      }}
                    >
                      <Activity className="size-3 mr-2" /> Activity
                    </DropdownMenuItem>

                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Newspaper className="size-3 mr-2" /> Dokumen
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            generateQuitansiSurvey(item);
                          }}
                        >
                          <CreditCard className="size-3 mr-2" /> Download
                          Kuitansi
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://wa.me/?text=${encodeURIComponent(buildWhatsAppScheduleMessage(item))}`,
                              "_blank",
                            );
                          }}
                        >
                          <MessageCircle className="size-3 mr-2" /> Export WA
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedScheduleForDesign(item);
                        setDesignOrderOpen(true);
                      }}
                    >
                      <CreditCard className="size-3 mr-2" /> Order Design
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGeneratePaymentLink(row.original);
                      }}
                    >
                      <Banknote className="size-3 mr-2" /> Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedScheduleForPayment(row.original);
                        setUpdatePaymentOpen(true);
                      }}
                    >
                      <Banknote className="size-3 mr-2" /> Update Payment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        generateInvoice(row.original);
                      }}
                    >
                      <Newspaper className="size-3 mr-2" /> Generate Invoice
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(item.id);
                  }}
                >
                  <Trash2 className="size-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent flex gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal{" "}
            {column.getIsSorted() === "desc" ? (
              <ArrowDownUp size={14} />
            ) : (
              <ArrowUpDown size={14} />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="whitespace-nowrap">
            {formatDate(row.getValue("date"), true)}
          </div>
        ),
      },
      {
        // Nama client + no HP-nya sekalian, biar gak perlu buka detail cuma buat
        // liat kontaknya.
        accessorKey: "client.name",
        header: "Client",
        cell: ({ row }) => {
          const client = row.original.client;
          return (
            <div>
              <div className="font-medium">{client?.name || "-"}</div>
              {client?.phone && (
                <div className="text-xs text-muted-foreground">
                  {client.phone}
                </div>
              )}
            </div>
          );
        },
      },
      {
        // Info harga survey + kode order-nya. Sebelumnya data ini sama sekali
        // gak ditampilkan padahal ada, jadi harus buka detail cuma buat tau harga.
        accessorKey: "order.amount",
        header: "Order",
        cell: ({ row }) => {
          const order = row.original.order;
          if (!order) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }
          return (
            <div className="whitespace-nowrap text-sm">
              <div className="font-medium">{formatRupiah(order.amount)}</div>
              <div className="text-xs text-muted-foreground">
                {order.order_code}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "surveyors",
        header: "Surveyor",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.surveyors
              ? row.original.surveyors?.map((s) => (
                  <UserColorBadge key={s.id} userName={s.name} />
                ))
              : "-"}
          </div>
        ),
      },
      {
        // Alamat + link maps digabung jadi satu: klik alamatnya langsung
        // buka link maps-nya (kalau ada), jadi gak perlu dua kolom terpisah lagi.
        accessorKey: "address",
        header: "Alamat",
        size: 300,
        cell: ({ row }) => {
          const address = row.getValue("address") || "-";
          const mapLink = row.original.link_address;

          const content = (
            <>
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground group-hover:text-blue-600" />
              <span className="text-wrap">{address}</span>
            </>
          );

          if (!mapLink) {
            return (
              <div className="flex min-w-[280px] max-w-[280px] items-start gap-1.5 text-sm text-muted-foreground">
                {content}
              </div>
            );
          }

          return (
            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="group flex min-w-[280px] max-w-[280px] items-start gap-1.5 text-sm hover:text-blue-600 hover:underline underline-offset-2"
            >
              {content}
            </a>
          );
        },
      },
      {
        // Payment status + status jadwal digabung jadi satu badge yang
        // langsung nunjukin tahap sebenarnya lead ini ada di mana.
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ScheduleStatusBadge schedule={row.original} />,
      },
      {
        // Catatan survey, dipotong + tooltip biar gak bikin baris melebar,
        // tapi tetap kebaca kalau memang penting buat surveyor.
        accessorKey: "note_survey",
        header: "Catatan",
        size: 220,
        cell: ({ row }) => {
          const note = row.getValue("note_survey");
          if (!note) {
            return <span className="text-sm text-muted-foreground">-</span>;
          }
          return (
            <p
              title={note}
              className="flex max-w-[220px] items-start gap-1.5 truncate text-sm text-muted-foreground"
            >
              <StickyNote className="mt-0.5 size-3.5 shrink-0" />
              <span className="truncate">{note}</span>
            </p>
          );
        },
      },
      {
        accessorKey: "cretime",
        header: "Created Time",
        cell: ({ row }) => {
          return formatDate(row.original.cretime, true);
        },
      },
    ],
    [router, handleGeneratePaymentLink],
  );

  return (
    <Tabs defaultValue="list" className="mt-6 space-y-6 w-full">
      <div className="overflow-x-auto md:pe-8">
        <TabsContent value="list" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-accent" size={20} />
            <h2 className="text-lg font-semibold">
              Daftar Jadwal Survey ({totalCount})
            </h2>
          </div>

          {/* [PAGINATION] pakai handleFilterChange agar page reset ke 1 */}
          <FilterScheduleSurvey
            filter={filter}
            setFilter={handleFilterChange}
          />

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* {canExport && (
              <Button variant="outline" onClick={handleExport}>
                <DownloadIcon className="size-4 mr-2" /> Export Excel
              </Button>
            )} */}
            <Button variant="outline" onClick={() => setAnalyticsOpen(true)}>
              <PieChartIcon className="size-4 mr-2" /> Analitik
            </Button>
            {/* <Button
              className="flex gap-2"
              onClick={() =>
                router.push("/dashboard/surveys/schedule-surveys/create")
              }
            >
              <IconPlus size={16} /> Add Schedule
            </Button> */}
          </div>

          <DataTable
            columns={columns}
            data={schedules}
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
            paginationLabel="survey"
          />
        </TabsContent>
      </div>

      {/* --- MODALS & SHEETS --- */}
      <EditScheduleSheet
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        scheduleId={editingScheduleId}
        onSuccess={refetch}
      />

      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Analitik Jadwal Survey</DialogTitle>
            <DialogDescription>
              Distribusi jadwal berdasarkan bulan asal lead.
            </DialogDescription>
          </DialogHeader>
          <SurveyAnalyticsView filter={analyticsFilter} />
        </DialogContent>
      </Dialog>

      <Dialog open={UpdatePaymentOpen} onOpenChange={setUpdatePaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
            <DialogDescription>
              Update status pembayaran hanya untuk client yang sudah bayar.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="w-full md:w-1/2"
              onClick={() => {
                setUpdatePaymentOpen(false);
                setSelectedScheduleForPayment(null);
              }}
            >
              Tutup
            </Button>

            <Button
              className="w-full md:w-1/2"
              // Panggil fungsinya dan lempar datanya ke sini
              onClick={() => handlePaymentUpdate(selectedScheduleForPayment)}
              disabled={isUpdatingPayment} // Disable tombol saat loading
            >
              {/* Gunakan state loading yang benar: isUpdatingPayment */}
              {isUpdatingPayment ? "Memproses..." : "Update Pembayaran"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={designOrderOpen} onOpenChange={setDesignOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Order Design</DialogTitle>
            <DialogDescription>
              Masukkan harga design untuk client ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Harga Design (Rp)</Label>
              <Input
                type="number"
                placeholder="Contoh: 5000000"
                value={
                  selectedScheduleForDesign?.estimate_design?.total_amount || ""
                }
                onChange={(e) =>
                  setDesignPrice(
                    selectedScheduleForDesign?.estimate_design?.total_amount,
                  )
                }
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateDesignOrder}
              disabled={isCreatingDesignOrder}
            >
              {isCreatingDesignOrder ? "Memproses..." : "Buat Order & Bayar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Jadwal survey akan dihapus
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
};

export default TableSchedule;
