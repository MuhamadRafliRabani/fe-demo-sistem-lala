"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Lightbulb,
  Pickaxe,
  DoorOpen,
  Zap,
  Hammer,
  Shovel,
  Building2,
  PencilRuler,
  Wrench,
  House,
  Shell,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";

import DashboardLayout from "@/components/layouts/dashboard-layout";
import { cn } from "@/lib/utils";
import { useApiFetch } from "@/hooks/use-api-fetch";

export const attachmentSectionMap = {
  // ── I · PERSIAPAN ────────────────────────────────────────────────────────
  I: {
    icon: Hammer,
    bg: "bg-stone-100",
    color: "text-stone-700",
    desc: "Mobilisasi, persiapan lahan, direksi keet, dan pekerjaan awal proyek.",
  },

  // ── II · SISTEM MANAJEMEN DAN KESELAMATAN KERJA (SMKK) ──────────────────
  II: {
    icon: ShieldCheck,
    bg: "bg-green-50",
    color: "text-green-600",
    desc: "Rencana K3, APD, rambu keselamatan, dan manajemen keselamatan kerja.",
  },

  // ── III · PEKERJAAN PEMBONGKARAN ─────────────────────────────────────────
  III: {
    icon: Pickaxe,
    bg: "bg-red-50",
    color: "text-red-600",
    desc: "Pembongkaran existing, pembersihan area, dan pembuangan material puing.",
  },

  // ── IV · PEKERJAAN TANAH ─────────────────────────────────────────────────
  IV: {
    icon: Shovel,
    bg: "bg-amber-50",
    color: "text-amber-600",
    desc: "Galian tanah, urug, pemadatan, dan pekerjaan pondasi dasar.",
  },

  // ── V · PEKERJAAN STRUKTUR ───────────────────────────────────────────────
  V: {
    icon: Building2,
    bg: "bg-blue-50",
    color: "text-blue-600",
    desc: "Kolom, balok, sloof, plat lantai, dan struktur utama bangunan.",
  },

  // ── VI · PEKERJAAN ARSITEKTUR ────────────────────────────────────────────
  VI: {
    icon: PencilRuler,
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    desc: "Dinding, finishing, plafond, lantai, dan elemen arsitektural.",
  },

  // ── VII · PEKERJAAN PLAMBING DAN SANITER ────────────────────────────────
  VII: {
    icon: Shell,
    bg: "bg-cyan-50",
    color: "text-cyan-600",
    desc: "Instalasi air bersih, air kotor, sanitair, dan plumbing.",
  },

  // ── VIII · PEKERJAAN MEKANIKAL DAN ELEKTRIKAL ───────────────────────────
  VIII: {
    icon: Zap,
    bg: "bg-yellow-50",
    color: "text-yellow-600",
    desc: "Kelistrikan, panel, lampu, AC, dan sistem mekanikal bangunan.",
  },

  // ── IX · PEKERJAAN PINTU DAN JENDELA ────────────────────────────────────
  IX: {
    icon: DoorOpen,
    bg: "bg-orange-50",
    color: "text-orange-600",
    desc: "Pintu, jendela, kusen aluminium, kaca, dan aksesoris.",
  },

  // ── X · PEKERJAAN LAS ───────────────────────────────────────────────────
  X: {
    icon: Wrench,
    bg: "bg-rose-50",
    color: "text-rose-600",
    desc: "Pekerjaan besi, kanopi, railing, dan fabrikasi pengelasan.",
  },

  // ── XI · PEKERJAAN ATAP ─────────────────────────────────────────────────
  XI: {
    icon: House,
    bg: "bg-indigo-50",
    color: "text-indigo-600",
    desc: "Rangka atap, penutup atap, talang, dan aksesoris roofing.",
  },

  // ── Fallback ─────────────────────────────────────────────────────────────
  default: {
    icon: FolderKanban,
    bg: "bg-slate-100",
    color: "text-slate-600",
    desc: "Kategori pekerjaan proyek.",
  },
};

// ─── Komponen UI Reusable ──────────────────────────────────────────────────

