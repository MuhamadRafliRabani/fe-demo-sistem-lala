"use client";

export default function StatusBadge({ status }) {
  switch (status) {
    case "done":
      return (
        <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          Done
        </span>
      );
    case "critical":
      return (
        <span className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.1)]">
          Critical
        </span>
      );
    case "warning":
      return (
        <span className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(254,216,24,0.1)]">
          Warning
        </span>
      );
    case "on-track":
      return (
        <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/40 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(19,90,134,0.1)]">
          On Track
        </span>
      );
    default:
      return null;
  }
}
