/**
 * generate-daily-report-pdf.js
 *
 * Drop-in replacement untuk versi html2pdf.js lama.
 * Signature fungsi IDENTIK — tidak ada perubahan di DailyReportForm.
 *
 * Stack: @react-pdf/renderer (true PDF, bukan screenshot)
 * Install: npm install @react-pdf/renderer
 *
 * Perbaikan v2:
 * - Footer nempel paling bawah tiap halaman (fixed + paddingBottom di Page)
 * - Header fixed + paddingTop di Page = halaman 2+ punya jarak atas yang benar
 * - Info-grid (Nama Project, Pengawas, Tanggal) hanya muncul di halaman 1
 */

import React from "react";
import {
  pdf,
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const FONT = "Helvetica"; // built-in, tidak perlu file eksternal

// ─── Ukuran fixed elements ────────────────────────────────────────────────────
// Nilai ini dipakai untuk paddingTop/paddingBottom Page agar konten
// tidak tertutup header/footer yang fixed.
const TOPBAR_H = 5; // height top bar
const HEADER_H = 78; // topBar + header row + rule (estimasi pt)
const FOOTER_H = 28; // footer paddingVertical*2 + text height

// ─── Warna ────────────────────────────────────────────────────────────────────
const C = {
  dark: "#1A1A2E",
  white: "#FFFFFF",
  border: "#E2E8F0",
  muted: "#94A3B8",
  mutedDark: "#64748B",
  text: "#374151",
  bg: "#F8FAFC",
  bgLight: "#FAFBFC",
  bgImg: "#F1F5F9",
};

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // ── Page
  // paddingTop  = ruang untuk header fixed (topBar + header)
  // paddingBottom = ruang untuk footer fixed
  page: {
    fontFamily: FONT,
    fontSize: 10,
    color: C.dark,
    backgroundColor: C.white,
    paddingTop: HEADER_H,
    paddingBottom: FOOTER_H,
  },

  // ── Top bar (fixed — muncul di semua halaman)
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: TOPBAR_H,
    backgroundColor: C.dark,
  },

  // ── Header (fixed — muncul di semua halaman)
  header: {
    position: "absolute",
    top: TOPBAR_H,
    left: 0,
    right: 0,
    paddingHorizontal: 36,
    paddingTop: 18,
    paddingBottom: 0,
    backgroundColor: C.white,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandName: {
    fontSize: 14,
    fontFamily: `${FONT}-Bold`,
    color: C.dark,
  },
  brandSub: { fontSize: 8, color: C.muted, marginTop: 3 },
  docLabel: {
    fontSize: 7.5,
    fontFamily: `${FONT}-Bold`,
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "right",
    marginBottom: 3,
  },
  docDate: {
    fontSize: 18,
    fontFamily: `${FONT}-Bold`,
    color: C.dark,
    textAlign: "right",
    letterSpacing: -0.3,
  },
  hdrRule: { height: 1, backgroundColor: C.border, marginTop: 14 },

  // ── Info grid (hanya halaman 1, BUKAN fixed)
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginHorizontal: 0,
  },
  infoCell: { flex: 1, paddingVertical: 11, paddingHorizontal: 16 },
  infoCellBorder: { borderRightWidth: 1, borderRightColor: C.border },
  infoLabel: {
    fontSize: 7,
    fontFamily: `${FONT}-Bold`,
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  infoVal: { fontSize: 10, fontFamily: `${FONT}-Bold`, color: C.dark },

  // ── Body
  body: { paddingHorizontal: 36, paddingTop: 20, paddingBottom: 16 },

  // ── Section
  sec: { marginBottom: 20 },
  secHdr: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  secBadge: {
    backgroundColor: C.dark,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    marginRight: 8,
  },
  secBadgeTxt: {
    fontSize: 7.5,
    fontFamily: `${FONT}-Bold`,
    color: C.white,
    letterSpacing: 1,
  },
  secTitle: {
    fontSize: 8.5,
    fontFamily: `${FONT}-Bold`,
    color: C.dark,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginRight: 10,
  },
  secRule: { flex: 1, height: 1, backgroundColor: C.border },

  // ── Progress
  progressText: { fontSize: 10, color: C.text, lineHeight: 1.75 },
  workersBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: C.bg,
    borderLeftWidth: 3,
    borderLeftColor: C.dark,
  },
  workersLabel: {
    fontSize: 8,
    fontFamily: `${FONT}-Bold`,
    color: C.mutedDark,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginRight: 8,
  },
  workersVal: { fontSize: 10, fontFamily: `${FONT}-Bold`, color: C.dark },

  // ── Issues table
  issueTable: { width: "100%" },
  issueThead: {
    flexDirection: "row",
    backgroundColor: C.bg,
    borderBottomWidth: 2,
    borderBottomColor: C.dark,
  },
  issueTh: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 7.5,
    fontFamily: `${FONT}-Bold`,
    color: C.mutedDark,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  issueThBorder: { borderRightWidth: 1, borderRightColor: C.border },
  issueTr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  issueTd: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 9.5,
    color: C.text,
  },
  issueTdBorder: { borderRightWidth: 1, borderRightColor: C.border },

  // ── Photo grid
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoCard: { width: "48.5%", borderWidth: 1, borderColor: C.border },
  photoImgWrap: {
    width: "100%",
    height: 130,
    backgroundColor: C.bgImg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoImg: { width: "100%", height: 130, objectFit: "contain" },
  photoCap: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bgLight,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  photoCapBadge: {
    backgroundColor: C.dark,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginRight: 6,
  },
  photoCapBadgeTxt: { fontSize: 7, fontFamily: `${FONT}-Bold`, color: C.white },
  photoCapText: { fontSize: 8.5, color: C.mutedDark, flexShrink: 1 },

  // ── Plans
  planItem: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 3,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  planItemAlt: { backgroundColor: C.bgLight },
  planNo: {
    fontSize: 8,
    fontFamily: `${FONT}-Bold`,
    color: C.muted,
    marginRight: 12,
    marginTop: 1,
  },
  planText: { fontSize: 9.5, color: C.text, lineHeight: 1.5, flex: 1 },

  // ── Signature
  signatureWrap: {
    marginHorizontal: 36,
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: "flex-end",
  },
  sigInner: { alignItems: "center", minWidth: 170 },
  sigBy: { fontSize: 9, color: C.muted, marginBottom: 38 },
  sigLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: C.dark,
    width: "100%",
    marginBottom: 7,
  },
  sigName: {
    fontSize: 10,
    fontFamily: `${FONT}-Bold`,
    color: C.dark,
    marginBottom: 2,
  },
  sigRole: {
    fontSize: 7,
    fontFamily: `${FONT}-Bold`,
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ── Footer (fixed — nempel paling bawah setiap halaman)
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_H,
    backgroundColor: C.dark,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  footerTxt: { fontSize: 8, color: C.muted, letterSpacing: 0.3 },

  // ── Empty state
  emptyTxt: { fontSize: 10, color: "#CBD5E1", fontStyle: "italic" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toBase64 = async (src, maxW = 1200, q = 0.85) => {
  if (!src) return "";
  if (src.startsWith("data:")) return src;
  if (src.startsWith("blob:")) return src;

  const url =
    src.includes("drive.google.com") || src.includes("googleusercontent.com")
      ? `/api/proxy-image?url=${encodeURIComponent(src)}`
      : src;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width || maxW;
      const h = img.naturalHeight || img.height || Math.round(maxW * 0.75);
      const scale = Math.min(1, maxW / Math.max(1, w));
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));
      const cv = document.createElement("canvas");
      cv.width = tw;
      cv.height = th;
      const ctx = cv.getContext("2d", { alpha: false });
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, tw, th);
      ctx.drawImage(img, 0, 0, tw, th);
      resolve(cv.toDataURL("image/jpeg", q));
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

