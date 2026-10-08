import { useState } from "react";

export const AnimatedTabs = ({ tabs, activeTab, setActiveTab }) => {
  const [hoveredTab, setHoveredTab] = useState(null);

  return (
    <div
      className="relative flex p-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl w-full lg:w-fit border border-slate-200/80 dark:border-slate-700/50 isolate overflow-hidden"
      onMouseLeave={() => setHoveredTab(null)}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id;
        return (
          <button
            key={tab.id}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 text-[12px] font-extrabold uppercase tracking-widest rounded-lg transition-colors duration-300 z-10 ${
              isActive ?
                `text-${tab.color || "blue"}-600 dark:text-${tab.color || "blue"}-400`
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.icon && <tab.icon size={16} strokeWidth={2.5} />}
            {tab.label}

            {/* Background Hover (Abu-abu pudar) */}
            {isHovered && !isActive && (
              <div className="absolute inset-0 bg-slate-300/30 dark:bg-slate-600/30 rounded-lg -z-10 animate-in fade-in duration-200" />
            )}
            {/* Background Active (Putih timbul / Dark Card) */}
            {isActive && (
              <div className="absolute inset-0 bg-white dark:bg-slate-900 shadow-sm dark:shadow-none border border-slate-200/50 dark:border-slate-700/50 -z-10 transition-all duration-300" />
            )}
          </button>
        );
      })}
    </div>
  );
};
