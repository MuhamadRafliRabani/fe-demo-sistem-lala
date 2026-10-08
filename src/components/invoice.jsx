import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  CreditCard,
  Download,
  ExternalLink,
  HelpCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

/**
 * UTILS & CONSTANTS
 */
const API_BASE_URL = "http://localhost:8000";

const STATUS_MAP = {
  settlement: { label: "Lunas", color: "text-green-600 bg-green-50" },
  capture: { label: "Lunas", color: "text-green-600 bg-green-50" },
  pending: { label: "Menunggu", color: "text-amber-600 bg-amber-50" },
  deny: { label: "Ditolak", color: "text-red-600 bg-red-50" },
  cancel: { label: "Dibatalkan", color: "text-gray-600 bg-gray-50" },
  expire: { label: "Kadaluarsa", color: "text-gray-600 bg-gray-50" },
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
};

const Invoice = () => {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  // Get URL Params
  const queryParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const orderId = queryParams.get("order_id");
  const transactionStatus = queryParams.get("transaction_status");
  const action = queryParams.get("action");

  useEffect(() => {
    // Handle back action from URL
    if (action === "back") {
      window.history.back();
      return;
    }

    const fetchData = async () => {
      try {
        if (!orderId || !transactionStatus) {
          // Demo/Placeholder Delay for preview purposes if params are missing
          await new Promise((resolve) => setTimeout(resolve, 1500));
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/orders/callback?order_id=${orderId}&transaction_status=${transactionStatus}`,
        );

        if (!response.ok) throw new Error("Gagal mengambil data transaksi");

        const result = await response.json();

        if (result.status === "success") {
          setOrderData(result.data);
        } else {
          throw new Error(result.message || "Terjadi kesalahan pada data");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, transactionStatus, action]);

  const currentStatus = useMemo(() => {
    const status = orderData?.transaction_status || transactionStatus;
    return (
      STATUS_MAP[status] || {
        label: status || "Unknown",
        color: "text-gray-600 bg-gray-100",
      }
    );
  }, [orderData, transactionStatus]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleCheck {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-scale-check { animation: scaleCheck 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.3s; }
      `}</style>

      <main className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 opacity-0 animate-fade-in-up">
        {/* Header Section */}
        <header className="text-center pt-12 pb-6 px-8">
          <div className="relative mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <div className="absolute w-full h-full rounded-full border-4 border-green-100 animate-pulse"></div>
            <div className="opacity-0 animate-scale-check text-green-500">
              <Check className="w-12 h-12 stroke-[3px]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
            {error ? "Terjadi Kendala" : "Pembayaran Berhasil!"}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed px-4">
            {error ?
              "Kami kesulitan memuat detail transaksi Anda saat ini."
            : "Terima kasih atas pembayaran Anda. Konfirmasi telah dikirim ke email terdaftar."
            }
          </p>
        </header>

        {/* Receipt Card Section */}
        <section className="px-8 mb-8">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden">
            {loading ?
              <div className="animate-pulse space-y-5">
                <div className="flex justify-between items-center pb-5 border-b border-slate-200 border-dashed">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            : error ?
              <div className="text-center py-6">
                <p className="text-red-500 text-sm font-medium">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1 mx-auto hover:text-slate-900 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Coba Lagi
                </button>
              </div>
            : <div className="space-y-4 transition-all duration-500">
                <div className="flex justify-between items-center pb-5 border-b border-slate-200 border-dashed">
                  <span className="text-slate-500 text-sm">Total Bayar</span>
                  <span className="text-slate-900 font-extrabold text-2xl tracking-tighter">
                    {formatCurrency(orderData?.gross_amount)}
                  </span>
                </div>

                <div className="grid gap-3 pt-2">
                  <DetailRow
                    label="ID Referensi"
                    value={
                      orderData?.order_code?.split("-").slice(0, 3).join("-") ||
                      orderId ||
                      "-"
                    }
                    isMono
                  />
                  <DetailRow
                    label="Tanggal"
                    value={formatDate(orderData?.paid_at || new Date())}
                  />
                  <DetailRow
                    label="Metode"
                    value={
                      <span className="flex items-center gap-1.5 capitalize">
                        <CreditCard className="w-3.5 h-3.5" />
                        {(orderData?.payment_type || "-").replace(/_/g, " ")}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Status"
                    value={
                      <span
                        className={`${currentStatus.color} px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}
                      >
                        {currentStatus.label}
                      </span>
                    }
                  />
                </div>
              </div>
            }
          </div>
        </section>

        {/* Action Buttons */}
        <footer className="px-8 pb-10 space-y-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 shadow-xl shadow-green-500/25 flex items-center justify-center gap-2 group"
          >
            Kembali ke Beranda
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              onClick={() => console.log("Download Clicked")}
            >
              <Download className="w-4 h-4" /> Bukti
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              <HelpCircle className="w-4 h-4" /> Bantuan
            </button>
          </div>

          <p className="text-center pt-4">
            <a
              href="#"
              className="text-xs text-slate-400 hover:text-green-600 transition-colors"
            >
              Ada masalah dengan transaksi ini?{" "}
              <span className="underline font-medium">Hubungi Kami</span>
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

/**
 * Reusable Row Component for better readability
 */
const DetailRow = ({ label, value, isMono = false }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-400">{label}</span>
    <span
      className={`text-slate-700 font-semibold ${isMono ? "font-mono text-[13px]" : ""}`}
    >
      {value}
    </span>
  </div>
);

export default Invoice;
