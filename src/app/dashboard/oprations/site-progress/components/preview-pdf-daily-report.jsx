import { resolveImageUrl } from "@/lib/resolve-image-url";
import { resolveImageUrlForPdf } from "@/lib/resolve-image-url-for-pdf";
import React from "react";

const PreviewPdfDailyReport = ({
  previewRef,
  formattedDate,
  formData,
  issues,
  plans,
  photos,
  getProxiedUrl,
}) => {
  return (
    <main className="w-full lg:w-[65%] bg-slate-100 overflow-y-auto p-4 sm:p-8 lg:p-10 flex flex-col items-center custom-scrollbar">
      <div className="w-full flex justify-center pb-16">
        <div
          ref={previewRef}
          className="bg-white shrink-0 shadow-xl"
          style={{
            width: "100%",
            maxWidth: "210mm",
            minHeight: "297mm",
            display: "flex",
            flexDirection: "column",
            color: "#1A1A2E",
          }}
        >
          {/* TOP BAR */}
          <div style={{ height: "5px", background: "#1A1A2E" }} />

          {/* HEADER */}
          <div style={{ padding: "32px 40px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <img
                  src="/langit-langit/langit-langit-name-dark.png"
                  alt="Langitlangit.id"
                  style={{
                    height: "32px",
                    objectFit: "contain",
                    marginBottom: "8px",
                  }}
                  onError={(e) => (e.target.style.display = "none")}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "#8892A4",
                    letterSpacing: "0.3px",
                    margin: 0,
                  }}
                >
                  PT Langit Karya Indonesia
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#8892A4",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    margin: "0 0 6px",
                  }}
                >
                  Laporan Harian Proyek
                </p>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "#1A1A2E",
                    margin: "0 0 8px",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "#E8ECF0",
                margin: "24px 0 0",
              }}
            />
          </div>

          {/* INFO PROYEK — 3 color blocks */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              margin: "0 40px",
              borderBottom: "1px solid #E8ECF0",
            }}
          >
            {[
              {
                label: "Nama Project",
                value: formData.customer || "—",
                accent: "#1A1A2E",
              },
              {
                label: "Pengawas Lapangan",
                value: formData.supervisor || "—",
                accent: "#1A1A2E",
              },
              {
                label: "Tanggal",
                value: new Date(formData.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
                accent: "#1A1A2E",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "18px 0",
                  borderRight: i < 2 ? "1px solid #E8ECF0" : "none",
                  paddingRight: i < 2 ? "20px" : "0",
                  paddingLeft: i > 0 ? "20px" : "0",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: "#8892A4",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    margin: "0 0 5px",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#1A1A2E",
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* BODY */}
          <div
            style={{
              flex: 1,
              padding: "28px 40px 40px",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
          >
            {/* ── 01 Progress ── */}
            <div data-pdf-section="progress">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <span
                  data-pdf-section-no
                  style={{
                    background: "#1A1A2E",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "3px 9px",
                    letterSpacing: "1px",
                  }}
                >
                  01
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#1A1A2E",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Progress Pekerjaan
                </span>
                <div
                  style={{ flex: 1, height: "1px", background: "#E8ECF0" }}
                />
              </div>

              {formData.progress ? (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#3D4A5C",
                    lineHeight: "1.85",
                  }}
                >
                  <div
                    className="ProseMirror rte-root"
                    dangerouslySetInnerHTML={{ __html: formData.progress }}
                  />
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#B0BAC8",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Belum ada deskripsi progress.
                </p>
              )}

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "14px",
                  padding: "9px 16px",
                  background: "#F4F6F8",
                  borderLeft: "3px solid #1A1A2E",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1A1A2E"
                  strokeWidth="2.5"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#8892A4",
                    fontWeight: "600",
                    letterSpacing: "0.5px",
                  }}
                >
                  TENAGA KERJA
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#1A1A2E",
                    fontWeight: "600",
                  }}
                >
                  {formData.workers || "—"}
                </span>
              </div>
            </div>

            {/* ── 02 Kendala ── */}
            <div data-pdf-section="issues">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <span
                  data-pdf-section-no
                  style={{
                    background: "#1A1A2E",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "3px 9px",
                    letterSpacing: "1px",
                  }}
                >
                  02
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#1A1A2E",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Kendala &amp; Solusi
                </span>
                <div
                  style={{ flex: 1, height: "1px", background: "#E8ECF0" }}
                />
              </div>

              {issues.filter((i) => i.problem || i.solution).length > 0 ? (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12.5px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          padding: "9px 14px",
                          textAlign: "left",
                          background: "#F4F6F8",
                          color: "#8892A4",
                          fontWeight: "700",
                          fontSize: "10px",
                          letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          borderBottom: "2px solid #1A1A2E",
                          width: "50%",
                        }}
                      >
                        Kendala / Masalah
                      </th>
                      <th
                        style={{
                          padding: "9px 14px",
                          textAlign: "left",
                          background: "#F4F6F8",
                          color: "#8892A4",
                          fontWeight: "700",
                          fontSize: "10px",
                          letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          borderBottom: "2px solid #1A1A2E",
                          width: "50%",
                        }}
                      >
                        Solusi / Tindakan
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues
                      .filter((i) => i.problem || i.solution)
                      .map((issue, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #E8ECF0" }}
                        >
                          <td
                            style={{
                              padding: "10px 14px",
                              color: "#3D4A5C",
                              verticalAlign: "top",
                              borderRight: "1px solid #E8ECF0",
                            }}
                          >
                            {issue.problem || "—"}
                          </td>
                          <td
                            style={{
                              padding: "10px 14px",
                              color: "#3D4A5C",
                              verticalAlign: "top",
                            }}
                          >
                            {issue.solution || "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#B0BAC8",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Tidak ada kendala yang dilaporkan.
                </p>
              )}
            </div>

            {/* ── 03 Dokumentasi ── */}
            <div data-pdf-section="photos">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <span
                  data-pdf-section-no
                  style={{
                    background: "#1A1A2E",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "3px 9px",
                    letterSpacing: "1px",
                  }}
                >
                  03
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#1A1A2E",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Dokumentasi Lapangan
                </span>
                <div
                  style={{ flex: 1, height: "1px", background: "#E8ECF0" }}
                />
              </div>

              {photos.length > 0 ? (
                <div
                  style={{
                    display: "flex", // DIGANTI KE FLEX SUPAYA TIDAK PECAH
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {photos.map((photo, idx) => {
                    const rawPdfSrc = resolveImageUrl(
                      photo.localPreviewUrl || photo.url,
                    );
                    // Gunakan proxy untuk PDF
                    const pdfImgSrc = getProxiedUrl(rawPdfSrc);

                    return (
                      <div
                        key={idx}
                        style={{
                          width: "calc(50% - 5px)", // GANTINYA GRID 1fr 1fr
                          border: "1px solid #E8ECF0",
                          overflow: "hidden",
                          breakInside: "avoid",
                          pageBreakInside: "avoid",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "16/9",
                            overflow: "hidden",
                            background: "#F4F6F8",
                            display: "flex", // TAMBAHAN AGAR CONTAIN RAPI
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <img
                            src={pdfImgSrc}
                            alt={`Dok ${idx + 1}`}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              // DI UBAH KE CONTAIN AGAR SESUAI ASLINYA
                              objectFit: "contain",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            padding: "8px 12px",
                            borderTop: "1px solid #E8ECF0",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#FAFBFC",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: "700",
                              color: "#FFFFFF",
                              background: "#1A1A2E",
                              padding: "2px 7px",
                              flexShrink: 0,
                            }}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#6B7585",
                              lineHeight: "1.3",
                            }}
                          >
                            {photo.caption || `Lampiran ${idx + 1}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #D1D8E0",
                    padding: "32px",
                    textAlign: "center",
                    background: "#FAFBFC",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#B0BAC8",
                      fontStyle: "italic",
                      margin: 0,
                    }}
                  >
                    Belum ada lampiran dokumentasi.
                  </p>
                </div>
              )}
            </div>

            {/* ── 04 Rencana Besok ── */}
            <div data-pdf-section="plans">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <span
                  data-pdf-section-no
                  style={{
                    background: "#1A1A2E",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "3px 9px",
                    letterSpacing: "1px",
                  }}
                >
                  04
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#1A1A2E",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  Rencana Pekerjaan Besok
                </span>
                <div
                  style={{ flex: 1, height: "1px", background: "#E8ECF0" }}
                />
              </div>

              {plans.filter((p) => p.task).length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {plans
                    .filter((p) => p.task)
                    .map((plan, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          padding: "10px 14px",
                          background: idx % 2 === 0 ? "#FAFBFC" : "#FFFFFF",
                          border: "1px solid #E8ECF0",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#8892A4",
                            minWidth: "18px",
                            marginTop: "1px",
                          }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#3D4A5C",
                            lineHeight: "1.5",
                          }}
                        >
                          {plan.task}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "13px",
                    color: "#B0BAC8",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Belum ada rencana detail untuk besok.
                </p>
              )}
            </div>
          </div>

          {/* TANDA TANGAN */}
          <div
            style={{
              margin: "0 40px 32px",
              paddingTop: "24px",
              borderTop: "1px solid #E8ECF0",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ textAlign: "center", minWidth: "200px" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: "#8892A4",
                  margin: "0 0 48px",
                }}
              >
                Dibuat &amp; Disetujui Oleh,
              </p>
              <div
                style={{
                  borderBottom: "1.5px solid #1A1A2E",
                  marginBottom: "10px",
                }}
              />
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1A1A2E",
                  margin: "0 0 3px",
                }}
              >
                {formData.supervisor || "(................................)"}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#8892A4",
                  fontWeight: "600",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Pengawas Lapangan
              </p>
            </div>
          </div>

          {/* FOOTER */}
          <div
            style={{
              background: "#1A1A2E",
              padding: "11px 40px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "#ffffff",
                letterSpacing: "0.3px",
              }}
            >
              PT Langit Karya Indonesia — Dokumen Internal
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#ffffff",
                letterSpacing: "0.5px",
              }}
            >
              Laporan Harian · {formData.date}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PreviewPdfDailyReport;
