/**
 * Image proxy untuk Google Drive thumbnails.
 * Server-side fetch → tidak kena CORS restriction browser.
 */

const ALLOWED_HOSTS = [
  "drive.google.com",
  "drive.usercontent.google.com",
  "lh3.googleusercontent.com",
  "googleusercontent.com",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  // Whitelist domain supaya tidak jadi open proxy
  const isAllowed = ALLOWED_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );
  if (!isAllowed) {
    return new Response("Forbidden domain", { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "image/*,*/*" },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return new Response("Upstream error", { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        // Cache 1 jam di browser, stale-while-revalidate 24 jam
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[proxy-image] fetch error:", err);
    return new Response("Proxy error", { status: 502 });
  }
}
