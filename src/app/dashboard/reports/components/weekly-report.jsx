import {
  FileText,
  Bug,
  Globe,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  BookOpen,
  Clock,
} from "lucide-react";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const WeeklyReportView = ({ data }) => {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalBugs = data.maintenance.filter(
    (m) => m.type === "bug" || !m.type,
  ).length;
  const resolvedBugs = data.maintenance.filter(
    (m) => (m.type === "bug" || !m.type) && m.status === "resolved",
  ).length;
  const totalRefactors = data.maintenance.filter(
    (m) => m.type === "refactor",
  ).length;

  const totalDocs = data.dokumentasi.length;
  const docs100 = data.dokumentasi.filter((d) => d.progress === 100).length;
  const docCompletionRate =
    totalDocs > 0 ? Math.round((docs100 / totalDocs) * 100) : 0;

  return (
    <div className="w-full bg-white dark:bg-[#152733] rounded-3xl shadow-sm border border-slate-200 dark:border-[#2a3b45] p-6 sm:p-10 animate-in fade-in duration-500 overflow-hidden relative">
      {/* Background Ornamen (Hanya estetika) */}
      <div className="absolute top-0 right-0 p-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/3 -translate-y-1/3"></div>

      {/* --- HEADER LAPORAN --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-slate-900 dark:border-slate-700 pb-6 mb-10 gap-6">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-2">
            Weekly Progress
          </h1>
          <p className="text-[14px] font-extrabold text-slate-500 dark:text-slate-400">
            Laporan Kinerja 4 Pilar KPI Developer
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1e2f3b] border border-slate-200 dark:border-[#2a3b45] px-4 py-3 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-white dark:bg-[#152733] rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-[#2a3b45]">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
              Tanggal Generate
            </p>
            <p className="text-[13px] font-black text-slate-800 dark:text-white">
              {today}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* --- SECTION 1: EKOSISTEM WEB --- */}
        <section>
          <h2 className="text-[18px] font-black text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Globe size={18} strokeWidth={3} />
            </div>
            1. Ekosistem Web Eksternal & Internal
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#2a3b45] shadow-sm">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1e2f3b] text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <th className="p-4 border-b border-slate-200 dark:border-[#2a3b45]">
                    Nama Proyek / Modul
                  </th>
                  <th className="p-4 border-b border-slate-200 dark:border-[#2a3b45]">
                    Kategori / Pilar
                  </th>
                  <th className="p-4 border-b border-slate-200 dark:border-[#2a3b45] text-center">
                    Target Rilis
                  </th>
                  <th className="p-4 border-b border-slate-200 dark:border-[#2a3b45] text-right">
                    Progres KPI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2a3b45]">
                {[...data.eksternal, ...data.internal].map((item, i) => {
                  const isCompleted = item.progress >= 100;
                  return (
                    <tr
                      key={i}
                      className="text-[14px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-[#1e2f3b]/50 transition-colors"
                    >
                      <td className="p-4">{item.title}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 dark:bg-[#1e2f3b] text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-[#2a3b45]">
                          {item.type ?
                            item.type.replace("_", " ")
                          : "INTERNAL (ERP/CRM)"}
                        </span>
                      </td>
                      <td className="p-4 text-center text-[13px] text-slate-500 dark:text-slate-400">
                        {item.targetDate ?
                          formatDate(item.targetDate)
                        : item.sprint}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {/* Mini Progress Bar */}
                          <div className="w-20 h-2 bg-slate-100 dark:bg-[#1e2f3b] rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-blue-500"}`}
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[12px] font-black w-14 text-center border ${
                              isCompleted ?
                                "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                              : "bg-slate-50 dark:bg-[#1e2f3b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2a3b45]"
                            }`}
                          >
                            {item.progress || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- SECTION 2: BUG & MAINTENANCE --- */}
        <section>
          <h2 className="text-[18px] font-black text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg">
              <Bug size={18} strokeWidth={3} />
            </div>
            2. Maintenance, Refactor & Bug (SLA 48 Jam)
          </h2>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-[#1e2f3b] border border-slate-200 dark:border-[#2a3b45] p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-[#152733] rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Total Bug
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">
                  {totalBugs}
                </p>
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-[#152733] rounded-xl flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest">
                  Selesai (SLA)
                </p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none mt-1">
                  {resolvedBugs}
                </p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 p-5 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-[#152733] rounded-xl flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-500/20">
                <Wrench size={20} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-widest">
                  Tugas Refactor
                </p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-400 leading-none mt-1">
                  {totalRefactors}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#2a3b45] shadow-sm">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#1e2f3b] text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  <th className="p-4 border-b border-slate-200 dark:border-[#2a3b45]">
                    Kategori & Urgensi
                  </th>
                  <th className="p-4 border-b border-slate-200 dark:border-[#2a3b45]">
                    Deskripsi Laporan / Pekerjaan
                  </th>
                  <th className="p-4 border-b border-slate-200 dark:border-[#2a3b45] text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2a3b45]">
                {data.maintenance.map((item, i) => (
                  <tr
                    key={i}
                    className="text-[14px] font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-[#1e2f3b]/50 transition-colors"
                  >
                    <td className="p-4">
                      {item.type === "refactor" ?
                        <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-black">
                          Refactor / Opt
                        </span>
                      : <span
                          className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-black border ${
                            item.urgency === "Kritis" ?
                              "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
                            : item.urgency === "Tinggi" ?
                              "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20"
                            : item.urgency === "Rendah" ?
                              "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                            : "bg-slate-50 dark:bg-[#1e2f3b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2a3b45]"
                          }`}
                        >
                          Bug: {item.urgency || "Sedang"}
                        </span>
                      }
                    </td>
                    <td className="p-4">
                      <div className="mb-1">
                        {item.projectName && (
                          <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded-md text-[9px] uppercase tracking-widest mr-2 align-middle">
                            {item.projectName}
                          </span>
                        )}
                        <span className="align-middle text-[13px]">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                        <Clock size={10} /> Reported:{" "}
                        {formatDateTime(item.reportedAt)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {item.status === "resolved" ?
                        <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">
                          RESOLVED
                        </span>
                      : <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest relative flex items-center justify-center gap-1.5 w-fit mx-auto">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                          OPEN
                        </span>
                      }
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {data.maintenance.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="p-8 text-center bg-slate-50/50 dark:bg-[#1e2f3b]/30"
                    >
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <CheckCircle2
                          size={32}
                          strokeWidth={1.5}
                          className="mb-3 text-emerald-400"
                        />
                        <p className="text-[13px] font-bold tracking-wide">
                          Sistem Stabil (100% Bebas Bug) di pekan ini.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* --- SECTION 3: DOKUMENTASI --- */}
        <section>
          <h2 className="text-[18px] font-black text-slate-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FileText size={18} strokeWidth={3} />
            </div>
            3. Dokumentasi Teknis (Target 100%)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-[#1e2f3b] border border-slate-200 dark:border-[#2a3b45] p-5 rounded-2xl flex flex-col justify-center">
              <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <BookOpen size={14} /> Total Fitur Rilis
              </p>
              <p className="font-black text-2xl text-slate-800 dark:text-white">
                {totalDocs}{" "}
                <span className="text-[12px] font-bold text-slate-400">
                  Modul
                </span>
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#1e2f3b] border border-slate-200 dark:border-[#2a3b45] p-5 rounded-2xl flex flex-col justify-center">
              <p className="text-[11px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <CheckCircle2 size={14} /> Dok. Lengkap
              </p>
              <p className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                {docs100}{" "}
                <span className="text-[12px] font-bold text-emerald-600/50 dark:text-emerald-400/50">
                  Tuntas
                </span>
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                  Completion Rate
                </p>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 leading-none">
                  {docCompletionRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-emerald-200/50 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${docCompletionRate}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* --- FOOTER LAPORAN --- */}
      <div className="mt-16 pt-6 border-t border-slate-200 dark:border-[#2a3b45] flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Laporan Resmi KPI Developer • Dibuat Otomatis Sistem
        </p>
        <div className="flex items-center gap-2 opacity-50 grayscale">
          {/* Logo Placeholder (Opsional) */}
          <div className="w-5 h-5 bg-slate-400 dark:bg-slate-600 rounded"></div>
          <span className="text-[12px] font-black tracking-tight text-slate-600 dark:text-slate-400">
            Langit.id
          </span>
        </div>
      </div>
    </div>
  );
};
