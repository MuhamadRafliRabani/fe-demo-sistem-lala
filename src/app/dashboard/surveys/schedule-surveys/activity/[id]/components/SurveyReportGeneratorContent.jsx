"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { usePost, usePut } from "@/hooks/use-api-mutation";
import SearchableSelect from "@/components/searchable-select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  Save,
  User,
  MapPin,
  UserCircle,
  Target,
  DollarSign,
  Users,
  Palette,
  Wrench,
  Loader2,
  Calendar,
  Trash2,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  X,
  Eye,
  Pencil,
} from "lucide-react";
import { formatDate } from "@/lib/date-format";
import { downloadFile } from "@/lib/download-file";
import MoneyInput from "@/components/MoneyInput";

// ==========================================
// CONSTANTS & OPTIONS
// ==========================================

const RENOVATION_PURPOSE_OPTIONS = [
  { value: "Kebutuhan", label: "Kebutuhan" },
  { value: "Keinginan", label: "Keinginan" },
  { value: "Kebutuhan & Keinginan", label: "Kebutuhan & Keinginan" },
];

const OCCUPANT_CATEGORY_OPTIONS = [
  { value: "Keluarga Inti", label: "Keluarga Inti" },
  { value: "Keluarga Lain", label: "Keluarga Lain" },
  { value: "Staff", label: "Staff" },
  { value: "Tamu", label: "Tamu" },
  { value: "Lainnya", label: "Lainnya" },
];

const OCCUPANT_SUB_CATEGORY_OPTIONS = {
  "Keluarga Inti": [
    { value: "Kepala Rumah Tangga", label: "Kepala Rumah Tangga" },
    { value: "Ibu", label: "Ibu" },
    { value: "Anak", label: "Anak" },
  ],
  "Keluarga Lain": [
    { value: "Kakak", label: "Kakak" },
    { value: "Adik", label: "Adik" },
    { value: "Orang Tua", label: "Orang Tua" },
    { value: "Lainnya", label: "Lainnya" },
  ],
  Staff: [
    { value: "Pembantu", label: "Pembantu" },
    { value: "Driver", label: "Driver" },
    { value: "Baby Sitter", label: "Baby Sitter" },
    { value: "Security", label: "Security" },
  ],
  Tamu: [
    { value: "Keluarga", label: "Keluarga" },
    { value: "Teman", label: "Teman" },
    { value: "Rekan Kerja", label: "Rekan Kerja" },
  ],
  Lainnya: [{ value: "Lainnya", label: "Lainnya" }],
};

const OCCUPANT_GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];

const OCCUPANT_AGE_OPTIONS = [
  { value: "0-1", label: "0-1" },
  { value: "5-12", label: "6-12" },
  { value: "13-17", label: "13-17" },
  { value: "18-35", label: "18-35" },
  { value: "36-55", label: "36-55" },
  { value: "56+", label: "56+" },
];

const OCCUPANT_STATUS_OPTIONS = [
  { value: "Bekerja", label: "Bekerja" },
  { value: "WFH", label: "WFH" },
  { value: "Ibu Rumah Tangga", label: "Ibu Rumah Tangga" },
  { value: "Wiraswasta / Bisnis", label: "Wiraswasta / Bisnis" },
  { value: "Kuliah", label: "Kuliah" },
  { value: "Sekolah", label: "Sekolah" },
  { value: "Pensiunan", label: "Pensiunan" },
  { value: "Belum Sekolah", label: "Belum Sekolah" },
  { value: "Mencari Kerja", label: "Mencari Kerja" },
  { value: "Stay-in (Menginap)", label: "Stay-in (Menginap)" },
  { value: "Stay-out (Pulang Pergi)", label: "Stay-out (Pulang Pergi)" },
  { value: "Lainnya", label: "Lainnya" },
];

const OCCUPANT_HEALTH_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Kursi Roda", label: "Kursi Roda" },
  { value: "Alergi Berat", label: "Alergi Berat" },
  { value: "Gangguan Penglihatan", label: "Gangguan Penglihatan" },
  { value: "Gangguan Pendengaran", label: "Gangguan Pendengaran" },
  { value: "Lainnya", label: "Lainnya" },
];

const OCCUPANT_HOBBY_OPTIONS = [
  { value: "Golf", label: "Olahraga: Golf" },
  { value: "Berkuda", label: "Olahraga: Berkuda" },
  { value: "Kucing", label: "Pelihara Hewan: Kucing" },
  { value: "Modifikasi Mobil", label: "Otomotif: Modifikasi Mobil" },
  { value: "Scroll Medsos", label: "Digital: Scroll Medsos" },
  { value: "Kuliner", label: "Lifestyle: Kuliner" },
  { value: "Yoga", label: "Wellness: Yoga" },
  { value: "Berkebun", label: "Rumah: Berkebun" },
  { value: "Fotografi", label: "Seni: Fotografi" },
  { value: "Membaca", label: "Intelektual: Membaca" },
];

const DESIGN_CONCEPT_OPTIONS = [
  { value: "Tropical Balines", label: "Tropical Balines" },
  { value: "Japandi", label: "Japandi" },
  { value: "American Classic", label: "American Classic" },
  { value: "Kontemporer Modern", label: "Kontemporer Modern" },
  { value: "Industrial Modern", label: "Industrial Modern" },
  { value: "Earth", label: "Earth" },
];

const TECHNICAL_UNDERSTANDING_OPTIONS = [
  { value: "Tidak Tahu", label: "Tidak Tahu" },
  { value: "Paham", label: "Paham" },
  { value: "Expert", label: "Expert" },
];

