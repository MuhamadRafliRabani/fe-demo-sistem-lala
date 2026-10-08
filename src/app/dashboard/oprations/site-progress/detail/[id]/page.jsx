"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Plus,
  FileText,
  Wallet,
  TrendingUp,
  CheckSquare,
  Package,
  RefreshCw,
  Layers,
  Clock,
  BarChart2,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatNumber } from "@/lib/construction-estimator-utils";
import { formatRupiah } from "@/lib/format-rupiah";
import { formatDate } from "@/lib/date-format";

// ─── Reusable UI Components ─────────────────────────────────────────────────

const MetricCard = ({ title, value, subtitle, icon, variant = "white" }) => {
  const styles = {
    black: "bg-[#0f0f11] text-white",
    yellow: "bg-[#fbb016] text-white",
    white: "bg-white text-gray-900 border border-gray-100",
  };

  const titleColors = {
    black: "text-gray-400",
    yellow: "text-yellow-100",
    white: "text-gray-400",
  };

  const subtitleColors = {
    black: "text-gray-400",
    yellow: "text-yellow-100",
    white: "text-gray-400",
  };

  return (
    <div
      className={`rounded-2xl p-5 shadow-sm relative overflow-hidden ${styles[variant]}`}
    >
      <p
        className={`text-[11px] uppercase font-bold tracking-wider mb-4 ${titleColors[variant]}`}
      >
        {title}
      </p>
      <h2 className="text-3xl font-extrabold mb-1">{value}</h2>
      <p className={`text-xs ${subtitleColors[variant]}`}>{subtitle}</p>
      <div className="absolute top-5 right-5 opacity-80">{icon}</div>
    </div>
  );
};

const MenuCard = ({ title, cat, icon, link }) => {
  const content = (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition group cursor-pointer h-full">
      <div className="flex items-center gap-4">
        {/* Ikon langsung tanpa background abu-abu, sesuai gambar */}
        <div className="p-1">{icon}</div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            {cat}
          </p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{title}</p>
        </div>
      </div>
      <ChevronRight
        size={18}
        className="text-gray-300 group-hover:text-gray-500 transition-colors"
      />
    </div>
  );

  return link ? (
    <Link href={link} className="block">
      {content}
    </Link>
  ) : (
    content
  );
};

const ProgressBar = ({
  percent,
  colorClass = "bg-yellow-500",
  trackClass = "bg-gray-700/50",
}) => (
  <div className={`w-full ${trackClass} rounded-full h-1.5`}>
    <div
      className={`${colorClass} h-1.5 rounded-full`}
      style={{ width: `${percent}%` }}
    />
  </div>
);

// ─── Main Page Component ────────────────────────────────────────────────────

