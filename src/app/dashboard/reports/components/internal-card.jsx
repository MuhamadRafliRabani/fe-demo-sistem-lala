import {
  Trash2,
  Settings,
  ChevronDown,
  CalendarDays,
  CheckCircle2,
  Server,
  Layers,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
// Pastikan Anda menyesuaikan path import komponen di bawah jika perlu
import { ModuleTracker } from "./module-traker";
import { ProgressRing } from "./progress-ring";

export const InternalCard = ({ project, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Menghitung statistik sederhana dari data internal
  const moduleCount = project.modules?.length || 0;
  const isCompleted = project.progress === 100;

  return (
    <div
      className={`relative bg-white dark:bg-[#152733] rounded-2xl border transition-all duration-300 mb-5 group overflow-hidden ${
        isExpanded ?
          "border-indigo-300 dark:border-indigo-500/50 shadow-lg dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-4 ring-indigo-50 dark:ring-indigo-900/20"
        : "border-slate-200 dark:border-[#2a3b45] hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md"
      }`}
    >
      {/* Accent Line Kiri */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 z-10 ${
          isExpanded ? "bg-indigo-500 dark:bg-indigo-400"
          : isCompleted ? "bg-emerald-500 dark:bg-emerald-400"
          : "bg-transparent group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30"
        }`}
      />

      {/* HEADER CARD (Selalu Terlihat) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative px-6 py-5 pl-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5 select-none z-10 bg-white dark:bg-[#152733]"
      >
        <div className="flex items-start md:items-center gap-5 flex-1">
          {/* Icon Box */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
              isCompleted ?
                "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
              : isExpanded ?
                "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20"
              : "bg-slate-50 dark:bg-[#1e2f3b] text-slate-500 dark:text-slate-400 border-slate-100 dark:border-[#2a3b45] group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/10 group-hover:text-indigo-500"
            }`}
          >
            <Server size={24} strokeWidth={isExpanded ? 2.5 : 2} />
          </div>

          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white truncate transition-colors">
                {project.title}
              </h3>
              {isCompleted && (
                <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 size={12} strokeWidth={3} /> Tuntas
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 md:mt-0">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#1e2f3b] border border-slate-200 dark:border-[#2a3b45]">
                <CalendarDays
                  size={12}
                  className="text-slate-400 dark:text-slate-500"
                />
                <span>
                  Sprint:{" "}
                  <span className="text-indigo-600 dark:text-indigo-400 font-black">
                    {project.sprint}
                  </span>
                </span>
              </span>

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#1e2f3b] border border-slate-200 dark:border-[#2a3b45]">
                <Layers
                  size={12}
                  className="text-slate-400 dark:text-slate-500"
                />
                <span>
                  <span className="text-slate-700 dark:text-slate-300 font-black">
                    {moduleCount}
                  </span>{" "}
                  Modul
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Action & Stats */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#2a3b45]">
          <div className="flex items-center gap-4 md:pr-4 md:border-r border-slate-200 dark:border-[#2a3b45]">
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                <Activity size={12} /> KPI Progres
              </p>
              <p
                className={`text-[16px] font-black ${
                  isCompleted ?
                    "text-emerald-600 dark:text-emerald-400"
                  : "text-indigo-600 dark:text-indigo-400"
                }`}
              >
                {project.progress || 0}%
              </p>
            </div>
            {/* Progress Ring dipastikan punya dimensi tetap di parent */}
            <div className="shrink-0 w-12 h-12">
              <ProgressRing progress={project.progress || 0} theme="indigo" />
            </div>
          </div>

          <button
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
              isExpanded ?
                "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rotate-180"
              : "bg-slate-50 dark:bg-[#1e2f3b] text-slate-400 dark:text-slate-500 group-hover:bg-slate-100 dark:group-hover:bg-[#2a3b45]"
            }`}
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* EXPANDED BODY */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ?
            "grid-rows-[1fr] opacity-100"
          : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden bg-slate-50/50 dark:bg-[#0f1a22]/50">
          <div className="p-6 md:p-8 border-t border-slate-100 dark:border-[#2a3b45]">
            {/* Bagian Utama: Tracker Modul */}
            <div className="w-full mb-8">
              <h4 className="text-[13px] font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-5">
                <Settings
                  size={16}
                  className="text-indigo-500 dark:text-indigo-400"
                />
                Manajemen Modul & Fitur
              </h4>
              <div className="bg-white dark:bg-[#152733] border border-slate-200 dark:border-[#2a3b45] rounded-2xl p-4 shadow-sm">
                <ModuleTracker
                  project={project}
                  onUpdate={onUpdate}
                  theme="indigo"
                />
              </div>
            </div>

            {/* Bagian Bawah: Danger Zone (Ringkas dan elegan) */}
            <div className="bg-red-50/50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-red-900 dark:text-red-400">
                    Hapus Sistem ERP/CRM
                  </p>
                  <p className="text-[11px] font-semibold text-red-600/70 dark:text-red-400/70 mt-0.5">
                    Data modul dan progres yang terkait proyek ini akan dihapus
                    permanen.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDelete(project.id)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-[#152733] text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white rounded-lg border border-red-200 dark:border-red-500/30 font-bold text-[12px] tracking-wide transition-colors shadow-sm"
              >
                Hapus Proyek
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
