export const resolveImageUrl = (src) => {
  const s = String(src || "").trim();
  if (!s) {
    return "https://i.pinimg.com/736x/4e/46/c2/4e46c274fec161fe63a5dadc3430ef8d.jpg";
  }
  const isAbs =
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("blob:") ||
    s.startsWith("data:");
  if (isAbs) return s;
  const rawBase =
    process.env.NEXT_PUBLIC_STORAGE_BASE_URL || "http://localhost:8000";
  const base = String(rawBase).trim().replace(/\/+$/, "");
  const path = String(s).replace(/^\/+/, "");
  if (path.startsWith("storage/")) {
    return `${base}/${path}`;
  }
  return `${base}/storage/${path}`;
};
