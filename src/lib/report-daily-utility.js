import { format } from "date-fns";

/**
 * Extract a consistent YYYY-MM-DD string from any report shape.
 * Handles: { date }, { report_date }, { reportDate }, Date objects, ISO strings.
 * @param {Record<string, any>} report
 * @returns {string | null}
 */
export function getDailyReportDateString(report) {
  const v = report?.date ?? report?.report_date ?? report?.reportDate ?? null;
  if (!v) return null;
  if (v instanceof Date) return format(v, "yyyy-MM-dd");

  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  return format(parsed, "yyyy-MM-dd");
}

/**
 * Resolve a consistent status string from any report shape.
 * @param {Record<string, any>} report
 * @returns {"submitted" | "draft"}
 */
export function getDailyReportStatus(report) {
  const raw =
    report?.status ?? report?.report_status ?? report?.state ?? report?.stage;
  if (raw) {
    return String(raw).toLowerCase() === "submitted" ? "submitted" : "draft";
  }
  if (report?.submitted_at || report?.submittedAt) return "submitted";
  if (report?.is_submitted || report?.isSubmitted) return "submitted";
  return "draft";
}

/**
 * Strip HTML tags and return plain text from a progress field.
 * Falls back gracefully if DOMParser is unavailable (SSR).
 * @param {unknown} html
 * @returns {string}
 */
export function extractProgressText(html) {
  if (!html) return "";
  try {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    return (doc.body.textContent ?? "").trim();
  } catch {
    return String(html);
  }
}