const ProjectDetailPage = () => {
  const { id } = useParams();
  const projectId = id ? String(id) : null;

  const { data: overviewRes, refetch: refetchOverview } = useApiFetch(
    ["overview", projectId],
    `/site-progress/overview/${projectId}`,
  );

  // --- INFINITE SCROLL LOGIC ---

  const overview = overviewRes?.data;

  // Best Practice: Memoize menu items agar tidak di-recreate setiap render
  const menuItems = useMemo(
    () => [
      {
        cat: "Menu",
        title: "Input Pekerjaan",
        icon: <Plus className="text-indigo-600" size={24} strokeWidth={2.5} />,
        link: `/dashboard/oprations/site-progress/detail/${projectId}/list-input-pekerjaan`,
      },
      {
        cat: "Laporan",
        title: "Rekapitulasi RAB",
        icon: (
          <FileText className="text-rose-400" size={24} strokeWidth={2.5} />
        ),
        link: projectId
          ? `/dashboard/oprations/site-progress/detail/${projectId}/rekapitulasi-rab`
          : null,
      },
      {
        cat: "Laporan",
        title: "Keuangan",
        icon: <Wallet className="text-amber-500" size={24} strokeWidth={2.5} />,
        link: null,
      },
      {
        cat: "Progress",
        title: "Update Kurva S",
        icon: (
          <TrendingUp className="text-blue-400" size={24} strokeWidth={2.5} />
        ),
        link: null,
      },
      {
        cat: "Dokumen",
        title: "Invoice",
        icon: (
          <FileText className="text-gray-400" size={24} strokeWidth={2.5} />
        ),
        link: null,
      },
      {
        cat: "Lapangan",
        title: "Progress Harian",
        icon: (
          <CheckSquare
            className="text-emerald-500"
            size={24}
            strokeWidth={2.5}
          />
        ),
        link: `/dashboard/oprations/site-progress/detail/${projectId}/laporan-harian`,
      },
      {
        cat: "Material",
        title: "Logistik",
        icon: (
          <Package className="text-amber-700" size={24} strokeWidth={2.5} />
        ),
        link: null,
      },
      {
        cat: "Proyek",
        title: "Ganti Proyek",
        icon: (
          <RefreshCw className="text-orange-500" size={24} strokeWidth={2.5} />
        ),
        link: null,
      },
    ],
    [projectId],
  );

  const dataGet = overviewRes?.data ?? null;

  return (
    <DashboardLayout>
      <div className="min-h-screen  text-gray-800 font-sans ">
        <main className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Greeting */}
          <p className="text-gray-500 font-medium mb-3">
            Selamat Sore, User 👋
          </p>

          {/* 1. HERO SECTION (Dark Card) */}
          <div className="relative bg-[#0f0f11] rounded-3xl p-6 md:p-8 mb-6 overflow-hidden shadow-lg border border-gray-800">
            {/* Striped Background Effect */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)",
              }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
                  {overview?.detail_data_progress?.project_name || "-"}
                </h1>
                <p className="text-sm text-gray-400 flex items-center gap-2 font-medium">
                  <Clock size={16} /> Mulai:{" "}
                  {dataGet
                    ? formatDate(overview?.detail_data_progress?.cretime)
                    : "-"}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                  Total RAB (SIPIL + INTERIOR)
                </p>
                <p className="text-3xl font-black text-[#fbb016]">
                  {dataGet
                    ? formatRupiah(
                        Math.round(overview?.grand_total / 1000) * 1000,
                      )
                    : "0"}
                </p>
              </div>
            </div>

            {/* Progress Section inside Hero */}
            <div className="relative z-10">
              <div className="flex justify-between text-xs font-semibold mb-2.5">
                <span className="text-gray-400">Progress Realisasi</span>
                <span className="text-[#fbb016]">
                  {dataGet ? Math.round(overview?.actual_progress) : "0"}%
                </span>
              </div>
              <ProgressBar
                percent={dataGet ? Math.round(overview?.actual_progress) : 0}
                colorClass="bg-[#fbb016]"
                trackClass="bg-gray-800"
              />
              <p className="text-xs text-gray-500 mt-2.5 font-medium">
                Sudah dimulai (
                {dataGet ? Math.round(overview?.actual_progress) : "0"}%{" "}
                progress)
              </p>
            </div>
          </div>

          {/* 2. METRIC CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              variant="black"
              title="Item Pekerjaan"
              value={dataGet ? Math.round(overview?.work_total_items) : "0"}
              subtitle="Jenis pekerjaan"
              icon={<Layers className="text-gray-600" size={28} />}
            />
            <MetricCard
              variant="yellow"
              title="Hari Berjalan"
              value={
                dataGet ? Math.round(overview?.days_passed) + " Hari" : "0"
              }
              subtitle="Sejak mulai proyek"
              icon={<Clock className="text-yellow-600/50" size={28} />}
            />
            <MetricCard
              variant="white"
              title="TOTAL RAB (SIPIL)"
              value={
                dataGet
                  ? formatRupiah(
                      Math.round(overview?.total_rab_sipil / 1000) * 1000,
                    )
                  : "0"
              }
              subtitle="Estimasi total RAB (SIPIL)"
              icon={<BarChart2 className="text-blue-500" size={24} />}
            />
            <MetricCard
              variant="white"
              title="TOTAL RAB (INTERIOR)"
              value={
                dataGet
                  ? formatRupiah(
                      Math.round(overview?.total_rab_interior / 1000) * 1000,
                    )
                  : "0"
              }
              subtitle="Estimasi total RAB (INTERIOR)"
              icon={<Wallet className="text-emerald-500" size={24} />}
            />
          </div>

          {/* 3. ACTION MENU GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {menuItems.map((item, index) => (
              <MenuCard key={index} {...item} />
            ))}
          </div>

          {/* 4. BOTTOM CHARTS/LISTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi Anggaran */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">
                    Distribusi Anggaran
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    Breakdown per kategori pekerjaan
                  </p>
                </div>
                <BarChart2 className="text-gray-300" size={24} />
              </div>

              <div className="space-y-7">
                {/* Item 1 */}
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <span className="text-orange-500 text-lg leading-none">
                        🚧
                      </span>{" "}
                      Persiapan & Tanah
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-medium">
                        5 item
                      </span>
                      <span className="font-extrabold">Rp 5.5 Jt</span>
                    </div>
                  </div>
                  <ProgressBar
                    percent={21.5}
                    colorClass="bg-orange-400"
                    trackClass="bg-gray-100"
                  />
                  <div className="text-right text-[11px] text-gray-400 font-bold mt-1.5">
                    18.5%
                  </div>
                </div>

                {/* Item 2 */}
                <div>
                  <div className="flex justify-between text-sm mb-3">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <span className="text-blue-500 text-lg leading-none">
                        🏗️
                      </span>{" "}
                      Struktur Beton
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-medium">
                        5 item
                      </span>
                      <span className="font-extrabold">Rp 20.3 Jt</span>
                    </div>
                  </div>
                  <ProgressBar
                    percent={78.5}
                    colorClass="bg-blue-500"
                    trackClass="bg-gray-100"
                  />
                  <div className="text-right text-[11px] text-gray-400 font-bold mt-1.5">
                    78.5%
                  </div>
                </div>
              </div>
            </div>

            {/* Top 5 Biaya Pareto */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg">
                    Top 5 Biaya Pareto
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    Pengeluaran anggaran terbesar
                  </p>
                </div>
                <TrendingUp className="text-gray-300" size={24} />
              </div>

              <div className="space-y-5">
                {[
                  {
                    id: 1,
                    name: "Pondasi Batu Kali (AHSP SNI)",
                    price: "Rp 6.6 Jt",
                    percent: "22.1%",
                    width: "100%",
                  },
                  {
                    id: 2,
                    name: "Kolom K-225 (AHSP SNI)",
                    price: "Rp 4.6 Jt",
                    percent: "17.8%",
                    width: "70%",
                  },
                  {
                    id: 3,
                    name: "Ringbalk K-225 (AHSP SNI)",
                    price: "Rp 3.6 Jt",
                    percent: "13.9%",
                    width: "55%",
                  },
                  {
                    id: 4,
                    name: "Sloof K-225 (AHSP SNI)",
                    price: "Rp 3.3 Jt",
                    percent: "12.8%",
                    width: "50%",
                  },
                ].map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <div className="flex items-center gap-3">
                        <span className="bg-gray-50 text-gray-400 border border-gray-100 text-[11px] font-bold px-2 py-0.5 rounded-md">
                          {item.id}
                        </span>
                        <span className="font-bold text-gray-800">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-extrabold text-red-600">
                        {item.price}
                      </span>
                    </div>
                    <div className="flex justify-end text-[11px] text-gray-400 font-bold mb-1.5">
                      {item.percent}
                    </div>
                    <ProgressBar
                      percent={parseInt(item.width)}
                      colorClass="bg-red-500"
                      trackClass="bg-red-50"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
