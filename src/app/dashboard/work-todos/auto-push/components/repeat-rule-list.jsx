"use client";

import {
  Repeat,
  Trash2,
  Pencil,
  Clock,
  AlignLeft,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { getScheduleText } from "../utils/get-schedule-text";
import { resolveImageUrl } from "@/lib/resolve-image-url";

export const RepeatRuleList = ({
  repeatRules,
  repeatUsers,
  onToggle,
  onDelete,
  onEdit,
}) => {
  console.log("🚀 ~ RepeatRuleList ~ repeatRules:", repeatRules);
  // FUNGSI BAWAAN ANDA (TIDAK ADA YANG DIUBAH)
  const isImageFile = (value = "") => /\.(jpg|jpeg|png|gif|webp)$/i.test(value);
  // const getDueDayText = (value) => {
  //   if (!value) return "-";
  //   const d = new Date(value);
  //   if (Number.isNaN(d.getTime())) return "-";
  //   return `Due tgl ${d.getDate()}`;
  // };
  const getLabelColor = (labelName) => {
    if (!labelName) return "bg-transparent";
    const label = String(labelName).toLowerCase();
    if (label === "easy" || label === "ringan") return "bg-[#4bce97]";
    if (label === "medium") return "bg-[#f5cd47]";
    if (label === "hard") return "bg-[#f87168]";
    if (label === "very hard" || label === "very_hard") return "bg-[#c9372c]";
    return "bg-[#8590a2]";
  };

  // --- LOGIKA GROUPING (BEST PRACTICE) ---
  const groupedRules = useMemo(() => {
    return repeatRules.reduce((acc, rule) => {
      const type = rule.repeat_type || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(rule);
      return acc;
    }, {});
  }, [repeatRules]);

  const groupOrder = [
    { key: "daily", title: "Daily / Setiap Hari" },
    { key: "weekly", title: "Weekly / Mingguan" },
    { key: "monthly", title: "Monthly / Bulanan" },
    { key: "specific_dates", title: "Specific Dates / Tanggal Spesifik" },
    { key: "other", title: "Lain-lain" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0f1a22]">
      <div className="p-6 h-full flex flex-col">
        {/* HEADER ASLI ANDA */}
        <div className="flex items-center justify-between mb-6 border-b border-[#363430] pb-4">
          <h3 className="text-[18px] font-bold text-[#fffdf5] flex items-center gap-2">
            <Clock size={20} className="text-[#f5cd47]" /> Active Auto-Push
            Rules
          </h3>
          <span className="bg-[#1e2732] border border-[#363430] text-[#9fadbc] px-3 py-1 rounded-full text-[12px] font-bold">
            Total: {repeatRules.length} Rule
          </span>
        </div>

        {/* CONTAINER DAFTAR (Ubah jadi flex-col untuk tumpukan grup) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-6 content-start">
          {repeatRules.length === 0 ? (
            <div className="w-full h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-[#363430] rounded-xl text-[#9fadbc]">
              <Repeat size={32} className="mb-2 opacity-40" />
              <p className="text-[14px] font-medium">
                Belum ada aturan repeat yang aktif.
              </p>
            </div>
          ) : (
            groupOrder.map(({ key, title }) => {
              const rules = groupedRules[key];
              if (!rules || rules.length === 0) return null;

              return (
                <div key={key} className="flex flex-col gap-3">
                  {/* LABEL GRUP */}
                  <div className="flex items-center gap-2 border-b border-[#363430]/50 pb-2">
                    <h4 className="text-[13px] font-bold text-[#9fadbc] uppercase tracking-wider">
                      {title}
                    </h4>
                    <span className="bg-[#1e2732] text-[#fffdf5] text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {rules.length}
                    </span>
                  </div>

                  {/* GRID CARD ASLI ANDA (Tidak ada style card yang diubah) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rules.map((rule) => {
                      const userObj = repeatUsers.find(
                        (u) => Number(u.id) === Number(rule.target_user_id),
                      );
                      const assigneeName = userObj
                        ? userObj.name
                        : `User ID: ${rule.target_user_id}`;

                      return (
                        <div
                          key={rule.id}
                          className={`group relative flex flex-col rounded-[8px] bg-[#22272b] p-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.2)] border border-[#a6c5e229] transition-all hover:bg-[#282e33] ${
                            rule.is_active ? "opacity-100" : "opacity-65"
                          }`}
                        >
                          <button
                            onClick={() => onEdit && onEdit(rule)}
                            className="absolute top-2 right-8 p-1 text-[#9fadbc] opacity-0 group-hover:opacity-100 hover:bg-[#a6c5e229] rounded transition-all z-20"
                            title="Edit Rule"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => onDelete(rule)}
                            className="absolute top-2 right-2 p-1 text-[#f87168] opacity-0 group-hover:opacity-100 hover:bg-[#f87168]/10 rounded transition-all z-20"
                            title="Hapus Rule"
                          >
                            <Trash2 size={12} />
                          </button>

                          <div className="flex flex-wrap gap-1 mb-1.5 pr-6">
                            {rule.label && (
                              <span
                                className={`h-[8px] w-[40px] rounded-full ${getLabelColor(
                                  rule.label,
                                )}`}
                                title={String(rule.label).toUpperCase()}
                              />
                            )}
                          </div>

                          {rule.file_path && isImageFile(rule.file_path) && (
                            <div className="mb-2 w-full h-[110px] rounded-lg overflow-hidden border border-[#363430] bg-[#0f1a22]">
                              <img
                                src={resolveImageUrl(rule.file_path)}
                                alt={rule.task_name}
                                className="w-full h-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          <h4
                            className="text-[14px] font-normal leading-snug mb-1.5 pr-2 text-[#b6c2cf]"
                            title={rule.task_name}
                          >
                            {rule.task_name}
                          </h4>

                          <div
                            className="text-[11px] text-[#9fadbc] mb-2 truncate"
                            title={assigneeName}
                          >
                            Untuk:{" "}
                            <span className="text-[#b6c2cf]">
                              {assigneeName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-[#9fadbc] text-[11px] mb-2">
                            {rule.due_in_days ? (
                              <div
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[#9fadbc] hover:bg-[#a6c5e229] hover:text-[#b6c2cf]"
                                title="Target Selesai"
                              >
                                <Clock size={12} /> Target: {rule.due_in_days}{" "}
                                Hari Kerja
                              </div>
                            ) : null}
                            {rule.reason && (
                              <AlignLeft size={13} title="Ada deskripsi" />
                            )}
                            {(rule.file_path || rule.link_url) && (
                              <Paperclip size={12} title="Ada lampiran" />
                            )}
                            {rule.link_url && (
                              <ExternalLink size={12} title="Ada link" />
                            )}
                          </div>

                          <div className="mt-auto bg-[#0f1a22] rounded-lg p-2 border border-[#363430]/50 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#579dff] bg-[#579dff]/10 px-2 py-1 rounded truncate">
                              <Repeat size={12} /> {getScheduleText(rule)}
                            </div>
                            <div
                              onClick={() => onToggle(rule)}
                              className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                                rule.is_active ? "bg-[#4bce97]" : "bg-[#363430]"
                              }`}
                              title={
                                rule.is_active ? "Nonaktifkan" : "Aktifkan"
                              }
                            >
                              <div
                                className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${
                                  rule.is_active
                                    ? "translate-x-4.5"
                                    : "translate-x-0"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
