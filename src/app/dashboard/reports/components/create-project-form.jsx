import { useState } from "react";
import { CalendarDays, Plus, Type, Link as LinkIcon } from "lucide-react";

export const CreateProjectForm = ({ type, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    startDate: "",
    targetDate: "",
  });

  const isLP = type === "landing_page";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.targetDate) {
      return alert("Isi form dengan lengkap!");
    }
    onSubmit({ ...formData, type });
    setFormData({ title: "", url: "", startDate: "", targetDate: "" });
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      <h3 className="text-[14px] font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-slate-200/60 dark:border-slate-700/60 pb-4">
        <div
          className={`p-2 rounded-lg ${
            isLP ?
              "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
            : "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
          }`}
        >
          <Plus size={16} strokeWidth={3} />
        </div>
        {isLP ? "Proyek LP Baru" : "Sistem Baru"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input Nama Proyek */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Nama Proyek / Klien
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
              placeholder="Cth: Web Perusahaan..."
              className={`w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 transition-all text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-none ${
                isLP ?
                  "focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-50 dark:focus:ring-blue-500/20"
                : "focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-50 dark:focus:ring-purple-500/20"
              }`}
            />
          </div>
        </div>

        {/* Input URL Publikasi */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
            URL Publikasi (Opsional)
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-300 transition-colors">
              <LinkIcon size={16} />
            </div>
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder="Cth: https://domain.com"
              className={`w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 transition-all text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-none ${
                isLP ?
                  "focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-50 dark:focus:ring-blue-500/20"
                : "focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-50 dark:focus:ring-purple-500/20"
              }`}
            />
          </div>
        </div>

        {/* Kotak Timeline */}
        <div className="bg-slate-50/80 dark:bg-slate-800/20 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/50 space-y-4">
          <h4 className="text-[12px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <CalendarDays
              size={16}
              className={
                isLP ?
                  "text-blue-500 dark:text-blue-400"
                : "text-purple-500 dark:text-purple-400"
              }
            />
            Timeline Pekerjaan
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={`w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 transition-all text-[12px] font-bold text-slate-700 dark:text-slate-200 shadow-sm dark:shadow-none ${
                  isLP ?
                    "focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-50 dark:focus:ring-blue-500/20"
                  : "focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-50 dark:focus:ring-purple-500/20"
                }`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Target Selesai
              </label>
              <input
                type="date"
                required
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData({ ...formData, targetDate: e.target.value })
                }
                className={`w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 transition-all text-[12px] font-bold text-slate-700 dark:text-slate-200 shadow-sm dark:shadow-none ${
                  isLP ?
                    "focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-50 dark:focus:ring-blue-500/20"
                  : "focus:border-purple-400 dark:focus:border-purple-500 focus:ring-purple-50 dark:focus:ring-purple-500/20"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Tombol Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-xl transition-all shadow-md dark:shadow-none text-white text-[13px] uppercase tracking-widest hover:-translate-y-0.5 ${
              isLP ?
                "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 dark:bg-blue-500 dark:hover:bg-blue-600"
              : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 dark:bg-purple-500 dark:hover:bg-purple-600"
            }`}
          >
            Simpan Ke Daftar
          </button>
        </div>
      </form>
    </div>
  );
};
