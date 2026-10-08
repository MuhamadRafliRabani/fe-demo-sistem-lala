import Echo from "laravel-echo";
import Pusher from "pusher-js";

export const createEcho = (token) => {
  if (typeof window === "undefined") return null; // << SSR SAFE

  window.Pusher = Pusher;

  // Pakai base URL dari ENV yang sama dengan axios
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  const normalizedApiBase = apiBase.replace(/\/+$/, "");
  const authBase = normalizedApiBase.replace(/\/api$/, "");

  return new Echo({
    broadcaster: "pusher",
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
    wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || undefined,
    wsPort: process.env.NEXT_PUBLIC_PUSHER_PORT
      ? Number(process.env.NEXT_PUBLIC_PUSHER_PORT)
      : undefined,
    wssPort: process.env.NEXT_PUBLIC_PUSHER_PORT
      ? Number(process.env.NEXT_PUBLIC_PUSHER_PORT)
      : undefined,
    enabledTransports: ["ws", "wss"],
    forceTLS: process.env.NEXT_PUBLIC_PUSHER_FORCE_TLS !== "false",
    authEndpoint: `${authBase}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};
