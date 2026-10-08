"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Circle,
  Loader2,
  MessageCircleQuestion,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";

import axiosInstance from "@/lib/axios";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "isomorphic-dompurify";

// API bisa balikin array langsung, atau objek paginate { data: [...] }
const toList = (res) => {
  const raw = res?.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message ?? fallback;

const NOTE_MAX = 1000;

// ---------------------------------------------------------------------------
// 0. ICON ACTION: tombol icon kecil + tooltip (dipakai di header kartu)
// ---------------------------------------------------------------------------
function IconAction({ label, onClick, disabled, className, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className={cn("size-8 text-muted-foreground", className)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// 0.1 FAQ ANSWER FORMATTER
//
// Editor Tiptap SEHARUSNYA menyimpan Markdown (e.getMarkdown()), tapi untuk
// struktur tertentu (list dengan <li><p>...</p></li> bersarang) serializer-nya
// gagal convert dan fallback ke HTML mentah. Jadi jawaban FAQ di database bisa
// berupa Markdown ATAU HTML — kita deteksi otomatis lalu render dengan cara
// yang tepat, supaya keduanya sama-sama rapi & ke-wrap dengan benar.
// ---------------------------------------------------------------------------
const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;
const isHtmlContent = (text) => HTML_TAG_RE.test(text ?? "");

// Class dipasang lewat components (markdown) atau langsung ke wrapper (HTML),
// disamakan supaya tampilan dua sumber ini identik.
const WRAP = "text-wrap break-words [overflow-wrap:anywhere]";

const md = {
  p: ({ node, ...props }) => <p className={cn("my-2", WRAP)} {...props} />,
  ul: ({ node, ...props }) => (
    <ul
      className="my-2 list-disc space-y-1 pl-5 marker:text-muted-foreground/60"
      {...props}
    />
  ),
  ol: ({ node, ...props }) => (
    <ol
      className="my-2 list-decimal space-y-1 pl-5 marker:text-muted-foreground/60"
      {...props}
    />
  ),
  li: ({ node, ...props }) => <li className={WRAP} {...props} />,
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  a: ({ node, ...props }) => (
    <a
      className="break-all text-primary underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  h1: ({ node, ...props }) => (
    <h1
      className="mb-2 mt-4 text-base font-semibold text-foreground"
      {...props}
    />
  ),
  h2: ({ node, ...props }) => (
    <h2
      className="mb-2 mt-4 text-base font-semibold text-foreground"
      {...props}
    />
  ),
  h3: ({ node, ...props }) => (
    <h3
      className="mb-1.5 mt-3 text-sm font-semibold text-foreground"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="my-2 border-l-2 pl-3 italic text-muted-foreground/80"
      {...props}
    />
  ),
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        className="break-all rounded bg-muted px-1 py-0.5 text-xs"
        {...props}
      />
    ) : (
      <code
        className="block break-words rounded bg-muted p-2 text-xs"
        {...props}
      />
    ),
  hr: ({ node, ...props }) => <hr className="my-3 border-border" {...props} />,
};

// Style untuk HTML mentah yang di-render lewat dangerouslySetInnerHTML.
// [&_li>p]:my-0 penting: Tiptap bungkus tiap list item pakai <li><p>...</p></li>,
// tanpa override ini spacing list jadi longgar/berantakan.
const RICH_HTML_CLASS = cn(
  "text-sm leading-6 text-muted-foreground",
  WRAP,
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
  "[&_p]:my-2",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
  "[&_li]:pl-1 [&_li]:marker:text-muted-foreground/60",
  "[&_li>p]:my-0 [&_li>ul]:my-1 [&_li>ol]:my-1",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_em]:italic",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-all",
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground",
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground/80",
  "[&_hr]:my-3 [&_hr]:border-border",
  "[&_code]:break-all [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
);

// Preview: dipotong via line-clamp, tag/syntax dibuang jadi teks polos.
function stripToPlainText(text) {
  if (isHtmlContent(text)) {
    return DOMPurify.sanitize(text ?? "", { ALLOWED_TAGS: [] }).trim();
  }
  return (text ?? "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

function FaqAnswerPreview({ text, clampLines = 3 }) {
  return (
    <p
      className={cn(
        "whitespace-pre-line text-sm leading-6 text-muted-foreground",
        clampLines && `line-clamp-${clampLines}`,
      )}
    >
      {stripToPlainText(text)}
    </p>
  );
}

function FaqAnswerFull({ text }) {
  if (isHtmlContent(text)) {
    const clean = DOMPurify.sanitize(text ?? "");
    return (
      <div
        className={RICH_HTML_CLASS}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  return (
    <div
      className={cn("min-w-0 text-sm leading-6 text-muted-foreground", WRAP)}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
        {text ?? ""}
      </ReactMarkdown>
    </div>
  );
}

function FaqAnswer({ text, expanded, clampLines = 3 }) {
  if (!text) return null;
  return expanded ? (
    <FaqAnswerFull text={text} />
  ) : (
    <FaqAnswerPreview text={text} clampLines={clampLines} />
  );
}

// ---------------------------------------------------------------------------
// 1. PICKER: dropdown pilih FAQ (multi-select + search)
// ---------------------------------------------------------------------------
function FaqPicker({ leadId, attachedIds, onAdded }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  // Master FAQ baru diambil saat dropdown dibuka pertama kali
  const { data, isLoading } = useApiFetch(
    ["faqs-master"],
    "/faqs",
    { per_page: 100 },
    open,
  );
  const faqs = toList(data);

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) setSelected([]);
  };

  const handleSubmit = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      await axiosInstance.post(`/leads/${leadId}/faqs`, {
        faq_ids: selected,
      });
      toast.success(`${selected.length} FAQ ditambahkan ke lead`);
      setOpen(false);
      setSelected([]);
      await onAdded();
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menambahkan FAQ"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          Tambah FAQ
          <ChevronsUpDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[min(440px,92vw)] p-0">
        <Command>
          <CommandInput placeholder="Cari pertanyaan atau kode FAQ..." />
          <CommandList className="max-h-72">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Memuat daftar FAQ...
              </div>
            ) : (
              <>
                <CommandEmpty>FAQ tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {faqs.map((faq) => {
                    const alreadyAdded = attachedIds.includes(faq.id);
                    const isChecked = selected.includes(faq.id);
                    return (
                      <CommandItem
                        key={faq.id}
                        // id ikut di value supaya unik walau code/question kembar
                        value={`${faq.id} ${faq.code} ${faq.question}`}
                        disabled={alreadyAdded}
                        onSelect={() => toggle(faq.id)}
                        className="items-start gap-3 py-2.5"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                            isChecked || alreadyAdded
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40",
                          )}
                        >
                          {(isChecked || alreadyAdded) && (
                            <Check className="size-3" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {faq.code}
                            </span>
                            {alreadyAdded && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                Sudah ditambahkan
                              </span>
                            )}
                          </span>
                          <span className="line-clamp-2 text-sm">
                            {faq.question}
                          </span>
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>

        <div className="flex items-center justify-between gap-3 border-t p-3">
          <p className="text-xs text-muted-foreground">
            {selected.length
              ? `${selected.length} FAQ dipilih`
              : "Pilih satu atau lebih FAQ"}
          </p>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selected.length || saving}
          >
            {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Tambahkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// 2. CARD: satu FAQ milik lead. Semua aksi ada di header sebagai icon.
// ---------------------------------------------------------------------------
function LeadFaqCard({ faq, leadId, onChanged }) {
  const url = `/leads/${leadId}/faqs/${faq.id}`;
  const answered = Boolean(faq.pivot?.is_answered);
  const savedNote = faq.pivot?.notes ?? "";
  const confirm = useConfirmDialog();

  const [showFullAnswer, setShowFullAnswer] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(savedNote);
  const [busy, setBusy] = useState(null); // "status" | "note" | "delete"

  // Preview dianggap "panjang" kalau lebih dari ~3 baris pendek, supaya
  // tombol "Lihat selengkapnya" cuma muncul saat memang perlu di-expand.
  const isLongAnswer = (faq.answer ?? "").length > 180;

  // Selalu kirim is_answered + notes berdua, supaya salah satunya
  // tidak ke-reset jadi null oleh backend.
  const patch = async (overrides, key, successMessage) => {
    setBusy(key);
    try {
      await axiosInstance.patch(url, {
        is_answered: answered,
        notes: savedNote || null,
        ...overrides,
      });
      toast.success(successMessage);
      await onChanged();
      return true;
    } catch (error) {
      toast.error(errorMessage(error, "Gagal menyimpan perubahan"));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleToggleAnswered = () =>
    patch(
      { is_answered: !answered },
      "status",
      answered ? "Ditandai belum dijawab" : "Ditandai sudah dijawab",
    );

  const handleSaveNote = async () => {
    const ok = await patch(
      { notes: noteDraft.trim() || null },
      "note",
      "Catatan disimpan",
    );
    if (ok) setEditingNote(false);
  };

  const handleCancelNote = () => {
    setNoteDraft(savedNote);
    setEditingNote(false);
  };

  const handleOpenNote = () => {
    setNoteDraft(savedNote);
    setEditingNote(true);
  };

  const handleDelete = async () => {
    const ok = await confirm({
      variant: "destructive",
      title: "Hapus FAQ ini dari lead?",
      description:
        "FAQ yang dihapus akan hilang dari lead ini. Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Ya, Hapus",
      cancelLabel: "Batal",
      icon: <Trash2 className="size-5 text-destructive" />,
      onConfirm: async () => {
        setBusy("delete");
        try {
          await axiosInstance.delete(url);
          toast.success("FAQ dihapus dari lead");
          await onChanged();
        } catch (error) {
          toast.error(errorMessage(error, "Gagal menghapus FAQ dari lead"));
          throw error;
        } finally {
          setBusy(null);
        }
      },
    });

    if (!ok) return;
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 bg-card p-4 shadow-sm transition-colors",
        answered ? "border-l-emerald-500" : "border-l-amber-400",
      )}
    >
      {/* Header: kode + status di kiri, aksi (icon) di kanan */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {faq.code || "FAQ"}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              answered
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
            )}
          >
            {answered ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Circle className="size-3.5" />
            )}
            {answered ? "Sudah dijawab" : "Belum dijawab"}
          </span>
        </div>

        <div className="-mr-1 flex shrink-0 items-center gap-0.5">
          <IconAction
            label={answered ? "Tandai belum dijawab" : "Tandai sudah dijawab"}
            onClick={handleToggleAnswered}
            disabled={busy === "status"}
            className={
              answered
                ? "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                : "hover:text-emerald-600"
            }
          >
            {busy === "status" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
          </IconAction>

          <IconAction
            label={savedNote ? "Edit catatan" : "Tambah catatan"}
            onClick={handleOpenNote}
            disabled={editingNote}
            className={savedNote ? "text-primary hover:text-primary" : ""}
          >
            <StickyNote className="size-4" />
          </IconAction>

          <IconAction
            label="Hapus dari lead"
            onClick={handleDelete}
            className="hover:text-destructive"
            disabled={busy === "delete"}
          >
            {busy === "delete" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </IconAction>
        </div>
      </div>

      {/* Pertanyaan + jawaban */}
      <h5 className="mt-2 text-sm font-semibold leading-6">{faq.question}</h5>

      <div className="mt-1 min-w-0">
        <FaqAnswer text={faq.answer} expanded={showFullAnswer} clampLines={3} />
      </div>

      {isLongAnswer && (
        <button
          type="button"
          onClick={() => setShowFullAnswer((v) => !v)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {showFullAnswer ? "Tampilkan lebih sedikit" : "Lihat selengkapnya"}
        </button>
      )}

      {/* Catatan: tampil / edit */}
      {editingNote ? (
        <div className="mt-3 space-y-2">
          <Textarea
            autoFocus
            rows={3}
            maxLength={NOTE_MAX}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Contoh: Sudah dijelaskan via WhatsApp, client minta jadwal survei."
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {noteDraft.length}/{NOTE_MAX}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelNote}
                disabled={busy === "note"}
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={busy === "note"}
              >
                {busy === "note" && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                Simpan catatan
              </Button>
            </div>
          </div>
        </div>
      ) : (
        savedNote && (
          <div className="mt-3 flex gap-2 rounded-lg bg-muted/60 p-3 text-sm">
            <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="whitespace-pre-wrap leading-6">{savedNote}</p>
          </div>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. PANEL: dipakai di renderSubComponent DataTable
// ---------------------------------------------------------------------------
export default function LeadFaqPanel({ lead }) {
  const queryClient = useQueryClient();
  const leadId = lead?.id;
  const queryKey = ["lead-faqs", leadId];

  const { data, isLoading } = useApiFetch(
    queryKey,
    leadId ? `/leads/${leadId}/faqs` : null,
    undefined,
    !!leadId,
  );

  const faqs = toList(data);
  const total = faqs.length;
  const answeredCount = faqs.filter((f) => f.pivot?.is_answered).length;
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">FAQ untuk lead ini</h4>
            <p className="text-xs text-muted-foreground">
              Pertanyaan yang perlu dijawab ke {lead?.name || "lead"}. Tandai
              yang sudah dijawab dan tulis catatannya.
            </p>
          </div>
          <FaqPicker
            leadId={leadId}
            attachedIds={faqs.map((f) => f.id)}
            onAdded={refresh}
          />
        </div>

        {/* Progress: cuma tampil kalau sudah ada FAQ */}
        {total > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {answeredCount} dari {total} sudah dijawab
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Isi */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl border bg-muted/40"
              />
            ))}
          </div>
        ) : total ? (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <LeadFaqCard
                key={faq.id}
                faq={faq}
                leadId={leadId}
                onChanged={refresh}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center">
            <MessageCircleQuestion className="size-7 text-muted-foreground/60" />
            <p className="text-sm font-medium">Belum ada FAQ untuk lead ini</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Klik &quot;Tambah FAQ&quot; di kanan atas untuk memilih pertanyaan
              yang perlu dijawab ke lead.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
