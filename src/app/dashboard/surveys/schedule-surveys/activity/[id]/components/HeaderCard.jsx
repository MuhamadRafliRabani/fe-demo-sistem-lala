import React from "react";
import { Zap, Timer, Send } from "lucide-react";

export const HeaderCard = ({
  projectData,
  currentTime,
  onTerminate,
  onOpenSendDialog,
}) => {
  if (!projectData) return null;

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-5 rounded-xl shadow-sm relative">
      <div className="flex items-center gap-5">
        <div className="p-3.5 bg-primary text-primary-foreground rounded-xl shadow-sm">
          <Zap size={22} fill="currentColor" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              System Live
            </p>
          </div>
          <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
            {projectData.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <div className="flex flex-col items-end px-6 border-r border-border group">
          <div className="flex items-center gap-2 mb-1">
            <Timer size={10} className="text-primary animate-spin-slow" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              Runtime Monitoring
            </p>
          </div>
          <p className="text-2xl font-mono font-black text-foreground tracking-tighter">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </p>
        </div>
        <button
          onClick={() => onOpenSendDialog && onOpenSendDialog()}
          className="px-5 py-3 bg-primary/10 hover:bg-primary border border-primary/30 rounded-2xl transition-all group active:scale-95 flex items-center gap-2"
        >
          <Send
            size={14}
            className="text-primary group-hover:text-primary-foreground"
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary group-hover:text-primary-foreground">
            Kirim Survey
          </span>
        </button>
        <button
          onClick={onTerminate}
          className="px-6 py-3 max-sm:col-span-2 bg-destructive/10 hover:bg-destructive border border-destructive/30 rounded-2xl transition-all group active:scale-95"
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-destructive group-hover:text-destructive-foreground">
            Akhiri Survey
          </span>
        </button>
      </div>
    </header>
  );
};
