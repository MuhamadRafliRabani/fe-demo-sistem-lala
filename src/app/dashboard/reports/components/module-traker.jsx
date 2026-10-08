import {
  Plus,
  FolderTree,
  Trash2,
  FileCode2,
  Check,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";

export const ModuleTracker = ({ project, onUpdate, theme }) => {
  const [newModuleName, setNewModuleName] = useState("");
  const [newSubFeatureInputs, setNewSubFeatureInputs] = useState({});

  const recalcProgress = (modulesList) => {
    let totalFeats = 0;
    let totalProg = 0;
    modulesList.forEach((m) => {
      m.features.forEach((f) => {
        totalFeats++;
        totalProg += f.progress;
      });
    });
    return totalFeats === 0 ? 0 : Math.round(totalProg / totalFeats);
  };

  const handleAddModule = (e) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    const newMods = [
      ...(project.modules || []),
      { id: Date.now(), name: newModuleName, features: [] },
    ];
    onUpdate(project.id, { modules: newMods });
    setNewModuleName("");
  };

  const handleDeleteModule = (modId) => {
    const newMods = project.modules.filter((m) => m.id !== modId);
    onUpdate(project.id, {
      modules: newMods,
      progress: recalcProgress(newMods),
    });
  };

  const handleAddSubFeature = (e, modId) => {
    e.preventDefault();
    const featName = newSubFeatureInputs[modId];
    if (!featName?.trim()) return;
    const newMods = project.modules.map((m) => {
      if (m.id === modId)
        return {
          ...m,
          features: [
            ...m.features,
            { id: Date.now(), name: featName, progress: 0 },
          ],
        };
      return m;
    });
    onUpdate(project.id, {
      modules: newMods,
      progress: recalcProgress(newMods),
    });
    setNewSubFeatureInputs({ ...newSubFeatureInputs, [modId]: "" });
  };

  const handleUpdateSubFeature = (modId, featId, progress) => {
    const newMods = project.modules.map((m) => {
      if (m.id === modId)
        return {
          ...m,
          features: m.features.map((f) =>
            f.id === featId ? { ...f, progress } : f,
          ),
        };
      return m;
    });
    onUpdate(project.id, {
      modules: newMods,
      progress: recalcProgress(newMods),
    });
  };

  const handleToggleSubFeature = (modId, featId) => {
    const newMods = project.modules.map((m) => {
      if (m.id === modId)
        return {
          ...m,
          features: m.features.map((f) =>
            f.id === featId ?
              { ...f, progress: f.progress === 100 ? 0 : 100 }
            : f,
          ),
        };
      return m;
    });
    onUpdate(project.id, {
      modules: newMods,
      progress: recalcProgress(newMods),
    });
  };

  const handleDeleteSubFeature = (modId, featId) => {
    const newMods = project.modules.map((m) => {
      if (m.id === modId)
        return { ...m, features: m.features.filter((f) => f.id !== featId) };
      return m;
    });
    onUpdate(project.id, {
      modules: newMods,
      progress: recalcProgress(newMods),
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200/80 p-6 shadow-inner">
      <div className="flex justify-between items-center mb-5">
        <h4
          className={`text-[14px] font-black text-${theme}-700 flex items-center gap-2 uppercase tracking-widest`}
        >
          <FolderTree size={18} className={`text-${theme}-500`} /> Struktur
          Modul
        </h4>
        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            Total Progres:{" "}
            <span className={`text-[14px] font-black text-${theme}-600`}>
              {project.progress || 0}%
            </span>
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
        {project.modules?.map((mod) => {
          const modProg =
            mod.features.length ?
              Math.round(
                mod.features.reduce((a, c) => a + c.progress, 0) /
                  mod.features.length,
              )
            : 0;
          return (
            <div
              key={mod.id}
              className={`bg-white border ${modProg === 100 ? "border-emerald-200 shadow-sm" : "border-slate-200 shadow-sm"} rounded-xl overflow-hidden transition-all group/mod`}
            >
              <div
                className={`px-4 py-3 flex items-center justify-between border-b ${modProg === 100 ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50/80 border-slate-100"}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${modProg === 100 ? "bg-emerald-100 text-emerald-600" : `bg-${theme}-100 text-${theme}-600`}`}
                  >
                    <FolderOpen size={14} strokeWidth={3} />
                  </div>
                  <h5 className="text-[13px] font-extrabold text-slate-800">
                    {mod.name}
                  </h5>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ml-2 ${modProg === 100 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                  >
                    {modProg}%
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteModule(mod.id)}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all opacity-0 group-hover/mod:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="divide-y divide-slate-50 bg-white">
                {mod.features.map((feat) => {
                  const isDone = feat.progress === 100;
                  return (
                    <div
                      key={feat.id}
                      className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors group/feat"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => handleToggleSubFeature(mod.id, feat.id)}
                      >
                        <div
                          className={`flex items-center justify-center w-5 h-5 rounded-md transition-all shrink-0 ${isDone ? "bg-emerald-500 text-white shadow-sm" : `bg-slate-50 text-transparent border border-slate-300 group-hover/feat:border-${theme}-400`}`}
                        >
                          <Check size={12} strokeWidth={4} />
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <FileCode2
                            size={12}
                            className={
                              isDone ? "text-emerald-400" : "text-slate-400"
                            }
                          />
                          <span
                            className={`text-[12px] font-bold truncate ${isDone ? "text-slate-400 line-through decoration-slate-300 decoration-2" : "text-slate-700"}`}
                          >
                            {feat.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-8 sm:ml-0 bg-slate-50 sm:bg-transparent p-1.5 sm:p-0 rounded-lg">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          className={`w-20 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-${theme}-600`}
                          value={feat.progress || 0}
                          onChange={(e) =>
                            handleUpdateSubFeature(
                              mod.id,
                              feat.id,
                              Number(e.target.value),
                            )
                          }
                        />
                        <span className="text-[10px] font-black text-slate-600 w-7 text-right">
                          {feat.progress || 0}%
                        </span>
                        <button
                          onClick={() =>
                            handleDeleteSubFeature(mod.id, feat.id)
                          }
                          className="text-slate-300 hover:text-red-500 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 p-1.5 rounded-md transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => handleAddSubFeature(e, mod.id)}
                className="border-t border-slate-100 bg-slate-50/50 p-2 flex gap-2"
              >
                <input
                  type="text"
                  value={newSubFeatureInputs[mod.id] || ""}
                  onChange={(e) =>
                    setNewSubFeatureInputs({
                      ...newSubFeatureInputs,
                      [mod.id]: e.target.value,
                    })
                  }
                  placeholder="Tambah komponen/page..."
                  className={`w-full text-[11px] font-bold px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-${theme}-400 focus:ring-2 focus:ring-${theme}-50 transition-all text-slate-700 placeholder:text-slate-400 shadow-sm`}
                />
                <button
                  type="submit"
                  className={`bg-${theme}-100 text-${theme}-700 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-${theme}-200 transition-all shadow-sm shrink-0`}
                >
                  Tambah
                </button>
              </form>
            </div>
          );
        })}
        {(!project.modules || project.modules.length === 0) && (
          <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center gap-2 bg-white/50">
            <FolderTree size={28} className="text-slate-300" />
            <p className="text-[12px] font-bold text-slate-500 max-w-[200px]">
              Belum ada modul yang dibuat. Tambahkan modul utama terlebih
              dahulu.
            </p>
          </div>
        )}
      </div>

      <form
        onSubmit={handleAddModule}
        className="mt-auto relative pt-4 border-t border-slate-200/80"
      >
        <div className={`absolute left-4 top-[30px] text-${theme}-500`}>
          <Plus size={18} strokeWidth={3} />
        </div>
        <input
          type="text"
          required
          placeholder="Buat Modul Induk Baru..."
          value={newModuleName}
          onChange={(e) => setNewModuleName(e.target.value)}
          className={`w-full text-[13px] font-black pl-12 pr-28 py-3 bg-white border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-${theme}-500 focus:ring-4 focus:ring-${theme}-50 transition-all text-slate-800 placeholder:text-slate-400 shadow-sm`}
        />
        <button
          type="submit"
          className={`absolute right-2 top-[24px] bg-${theme}-600 text-white px-4 py-2 rounded-lg text-[11px] font-black tracking-widest uppercase hover:bg-${theme}-700 transition-all shadow-md shadow-${theme}-600/20`}
        >
          Buat Modul
        </button>
      </form>
    </div>
  );
};
