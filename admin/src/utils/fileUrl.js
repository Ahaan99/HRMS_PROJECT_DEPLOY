// Shared helper to build correct URLs for files stored under the backend's /uploads folder.
// Handles all photo/signature value formats saved in the DB:
//   - "/uploads/profile/xxx.jpg"  (full path, current backend format)
//   - "uploads/profile/xxx.jpg"
//   - "xxx.jpg"                   (bare filename)
//   - full http(s)/blob/data URLs (returned as-is)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Prefer explicit VITE_UPLOADS_BASE_URL; otherwise derive from the API base
// (strip trailing "/api" and append "/uploads" - backend serves /uploads statically).
const UPLOADS_BASE = (
  import.meta.env.VITE_UPLOADS_BASE_URL ||
  API_BASE.replace(/\/api\/?$/, "") + "/uploads"
).replace(/\/+$/, "");

export function fileUrl(value, folder = "profile") {
  if (!value) return null;
  const v = String(value).trim().replace(/\\/g, "/");
  if (/^(https?:|blob:|data:)/i.test(v)) return v;
  if (v.startsWith("/uploads/")) return UPLOADS_BASE + v.slice("/uploads".length);
  if (v.startsWith("uploads/")) return UPLOADS_BASE + v.slice("uploads".length);
  return `${UPLOADS_BASE}/${folder}/${v.replace(/^\/+/, "")}`;
}

export default fileUrl;