const DECISION_MAKER_OPTIONS = [
  { value: "Ya", label: "Ya" },
  { value: "Tidak", label: "Tidak" },
];

const INITIAL_OCCUPANT_ROW = {
  category: "",
  sub_category: "",
  gender: "",
  age: "",
  status: "",
  condition: "",
  hobbies: "",
  description: "",
  technical_understanding: "Tidak Tahu",
  decision_maker: "Tidak",
};

const FORM_STEPS = [
  { id: "dasar", label: "Info Dasar", icon: User },
  { id: "profil", label: "Kebutuhan", icon: Target },
  { id: "scope", label: "Scope", icon: Wrench },
  { id: "catatan", label: "Catatan", icon: FileText },
];

// ==========================================
// HELPERS
// ==========================================

const formatRupiah = (num) => {
  if (!num || num === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

// ==========================================
// SHARED FORM LAYOUT PRIMITIVES
// (same visual language as CreateLeadModal: grouped sections with a
// heading + description, divided by hairlines, 2-col grid on sm+)
// ==========================================

function FormSection({ title, desc, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function FormField({ label, required, error, hint, className, children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center justify-between gap-2 text-sm font-medium">
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        {hint}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ==========================================
// LOCAL CREATABLE SELECT
// ==========================================

const LocalCreatableSelect = ({
  storageKey,
  defaultOptions = [],
  value,
  onChange,
  placeholder = "Pilih atau ketik...",
  disabled = false,
  clearable = true,
  className = "",
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localOptions, setLocalOptions] = useState([]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setLocalOptions(JSON.parse(saved));
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  const allOptions = useMemo(() => {
    const seen = new Set();
    return [...defaultOptions, ...localOptions].filter((o) => {
      if (seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
  }, [defaultOptions, localOptions]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [allOptions, query]);

  const exactMatch = useMemo(
    () =>
      allOptions.some(
        (o) => String(o.label).toLowerCase() === query.trim().toLowerCase(),
      ),
    [allOptions, query],
  );

  const showCreate = query.trim().length > 0 && !exactMatch;

  const handleCreate = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const newOpt = { value: trimmed, label: trimmed };
    const updatedLocal = [...localOptions, newOpt];
    setLocalOptions(updatedLocal);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updatedLocal));
    }
    onChange(newOpt.value);
    setIsOpen(false);
    setQuery("");
  }, [query, localOptions, storageKey, onChange]);

  const handleSelect = useCallback(
    (optValue) => {
      onChange(optValue);
      setIsOpen(false);
      setQuery("");
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange("");
      setQuery("");
    },
    [onChange],
  );

  const selectedOption = useMemo(
    () => allOptions.find((o) => o.value === value) ?? null,
    [allOptions, value],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-background hover:bg-background",
            !selectedOption && "text-muted-foreground",
            error && "border-red-500",
            className,
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center shrink-0">
            {clearable && selectedOption && !disabled && (
              <div
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded-md mr-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0"
        align="start"
        style={{
          width: "var(--radix-popover-trigger-width)",
          touchAction: "pan-y",
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Ketik untuk mencari atau menambah..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[220px] overflow-y-auto overscroll-contain touch-pan-y pointer-events-auto">
            {filteredOptions.length === 0 && !showCreate && (
              <CommandEmpty>Tidak ada data ditemukan.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option, idx) => (
                <CommandItem
                  key={`${option.value}-${idx}`}
                  value={String(option.value)}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-primary",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  value={`CREATE_${query}`}
                  onSelect={handleCreate}
                  className="cursor-pointer text-primary"
                >
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  <span className="truncate font-medium">
                    Tambah {`"${query.trim()}"`}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

function CreatableSelectField({
  label,
  storageKey,
  defaultOptions,
  value,
  onChange,
  placeholder,
  required,
  error,
  disabled,
  className,
}) {
  return (
    <FormField label={label} required={required} error={error}>
      <LocalCreatableSelect
        storageKey={storageKey}
        defaultOptions={defaultOptions}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        error={!!error}
        className={cn("h-10", className)}
      />
    </FormField>
  );
}

// ==========================================
// OCCUPANT FORM DIALOG
// Single-record dialog, styled the same way as CreateLeadModal: icon badge
// header, grouped sections with hairline dividers, sticky footer with
// "Batal" / "Simpan & Tambah Lagi" / "Simpan Penghuni".
// ==========================================

function OccupantFormDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onSave,
  isEditing,
}) {
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) setTouched(false);
  }, [open]);

  const categoryError =
    touched && !draft.category ? "Kategori wajib dipilih" : "";

  const handleSubmit = (addAnother) => {
    if (!draft.category) {
      setTouched(true);
      toast.error("Kategori penghuni wajib dipilih.");
      return;
    }
    onSave(addAnother);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* HEADER */}
        <DialogHeader className="border-b px-5 py-4 pr-12 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base sm:text-lg">
                {isEditing ? "Edit Penghuni" : "Tambah Penghuni"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Isi kategori dulu, kolom lain membantu tim desain memahami
                penghuni ini.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* BODY (scrollable) */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          <FormSection
            title="Identitas"
            desc="Siapa penghuni ini dan posisinya di rumah."
          >
            <CreatableSelectField
              label="Kategori"
              storageKey="occupant_category_options"
              defaultOptions={OCCUPANT_CATEGORY_OPTIONS}
              value={draft.category}
              onChange={(val) => onDraftChange("category", val)}
              placeholder="Pilih/ketik kategori..."
              required
              error={categoryError}
            />
            <CreatableSelectField
              label="Sub Kategori"
              storageKey={`occupant_sub_category_options_${draft.category}`}
              defaultOptions={
                OCCUPANT_SUB_CATEGORY_OPTIONS[draft.category] || []
              }
              value={draft.sub_category}
              onChange={(val) => onDraftChange("sub_category", val)}
              placeholder="Pilih/ketik..."
              disabled={!draft.category}
            />
            <CreatableSelectField
              label="Gender"
              storageKey="occupant_gender_options"
              defaultOptions={OCCUPANT_GENDER_OPTIONS}
              value={draft.gender}
              onChange={(val) => onDraftChange("gender", val)}
              placeholder="Pilih gender..."
            />
            <CreatableSelectField
              label="Usia"
              storageKey="occupant_age_options"
              defaultOptions={OCCUPANT_AGE_OPTIONS}
              value={draft.age}
              onChange={(val) => onDraftChange("age", val)}
              placeholder="Pilih rentang usia..."
            />
          </FormSection>

          <hr className="border-border" />

          <FormSection
            title="Status & kondisi"
            desc="Aktivitas sehari-hari dan hal yang perlu diperhatikan tim desain."
          >
            <CreatableSelectField
              label="Status"
              storageKey="occupant_status_options"
              defaultOptions={OCCUPANT_STATUS_OPTIONS}
              value={draft.status}
              onChange={(val) => onDraftChange("status", val)}
              placeholder="Pilih/ketik status..."
            />
            <CreatableSelectField
              label="Kondisi Kesehatan"
              storageKey="occupant_condition_options"
              defaultOptions={OCCUPANT_HEALTH_OPTIONS}
              value={draft.condition}
              onChange={(val) => onDraftChange("condition", val)}
              placeholder="Pilih/ketik kondisi..."
            />
            <CreatableSelectField
              label="Pemahaman Teknis"
              storageKey="occupant_technical_options"
              defaultOptions={TECHNICAL_UNDERSTANDING_OPTIONS}
              value={draft.technical_understanding || "Tidak Tahu"}
              onChange={(val) => onDraftChange("technical_understanding", val)}
              placeholder="Pilih..."
            />
            <CreatableSelectField
              label="Decision Maker"
              storageKey="occupant_decision_maker_options"
              defaultOptions={DECISION_MAKER_OPTIONS}
              value={draft.decision_maker || "Tidak"}
              onChange={(val) => onDraftChange("decision_maker", val)}
              placeholder="Pilih..."
            />
          </FormSection>

          <hr className="border-border" />

          <FormSection
            title="Hobi & catatan"
            desc="Konteks tambahan yang bisa memengaruhi desain ruang."
          >
            <CreatableSelectField
              label="Hobi Utama"
              storageKey="occupant_hobby_options"
              defaultOptions={OCCUPANT_HOBBY_OPTIONS}
              value={draft.hobbies}
              onChange={(val) => onDraftChange("hobbies", val)}
              placeholder="Pilih/ketik hobi..."
              className="sm:col-span-2"
            />
            <FormField label="Catatan" className="sm:col-span-2">
              <Textarea
                rows={3}
                className="resize-none"
                placeholder="Catatan tambahan tentang penghuni ini..."
                value={draft.description || ""}
                onChange={(e) => onDraftChange("description", e.target.value)}
              />
            </FormField>
          </FormSection>
        </div>

        {/* FOOTER (selalu kelihatan) */}
        <div className="flex flex-col-reverse gap-2 border-t bg-muted/40 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>

          {!isEditing && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => handleSubmit(true)}
            >
              Simpan & Tambah Lagi
            </Button>
          )}

          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => handleSubmit(false)}
          >
            {isEditing ? "Simpan Perubahan" : "Simpan Penghuni"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function SurveyReportGeneratorContent({
  initialScheduleId,
  initialSchedule,
  initialSurveyReport,
  embedded = false,
}) {
  const searchParams = useSearchParams();
  const prefillId = initialScheduleId ?? searchParams.get("schedule_id");
  const surveyReportId = initialSurveyReport?.id;

  // ── Remote data ────────────────────────────────────────────────────────
  const { data: surveyReportResponse } = useApiFetch(
    surveyReportId ? ["survey-reports", surveyReportId] : null,
    surveyReportId ? `/survey-reports/${surveyReportId}` : null,
  );

  const prefillSurveyReport =
    surveyReportResponse?.data ?? initialSurveyReport ?? null;
  const isEditing = !!prefillSurveyReport?.id;

  const { data: schedulesData, isLoading: isLoadingSchedules } = useApiFetch(
    "schedules",
    "/schedules",
    {
      include: "client,client.occupants,surveyors",
      filter: { status: "sedang berlangsung" },
      paginate: 100,
    },
  );

  const { data: prefillScheduleData } = useApiFetch(
    !initialSchedule && prefillId ? ["schedules", prefillId] : null,
    !initialSchedule && prefillId ? `/schedules/${prefillId}` : null,
    !initialSchedule && prefillId
      ? { include: "client,client.occupants,surveyors" }
      : {},
  );

  const prefillSchedule = initialSchedule ?? prefillScheduleData?.data;

  // ── Mutations ─────────────────────────────────────────────────────────
  const { mutate: saveReport, isPending: isSaving } = usePost(
    "/survey-reports",
    { invalidate: prefillId ? [["schedule", prefillId]] : undefined },
  );

  const { mutate: updateReport, isPending: isUpdating } = usePut(
    `/survey-reports/${prefillSurveyReport?.id}`,
    {
      invalidate: prefillSurveyReport?.survey_id
        ? [["schedule", prefillSurveyReport.survey_id]]
        : prefillId
          ? [["schedule", prefillId]]
          : undefined,
    },
  );

  const [isDownloading, setIsDownloading] = useState(false);

  // ── Draft key (unique per report or schedule) ─────────────────────────
  const draftKey = useMemo(() => {
    if (prefillSurveyReport?.id)
      return `survey_report_form_report_${prefillSurveyReport.id}`;
    if (prefillId) return `survey_report_form_schedule_${prefillId}`;
    return "survey_report_form";
  }, [prefillSurveyReport?.id, prefillId]);

  // ── Schedule options ───────────────────────────────────────────────────
  const baseOptions = useMemo(
    () =>
      schedulesData?.data?.data?.map((item) => ({
        label: `${item.client?.name || item.name || "Survey"} - ${item.date ? formatDate(item.date) : ""}`,
        value: item.id,
        schedule: item,
      })) ?? [],
    [schedulesData],
  );

  const scheduleOptions = useMemo(() => {
    if (!prefillSchedule) return baseOptions;
    const exists = baseOptions.some((o) => o.value === prefillSchedule.id);
    if (exists) return baseOptions;
    return [
      {
        label: `${prefillSchedule.client?.name || "Survey"} - ${prefillSchedule.date ? formatDate(prefillSchedule.date) : ""}`,
        value: prefillSchedule.id,
        schedule: prefillSchedule,
      },
      ...baseOptions,
    ];
  }, [baseOptions, prefillSchedule]);

  // ── Form state ─────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    survey_id: undefined,
    client_id: undefined,
    client_name: "",
    address: "",
    surveyor_name: "",
    renovation_purpose: "",
    budget_min: 0,
    budget_max: 0,
    occupants_info: "",
    occupants_list: [],
    hobbies_habits: "",
    design_concept: "",
    priority_scope: "",
    ideal_scope: "",
    note: "",
  });

  const draftAppliedRef = useRef(false);
  const prefillAppliedRef = useRef(false);

  const handleInputChange = useCallback(
    (field, value) => setFormData((prev) => ({ ...prev, [field]: value })),
    [],
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      draftAppliedRef.current = true;
      setFormData((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Ignore
    }
  }, [draftKey]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
      } catch {
        // Ignore
      }
    }, 300);
    return () => clearTimeout(t);
  }, [formData, draftKey]);

  useEffect(() => {
    if (
      !prefillId ||
      !prefillSchedule?.id ||
      prefillAppliedRef.current ||
      draftAppliedRef.current
    )
      return;

    prefillAppliedRef.current = true;

    const id =
      typeof prefillSchedule.id === "string"
        ? parseInt(prefillSchedule.id, 10)
        : prefillSchedule.id;

    setFormData((prev) => ({
      ...prev,
      survey_id: id,
      client_id: prefillSurveyReport
        ? prefillSurveyReport.client?.id
        : prefillSchedule.client?.id || undefined,
      client_name: prefillSurveyReport
        ? prefillSurveyReport.client?.name || ""
        : prefillSchedule.client?.name || "",
      address: prefillSurveyReport
        ? prefillSurveyReport.client?.address || ""
        : prefillSchedule?.address || "",
      surveyor_name: prefillSchedule.surveyors?.[0]?.name || "",
      renovation_purpose: prefillSurveyReport?.renovation_purpose || "",
      budget_min: prefillSurveyReport?.budget_min || 0,
      budget_max: prefillSurveyReport?.budget_max || 0,
      occupants_info: prefillSurveyReport?.occupants_info || "",
      occupants_list:
        prefillSurveyReport?.client?.occupants ||
        prefillSchedule?.client?.occupants ||
        [],
      hobbies_habits: prefillSurveyReport?.hobbies_habits || "",
      design_concept: prefillSurveyReport?.design_concept || "",
      priority_scope: prefillSurveyReport?.priority_scope || "",
      ideal_scope: prefillSurveyReport?.ideal_scope || "",
      note: prefillSurveyReport?.note || "",
    }));
  }, [prefillId, prefillSchedule, prefillSurveyReport]);

  // ── Sync derived fields when schedule changes ──────────────────────────
  const selectedSchedule = useMemo(
    () =>
      scheduleOptions.find((opt) => opt.value === formData.survey_id)
        ?.schedule ?? null,
    [formData.survey_id, scheduleOptions],
  );

  useEffect(() => {
    if (!selectedSchedule) return;
    setFormData((prev) => ({
      ...prev,
      client_id: selectedSchedule.client_id,
      client_name: selectedSchedule.client?.name || "",
      address: selectedSchedule.address || "",
      surveyor_name:
        selectedSchedule.surveyors?.length > 0
          ? selectedSchedule.surveyors[0]?.name
          : prev.surveyor_name,
    }));
  }, [selectedSchedule]);

  // ── Auto-generate occupants_info summary ───────────────────────────────
  useEffect(() => {
    setFormData((prev) => {
      const list = prev.occupants_list || [];
      if (!list.length) {
        return prev.occupants_info ? { ...prev, occupants_info: "" } : prev;
      }
      const summary = list
        .map((item) =>
          [
            item.category,
            item.sub_category,
            item.gender,
            item.age,
            item.status,
            item.condition,
          ]
            .filter(Boolean)
            .join(" - "),
        )
        .filter((t) => t.trim() !== "")
        .join("; ");

      return summary === prev.occupants_info
        ? prev
        : { ...prev, occupants_info: summary };
    });
  }, [formData.occupants_list]);

  // ── Occupant dialog state (single-record, add or edit) ─────────────────
  const [expandedOccupantIndex, setExpandedOccupantIndex] = useState(null);
  const [occupantDialogOpen, setOccupantDialogOpen] = useState(false);
  const [editingOccupantIndex, setEditingOccupantIndex] = useState(null); // null = adding new
  const [occupantDraft, setOccupantDraft] = useState(INITIAL_OCCUPANT_ROW);

  const openAddOccupant = useCallback(() => {
    setEditingOccupantIndex(null);
    setOccupantDraft({ ...INITIAL_OCCUPANT_ROW });
    setOccupantDialogOpen(true);
  }, []);

  const openEditOccupant = useCallback(
    (index) => {
      setEditingOccupantIndex(index);
      setOccupantDraft({ ...formData.occupants_list[index] });
      setOccupantDialogOpen(true);
    },
    [formData.occupants_list],
  );

  const handleOccupantDraftChange = useCallback((field, value) => {
    setOccupantDraft((prev) => {
      const updated = { ...prev, [field]: value };
      if (
        field === "category" &&
        updated.sub_category &&
        !(OCCUPANT_SUB_CATEGORY_OPTIONS[value] || []).some(
          (opt) => opt.value === updated.sub_category,
        )
      ) {
        updated.sub_category = "";
      }
      return updated;
    });
  }, []);

  const handleSaveOccupant = useCallback(
    (addAnother) => {
      setFormData((prev) => {
        const list = [...(prev.occupants_list || [])];
        if (editingOccupantIndex !== null) {
          list[editingOccupantIndex] = occupantDraft;
        } else {
          list.push(occupantDraft);
        }
        return { ...prev, occupants_list: list };
      });
      toast.success(
        editingOccupantIndex !== null
          ? "Data penghuni diperbarui."
          : "Penghuni ditambahkan.",
      );
      if (addAnother) {
        setEditingOccupantIndex(null);
        setOccupantDraft({ ...INITIAL_OCCUPANT_ROW });
      } else {
        setOccupantDialogOpen(false);
      }
    },
    [editingOccupantIndex, occupantDraft],
  );

  const handleRemoveOccupant = useCallback(
    (index) =>
      handleInputChange(
        "occupants_list",
        formData.occupants_list.filter((_, i) => i !== index),
      ),
    [formData.occupants_list, handleInputChange],
  );

  // ── Save / download handlers ───────────────────────────────────────────
  const getSavePayload = useCallback(
    () => ({
      survey_id: formData.survey_id,
      client_id: formData.client_id || undefined,
      renovation_purpose: formData.renovation_purpose || null,
      budget_min: Number(formData.budget_min) || 0,
      budget_max: Number(formData.budget_max) || 0,
      occupants_info: formData.occupants_info || null,
      occupants_list: formData.occupants_list || [],
      hobbies_habits: formData.hobbies_habits || null,
      design_concept: formData.design_concept || null,
      priority_scope: formData.priority_scope || null,
      ideal_scope: formData.ideal_scope || null,
      note: formData.note || null,
    }),
    [formData],
  );

  const handleSaveToDB = useCallback(() => {
    if (isSaving || isUpdating) return;
    if (!formData.survey_id) {
      toast.error("Pilih survey terlebih dahulu");
      return;
    }
    const payload = getSavePayload();
    const clearDraft = () => {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
    };

    if (isEditing) {
      updateReport(
        { ...payload, id: prefillSurveyReport.id },
        {
          onSuccess: () => {
            toast.success("Report survey berhasil diupdate!");
            clearDraft();
          },
          onError: (error) =>
            toast.error(
              error?.response?.data?.message ||
                "Gagal mengupdate report survey",
            ),
        },
      );
    } else {
      saveReport(payload, {
        onSuccess: () => {
          toast.success("Report survey berhasil disimpan!");
          clearDraft();
        },
        onError: (error) =>
          toast.error(
            error?.response?.data?.message || "Gagal menyimpan report survey",
          ),
      });
    }
  }, [
    isSaving,
    isUpdating,
    formData.survey_id,
    getSavePayload,
    isEditing,
    prefillSurveyReport,
    updateReport,
    saveReport,
    draftKey,
  ]);

  const handleDownloadPDF = useCallback(async () => {
    const currentId = prefillSurveyReport?.id || surveyReportId;
    if (!currentId) {
      toast.warning("Laporan tidak ditemukan. Simpan data terlebih dahulu.");
      return;
    }
    setIsDownloading(true);
    try {
      await downloadFile(
        `/survey-reports/${currentId}/pdf`,
        `Survey_Report_${formData.client_name || "Klien"}_${Date.now()}.pdf`,
      );
      toast.success("PDF berhasil diunduh.");
    } catch (err) {
      console.error(err);
      toast.error(
        "Gagal mengunduh PDF. Pastikan data sudah tersimpan di database.",
      );
    } finally {
      setIsDownloading(false);
    }
  }, [prefillSurveyReport?.id, surveyReportId, formData.client_name]);

  // ── Preview helpers ────────────────────────────────────────────────────
  const renderPreviewList = (text) => {
    if (!text?.trim()) return <li>Belum ada data</li>;
    return text.split("\n").map((line, i) => {
      const clean = line.trim();
      if (!clean) return null;
      return <li key={i}>{clean.replace(/^[-•*]\s*/, "")}</li>;
    });
  };

  const previewDate = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const previewBudget = useMemo(() => {
    const min = Number(formData.budget_min) || 0;
    const max = Number(formData.budget_max) || 0;
    if (min > 0 && max > 0)
      return `${formatRupiah(min)} - ${formatRupiah(max)}`;
    if (min > 0) return formatRupiah(min);
    if (max > 0) return formatRupiah(max);
    return "-";
  }, [formData.budget_min, formData.budget_max]);

  const previewClientName =
    formData.client_name || selectedSchedule?.client?.name || "Nama Klien";
  const previewLocation =
    formData.address || selectedSchedule?.address || "Lokasi";
  const previewSurveyor =
    formData.surveyor_name ||
    selectedSchedule?.surveyors?.[0]?.name ||
    "Tim Survey";

  const isBusy = isDownloading || isSaving || isUpdating;

  // ── Step / progress tracking ────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(0);
  // View toggle: "form" or "preview". Below xl, only one panel is shown at
  // a time via tabs (the A4 preview is a fixed 210mm wide and doesn't fit
  // next to the form below that width). At xl and up, both panels show
  // side by side and this toggle is ignored (see xl: overrides below).
  const [mobileView, setMobileView] = useState("form");

  const stepCompletion = useMemo(
    () => [
      !!formData.survey_id, // dasar
      !!(formData.renovation_purpose && formData.design_concept), // profil
      !!(formData.priority_scope || formData.ideal_scope), // scope
      true, // catatan is always optional/"done"
    ],
    [
      formData.survey_id,
      formData.renovation_purpose,
      formData.design_concept,
      formData.priority_scope,
      formData.ideal_scope,
    ],
  );

  const filledCount = stepCompletion.filter(Boolean).length;

  const goToStep = (idx) =>
    setActiveStep(Math.min(Math.max(idx, 0), FORM_STEPS.length - 1));

  // ── Scaled A4 preview (fits any screen width without horizontal scroll) ─
  const previewWrapRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);
  const A4_WIDTH_PX = 794; // 210mm at 96dpi

  useLayoutEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const updateScale = () => {
      const available = el.offsetWidth;
      setPreviewScale(Math.min(available / A4_WIDTH_PX, 1));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex flex-col xl:flex-row flex-1 overflow-hidden min-h-0 ${embedded ? "rounded-b-lg" : ""}`}
    >
      {/* ================================================================ */}
      {/* TAB SWITCH — Form / Preview. Hidden at xl+, where both panels    */}
      {/* show side by side instead.                                       */}
      {/* ================================================================ */}
      <div className="xl:hidden flex border-b bg-background sticky top-0 z-20">
        <button
          type="button"
          onClick={() => setMobileView("form")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
            mobileView === "form"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground",
          )}
        >
          <Pencil className="h-4 w-4" /> Isi Data
        </button>
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
            mobileView === "preview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground",
          )}
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
      </div>

      {/* ================================================================ */}
      {/* PANEL — FORM (stepper). Side-by-side column at xl+.              */}
      {/* ================================================================ */}
      <aside
        className={cn(
          "w-full overflow-y-auto pb-28 xl:p-6 xl:pb-20 flex-col",
          "xl:flex xl:w-[35%] xl:border-r",
          mobileView === "form" ? "flex" : "hidden",
        )}
      >
        {/* Step progress */}
        <div className="px-4 pt-4 xl:px-0 xl:pt-0 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Langkah {activeStep + 1} dari {FORM_STEPS.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {filledCount}/{FORM_STEPS.length} bagian terisi
            </span>
          </div>
          <div className="flex gap-1.5">
            {FORM_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(idx)}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  idx === activeStep
                    ? "bg-primary"
                    : stepCompletion[idx]
                      ? "bg-primary/40"
                      : "bg-muted",
                )}
                aria-label={step.label}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {FORM_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={cn(
                    "flex items-center gap-1 text-[11px] font-medium",
                    idx === activeStep
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <StepIcon size={12} />
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 xl:px-0 space-y-4 flex-1">
          {/* STEP 1 — Informasi Dasar */}
          {activeStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2">
                  <User size={16} /> Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="survey_id"
                    className="flex items-center gap-1"
                  >
                    <Calendar size={12} /> Info Survey{" "}
                    <span className="text-red-400">*</span>
                  </Label>
                  <SearchableSelect
                    options={scheduleOptions}
                    value={formData.survey_id}
                    onChange={(selectedValue) => {
                      if (selectedValue) {
                        const opt = scheduleOptions.find(
                          (o) => o.value === selectedValue,
                        );
                        if (opt) {
                          handleInputChange("survey_id", opt.value);
                          if (opt.schedule?.client_id) {
                            handleInputChange(
                              "client_id",
                              opt.schedule.client_id,
                            );
                          }
                        }
                      } else {
                        handleInputChange("survey_id", undefined);
                        handleInputChange("client_id", undefined);
                      }
                    }}
                    placeholder={
                      isLoadingSchedules
                        ? "Memuat data..."
                        : scheduleOptions.length === 0
                          ? "Tidak ada survey"
                          : "Pilih survey"
                    }
                    disabled={
                      isLoadingSchedules || scheduleOptions.length === 0
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="client_name"
                      className="flex items-center gap-1"
                    >
                      <User size={12} /> Nama Klien
                    </Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) =>
                        handleInputChange("client_name", e.target.value)
                      }
                      placeholder="Nama klien"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="flex items-center gap-1"
                    >
                      <MapPin size={12} /> Alamat
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="Alamat survey"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="surveyor_name"
                    className="flex items-center gap-1"
                  >
                    <UserCircle size={12} /> Surveyor
                  </Label>
                  <Input
                    id="surveyor_name"
                    value={formData.surveyor_name}
                    onChange={(e) =>
                      handleInputChange("surveyor_name", e.target.value)
                    }
                    placeholder="Nama surveyor"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2 — Kebutuhan & Profil */}
          {activeStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2">
                  <Target size={16} /> Kebutuhan & Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="renovation_purpose">Tujuan Renovasi</Label>
                  <LocalCreatableSelect
                    storageKey="renovation_purpose_options"
                    defaultOptions={RENOVATION_PURPOSE_OPTIONS}
                    value={formData.renovation_purpose}
                    onChange={(val) =>
                      handleInputChange("renovation_purpose", val)
                    }
                    placeholder="Pilih atau ketik..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign size={12} /> Budget (Rp)
                  </Label>
                  <div className="flex items-center gap-2">
                    <MoneyInput
                      id="budget_min"
                      value={formData.budget_min}
                      onChange={(num) => handleInputChange("budget_min", num)}
                      placeholder={0}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground shrink-0">–</span>
                    <MoneyInput
                      id="budget_max"
                      value={formData.budget_max}
                      onChange={(num) => handleInputChange("budget_max", num)}
                      placeholder={0}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Occupants — list + add/edit via dialog */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1">
                      <Users size={12} /> Jumlah Penghuni
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {formData.occupants_list?.length || 0} penghuni
                    </span>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <div className="divide-y">
                      {formData.occupants_list?.length > 0 ? (
                        formData.occupants_list.map((item, index) => (
                          <div key={index} className="px-3 py-2 space-y-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-xs space-y-0.5">
                                <div className="font-medium">
                                  {item.category || "-"}
                                  {item.sub_category
                                    ? ` • ${item.sub_category}`
                                    : ""}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {[
                                    item.gender,
                                    item.age,
                                    item.status,
                                    item.condition,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ") || "-"}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    setExpandedOccupantIndex(
                                      expandedOccupantIndex === index
                                        ? null
                                        : index,
                                    )
                                  }
                                >
                                  <ChevronDown
                                    className={cn(
                                      "h-3 w-3 transition-transform",
                                      expandedOccupantIndex === index &&
                                        "rotate-180",
                                    )}
                                  />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className="h-7 text-[11px]"
                                  onClick={() => openEditOccupant(index)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600"
                                  onClick={() => handleRemoveOccupant(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {expandedOccupantIndex === index && (
                              <div className="mt-2 rounded-md bg-muted/40 p-2 text-[11px] space-y-1">
                                {item.hobbies && (
                                  <div>
                                    <span className="font-medium">Hobi:</span>{" "}
                                    {item.hobbies}
                                  </div>
                                )}
                                {item.description && (
                                  <div>
                                    <span className="font-medium">
                                      Catatan:
                                    </span>{" "}
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-[11px] text-muted-foreground">
                          Belum ada data penghuni. Tambahkan minimal satu
                          penghuni.
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={openAddOccupant}
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Penghuni
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Palette size={12} /> Konsep Desain
                  </Label>
                  <LocalCreatableSelect
                    storageKey="design_concept_options"
                    defaultOptions={DESIGN_CONCEPT_OPTIONS}
                    value={formData.design_concept}
                    onChange={(val) => handleInputChange("design_concept", val)}
                    placeholder="Pilih atau ketik konsep..."
                    className="h-9 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3 — Scope */}
          {activeStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2">
                  <Wrench size={16} /> Scope Pekerjaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="priority_scope">
                    Scope Prioritas (Enter untuk baris baru)
                  </Label>
                  <Textarea
                    id="priority_scope"
                    rows={4}
                    value={formData.priority_scope}
                    onChange={(e) =>
                      handleInputChange("priority_scope", e.target.value)
                    }
                    placeholder={`- Dapur\n- Kamar Utama`}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ideal_scope">
                    Scope Jangka Panjang (Enter untuk baris baru)
                  </Label>
                  <Textarea
                    id="ideal_scope"
                    rows={4}
                    value={formData.ideal_scope}
                    onChange={(e) =>
                      handleInputChange("ideal_scope", e.target.value)
                    }
                    placeholder={`- Taman Belakang\n- Rooftop`}
                    className="font-mono"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4 — Catatan */}
          {activeStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide font-bold flex items-center gap-2">
                  <FileText size={16} /> Catatan Tambahan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Tambahkan catatan khusus untuk laporan ini..."
                  className="min-h-[140px]"
                  value={formData.note}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                />
              </CardContent>
            </Card>
          )}

          {/* Step navigation */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={activeStep === 0}
              onClick={() => goToStep(activeStep - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Button>
            {activeStep < FORM_STEPS.length - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => goToStep(activeStep + 1)}
                className="gap-1"
              >
                Lanjut <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1 xl:hidden"
                onClick={() => setMobileView("preview")}
              >
                Lihat Preview <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Sticky action bar — always reachable without scrolling far */}
        <div className="sticky bottom-0 mt-6 -mx-4 xl:mx-0 px-4 py-3 xl:py-4 bg-background/95 backdrop-blur border-t flex flex-col gap-2">
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading || !formData.survey_id}
            className="w-full"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengunduh via
                Server...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> Unduh PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleSaveToDB}
            disabled={isSaving || isUpdating || !formData.survey_id}
            variant="default"
            className="w-full"
          >
            {isSaving || isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Simpan ke Database
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* PANEL — PREVIEW (scaled to fit, no horizontal scroll).           */}
      {/* Side-by-side column at xl+.                                      */}
      {/* ================================================================ */}
      <main
        ref={previewWrapRef}
        className={cn(
          "w-full bg-muted overflow-y-auto p-3 xl:p-8 xl:rounded-2xl xl:mt-6 flex-col items-center relative gap-8",
          "xl:flex xl:w-[65%]",
          mobileView === "preview" ? "flex" : "hidden",
        )}
      >
        {isBusy && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center text-slate-800 rounded-2xl">
            <Loader2 className="h-10 w-10 mb-3 animate-spin" />
            <p className="font-medium text-sm">Memproses permintaan...</p>
          </div>
        )}

        {/* Scale wrapper: reserves the real scaled height so layout doesn't
            collapse, while the A4 page itself stays at native mm size and
            is visually scaled down to fit the available width. */}
        <div
          style={{
            width: "100%",
            maxWidth: `${A4_WIDTH_PX}px`,
            height: `${previewScale * 1123}px`, // 297mm at 96dpi
          }}
        >
          <div
            className="a4-page bg-white text-slate-800"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "12mm",
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              transform: `scale(${previewScale})`,
              transformOrigin: "top left",
            }}
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src="/langit-langit/langit-langit-name-dark.png"
                alt="Langit Langit Logo"
                className="h-14 object-contain"
              />
            </div>

            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-6 mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                  REPORT SURVEI
                </h1>
                <p className="text-slate-500 text-sm mt-1">{previewDate}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-semibold text-slate-800">
                  {previewClientName}
                </h2>
                <p className="text-slate-600 text-sm max-w-4/5 ms-auto">
                  {previewLocation}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-10">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                  Profil & Kebutuhan
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-6">
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">
                      Tujuan Renovasi
                    </span>
                    <span className="font-medium text-slate-900 block">
                      {formData.renovation_purpose || "_"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">
                      Budget
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {previewBudget}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 font-medium mb-1">
                      Konsep Desain
                    </span>
                    <p className="text-slate-700 italic">
                      {formData.design_concept || "_"}
                    </p>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 border-b border-slate-100 pb-1">
                    Data Penghuni ({formData.occupants_list?.length || 0} orang)
                  </h4>
                  {formData.occupants_list?.length > 0 ? (
                    <div className="border rounded overflow-x-auto">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                          <tr>
                            <th className="px-2 py-1 w-6 text-center">No</th>
                            <th className="px-2 py-1">Kategori</th>
                            <th className="px-2 py-1">Sub</th>
                            <th className="px-2 py-1">Gender</th>
                            <th className="px-2 py-1">Usia</th>
                            <th className="px-2 py-1">Status</th>
                            <th className="px-2 py-1">Kondisi</th>
                            <th className="px-2 py-1">Teknis</th>
                            <th className="px-2 py-1">Decision</th>
                            <th className="px-2 py-1 w-1/4">Hobi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-nowrap">
                          {formData.occupants_list.map((occ, idx) => (
                            <tr key={idx}>
                              <td className="px-2 py-1 text-center">
                                {idx + 1}
                              </td>
                              <td className="px-2 py-1">
                                {occ.category || "-"}
                              </td>
                              <td className="px-2 py-1">
                                {occ.sub_category || "-"}
                              </td>
                              <td className="px-2 py-1">{occ.gender || "-"}</td>
                              <td className="px-2 py-1">{occ.age || "-"}</td>
                              <td className="px-2 py-1">{occ.status || "-"}</td>
                              <td className="px-2 py-1">
                                {occ.condition || "-"}
                              </td>
                              <td className="px-2 py-1">
                                {occ.technical_understanding || "-"}
                              </td>
                              <td className="px-2 py-1">
                                {occ.decision_maker || "-"}
                              </td>
                              <td className="px-2 py-1">
                                {Array.isArray(occ.hobbies)
                                  ? occ.hobbies.join(", ")
                                  : occ.hobbies || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">
                      Belum ada data penghuni
                    </p>
                  )}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-8">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                    Scope Prioritas
                  </h3>
                  <ul className="list-disc list-outside ml-4 text-sm space-y-1 text-slate-700">
                    {renderPreviewList(formData.priority_scope)}
                  </ul>
                </section>
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1 mb-3">
                    Scope Ideal (Jangka Panjang)
                  </h3>
                  <ul className="list-disc list-outside ml-4 text-sm space-y-1 text-slate-700">
                    {renderPreviewList(formData.ideal_scope)}
                  </ul>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t-2 border-slate-100">
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                Demikian poin-poin hasil survei. Jika ada koreksi atau
                pertanyaan, silakan hubungi admin kami.
              </p>
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <p className="text-xs text-slate-400 uppercase mb-1">
                    Hormat Kami,
                  </p>
                  <p className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 min-w-[150px]">
                    {previewSurveyor}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-300">
                    Generated by System
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick jump back to form (hidden at xl+, both panels visible) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 mb-4 xl:hidden"
          onClick={() => setMobileView("form")}
        >
          <Pencil className="h-4 w-4" /> Kembali ke Form
        </Button>
      </main>

      {/* ================================================================ */}
      {/* DIALOG — TAMBAH / EDIT PENGHUNI (satu record per dialog)         */}
      {/* ================================================================ */}
      <OccupantFormDialog
        open={occupantDialogOpen}
        onOpenChange={setOccupantDialogOpen}
        draft={occupantDraft}
        onDraftChange={handleOccupantDraftChange}
        onSave={handleSaveOccupant}
        isEditing={editingOccupantIndex !== null}
      />
    </div>
  );
}
