"use client";

import { useState } from "react";
import {
  QUALITY_TIERS,
  SPEC_DETAILS,
} from "@/hooks/use-construction-estimator";
import {
  Info,
  X,
  Check,
  Zap,
  BrickWall,
  Layers,
  Umbrella,
  Wind,
  Droplet,
  PaintBucket,
  DoorOpen,
} from "lucide-react";

const SpecModal = ({ isOpen, onClose, tierId }) => {
  if (!isOpen) return null;
  const specs = SPEC_DETAILS[tierId];
  const tier = QUALITY_TIERS[tierId];

  const categoryConfig = {
    atap: { label: "Atap", icon: Umbrella },
    plafon: { label: "Plafon", icon: Wind },
    dinding: { label: "Dinding", icon: BrickWall },
    lantai: { label: "Lantai", icon: Layers },
    pintu_jendela: { label: "Pintu & Jendela", icon: DoorOpen },
    sanitair: { label: "Sanitair", icon: Droplet },
    listrik: { label: "Listrik", icon: Zap },
  };

  const formatSubKey = (key) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${tier.color}`}
        >
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              Spesifikasi {tier.label}
              <span className="text-sm font-normal opacity-80">
                {tier.subLabel}
              </span>
            </h3>
            <p className="text-sm opacity-90 mt-1">
              Detail material yang digunakan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(specs).map((key) => {
              const config = categoryConfig[key] || {
                label: key,
                icon: Info,
              };
              const Icon = config.icon;
              const subCategories = specs[key];

              return (
                <div
                  key={key}
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Icon size={18} className="text-blue-500" />
                    {config.label}
                  </div>
                  <div className="space-y-3">
                    {Object.entries(subCategories).map(
                      ([subKey, items], idx) => (
                        <div key={subKey}>
                          <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            {formatSubKey(subKey)}
                          </h5>
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li
                                key={i}
                                className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                              >
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export function QualitySelector({ selected, onSelect }) {
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Pilih Kelas Bangunan
          </h3>
          <button
            onClick={() => setShowSpecsModal(true)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
          >
            <Info size={14} />
            Lihat Detail Spek
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Object.values(QUALITY_TIERS).map((tier) => (
            <div key={tier.id} className="relative group">
              <button
                onClick={() => onSelect(tier.id)}
                className={`w-full relative p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-start gap-4
                  ${
                    selected === tier.id ?
                      `${tier.color} border-current shadow-md scale-[1.01]`
                    : "bg-card border-border hover:border-primary/50 text-foreground hover:bg-accent/50"
                  }`}
              >
                <div
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${selected === tier.id ? "border-current" : "border-muted-foreground/50 bg-muted/50"}`}
                >
                  {selected === tier.id && (
                    <div className="w-3 h-3 rounded-full bg-current" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-lg">{tier.label}</span>
                    {selected === tier.id && (
                      <Check size={18} className="text-current" />
                    )}
                  </div>
                  <div className="text-sm font-medium opacity-90 mb-2">
                    {tier.subLabel}
                  </div>
                  <div className="text-xs opacity-80 leading-relaxed">
                    {tier.description}
                  </div>
                  <div className="text-xs font-semibold mt-2 px-2 py-0.5 rounded-full bg-background/50 border border-border inline-block">
                    Faktor Pengali: {tier.multiplier}x
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      <SpecModal
        isOpen={showSpecsModal}
        onClose={() => setShowSpecsModal(false)}
        tierId={selected}
      />
    </>
  );
}
