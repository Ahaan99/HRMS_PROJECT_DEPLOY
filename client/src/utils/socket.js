import { io } from "socket.io-client";

// Prefer the explicit socket URL; fall back to the API origin (strip /api)
// so a missing VITE_API_SOCKET_URL never silently connects to the wrong host.
const SOCKET_URL =
  import.meta.env.VITE_API_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
});
