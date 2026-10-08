import { Trash2, Check, FileText, CheckCircle2 } from "lucide-react";

// Komponen ProgressRing disatukan ke dalam file ini untuk menghindari error import
export const ProgressRing = ({
  progress,
  theme = "emerald",
  size = 48,
  strokeWidth = 5,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-90"
    >
      <circle
        className="text-slate-200 dark:text-slate-700/50"
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className={`text-${theme}-500 transition-all duration-1000 ease-in-out`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </svg>
  );
};

export const DocCard = ({ doc, onUpdate, onDelete }) => {
  const toggleCheck = (key) => {
    const newChecks = { ...doc.checklists, [key]: !doc.checklists[key] };
    const prog = Math.round(
      (Object.values(newChecks).filter(Boolean).length / 3) * 100,
    );
    onUpdate(doc.id, { checklists: newChecks, progress: prog });
  };

  const isCompleted = doc.progress === 100;

  return (
    <div
      className={`relative bg-white dark:bg-[#152733] border rounded-2xl mb-5 p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 md:gap-8 transition-all duration-300 group overflow-hidden ${
        isCompleted ?
          "border-emerald-300 dark:border-emerald-500/50 shadow-lg dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-4 ring-emerald-50 dark:ring-emerald-900/20"
        : "border-slate-200 dark:border-[#2a3b45] hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-md dark:hover:shadow-none"
      }`}
    >
      {/* Accent Line Kiri */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 z-10 ${
          isCompleted ?
            "bg-emerald-500 dark:bg-emerald-400"
          : "bg-transparent group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/30"
        }`}
      />

      {/* Bagian Kiri: Info & Checklists */}
      <div className="flex-1 pl-2 md:pl-0 z-10">
        <div className="flex items-center gap-4 mb-5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-300 ${
              isCompleted ?
                "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-50 dark:bg-[#1e2f3b] border-slate-100 dark:border-[#2a3b45] text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400"
            }`}
          >
            {isCompleted ?
              <CheckCircle2 size={24} strokeWidth={2.5} />
            : <FileText size={24} strokeWidth={2} />}
          </div>
          <h3
            className={`text-[16px] md:text-[18px] font-black tracking-tight transition-colors duration-300 ${
              isCompleted ?
                "text-emerald-700 dark:text-emerald-400"
              : "text-slate-900 dark:text-white"
            }`}
          >
            {doc.feature}
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { k: "api", l: "API Docs" },
            { k: "schema", l: "Schema DB" },
            { k: "flow", l: "Flowchart" },
          ].map((chk) => {
            const isChecked = doc.checklists?.[chk.k];
            return (
              <button
                key={chk.k}
                onClick={() => toggleCheck(chk.k)}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-widest border transition-all duration-300 flex items-center gap-2 select-none ${
                  isChecked ?
                    "bg-emerald-500 dark:bg-emerald-500/20 text-white dark:text-emerald-400 border-emerald-500 dark:border-emerald-500/30 shadow-md shadow-emerald-500/30 dark:shadow-none translate-y-0"
                  : "bg-slate-50 dark:bg-[#1e2f3b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-[#2a3b45] hover:bg-slate-100 dark:hover:bg-[#2a3b45]/80 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <Check
                  size={16}
                  className={`transition-all duration-300 ${
                    isChecked ?
                      "opacity-100 scale-100"
                    : "opacity-0 w-0 scale-50 hidden"
                  }`}
                  strokeWidth={4}
                />
                {chk.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bagian Kanan: Kelengkapan & Action */}
      <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-[#2a3b45] pt-6 md:pt-0 md:pl-8 shrink-0 z-10 justify-between md:justify-end">
        <div className="flex items-center gap-4 md:pr-6 md:border-r border-slate-100 dark:border-[#2a3b45]">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Kelengkapan
            </p>
            <p
              className={`text-[16px] font-black transition-colors duration-300 ${
                isCompleted ?
                  "text-emerald-600 dark:text-emerald-400"
                : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {doc.progress || 0}%
            </p>
          </div>
          {/* Progress Ring dengan ukuran pasti agar konsisten */}
          <div className="w-12 h-12 shrink-0">
            <ProgressRing progress={doc.progress || 0} theme="emerald" />
          </div>
        </div>

        <button
          onClick={() => onDelete(doc.id)}
          className="text-slate-400 dark:text-slate-500 bg-white dark:bg-[#152733] border border-slate-200 dark:border-[#2a3b45] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/30 p-3 rounded-xl transition-all duration-300 shadow-sm dark:shadow-none"
          title="Hapus Dokumentasi"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
