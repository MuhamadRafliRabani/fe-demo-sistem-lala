import React from "react";
import {
  User,
  Phone,
  MapPin,
  Layers,
  Copy,
  ExternalLink,
  Clock,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const MonitoringSteps = ({ projectData }) => {
  if (!projectData) return null;

  const openMaps = () => {
    const url = projectData.link_address;

    if (!url) return;

    if (url.startsWith("http")) {
      window.open(url, "_blank");
      return;
    }

    window.open(
      `https://www.google.com/maps?q=${encodeURIComponent(url)}`,
      "_blank",
    );
  };

  return (
    <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
      <div className="grid grid-cols-1 xl:grid-cols-12">
        <div className="xl:col-span-5 p-8 lg:p-10 space-y-10 border-b lg:border-b-0 lg:border-r border-border relative z-10">
          <div className="grid grid-cols-1 gap-8">
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/15 transition-all">
                <User size={22} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-primary/80 uppercase tracking-widest">
                  Client Name
                </p>
                <h3 className="text-xl font-black text-foreground leading-none tracking-tight">
                  {projectData.client.name}
                </h3>
                <div className="flex items-center gap-2 cursor-copy">
                  <span className="group flex items-center gap-2 text-muted-foreground text-[11px] font-medium mt-1">
                    <Phone size={10} className="-mt-0.5" />{" "}
                    {projectData.client.phone}
                  </span>

                  <Copy
                    size={14}
                    className="opacity-0 translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 bg-secondary/80 border border-border rounded-xl flex items-center justify-center text-foreground group-hover:bg-accent transition-all">
                <MapPin size={22} />
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                  Survey Location
                </p>
                <h3 className="text-xl font-black text-foreground leading-none tracking-tight">
                  {projectData.location}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium truncate text-wrap max-w-xs">
                  {projectData.address}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <Layers size={14} className="text-primary" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                Survey Team
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {projectData.team.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-muted border border-border pl-1.5 pr-4 py-1.5 rounded-full shadow-sm hover:border-primary/30 transition-all"
                >
                  <div
                    className={`w-8 h-8 ${member.color} rounded-full flex items-center justify-center text-[11px] font-black text-black shadow-sm`}
                  >
                    {member.initial}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {member.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(projectData.link_address);
                toast.success("Address copied to clipboard");
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-muted hover:bg-accent border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground transition-all"
            >
              <Copy size={12} /> Copy Address
            </button>
            <button
              onClick={openMaps}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
            >
              <ExternalLink size={12} /> Open Maps
            </button>
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col md:flex-row relative">
          <div className="w-full md:w-1/2 p-8 lg:p-10 flex flex-col space-y-8 relative overflow-hidden bg-muted/50">
            <div className="absolute left-[47px] top-24 bottom-24 w-[1px] bg-border"></div>
            <div className="mb-2 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                <Clock size={16} />
              </div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                Estimasi Progress
              </p>
            </div>
            <div className="space-y-10 relative z-10">
              {projectData.monitoring.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className="relative mt-1.5">
                    <div
                      className={`w-4 h-4 rounded-full border-4 border-background transition-all duration-500 ${
                        step.status === "done"
                          ? "bg-primary shadow-sm"
                          : "bg-muted-foreground/50"
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                        step.status === "done"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <div className="flex items-center gap-4">
                      <h4
                        className={`text-2xl font-mono font-black tracking-tighter transition-colors ${
                          step.status === "done"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.actual || step.est}
                      </h4>
                      <div className="px-2 py-0.5 bg-background rounded border border-border flex items-center gap-1.5 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-tighter">
                        EST: {step.est}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col border-t md:border-t-0 md:border-l border-border">
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center border-b border-border bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">
                  Berangkat Pada
                </p>
              </div>
              <h2 className="text-5xl lg:text-6xl font-mono font-black text-foreground tracking-tighter group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                {projectData.monitoring.actualDeparture}
              </h2>
            </div>
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center bg-background/50 hover:bg-accent/30 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                  Selesai Pada
                </p>
              </div>
              <h2
                className={`text-5xl lg:text-6xl font-mono font-black tracking-tighter transition-all ${
                  projectData.monitoring.actualCompletion === "--:--"
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {projectData.monitoring.actualCompletion}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
