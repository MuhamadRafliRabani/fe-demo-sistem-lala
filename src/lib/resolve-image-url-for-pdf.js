/**
 * Resolve URL gambar.
 * - blob: / data: → langsung dikembalikan (local preview / base64)
 * - drive.google.com / googleusercontent.com → di-proxy lewat /api/proxy-image
 *   supaya tidak kena CORS restriction saat ditampilkan maupun di-capture html2canvas
 * - URL lain → dikembalikan apa adanya
 */
export const resolveImageUrlForPdf = (url) => {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  if (
    url.includes("drive.google.com") ||
    url.includes("googleusercontent.com")
  ) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }

  return url;
};
