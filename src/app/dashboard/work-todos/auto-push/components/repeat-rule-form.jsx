"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, LinkIcon, Paperclip, Save, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/date-picker";
import { formatDateDb } from "@/lib/date-format-db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveImageUrl } from "@/lib/resolve-image-url";

const LABEL_OPTIONS = [
  { value: "easy", name: "EASY", color: "bg-chart-2" },
  { value: "medium", name: "MEDIUM", color: "bg-chart-3" },
  { value: "hard", name: "HARD", color: "bg-chart-4" },
  { value: "very hard", name: "VERY HARD", color: "bg-destructive" },
];

const DAY_OPTIONS = [
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
  { label: "Su", value: 7 },
];

export function RepeatRuleForm({
  repeatRuleForm,
  setRepeatRuleForm,
  repeatUsers,
  isAdmin = false,
  currentUser = null,
  mode = "create",
  onSave,
  onCancel,
  isSaving,
  onCreate,
  isCreatingRepeatRule,
}) {
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const attachRef = useRef(null);
  const [customDateDraft, setCustomDateDraft] = useState(null);
  const [monthDateDraft, setMonthDateDraft] = useState(null);
  const [dueDateDraft, setDueDateDraft] = useState(null);

  // --- UTILITIES ---
  const toCapitalizeWords = (str) =>
    str.replace(/\b\w/g, (l) => l.toUpperCase());
  const toTitleCase = (str) =>
    str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachRef.current && !attachRef.current.contains(event.target)) {
        setIsAttachOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const isImagePath = (value = "") =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(value);

    if (
      repeatRuleForm.file instanceof File &&
      repeatRuleForm.file.type?.startsWith("image/")
    ) {
      const url = URL.createObjectURL(repeatRuleForm.file);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }

    if (repeatRuleForm.file_path && isImagePath(repeatRuleForm.file_path)) {
      setImagePreview(resolveImageUrl(repeatRuleForm.file_path));
      return undefined;
    }

    setImagePreview("");
    return undefined;
  }, [repeatRuleForm.file, repeatRuleForm.file_path]);

  // --- COMPUTED / HANDLERS ---
  const selectedDays = Array.isArray(repeatRuleForm.weekdays)
    ? repeatRuleForm.weekdays.map((d) => Number(d)).filter(Number.isFinite)
    : [];
  const selectedMonthDays = Array.isArray(repeatRuleForm.month_days)
    ? repeatRuleForm.month_days.map((d) => Number(d)).filter(Number.isFinite)
    : [];
  const selectedSpecificDates = Array.isArray(repeatRuleForm.specific_dates)
    ? repeatRuleForm.specific_dates.map((d) => String(d)).filter(Boolean)
    : [];
  const activeLabel =
    LABEL_OPTIONS.find(
      (l) => l.value === String(repeatRuleForm.label || "").toLowerCase(),
    ) || null;

  const toggleWeekday = (value) => {
    const nextDays = selectedDays.includes(value)
      ? selectedDays.filter((day) => day !== value)
      : [...selectedDays, value].sort((a, b) => a - b);
    setRepeatRuleForm((prev) => ({ ...prev, weekdays: nextDays }));
  };

  const addMonthDay = () => {
    const parsed = monthDateDraft ? new Date(monthDateDraft).getDate() : NaN;
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) return;
    if (selectedMonthDays.includes(parsed)) return;
    const next = [...selectedMonthDays, parsed].sort((a, b) => a - b);
    setRepeatRuleForm((prev) => ({ ...prev, month_days: next }));
    setMonthDateDraft(null);
  };

  const removeMonthDay = (day) => {
    const next = selectedMonthDays.filter((d) => d !== day);
    setRepeatRuleForm((prev) => ({
      ...prev,
      month_days: next.length ? next : [1],
    }));
  };

  const addSpecificDate = (dateObj) => {
    if (!dateObj) return;
    const formatted = formatDateDb(dateObj);
    if (!formatted) return;
    if (selectedSpecificDates.includes(formatted)) return;
    const next = [...selectedSpecificDates, formatted].sort();
    setRepeatRuleForm((prev) => ({ ...prev, specific_dates: next }));
  };

  const removeSpecificDate = (value) => {
    const next = selectedSpecificDates.filter((d) => d !== value);
    setRepeatRuleForm((prev) => ({ ...prev, specific_dates: next }));
  };

  const toTitleCaseSafe = (value) => toTitleCase(String(value || ""));

  return (
    <div className="w-full max-w-[500px] flex flex-col mx-auto h-full">
      <div className="bg-card rounded-xl p-5 shadow-lg ring-1 ring-primary/25 flex flex-col gap-5 w-full">
        {/* --- 1. ASSIGNEE --- */}
        <div className="w-full">
          <Select
            value={
              repeatRuleForm.target_user_id ||
              (!isAdmin && currentUser?.id ? String(currentUser.id) : "")
            }
            onValueChange={(value) =>
              setRepeatRuleForm((prev) => ({ ...prev, target_user_id: value }))
            }
            disabled={!isAdmin}
          >
            <SelectTrigger className="w-full bg-secondary border border-border text-foreground">
              <SelectValue
                placeholder={
                  !isAdmin && currentUser?.name
                    ? toTitleCaseSafe(currentUser.name)
                    : "Select Assignee"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {repeatUsers?.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
                  {toTitleCaseSafe(user.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* --- 2. SCHEDULE TYPE (Daily, Weekly, Monthly, Custom) --- */}
        <div className="flex bg-secondary border border-border rounded-lg p-1 w-full relative">
          {["daily", "weekly", "monthly", "specific_dates"].map((type) => {
            const labelMap = {
              daily: "Daily",
              weekly: "Weekly",
              monthly: "Monthly",
              specific_dates: "Custom",
            };
            const isActive = repeatRuleForm.repeat_type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setRepeatRuleForm((prev) => ({ ...prev, repeat_type: type }))
                }
                className={`flex-1 py-1.5 rounded-md text-[11px] sm:text-[12px] font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-muted text-primary shadow-sm border border-primary/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {labelMap[type]}
              </button>
            );
          })}
        </div>

        {/* --- 3. DYNAMIC DATE FIELD --- */}
        {repeatRuleForm.repeat_type !== "daily" && (
          <div className="w-full bg-secondary border border-border rounded-lg min-h-[44px] flex items-center p-2">
            {/* WEEKLY */}
            {repeatRuleForm.repeat_type === "weekly" && (
              <div className="flex items-center justify-center gap-1.5 w-full flex-wrap">
                {DAY_OPTIONS.map((day) => {
                  const isSelected = selectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* MONTHLY (Tanggal di bulan tersebut) */}
            {repeatRuleForm.repeat_type === "monthly" && (
              <div className="flex items-center w-full gap-2 px-1 flex-wrap">
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1">
                    <DatePicker
                      value={monthDateDraft}
                      onChange={setMonthDateDraft}
                      label=""
                      placeholder="Pilih tanggal (ambil hari-nya)"
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addMonthDay}
                    className="px-3 py-1.5 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 w-full pt-2">
                  {selectedMonthDays.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => removeMonthDay(d)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#1e2732] border border-[#363430] px-2 py-1 text-[11px] font-bold text-[#b6c2cf] hover:border-[#f87168]/40 hover:text-[#fffdf5]"
                      title="Remove"
                    >
                      {d}
                      <X size={12} className="text-[#f87168]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOM / SPECIFIC DATES */}
            {repeatRuleForm.repeat_type === "specific_dates" && (
              <div className="flex flex-col w-full gap-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <DatePicker
                      value={customDateDraft}
                      onChange={(d) => {
                        setCustomDateDraft(d);
                        addSpecificDate(d);
                        setCustomDateDraft(null);
                      }}
                      label=""
                      placeholder="Pilih tanggal"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedSpecificDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => removeSpecificDate(d)}
                      className="inline-flex items-center gap-1 rounded-md bg-[#1e2732] border border-[#363430] px-2 py-1 text-[11px] font-bold text-[#b6c2cf] hover:border-[#f87168]/40 hover:text-[#fffdf5]"
                      title="Remove"
                    >
                      {d}
                      <X size={12} className="text-[#f87168]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 4. LABEL & ATTACHMENT ROW --- */}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {/* Label Button */}
            <Popover open={isLabelOpen} onOpenChange={setIsLabelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="bg-secondary hover:bg-muted border border-border text-muted-foreground text-[11px] font-medium rounded-lg px-3 h-[32px] min-w-[75px] focus:outline-none focus:border-primary/40 transition-colors flex items-center gap-1.5"
                >
                  {activeLabel && (
                    <span
                      className={`w-2 h-2 rounded-full ${activeLabel.color} shrink-0`}
                    />
                  )}
                  <span className="truncate">
                    {activeLabel ? activeLabel.name.toUpperCase() : "Label"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[180px] p-2 bg-popover border-border shadow-xl rounded-lg flex flex-col gap-1"
                align="start"
              >
                <span className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">
                  Select Label
                </span>
                {LABEL_OPTIONS.map((l) => {
                  const isSelected = repeatRuleForm.label === l.value;
                  return (
                    <div
                      key={l.value}
                      onClick={() => {
                        setRepeatRuleForm((prev) => ({
                          ...prev,
                          label: isSelected ? "" : l.value,
                        }));
                        setIsLabelOpen(false);
                      }}
                      className={`h-8 rounded ${l.color} flex items-center justify-between px-3 cursor-pointer text-[11px] font-bold text-[#1d2125] hover:opacity-90 transition-opacity`}
                    >
                      <span>{l.name.toUpperCase()}</span>
                      {isSelected && <Check size={12} />}
                    </div>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>

          {/* Attachment Button */}
          <div className="relative shrink-0" ref={attachRef}>
            <button
              type="button"
              onClick={() => setIsAttachOpen(!isAttachOpen)}
              className={`flex items-center justify-center w-[36px] h-[32px] rounded-lg border transition-colors ${
                repeatRuleForm.file || repeatRuleForm.link_url
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-secondary hover:bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Paperclip size={15} />
            </button>

            {isAttachOpen && (
              <div className="absolute top-full mt-2 right-0 w-[240px] bg-popover border border-border rounded-xl shadow-2xl z-[60] overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <h4 className="text-[12px] font-bold text-foreground flex-1">
                    Attachment
                  </h4>
                  <button type="button" onClick={() => setIsAttachOpen(false)}>
                    <X
                      size={14}
                      className="text-muted-foreground hover:text-foreground"
                    />
                  </button>
                </div>
                <div className="p-3 flex flex-col gap-3">
                  <label className="flex items-center justify-center w-full bg-secondary hover:bg-muted border border-dashed border-primary/40 rounded-lg py-2 cursor-pointer transition-colors">
                    <span className="text-[11px] font-bold text-primary">
                      Choose a file...
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        setRepeatRuleForm((prev) => ({
                          ...prev,
                          file: e.target.files?.[0] || null,
                          remove_file: false,
                        }))
                      }
                    />
                  </label>
                  <div className="h-px w-full bg-border" />
                  <input
                    type="text"
                    value={repeatRuleForm.link_url || ""}
                    onChange={(e) =>
                      setRepeatRuleForm((prev) => ({
                        ...prev,
                        link_url: e.target.value,
                      }))
                    }
                    placeholder="Paste a link here..."
                    className="w-full bg-secondary border border-border rounded-md px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAttachOpen(false)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold py-2 rounded-md transition-colors"
                  >
                    Confirm Attachment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- 5. DUE DATE IN DAYS --- */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
            <Calendar size={14} className="text-muted-foreground" />
            Target Selesai (Hari Kerja)
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={repeatRuleForm.due_in_days || 1}
              onChange={(e) =>
                setRepeatRuleForm((prev) => ({
                  ...prev,
                  due_in_days: parseInt(e.target.value) || 1,
                }))
              }
              className="w-full bg-[#152733] border border-[#363430] rounded-lg px-3 py-2.5 text-[13px] text-[#fffdf5] font-semibold placeholder:text-[#cfc9bd]/50 focus:outline-none focus:border-[#fed818]/50 transition-colors"
              placeholder="1"
            />
            <span className="text-muted-foreground text-[12px] whitespace-nowrap">
              hari sejak dipush
            </span>
          </div>
        </div>

        {/* --- 5. TASK NAME & DESCRIPTION --- */}
        <div className="flex flex-col gap-3">
          <input
            value={repeatRuleForm.task_name || ""}
            onChange={(e) =>
              setRepeatRuleForm((prev) => ({
                ...prev,
                task_name: toCapitalizeWords(e.target.value),
              }))
            }
            placeholder="Task Name"
            className="w-full bg-[#152733] border border-[#363430] rounded-lg px-3 py-2.5 text-[13px] text-[#fffdf5] font-semibold placeholder:text-[#cfc9bd]/50 focus:outline-none focus:border-[#fed818]/50 transition-colors"
          />
          <textarea
            value={repeatRuleForm.reason || ""}
            onChange={(e) =>
              setRepeatRuleForm((prev) => ({
                ...prev,
                reason: toCapitalizeWords(e.target.value),
              }))
            }
            placeholder="Description..."
            rows={4}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none custom-scrollbar transition-colors"
          />
        </div>

        {/* --- 6. ATTACHMENT PREVIEW (Expandable) --- */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${imagePreview || repeatRuleForm.link_url ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2">
              {/* Gambar Preview */}
              {imagePreview && (
                <div className="relative w-full h-[120px] rounded-lg overflow-hidden border border-border group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setRepeatRuleForm((prev) => ({
                        ...prev,
                        file: null,
                        file_path: "",
                        remove_file: true,
                      }))
                    }
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {/* Tautan / Link Preview */}
              {repeatRuleForm.link_url && !imagePreview && (
                <div className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-secondary relative group">
                  <div className="w-8 h-8 rounded bg-card flex items-center justify-center shrink-0 border border-border">
                    <LinkIcon size={12} className="text-primary" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] font-semibold text-foreground truncate">
                      Attached Link
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {getDomain(repeatRuleForm.link_url)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setRepeatRuleForm((prev) => ({ ...prev, link_url: "" }))
                    }
                    className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- 7. FOOTER ACTION BUTTONS --- */}
        <div className="flex items-center justify-start gap-2 pt-1">
          <button
            type="button"
            onClick={onSave || onCreate}
            disabled={
              typeof isSaving === "boolean" ? isSaving : isCreatingRepeatRule
            }
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Save size={14} />{" "}
            {typeof isSaving === "boolean"
              ? isSaving
                ? "Saving..."
                : mode === "edit"
                  ? "Update Rule"
                  : "Save Rule"
              : isCreatingRepeatRule
                ? "Saving..."
                : mode === "edit"
                  ? "Update Rule"
                  : "Save Rule"}
          </button>
          {mode === "edit" && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-secondary hover:bg-muted border border-border text-muted-foreground flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
