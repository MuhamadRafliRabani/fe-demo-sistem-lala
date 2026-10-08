import {
  Bug,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Globe,
  LayoutTemplate,
  LinkIcon,
  Settings,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { ModuleTracker } from "./module-traker";
import { ProgressRing } from "./progress-ring";
import { useState } from "react";
import { formatDate } from "@/lib/date-format";
import { formatDateTime } from "../page";

export const EksternalCard = ({
  project,
  onUpdate,
  onDelete,
  onAddBug,
  projectBugs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newBugTitle, setNewBugTitle] = useState("");
  const [newBugSource, setNewBugSource] = useState("Eksternal (Customer)");
  const [newBugUrgency, setNewBugUrgency] = useState("Sedang");

  const isLP = project.type === "landing_page";
  const theme = isLP ? "blue" : "purple";
  const isOverdue =
    new Date(project.targetDate) < new Date() && project.progress < 100;
  const activeBugsCount = projectBugs.filter((b) => b.status === "open").length;

  const handleChecklistToggle = (key) => {
    const newChecklists = {
      ...project.checklists,
      [key]: !project.checklists[key],
    };
    const completed = Object.values(newChecklists).filter(Boolean).length;
    const progress = Math.round((completed / 3) * 100);
    onUpdate(project.id, { checklists: newChecklists, progress });
  };

  const handleProjectBugSubmit = (e) => {
    e.preventDefault();
    if (!newBugTitle.trim()) return;
    onAddBug({
      projectId: project.id,
      projectName: project.title,
      type: "bug",
      title: newBugTitle,
      source: newBugSource,
      urgency: newBugUrgency,
      reportedAt: new Date().toISOString(),
    });
    setNewBugTitle("");
    setNewBugUrgency("Sedang");
  };

  return (
    <div
      className={` rounded-2xl border transition-all duration-300 mb-5 group hover:shadow-md ${isExpanded ? `border-${theme}-300 shadow-lg ring-4 ring-${theme}-50/50` : "border-slate-200 hover:border-slate-300"}`}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-6 py-5 cursor-pointer flex items-center justify-between gap-5 select-none relative bg-white rounded-2xl z-10"
      >
        <div
          className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl transition-colors ${isExpanded ? `bg-${theme}-500` : "bg-transparent group-hover:bg-slate-200"}`}
        />
        <div className="flex items-center gap-5 flex-1 pl-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${isExpanded ? `bg-${theme}-50 text-${theme}-600 border-${theme}-200` : "bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-slate-100"}`}
          >
            {isLP ?
              <LayoutTemplate size={22} strokeWidth={2.5} />
            : <CalendarClock size={22} strokeWidth={2.5} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-[16px] font-black text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                {project.title}
              </h3>
              {project.progress === 100 && (
                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[9px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={10} strokeWidth={3} /> Tuntas
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2 py-1 rounded-md">
                <CalendarDays size={12} className="text-slate-400" />{" "}
                {formatDate(project.startDate)}
              </span>
              <span
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${isOverdue ? "text-red-600 bg-red-50 border-red-200" : "bg-slate-50 border-slate-200/60 text-slate-500"}`}
              >
                <Clock
                  size={12}
                  className={isOverdue ? "text-red-500" : "text-slate-400"}
                />{" "}
                Target: {formatDate(project.targetDate)}
              </span>
              {activeBugsCount > 0 && (
                <span className="flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md shadow-sm animate-pulse">
                  <Bug size={12} strokeWidth={3} /> {activeBugsCount} Laporan
                  Bug
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="hidden sm:flex items-center gap-4 pr-3 border-r border-slate-100">
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">
                KPI Progres
              </p>
              <p
                className={`text-[14px] font-black ${project.progress === 100 ? "text-emerald-600" : "text-slate-800"}`}
              >
                {project.progress || 0}%
              </p>
            </div>
            <ProgressRing progress={project.progress || 0} theme={theme} />
          </div>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isExpanded ? `bg-${theme}-100 text-${theme}-600 rotate-180` : "bg-slate-50 text-slate-400 group-hover:bg-slate-200"}`}
          >
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden bg-slate-50/30">
          <div className="p-6 border-t border-slate-200 flex flex-col xl:flex-row gap-8">
            {/* KIRI: INFO URL & MANAJEMEN */}
            <div className="w-full xl:w-[35%] flex flex-col gap-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div
                  className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-${theme}-400 to-${theme}-600`}
                ></div>
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4 mt-1">
                  <Globe size={16} className={`text-${theme}-500`} /> URL
                  Publikasi Proyek
                </h4>
                <div className="space-y-4">
                  <div className="relative group flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors">
                      <LinkIcon size={16} />
                    </div>
                    <input
                      type="url"
                      value={project.url || ""}
                      onChange={(e) =>
                        onUpdate(project.id, { url: e.target.value })
                      }
                      placeholder="Masukkan link publikasi..."
                      className={`w-full text-[13px] pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-${theme}-400 focus:ring-4 focus:ring-${theme}-50 transition-all font-bold text-slate-700 placeholder:text-slate-400`}
                    />
                  </div>
                  <a
                    href={project.url || "#"}
                    target={project.url ? "_blank" : "_self"}
                    onClick={(e) => !project.url && e.preventDefault()}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${project.url ? `bg-${theme}-600 text-white hover:bg-${theme}-700 shadow-md shadow-${theme}-600/20 hover:-translate-y-0.5` : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                  >
                    Kunjungi Link <ExternalLink size={16} strokeWidth={2.5} />
                  </a>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mt-auto">
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-slate-400" /> Manajemen
                  Data
                </h4>
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-red-800">
                      Hapus Permanen
                    </p>
                    <p className="text-[10px] font-semibold text-red-600/70 mt-0.5">
                      Tindakan tidak dapat diurungkan.
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(project.id)}
                    className="p-2.5 bg-white text-red-600 hover:bg-red-600 hover:text-white rounded-lg border border-red-200 transition-colors shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* KANAN: WORKSPACE */}
            <div className="w-full xl:w-[65%] flex flex-col gap-8">
              {isLP ?
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <h4 className="text-[14px] font-black text-slate-900 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-blue-500" />{" "}
                        Validasi Kelayakan Landing Page
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-widest">
                        Berdasarkan Parameter KPI Laporan
                      </p>
                    </div>
                    <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest">
                      {Object.values(project.checklists).filter(Boolean).length}{" "}
                      / 3 Selesai
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="space-y-3">
                      {[
                        {
                          key: "live",
                          label: "Website Live & Dapat Diakses Publik",
                        },
                        {
                          key: "responsive",
                          label: "Tampilan Responsif (Mobile, Tablet, Desktop)",
                        },
                        {
                          key: "ready",
                          label:
                            "Siap Digunakan Oleh Customer (Bebas Bug/Error)",
                        },
                      ].map((item) => {
                        const isChecked = project.checklists[item.key];
                        return (
                          <label
                            key={item.key}
                            className={`flex items-center gap-4 p-5 cursor-pointer transition-all rounded-2xl border ${isChecked ? "bg-blue-50/80 border-blue-200 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"}`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              onChange={() => handleChecklistToggle(item.key)}
                            />
                            <div
                              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all shrink-0 ${isChecked ? "bg-blue-500 text-white shadow-md shadow-blue-500/40" : "bg-slate-100 text-transparent border-2 border-slate-200 group-hover:border-blue-400"}`}
                            >
                              <Check size={16} strokeWidth={4} />
                            </div>
                            <span
                              className={`text-[14px] font-extrabold transition-all select-none ${isChecked ? "text-blue-900/50 line-through decoration-blue-300 decoration-2" : "text-slate-700 group-hover:text-slate-900"}`}
                            >
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              : <ModuleTracker
                  project={project}
                  onUpdate={onUpdate}
                  theme={theme}
                />
              }
            </div>
          </div>

          {/* TRACKER BUG PROYEK */}
          <div className="px-6 pb-6">
            <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between bg-red-50/50 pl-7">
                <h4 className="text-[13px] font-black text-red-700 flex items-center gap-2 uppercase tracking-widest">
                  <ShieldAlert size={16} /> Tracker Bug Proyek Lokal
                </h4>
                <span className="text-[10px] font-bold bg-white text-red-600 border border-red-200 px-2.5 py-1 rounded-md shadow-sm">
                  {activeBugsCount} Terbuka
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-5 pl-7">
                <div className="space-y-3 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                  {projectBugs.map((bug) => (
                    <div
                      key={bug.id}
                      className={`flex items-center justify-between bg-white border px-4 py-3 rounded-xl shadow-sm transition-colors ${bug.status === "resolved" ? "border-emerald-200" : "border-red-200 hover:border-red-300"}`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                          <p
                            className={`text-[13px] font-bold truncate ${bug.status === "resolved" ? "text-slate-400 line-through" : "text-slate-800"}`}
                          >
                            {bug.title}
                          </p>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              bug.urgency === "Kritis" ?
                                "bg-red-100 text-red-700"
                              : bug.urgency === "Tinggi" ?
                                "bg-orange-100 text-orange-700"
                              : bug.urgency === "Rendah" ?
                                "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {bug.urgency}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                          <Clock size={12} /> Dilaporkan:{" "}
                          {formatDateTime(bug.reportedAt)}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shrink-0 border ${bug.status === "resolved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}
                      >
                        {bug.status === "resolved" ? "Done" : "Open"}
                      </span>
                    </div>
                  ))}
                  {projectBugs.length === 0 && (
                    <div className="py-5 border border-dashed border-red-200 rounded-xl text-center flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                      <CheckCircle2
                        size={24}
                        className="text-emerald-400 mb-1"
                      />
                      <p className="text-[12px] font-bold text-slate-500">
                        Sistem stabil. Belum ada bug dilaporkan di proyek ini.
                      </p>
                    </div>
                  )}
                </div>
                <form
                  onSubmit={handleProjectBugSubmit}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-auto bg-slate-50 p-3 rounded-xl border border-slate-200"
                >
                  <div className="sm:col-span-12 md:col-span-5 relative">
                    <input
                      type="text"
                      required
                      placeholder="Deskripsi bug atau error..."
                      value={newBugTitle}
                      onChange={(e) => setNewBugTitle(e.target.value)}
                      className="w-full text-[12px] font-bold px-4 py-3 bg-white border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 text-slate-800 transition-all shadow-sm"
                    />
                  </div>
                  <select
                    value={newBugUrgency}
                    onChange={(e) => setNewBugUrgency(e.target.value)}
                    className="sm:col-span-6 md:col-span-3 text-[12px] font-bold px-3 py-3 bg-white border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 text-slate-700 transition-all shadow-sm"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Kritis">Kritis</option>
                  </select>
                  <button
                    type="submit"
                    className="sm:col-span-6 md:col-span-4 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-lg hover:bg-red-700 transition-all shadow-sm shadow-red-600/20"
                  >
                    Catat Bug
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
