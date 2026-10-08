import { CalendarDays, Plus, Type } from "lucide-react";
import { useState } from "react";

export const InternalForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ title: "", sprint: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.sprint) {
      return alert("Isi form dengan lengkap!");
    }
    onSubmit(formData);
    setFormData({ title: "", sprint: "" });
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      <h3 className="text-[14px] font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-slate-200/60 dark:border-slate-700/60 pb-4">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
          <Plus size={16} strokeWidth={3} />
        </div>
        Modul ERP/CRM Baru
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Nama Proyek / Sistem
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors">
              <Type size={16} />
            </div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Cth: Dashboard Keuangan..."
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/20 transition-all text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Target Sprint / Periode
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors">
              <CalendarDays size={16} />
            </div>
            <input
              type="text"
              required
              value={formData.sprint}
              onChange={(e) =>
                setFormData({ ...formData, sprint: e.target.value })
              }
              placeholder="Cth: Sprint 12 atau April W2"
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-500/20 transition-all text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 font-black py-4 rounded-xl transition-all shadow-md dark:shadow-none text-white text-[13px] uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 dark:bg-indigo-500 dark:hover:bg-indigo-600 hover:-translate-y-0.5"
          >
            Simpan Proyek
          </button>
        </div>
      </form>
    </div>
  );
};
