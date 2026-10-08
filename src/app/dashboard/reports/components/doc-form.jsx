import { FileText, Plus } from "lucide-react";
import { useState } from "react";

export const DocForm = ({ onSubmit }) => {
  const [feature, setFeature] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feature.trim()) {
      return alert("Isi nama modul dengan lengkap!");
    }
    onSubmit({ feature });
    setFeature("");
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      <h3 className="text-[14px] font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-slate-200/60 dark:border-slate-700/60 pb-4">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Plus size={18} strokeWidth={3} />
        </div>
        Log Dokumentasi Baru
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Nama Modul / Fitur Rilis
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors">
              <FileText size={18} />
            </div>
            <input
              type="text"
              required
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              placeholder="Cth: Flowchart Integrasi Midtrans"
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 dark:focus:ring-emerald-500/20 transition-all text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 font-black py-4 rounded-xl transition-all shadow-md dark:shadow-none text-white text-[13px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 dark:bg-emerald-500 dark:hover:bg-emerald-600 hover:-translate-y-0.5"
          >
            Tambah Ke Daftar
          </button>
        </div>
      </form>
    </div>
  );
};
