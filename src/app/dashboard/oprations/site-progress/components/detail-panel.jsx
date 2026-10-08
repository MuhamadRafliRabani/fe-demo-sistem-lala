"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  getDailyReportStatus,
  extractProgressText,
} from "@/lib/report-daily-utility";
import { resolveImageUrl } from "@/lib/resolve-image-url";

// ─── Shared atoms ─────────────────────────────────────────────────────────────

function SectionLabel({ num, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[9px] font-[family-name:var(--font-dm-mono)] font-medium tracking-[1px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-sm">
        {num}
      </span>
      <span className="text-[10px] font-[family-name:var(--font-dm-mono)] tracking-[1.2px] text-stone-500 uppercase">
        {title}
      </span>
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="p-3.5">
      <p className="text-[9px] font-[family-name:var(--font-dm-mono)] tracking-[1.5px] uppercase text-stone-400 mb-1">
        {label}
      </p>
      <p className="text-[13px] font-medium text-stone-900 leading-snug">
        {value || "—"}
      </p>
    </div>
  );
}

function EmptyState({ message, muted = false, danger = false }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-10 text-center gap-3">
      <div className="text-3xl opacity-20">⬜</div>
      <p
        className={[
          "text-[12px] font-[family-name:var(--font-dm-mono)] tracking-[0.5px]",
          danger
            ? "text-rose-500"
            : muted
              ? "text-stone-400"
              : "text-stone-500",
        ].join(" ")}
      >
        {message}
      </p>
    </div>
  );
}

// ─── Section: Progress ────────────────────────────────────────────────────────