const resolvePhotoSrc = (p) => p?.localPreviewUrl || p?.url || "";

const stripHtml = (html = "") =>
  String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();

// ─── Sub-components ───────────────────────────────────────────────────────────
const SecHeader = ({ no, title }) => (
  <View style={s.secHdr} wrap={false}>
    <View style={s.secBadge}>
      <Text style={s.secBadgeTxt}>{no}</Text>
    </View>
    <Text style={s.secTitle}>{title}</Text>
    <View style={s.secRule} />
  </View>
);

// ─── PDF Document ─────────────────────────────────────────────────────────────
const DailyReportDocument = ({
  formData,
  photos,
  issues,
  plans,
  formattedDate,
  audience,
}) => {
  const isCustomer = audience === "customer";
  const dateStr = new Date(formData.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const docsNo = isCustomer ? "02" : "03";
  const plansNo = isCustomer ? "03" : "04";
  const validIssues = (issues || []).filter((i) => i.problem || i.solution);
  const validPlans = (plans || []).filter((p) => p.task);
  const progressText = stripHtml(formData.progress);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ══ TOP BAR — absolute, setiap halaman ══ */}
        <View style={s.topBar} fixed />

        {/* ══ HEADER — absolute, setiap halaman ══ */}
        <View style={s.header} fixed>
          <View style={s.headerRow}>
            <View>
              {/*
                Untuk logo gambar, uncomment baris di bawah dan hapus brandName Text.
                Pastikan file bisa diakses sebagai URL absolut atau data URL base64.
                <Image
                  src="/langit-langit/langit-langit-name-dark.png"
                  style={{ height: 24, marginBottom: 3 }}
                />
              */}
              <Text style={s.brandName}>langitlangit.id</Text>
              <Text style={s.brandSub}>PT Langit Karya Indonesia</Text>
            </View>
            <View>
              <Text style={s.docLabel}>Laporan Harian Proyek</Text>
              <Text style={s.docDate}>{formattedDate}</Text>
            </View>
          </View>
          <View style={s.hdrRule} />
        </View>

        {/* ══ FOOTER — absolute bottom, setiap halaman ══ */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>
            PT Langit Karya Indonesia — Dokumen Internal
          </Text>
          <Text style={s.footerTxt}>
            Laporan Harian · {formData.date || ""}
          </Text>
        </View>

        {/* ══ INFO GRID — hanya halaman 1, mengalir normal setelah header ══ */}
        <View style={s.infoRow}>
          <View style={[s.infoCell, s.infoCellBorder]}>
            <Text style={s.infoLabel}>Nama Project</Text>
            <Text style={s.infoVal}>{formData.customer || "—"}</Text>
          </View>
          <View style={[s.infoCell, s.infoCellBorder]}>
            <Text style={s.infoLabel}>Pengawas Lapangan</Text>
            <Text style={s.infoVal}>{formData.supervisor || "—"}</Text>
          </View>
          <View style={s.infoCell}>
            <Text style={s.infoLabel}>Tanggal</Text>
            <Text style={s.infoVal}>{dateStr}</Text>
          </View>
        </View>

        {/* ══ BODY ══ */}
        <View style={s.body}>
          {/* 01 — Progress */}
          <View style={s.sec}>
            <SecHeader no="01" title="Progress Pekerjaan" />
            {progressText ? (
              <Text style={s.progressText}>{progressText}</Text>
            ) : (
              <Text style={s.emptyTxt}>Belum ada deskripsi progress.</Text>
            )}
            <View style={s.workersBar} wrap={false}>
              <Text style={s.workersLabel}>Tenaga Kerja</Text>
              <Text style={s.workersVal}>{formData.workers || "—"}</Text>
            </View>
          </View>

          {/* 02 — Kendala (management only) */}
          {!isCustomer && (
            <View style={s.sec}>
              <SecHeader no="02" title="Kendala & Solusi" />
              {validIssues.length > 0 ? (
                <View style={s.issueTable}>
                  <View style={s.issueThead} wrap={false}>
                    <Text style={[s.issueTh, s.issueThBorder]}>
                      Kendala / Masalah
                    </Text>
                    <Text style={s.issueTh}>Solusi / Tindakan</Text>
                  </View>
                  {validIssues.map((issue, idx) => (
                    <View key={idx} style={s.issueTr} wrap={false}>
                      <Text style={[s.issueTd, s.issueTdBorder]}>
                        {issue.problem || "—"}
                      </Text>
                      <Text style={s.issueTd}>{issue.solution || "—"}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={s.emptyTxt}>
                  Tidak ada kendala yang dilaporkan.
                </Text>
              )}
            </View>
          )}

          {/* 03/02 — Dokumentasi */}
          <View style={s.sec}>
            <SecHeader no={docsNo} title="Dokumentasi Lapangan" />
            {photos.length > 0 ? (
              <View style={s.photoGrid}>
                {photos.map((ph, idx) => (
                  <View key={idx} style={s.photoCard} wrap={false}>
                    <View style={s.photoImgWrap}>
                      {ph.pdfSrc ? (
                        <Image src={ph.pdfSrc} style={s.photoImg} />
                      ) : null}
                    </View>
                    <View style={s.photoCap}>
                      <View style={s.photoCapBadge}>
                        <Text style={s.photoCapBadgeTxt}>
                          {String(idx + 1).padStart(2, "0")}
                        </Text>
                      </View>
                      <Text style={s.photoCapText}>
                        {ph.caption || `Lampiran ${idx + 1}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={s.emptyTxt}>Belum ada lampiran dokumentasi.</Text>
            )}
          </View>

          {/* 04/03 — Rencana */}
          <View style={s.sec}>
            <SecHeader no={plansNo} title="Rencana Pekerjaan Besok" />
            {validPlans.length > 0 ? (
              <View>
                {validPlans.map((p, idx) => (
                  <View
                    key={idx}
                    style={[s.planItem, idx % 2 === 1 && s.planItemAlt]}
                    wrap={false}
                  >
                    <Text style={s.planNo}>
                      {String(idx + 1).padStart(2, "0")}
                    </Text>
                    <Text style={s.planText}>{p.task}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={s.emptyTxt}>
                Belum ada rencana detail untuk besok.
              </Text>
            )}
          </View>
        </View>

        {/* ══ TANDA TANGAN ══ */}
        <View style={s.signatureWrap} wrap={false}>
          <View style={s.sigInner}>
            <Text style={s.sigBy}>Dibuat & Disetujui Oleh,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>
              {formData.supervisor || "(................................)"}
            </Text>
            <Text style={s.sigRole}>Pengawas Lapangan</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ─── Main export (signature IDENTIK dengan versi lama) ────────────────────────
export const generateDailyReportPdf = async ({
  formData,
  photos,
  issues,
  plans,
  formattedDate,
  audience = "management",
  onProgress,
}) => {
  const pdfAudience = audience === "customer" ? "customer" : "management";
  const readyPhotos = (photos || []).filter((p) => {
    if (p?.uploadError) return false;
    return Boolean(resolvePhotoSrc(p));
  });

  onProgress?.({
    stage: "init",
    progress: 5,
    message: "Menyiapkan data PDF...",
  });

  const preparedPhotos = [];
  for (let i = 0; i < readyPhotos.length; i++) {
    const p = readyPhotos[i];
    const src = resolvePhotoSrc(p);
    const pdfSrc = await toBase64(src, 1200, 0.85);
    if (!pdfSrc) {
      continue;
    }
    preparedPhotos.push({ ...p, pdfSrc, _i: i });
    onProgress?.({
      stage: "images",
      progress: readyPhotos.length
        ? 10 + Math.round(((i + 1) / readyPhotos.length) * 50)
        : 60,
      message: `Menyiapkan gambar ${i + 1}/${readyPhotos.length}...`,
    });
  }

  onProgress?.({
    stage: "render",
    progress: 65,
    message: "Menyusun layout PDF...",
  });

  const docElement = (
    <DailyReportDocument
      formData={formData}
      photos={preparedPhotos}
      issues={issues}
      plans={plans}
      formattedDate={formattedDate}
      audience={pdfAudience}
    />
  );

  onProgress?.({ stage: "render", progress: 80, message: "Merender PDF..." });

  const blob = await pdf(docElement).toBlob();
  const filename = `laporan-harian-${pdfAudience}-${formData.date}.pdf`;

  onProgress?.({
    stage: "done",
    progress: 100,
    message: "PDF berhasil disiapkan.",
  });

  return { blob, filename, audience: pdfAudience };
};
