import {
  Trash2,
  Timer,
  Clock,
  AlertCircle,
  LayoutTemplate,
  CheckCircle2,
} from "lucide-react";
import { formatDateTime } from "../page";

export const BugCard = ({ bug, onResolve, onDelete }) => {
  const reported = new Date(bug.reportedAt).getTime();
  const now =
    bug.resolvedAt ? new Date(bug.resolvedAt).getTime() : new Date().getTime();
  const diffHours = ((now - reported) / (1000 * 60 * 60)).toFixed(1);
  const isOverdue = diffHours > 48;
  const isResolved = bug.status === "resolved";
  const isRefactor = bug.type === "refactor";

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-2xl mb-4 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:shadow-md ${
        !isRefactor && isOverdue && !isResolved ?
          "border-red-300 dark:border-red-500/50 ring-4 ring-red-50 dark:ring-red-900/20"
        : "border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-5 flex-1">
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 ${
            isResolved ?
              "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
            : isRefactor ?
              "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
          }`}
        >
          {isResolved ?
            <CheckCircle2 size={28} strokeWidth={2.5} />
          : isRefactor ?
            <LayoutTemplate size={28} strokeWidth={2.5} />
          : <AlertCircle size={28} strokeWidth={2.5} />}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3
              className={`text-[16px]  tracking-tight ${
                isResolved ?
                  "line-through text-slate-400 dark:text-slate-500"
                : "text-slate-900 dark:text-white"
              }`}
            >
              {bug.title}
            </h3>
            {bug.urgency && !isRefactor && (
              <span
                className={`text-[9px]  uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  bug.urgency === "Kritis" ?
                    "bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30"
                  : bug.urgency === "Tinggi" ?
                    "bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                  : bug.urgency === "Rendah" ?
                    "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                  : "bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                }`}
              >
                {bug.urgency}
              </span>
            )}
            {isRefactor && (
              <span className="bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-[9px]  uppercase tracking-wider px-2 py-0.5 rounded-md">
                Refactor / Opt
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {bug.projectName && (
              <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-1 rounded-md mr-1">
                <span className="text-[9px] uppercase tracking-widest text-indigo-400 dark:text-indigo-500">
                  Proyek:
                </span>{" "}
                {bug.projectName}
              </span>
            )}
            {bug.source && (
              <span className="text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md mr-1">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Source:
                </span>{" "}
                {bug.source}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {formatDateTime(bug.reportedAt)}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-5 border px-5 py-4 rounded-xl shrink-0 ${
          isResolved ?
            "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20"
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50"
        }`}
      >
        {!isRefactor && (
          <>
            <div className="text-center pr-3 border-r border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1">
                <Timer size={12} /> SLA Timer
              </p>
              <p
                className={`text-[16px]  ${
                  isOverdue && !isResolved ?
                    "text-red-600 dark:text-red-400"
                  : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {diffHours} Jam{" "}
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  / 48 SLA
                </span>
              </p>
            </div>
          </>
        )}

        {!isResolved ?
          <button
            onClick={() => onResolve(bug.id)}
            className={`${
              isRefactor ?
                "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 dark:bg-blue-500 dark:hover:bg-blue-600"
              : "bg-slate-800 hover:bg-slate-700 shadow-slate-800/20 dark:bg-slate-700 dark:hover:bg-slate-600"
            } text-white px-5 py-2.5 rounded-lg text-[12px] font-extrabold uppercase tracking-widest shadow-md transition-all hover:-translate-y-0.5`}
          >
            Selesaikan
          </button>
        : <button
            onClick={() => onDelete(bug.id)}
            className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900/50 p-2.5 rounded-lg transition-all shadow-sm dark:shadow-none"
          >
            <Trash2 size={16} />
          </button>
        }
      </div>
    </div>
  );
};
