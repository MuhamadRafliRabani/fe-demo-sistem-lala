import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Layers,
  Pencil,
  X,
} from "lucide-react";
import { useState } from "react";

const formatRupiah = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

const formatDecimal = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 4,
  }).format(n);
};

const SavedItemRow = ({ item, onDelete, isDeleting }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  let grandRunningSubtotal = 0;

  return (
    <div className="border-b border-slate-200/60 last:border-0 py-4">
      {/* Header Item */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h4 className="font-extrabold text-white/80 text-[14px] leading-snug">
            {item.uraian_pekerjaan}
          </h4>
          <div className="text-[12px] text-slate-400 mt-0.5">
            {formatDecimal(item.volume)} {item.satuan}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-[11px] text-slate-500 font-bold mt-2 hover:text-[#e60000] transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 mr-1" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 mr-1" />
            )}
            Lihat Rincian
          </button>
        </div>

        {/* Kolom Harga & Aksi */}
        <div className="flex items-center gap-4 shrink-0 pt-0.5">
          <span className="font-black text-accent/80 tracking-wide text-[14px]">
            Rp {formatRupiah(item.jumlah_harga)}
          </span>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <button
              type="button"
              className="text-orange-400 hover:text-orange-600 transition-colors p-1"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 p-1"
              title="Hapus"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Konten Rincian (Expanded) */}
      {isExpanded && (
        <div className="mt-3.5">
          {item.categories && item.categories.length > 0 && !item.is_manual ? (
            /* TAMPILAN JIKA ADA DETAIL AHSP (TENAGA KERJA, BAHAN DLL) */
            <div className="bg-[#1a202c] rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 flex items-center gap-2 bg-[#2d3748] text-white">
                <Layers size={14} className="opacity-70" />
                <span className="text-[12px] font-bold tracking-wide">
                  Rincian Uraian Komponen
                </span>
              </div>

              <div className="p-2 space-y-2">
                {item.categories.map((cat, cIdx) => {
                  return (
                    <div key={cIdx} className="bg-[#242b38] rounded-lg p-3">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="text-[13px] font-bold text-white">
                            {cat.nama}
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Subtotal Komponen:{" "}
                            <span className="text-sky-400 font-semibold">
                              Rp {formatRupiah(cat.subtotal)}
                            </span>
                          </p>
                        </div>
                        <ChevronUp size={16} className="text-slate-500" />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-600/50">
                              <th className="pb-2 text-left font-semibold text-slate-400">
                                No
                              </th>
                              <th className="pb-2 text-left font-semibold text-slate-400 w-[40%]">
                                Uraian Pekerjaan
                              </th>
                              <th className="pb-2 text-center font-semibold text-slate-400">
                                Sat
                              </th>
                              <th className="pb-2 text-center font-semibold text-slate-400">
                                Koefisien
                              </th>
                              <th className="pb-2 text-right font-semibold text-slate-400">
                                Harga Sat.
                              </th>
                              <th className="pb-2 text-right font-semibold text-slate-400">
                                Jumlah
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.details.map((det, dIdx) => {
                              grandRunningSubtotal += Number(
                                det.jumlah_harga || 0,
                              );
                              return (
                                <tr
                                  key={dIdx}
                                  className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30"
                                >
                                  <td className="py-2">{dIdx + 1}</td>
                                  <td className="py-2 text-slate-200">
                                    {det.uraian}
                                  </td>
                                  <td className="py-2 text-center">
                                    {det.satuan}
                                  </td>
                                  <td className="py-2 text-center">
                                    {formatDecimal(det.koefisien)}
                                  </td>
                                  <td className="py-2 text-right">
                                    {formatRupiah(det.harga_satuan)}
                                  </td>
                                  <td className="py-2 text-right font-bold text-white">
                                    {formatRupiah(det.jumlah_harga)}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr>
                              <td className="py-2"></td>
                              <td className="py-2"></td>
                              <td className="py-2"></td>
                              <td className="py-2"></td>
                              <td className="py-2 text-right font-bold text-white">
                                Subtotal :{" "}
                              </td>
                              <td className="py-2 text-right font-bold text-white">
                                {formatRupiah(grandRunningSubtotal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 bg-[#fbb016]/10 border-t border-[#fbb016]/20 flex justify-between items-center">
                <span className="text-[12px] font-bold text-white uppercase tracking-widest">
                  Total Keseluruhan Komponen
                </span>
                <span className="text-[14px] font-black text-[#fbb016]">
                  Rp {formatRupiah(grandRunningSubtotal)}
                </span>
              </div>
            </div>
          ) : (
            /* FALLBACK MANUAL (Hanya Volume x Harga) */
            <div className="bg-[#f8fafc] rounded-lg p-4 text-[11px] font-mono text-slate-500 border border-slate-100">
              <p className="font-sans font-bold text-slate-700 mb-1.5">
                {item.is_manual ? "Analisa Manual" : "Kalkulasi Dasar"}
              </p>
              <p>
                Qty: {item.volume} {item.satuan} x Rp{" "}
                {formatRupiah(item.harga_satuan)}
              </p>
              <p className="opacity-50 tracking-widest my-1.5">
                ---------------------------
              </p>
              <p className="text-slate-800 font-bold">
                = Rp {formatRupiah(item.jumlah_harga)}
              </p>
              {item.spesifikasi && (
                <p className="mt-2 text-slate-400 font-sans text-xs">
                  Ket: {item.spesifikasi}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedItemRow;
