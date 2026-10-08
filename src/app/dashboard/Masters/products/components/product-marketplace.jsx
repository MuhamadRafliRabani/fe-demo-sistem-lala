"use client";

import React, { useState, useEffect } from "react";
import {
  PackageSearch,
  Image as ImageIcon,
  ExternalLink,
  Edit2,
  Trash2,
  Tag,
  Box,
  Fingerprint,
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- UTILS ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

// --- KOMPONEN UTAMA ---
const ProductMarketplace = ({ data, isLoading, refetch }) => {
  const router = useRouter();
  // Mock router actions
  const handleEdit = (e, id) => {
    e.stopPropagation();
    router.push(`/dashboard/masters/products/${id}/edit`);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      router.push(`/dashboard/masters/products/${id}/delete`);
    }
  };

  const handleViewProduct = (e, link) => {
    e.stopPropagation();
    if (link) window.open(link, "_blank");
  };

  // 1. STATE LOADING YANG ELEGAN
  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-card/50 rounded-md p-4 border border-border/40 shadow-sm animate-pulse"
          >
            <div className="w-full aspect-[4/3] bg-muted/60 rounded-md mb-4" />
            <div className="space-y-3 px-2">
              <div className="h-4 w-1/3 bg-muted/60 rounded-full" />
              <div className="h-6 w-3/4 bg-muted/60 rounded-lg" />
              <div className="h-4 w-full bg-muted/60 rounded-md" />
              <div className="h-8 w-1/2 bg-muted/60 rounded-lg mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. STATE KOSONG MODERN
  if (!data || data.length === 0) {
    return (
      <div className="relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] text-center border border-dashed border-border/60 rounded-md bg-muted/10 group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50 dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
        <div className="relative z-10 w-20 h-20 bg-background rounded-3xl flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border/50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
          <PackageSearch className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="relative z-10 text-2xl font-black text-foreground tracking-tight">
          Katalog Kosong
        </h3>
        <p className="relative z-10 text-sm text-muted-foreground max-w-[300px] mt-2 leading-relaxed">
          Belum ada produk yang ditambahkan. Mulai tambahkan produk pertama Anda
          untuk melihatnya di sini.
        </p>
      </div>
    );
  }

  // 3. DESAIN CARD TERBAIK (Elevated Layered Design)
  return (
    <>
      {/* Definisi Keyframes untuk animasi ekstra mulus */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shine {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { left: 200%; opacity: 0; }
        }
        .animate-shine:hover::after {
          content: "";
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-20deg);
          animation: shine 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          pointer-events: none;
        }
        /* Custom scrollbar for description */
        .desc-scroll::-webkit-scrollbar { width: 4px; }
        .desc-scroll::-webkit-scrollbar-track { background: transparent; }
        .desc-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `,
        }}
      />

      {/* Grid menggunakan auto-fill minmax() agar sangat aman meski sidebar ditarik / kontainer mengecil */}
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {data.map((product) => (
          <div
            key={product.id}
            className="group relative flex flex-col bg-background rounded-md p-2 border border-border/50 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 overflow-hidden animate-shine cursor-pointer min-w-full"
            onClick={(e) => handleViewProduct(e, product.link)}
          >
            {/* --- BAGIAN GAMBAR (Layer 1) --- */}
            <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-muted/30">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-1"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground/50">
                  <ImageIcon className="w-12 h-12 mb-2" strokeWidth={1} />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    No Image
                  </span>
                </div>
              )}

              {/* Overlay Gradien Halus saat Hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Status Badge (Kiri Atas) */}
              <div className="absolute top-3 left-3 z-10">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md border ${
                    product.status
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.status ? "bg-emerald-500" : "bg-destructive"}`}
                  ></span>
                  {product.status ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              {/* Category Badge (Kanan Atas) */}
              {product.category && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-background/80 text-accent backdrop-blur-md border border-border/50 shadow-sm">
                    {product.category}
                  </span>
                </div>
              )}

              {/* --- FLOATING ACTIONS (Muncul di tengah gambar saat hover) --- */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-3 px-4 z-20 pointer-events-none group-hover:pointer-events-auto">
                <button
                  onClick={(e) => handleEdit(e, product.id)}
                  className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-75 w-10 h-10 rounded-full bg-background/90 text-blue-600 flex items-center justify-center shadow-lg backdrop-blur-md hover:bg-blue-50 hover:scale-110"
                  title="Edit Produk"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleViewProduct(e, product.link)}
                  className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-primary/30 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!product.link}
                  title="Lihat Halaman"
                >
                  <ExternalLink className="w-5 h-5 ml-0.5" />
                </button>

                <button
                  onClick={(e) => handleDelete(e, product.id)}
                  className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-150 w-10 h-10 rounded-full bg-background/90 text-red-500 flex items-center justify-center shadow-lg backdrop-blur-md hover:bg-red-50 hover:scale-110"
                  title="Hapus Produk"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* --- BAGIAN KONTEN (Layer 2) --- */}
            <div className="relative flex flex-col px-4 pt-5 pb-4 flex-grow z-10">
              {/* Type & SKU (Subtle Info) */}
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  <Box className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                  {product.type || "Produk"}
                </span>
                {product.sku && (
                  <span className="flex items-center text-[10px] text-accent font-mono bg-muted/50 px-2 py-0.5 rounded-md">
                    <Fingerprint className="w-3 h-3 mr-1 opacity-50" />
                    {product.sku}
                  </span>
                )}
              </div>
              {/* Title */}
              <h3 className="text-lg font-bold text-foreground leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                {product.name}
              </h3>
              {/* Description Area (Selalu Terbuka) */}
              <p className="desc-scroll text-sm text-muted-foreground mt-3 max-h-16 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {product.description || "Tidak ada deskripsi tersedia."}
              </p>
              <div className="flex-grow" /> {/* Spacer */}
              {/* Price & Unit (Footer) */}
              <div className="flex items-end justify-between mt-4 pt-4 border-t border-border/40">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground mb-0.5">
                    Harga
                  </span>
                  <div className="flex items-baseline gap-1">
                    {/* Warna harga diset menggunakan text-accent */}
                    <span className="text-xl sm:text-2xl font-black text-accent tracking-tight">
                      {formatCurrency(product.price)}
                    </span>
                    {product.unit && (
                      <span className="text-sm font-semibold text-muted-foreground">
                        /{product.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductMarketplace;