// 1. Banner Panduan
const GuideBanner = () => (
  <div className="bg-[#f4f7fc] border border-[#e2e8f0] rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start gap-4">
    <div className="bg-white p-3 rounded-full shadow-sm shrink-0">
      <Lightbulb className="w-6 h-6 text-blue-500" strokeWidth={2} />
    </div>
    <div>
      <h3 className="font-bold text-slate-800 text-sm mb-1.5">
        Panduan Penggunaan Singkat
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">
        <span className="font-semibold text-blue-600">1.</span> Pilih jenis
        pekerjaan (misal: Persiapan) &rarr;{" "}
        <span className="font-semibold text-blue-600">2.</span> Masukkan volume
        / ukuran dari gambar kerja &rarr;{" "}
        <span className="font-semibold text-blue-600">3.</span> Sistem otomatis
        menghitung harga berdasarkan AHSP & menyimpannya ke{" "}
        <span className="font-bold text-slate-800">RAB Induk</span>.
      </p>
    </div>
  </div>
);

// 2. Card Kategori Pekerjaan
const CategoryCard = ({ item, projectId }) => {
  const Icon = item.icon;
  // Sesuaikan link ini dengan struktur routing Next.js Anda
  const href = projectId
    ? `/dashboard/oprations/site-progress/detail/${projectId}/list-input-pekerjaan/${item.id}/input-pekerjaan/`
    : "#";

  return (
    <Link
      href={href}
      className="bg-white rounded-[1.25rem] p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200 flex flex-col items-center text-center group"
    >
      <div
        className={cn(
          "w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105",
          item.bg,
          item.color,
        )}
      >
        <Icon className="w-8 h-8" strokeWidth={2} />
      </div>
      <h4 className="font-bold text-slate-800 text-[15px] mb-1">{item.name}</h4>
      <p className="text-xs text-slate-500 leading-relaxed px-2">{item.desc}</p>
    </Link>
  );
};

// 3. Komponen Skeleton Loading
const CategoryCardSkeleton = () => (
  <div className="bg-white rounded-[1.25rem] p-6 border border-slate-100 shadow-sm flex flex-col items-center text-center">
    <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-slate-200 mb-5 animate-pulse" />
    <div className="h-4 w-3/4 bg-slate-200 rounded mb-3 animate-pulse" />
    <div className="h-3 w-full bg-slate-200 rounded mb-1.5 animate-pulse" />
    <div className="h-3 w-5/6 bg-slate-200 rounded animate-pulse" />
  </div>
);

// ─── Halaman Utama ────────────────────────────────────────────────────────

export default function InputPekerjaanPage() {
  const params = useParams();
  const projectId = params?.id ? String(params.id) : null;

  const {
    data: sectionsRes,
    refetch: refetchSections,
    isLoading,
  } = useApiFetch(["sections"], `/master/ahsp/sections`);

  // --- INFINITE SCROLL LOGIC ---

  const sections = sectionsRes?.data;

  const sectionItems = useMemo(
    () =>
      sections?.map((item) => ({
        id: item.id,
        name: item.nama,
        desc:
          attachmentSectionMap[item.kode]?.desc ??
          attachmentSectionMap["default"].desc,
        icon:
          attachmentSectionMap[item.kode]?.icon ??
          attachmentSectionMap["default"].icon,
        bg:
          attachmentSectionMap[item.kode]?.bg ??
          attachmentSectionMap["default"].bg,
        color:
          attachmentSectionMap[item.kode]?.color ??
          attachmentSectionMap["default"].color,
      })) || [],
    [sections],
  );

  return (
    <DashboardLayout title="Input Pekerjaan RAB" desc="Kategori Pekerjaan">
      <div className="w-full rounded-xl shadow-sm  p-8 md:p-10 min-h-[80vh]">
        {/* Header Teks */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-slate-600 font-medium">
            Pilih kategori pekerjaan di bawah untuk mulai menghitung estimasi
            biaya RAB.
          </p>
        </div>

        {/* Komponen Banner Panduan */}
        <GuideBanner />

        {/* Grid Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <CategoryCardSkeleton key={`skeleton-${index}`} />
              ))
            : sectionItems.map((item) => (
                <CategoryCard key={item.id} item={item} projectId={projectId} />
              ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
