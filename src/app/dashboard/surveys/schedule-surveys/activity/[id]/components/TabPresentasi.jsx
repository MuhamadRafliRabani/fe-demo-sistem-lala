import React, { useState } from "react";
import {
  ChevronLeft,
  FileText,
  ExternalLink,
  Download,
  Minimize2,
  Maximize2,
} from "lucide-react";

const pdfUrl = "/asset/Presentasi Compro Langitlangit.pdf";

const PdfToolbar = ({ expanded, onClose, setIsPdfExpanded }) => (
  <div
    className={`p-4 md:p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6 bg-[#1c2f3d]/50 backdrop-blur-md ${
      expanded ? "rounded-t-2xl md:rounded-t-[2.5rem]" : ""
    }`}
  >
    <div className="flex items-center gap-5">
      {expanded && (
        <button
          onClick={onClose}
          className="flex items-center gap-2 pr-4 border-r border-white/10 text-slate-400 hover:text-white transition-colors group/back"
        >
          <ChevronLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Kembali
          </span>
        </button>
      )}
      <div className="w-12 h-12 bg-cyan-400/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-400/20 shadow-lg">
        <FileText size={24} />
      </div>
      <div>
        <h3 className="text-base font-bold text-white uppercase tracking-tight">
          Project_Infrastructure_Plan.pdf
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-nowrap">
            Digital Asset
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-700 shrink-0"></div>
          <span className="text-[10px] text-cyan-400/60 font-bold uppercase tracking-widest text-nowrap">
            Secured Module
          </span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3">
      {/* Buka di Tab Lain Button */}
      <button
        onClick={() => window.open(pdfUrl, "_blank")}
        className="flex items-center gap-0 hover:gap-3 px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-500 group/btn"
      >
        <ExternalLink size={18} className="shrink-0" />
        <span className="max-w-0 overflow-hidden opacity-0 group-hover/btn:max-w-[150px] group-hover/btn:opacity-100 transition-all duration-500 text-[10px] font-bold uppercase whitespace-nowrap px-0 group-hover/btn:px-1">
          Buka Di Tab Lain
        </span>
      </button>

      {/* Download Button */}
      <a
        href={pdfUrl}
        download
        className="flex items-center gap-0 hover:gap-3 px-3 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-500 group/btn"
      >
        <Download size={18} className="shrink-0" />
        <span className="max-w-0 overflow-hidden opacity-0 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 transition-all duration-500 text-[10px] font-bold uppercase whitespace-nowrap px-0 group-hover/btn:px-1">
          Download
        </span>
      </a>

      <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

      {/* Expand / Close Button */}
      <button
        onClick={() => (expanded ? onClose() : setIsPdfExpanded(true))}
        className={`flex items-center gap-0 hover:gap-3 px-6 py-3 rounded-2xl transition-all duration-500 group/btn shadow-lg ${
          expanded ?
            "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          : "bg-cyan-400 text-black shadow-cyan-400/20"
        }`}
      >
        {expanded ?
          <Minimize2 size={18} className="shrink-0" />
        : <Maximize2 size={18} className="shrink-0" />}
        <span className="max-w-0 overflow-hidden opacity-0 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 transition-all duration-500 text-[10px] font-bold uppercase whitespace-nowrap px-0 group-hover/btn:px-1">
          {expanded ? "Kecilkan" : "Expand"}
        </span>
      </button>
    </div>
  </div>
);

export const TabPresentasi = () => {
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 h-[850px]">
      {/* CUSTOM TOOLBAR HEADER */}
      <PdfToolbar
        expanded={isPdfExpanded}
        onClose={() => setIsPdfExpanded(false)}
        setIsPdfExpanded={setIsPdfExpanded}
      />

      {/* PDF VIEWER FRAME (CLEAN) */}
      <div className="flex-1 w-full bg-[#0a0f14] relative">
        <iframe
          src={`${pdfUrl}#toolbar=0&scrollbar=0`}
          className="w-full h-full border-none"
          title="PDF Viewer"
        />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
