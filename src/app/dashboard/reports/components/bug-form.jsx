import { Plus } from "lucide-react";
import { useState } from "react";

export const BugForm = ({ onSubmit }) => {
  const [data, setData] = useState({
    type: "bug",
    title: "",
    source: "Eksternal (Customer)",
    urgency: "Sedang",
    reportedAt: "",
  });
  const isRefactor = data.type === "refactor";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!data.title || !data.reportedAt)
      return alert("Isi form dengan lengkap!");
    onSubmit(data);
    setData({
      type: data.type,
      title: "",
      source: "Eksternal (Customer)",
      urgency: "Sedang",
      reportedAt: "",
    });
  };

  return (
    <div className="w-full">
      <h3 className="text-[14px]  text-slate-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-widest border-b border-slate-200/60 dark:border-slate-700/60 pb-4">
        <div
          className={`p-2 rounded-lg ${
            isRefactor ?
              "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
            : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
          }`}
        >
          <Plus size={16} strokeWidth={3} />
        </div>
        Laporan Maintenance
      </h3>

      <div className="flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl mb-6 w-full border border-slate-200/80 dark:border-slate-700/50">
        <button
          type="button"
          onClick={() => setData({ ...data, type: "bug" })}
          className={`flex-1 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${
            !isRefactor ?
              "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm dark:shadow-none"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Tiket Bug
        </button>
        <button
          type="button"
          onClick={() => setData({ ...data, type: "refactor" })}
          className={`flex-1 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest rounded-lg transition-all ${
            isRefactor ?
              "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-none"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Refactor / UI
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
            {isRefactor ?
              "Deskripsi Refactor / Optimasi"
            : "Deskripsi Masalah / Error"}
          </label>
          <input
            type="text"
            required
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder={
              isRefactor ?
                "Cth: Refactor komponen tabel..."
              : "Cth: Payment gagal di Safari..."
            }
            className={`w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 transition-all text-[13px] font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-none ${
              isRefactor ?
                "focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-50 dark:focus:ring-blue-500/20"
              : "focus:border-red-400 dark:focus:border-red-500 focus:ring-red-50 dark:focus:ring-red-500/20"
            }`}
          />
        </div>

        {!isRefactor && (
          <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/50 p-5 rounded-xl grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Urgensi
              </label>
              <select
                value={data.urgency}
                onChange={(e) => setData({ ...data, urgency: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-500/20 transition-all text-[12px] font-bold text-slate-800 dark:text-white shadow-sm dark:shadow-none"
              >
                <option value="Rendah">Rendah</option>
                <option value="Sedang">Sedang</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Kritis">Kritis</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Sumber Pelapor
              </label>
              <select
                value={data.source}
                onChange={(e) => setData({ ...data, source: e.target.value })}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-red-400 dark:focus:border-red-500 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-500/20 transition-all text-[12px] font-bold text-slate-800 dark:text-white shadow-sm dark:shadow-none"
              >
                <option>Eksternal (Customer)</option>
                <option>Internal (Karyawan/QA)</option>
                <option>Monitoring Server</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Waktu Kejadian / Eksekusi
          </label>
          <input
            type="datetime-local"
            required
            value={data.reportedAt}
            onChange={(e) => setData({ ...data, reportedAt: e.target.value })}
            className={`w-full px-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 transition-all text-[13px] font-bold text-slate-700 dark:text-white shadow-sm dark:shadow-none ${
              isRefactor ?
                "focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-50 dark:focus:ring-blue-500/20"
              : "focus:border-red-400 dark:focus:border-red-500 focus:ring-red-50 dark:focus:ring-red-500/20"
            }`}
          />
        </div>
        <div className="pt-2">
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2  py-4 rounded-xl transition-all shadow-md dark:shadow-none text-white text-[13px] uppercase tracking-widest ${
              isRefactor ?
                "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 shadow-blue-600/20 hover:-translate-y-0.5"
              : "bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 shadow-red-600/20 hover:-translate-y-0.5"
            }`}
          >
            Catat Ke Tracker
          </button>
        </div>
      </form>
    </div>
  );
};
