/* Shared tones, badges and formatters for the admin complaint pages.
   Palette follows the admin design system (ink #0b1220, muted #7b8698, hairline #e6e9f0)
   so the global .dark overrides in index.css apply automatically. */

export const STATUS = {
  open: {
    label: "Open",
    pill: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    dot: "bg-sky-500",
  },
  in_progress: {
    label: "In Progress",
    pill: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    pill: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    dot: "bg-rose-500",
  },
};

export const PRIORITY = {
  low: { label: "Low", pill: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200" },
  medium: { label: "Medium", pill: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" },
  high: { label: "High", pill: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200" },
};

export const CATEGORY = {
  technical: "Technical",
  salary: "Salary",
  attendance: "Attendance",
  management: "Management",
  other: "Other",
};

/* Every portal that can raise a complaint (complaints.created_by_role enum). */
export const PORTAL_ORDER = ["client", "sales", "hr", "employee", "it", "manager", "admin"];

export const PORTAL = {
  client: { label: "Client Portal", short: "Client", dot: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700" },
  sales: { label: "Sales Portal", short: "Sales", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  hr: { label: "HR Portal", short: "HR", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  employee: { label: "Employee Portal", short: "Employee", dot: "bg-sky-500", chip: "bg-sky-50 text-sky-700" },
  it: { label: "IT Portal", short: "IT", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700" },
  manager: { label: "Manager", short: "Manager", dot: "bg-slate-500", chip: "bg-slate-100 text-slate-700" },
  admin: { label: "Super Admin", short: "Admin", dot: "bg-slate-500", chip: "bg-slate-100 text-slate-700" },
};

const FALLBACK_STATUS = { label: "Unknown", pill: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };
const FALLBACK_PORTAL = { label: "Other", short: "Other", dot: "bg-slate-400", chip: "bg-slate-100 text-slate-700" };

export const statusOf = (s) => STATUS[s] || { ...FALLBACK_STATUS, label: s || "Unknown" };
export const priorityOf = (p) => PRIORITY[p] || { label: p || "—", pill: PRIORITY.low.pill };
export const portalOf = (role) => PORTAL[role] || FALLBACK_PORTAL;
export const categoryOf = (c) => CATEGORY[c] || (c ? c[0].toUpperCase() + c.slice(1) : "Other");

export const isActiveStatus = (s) => s === "open" || s === "in_progress";

export const ADMIN_ROLES = new Set(["admin", "manager", "tl", "super_admin"]);

export const raisedBy = (c) => {
  if (!c) return "Unknown";
  if (c.created_by_role === "client") return c.client_name || "Client";
  if (c.created_by_role === "admin") return "Super Admin";
  return c.employee_name || c.client_name || "Unknown";
};

export const senderName = (r) => {
  if (r.sender_name) return r.sender_name;
  if (r.sender_role === "client") return r.client_name || "Client";
  if (ADMIN_ROLES.has(r.sender_role)) return "Super Admin";
  return r.employee_name || "Unknown";
};

export const roleLabel = (role) => portalOf(role).short;

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (w[0] || "").toUpperCase())
    .join("") || "?";

export function timeAgo(input) {
  if (!input) return "—";
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(input).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(input) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/* ---------- small presentational badges ---------- */

export function StatusPill({ status, size = "sm" }) {
  const t = statusOf(status);
  const pad = size === "lg" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${pad} ${t.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {t.label}
    </span>
  );
}

export function PriorityBadge({ priority, size = "sm" }) {
  const t = priorityOf(priority);
  const pad = size === "lg" ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";
  return (
    <span className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide ${pad} ${t.pill}`}>
      {t.label}
    </span>
  );
}

export function PortalChip({ role }) {
  const t = portalOf(role);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${t.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {t.short}
    </span>
  );
}

export function CategoryChip({ category }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#e6e9f0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#33405c]">
      {categoryOf(category)}
    </span>
  );
}
