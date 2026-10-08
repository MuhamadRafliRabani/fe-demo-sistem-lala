const IDR_CURRENCY_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ID_NUMBER_FORMATTER = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function toFiniteNumber(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "bigint") return Number(value);

  if (typeof value === "string") {
    const isNegative = /^\s*-/.test(value);
    const digits = parseIdrToDigits(value);
    if (!digits) return 0;
    const parsed = Number(digits);
    if (!Number.isFinite(parsed)) return 0;
    return isNegative ? -parsed : parsed;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseIdrToDigits(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

export function parseIdrToNumber(value) {
  return toFiniteNumber(value);
}

export function formatRupiah(value) {
  const amount = toFiniteNumber(value);
  const formatted = IDR_CURRENCY_FORMATTER.format(amount);
  return formatted
    .replace(/^-\s*Rp\s?/, "-Rp\u00A0")
    .replace(/^Rp\s?/, "Rp\u00A0");
}

export function formatRupiahCompact(value) {
  const amount = toFiniteNumber(value);
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: "compact",
    compactDisplay: "short",
  }).format(amount);

  return formatted
    .replace(/^-\s*Rp\s?/, "-Rp\u00A0")
    .replace(/^Rp\s?/, "Rp\u00A0");
}

export function formatMoneyPlain(value) {
  const amount = toFiniteNumber(value);
  return ID_NUMBER_FORMATTER.format(amount);
}
