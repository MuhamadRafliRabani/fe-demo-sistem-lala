// Nama File: UserColorBadge.jsx (diperbarui)

"use client";

import { Badge } from "@/components/ui/badge";
import React from "react";

// --- (DEFINISI ALL_USERS, COLOR_CLASSES_EXTENDED, dan colorCache DI ATAS DISINI) ---

// Map untuk menyimpan warna berdasarkan nama
const colorCache = new Map();

// Mengisi colorCache secara statis saat inisialisasi
// Ini menjamin urutan dan keunikan (1 warna per 1 nama)
const ALL_USERS = [
  "Deni",
  "Ikhsan",
  "Aida",
  "Rizki Apay",
  "Ami",
  "Indra",
  "Dita",
  "Yulia",
  "Putri",
  "Padma",
  "Lude",
  "Ayu",
  "Idris",
  "Diego",
  "Adli",
  "Rizki",
  "Rendy",
  "Rafly",
  "Salman",
];

// Daftar kelas warna yang diperluas (minimal 19 warna berbeda)
const COLOR_CLASSES_EXTENDED = [
  "bg-red-100 text-red-700 hover:bg-red-200 border-red-300",
  "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300",
  "bg-green-100 text-green-700 hover:bg-green-200 border-green-300",
  "bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-300",
  "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-300",
  "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300",
  "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-300",
  "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-300",
  "bg-lime-100 text-lime-700 hover:bg-lime-200 border-lime-300",
  "bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 border-fuchsia-300",
  "bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-300",
  "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300",
  "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300",
  "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300",
  "bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-300",
  "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300",
  "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300",
  "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300",
  "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-300",
];

// Inisialisasi cache
ALL_USERS.forEach((name, index) => {
  const colorClass =
    COLOR_CLASSES_EXTENDED[index % COLOR_CLASSES_EXTENDED.length];
  colorCache.set(name, colorClass);
});

/**
 * Mendapatkan kelas warna yang konsisten dari cache statis.
 * Jika nama baru muncul, akan menggunakan warna default.
 * @param {string} userName
 * @returns {string} Kelas CSS untuk warna badge
 */
const getConsistentColorClass = (userName) => {
  // Jika nama ada di cache (dari list ALL_USERS), gunakan warna unik yang sudah ditetapkan
  if (colorCache.has(userName)) {
    return colorCache.get(userName);
  }

  // Default/fallback jika nama tidak terdaftar di ALL_USERS
  return "bg-muted text-muted-foreground border-border";
};

/**
 * Komponen Badge untuk menampilkan nama pengguna dengan warna latar belakang unik.
 * @param {object} props
 * @param {string} props.userName Nama pengguna yang akan ditampilkan.
 * @returns {JSX.Element}
 */
export const UserColorBadge = ({ userName }) => {
  const colorClass = getConsistentColorClass(userName);

  return (
    <Badge
      variant="outline"
      className={`px-2 py-0.5 text-[13px] font-medium ${colorClass}`}
    >
      {userName}
    </Badge>
  );
};