function ProgressSection({ text, workers }) {
  return (
    <div className="px-5 py-4 border-b border-stone-200/70">
      <SectionLabel num="01" title="Progress Pekerjaan" />
      <p className="text-[13px] text-stone-700 leading-relaxed">
        {text || (
          <span className="italic text-stone-400">
            Belum ada deskripsi progress.
          </span>
        )}
      </p>
      {workers && (
        <div className="mt-3 inline-flex items-center gap-2 bg-stone-50 border border-stone-200/70 rounded px-3 py-1.5">
          <span className="text-[9px] font-[family-name:var(--font-dm-mono)] tracking-[1px] text-stone-400 uppercase">
            Tenaga Kerja
          </span>
          <span className="text-[13px] font-medium text-stone-900 font-[family-name:var(--font-dm-mono)]">
            {workers}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Section: Issues ─────────────────────────────────────────────────────────

function IssuesSection({ issues }) {
  const filtered = (issues ?? []).filter((i) => i.problem || i.solution);

  return (
    <div className="px-5 py-4 border-b border-stone-200/70">
      <SectionLabel num="02" title="Kendala & Solusi" />
      {filtered.length === 0 ? (
        <p className="text-[12px] italic text-stone-400 font-[family-name:var(--font-dm-mono)]">
          Tidak ada kendala dilaporkan.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((issue, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2">
              <div className="bg-stone-50 border border-stone-200/70 rounded p-2.5">
                <p className="text-[8.5px] font-[family-name:var(--font-dm-mono)] tracking-[1px] uppercase text-stone-400 mb-1">
                  Kendala
                </p>
                <p className="text-[12px] text-stone-700 leading-relaxed">
                  {issue.problem || "—"}
                </p>
              </div>
              <div className="bg-stone-50 border border-stone-200/70 rounded p-2.5">
                <p className="text-[8.5px] font-[family-name:var(--font-dm-mono)] tracking-[1px] uppercase text-stone-400 mb-1">
                  Solusi
                </p>
                <p className="text-[12px] text-stone-700 leading-relaxed">
                  {issue.solution || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: Photos ─────────────────────────────────────────────────────────

function PhotosSection({ photos }) {
  const getProxiedUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("blob:")) return url;
    if (
      url.includes("drive.google.com") ||
      url.includes("googleusercontent.com")
    ) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  function PhotoCard({ photo, idx }) {
    const [failed, setFailed] = useState(false);

    const raw =
      photo?.localPreviewUrl ??
      photo?.url ??
      photo?.thumbnail_url ??
      photo?.thumbnailUrl ??
      "";

    const resolved = resolveImageUrl(raw);
    const src = getProxiedUrl(resolved);

    const canShow = !failed && Boolean(src);
    const caption = photo?.caption || `Lampiran ${idx + 1}`;

    return (
      <div className="border border-stone-200/70 rounded overflow-hidden bg-white">
        <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
          {canShow ? (
            <img
              src={src}
              alt={caption}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
              <span className="text-stone-500 text-[11px] font-[family-name:var(--font-dm-mono)] tracking-[0.5px]">
                Gambar tidak bisa dimuat
              </span>
            </div>
          )}
        </div>
        <div className="px-2.5 py-2 border-t border-stone-200/70 flex items-start gap-1.5 bg-white">
          <span className="text-[9px] font-[family-name:var(--font-dm-mono)] font-medium text-white bg-stone-900 px-1.5 py-0.5 rounded-sm flex-shrink-0">
            {String(idx + 1).padStart(2, "0")}
          </span>
          <span className="text-[11px] text-stone-700 leading-tight">
            {caption}
          </span>
        </div>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="px-5 py-4 border-b border-stone-200/70">
        <SectionLabel num="03" title="Dokumentasi Lapangan" />
        <p className="text-[12px] italic text-stone-400 font-[family-name:var(--font-dm-mono)]">
          Belum ada lampiran dokumentasi.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 border-b border-stone-200/70">
      <SectionLabel num="03" title="Dokumentasi Lapangan" />
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo, idx) => (
          <PhotoCard key={idx} photo={photo} idx={idx} />
        ))}
      </div>
    </div>
  );
}

// ─── Section: Plans ───────────────────────────────────────────────────────────

function PlansSection({ plans }) {
  const filtered = (plans ?? []).filter((p) => p.task);

  return (
    <div className="px-5 py-4">
      <SectionLabel num="04" title="Rencana Pekerjaan Besok" />
      {filtered.length === 0 ? (
        <p className="text-[12px] italic text-stone-400 font-[family-name:var(--font-dm-mono)]">
          Belum ada rencana detail untuk besok.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-stone-200/70">
          {filtered.map((plan, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="text-[10px] font-[family-name:var(--font-dm-mono)] font-medium text-stone-400 min-w-[20px] mt-0.5">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-[13px] text-stone-800 leading-relaxed">
                {plan.task}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DetailPanel({
  siteId,
  selectedDate,
  siteProgress,
  report,
  isLoading,
  error,
}) {
  const status = report ? getDailyReportStatus(report) : null;

  const progressText = useMemo(
    () =>
      extractProgressText(
        report?.progress_html ?? report?.progress ?? report?.progressText,
      ),
    [report],
  );

  const projectName = report?.project_name ?? siteProgress?.project_name ?? "—";
  const supervisorName =
    report?.supervisor_name ?? siteProgress?.site_leader ?? "—";
  const location = report?.location ?? siteProgress?.location ?? "—";
  const workers = report?.workers ?? null;

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-md">
      {/* Dark header */}
      <div className="flex-shrink-0 bg-stone-900 px-5 py-5">
        <p className="text-[9px] font-[family-name:var(--font-dm-mono)] tracking-[2px] text-stone-500 uppercase mb-1.5">
          Detail Laporan
        </p>
        <h2 className="text-[22px] leading-tight font-black text-white font-[family-name:var(--font-playfair)] tracking-tight">
          {format(selectedDate, "eeee, d MMMM yyyy", { locale: id })}
        </h2>

        {status && (
          <div
            className={[
              "inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full",
              "text-[9px] font-[family-name:var(--font-dm-mono)] tracking-[1.5px] uppercase",
              status === "submitted"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/10 text-stone-400",
            ].join(" ")}
          >
            <div
              className={[
                "w-1.5 h-1.5 rounded-full",
                status === "submitted" ? "bg-amber-400" : "bg-stone-500",
              ].join(" ")}
            />
            {status === "submitted" ? "Submitted" : "Draft"}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto bg-white">
        {!siteId && <EmptyState message="Site ID tidak ditemukan dari URL." />}

        {siteId && isLoading && (
          <EmptyState message="Memuat laporan..." muted />
        )}

        {siteId && error && !isLoading && (
          <EmptyState
            message="Gagal mengambil laporan untuk tanggal ini."
            danger
          />
        )}

        {siteId && !isLoading && !error && !report && (
          <EmptyState message="Belum ada laporan di tanggal ini." />
        )}

        {siteId && report && !isLoading && (
          <>
            <div className="grid grid-cols-2 divide-x divide-y divide-stone-200/70 border-b border-stone-200/70">
              <MetaCell label="Project" value={projectName} />
              <MetaCell label="Supervisor" value={supervisorName} />
              <MetaCell label="Lokasi" value={location} />
              <MetaCell label="Tenaga Kerja" value={String(workers ?? "—")} />
            </div>

            <ProgressSection text={progressText} workers={workers} />
            <IssuesSection issues={report.issues} />
            <PhotosSection photos={report.photos} />
            <PlansSection plans={report.plans} />
          </>
        )}
      </div>
    </div>
  );
}
