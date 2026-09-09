import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Siren, CheckCircle2, PhoneCall } from "lucide-react";

const BASE = import.meta.env.VITE_API_BASE_URL;
const REFRESH_MS = 20000;

const timeAgo = (iso) => {
  const m = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
};

const roleLabel = (r) => ({ hr: "HR", it: "IT", employee: "Employee", sales: "Sales" }[r] || r || "Unknown");

/* Read-only responder view for HR: open alerts from every portal, with a
   one-click resolve. Renders nothing when there are no open alerts so the
   dashboard stays quiet in normal operation. */
export default function EmergencyAlertsPanel() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("hrms_hr_Token")}` });

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/emergency`, { params: { status: "open", limit: 50 }, headers: headers() });
      setRows(res.data.data || []);
    } catch {
      /* non-responder token or network blip: keep last known state */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const resolve = async (id) => {
    try {
      setBusy(id);
      await axios.patch(`${BASE}/emergency/${id}/resolve`, {}, { headers: headers() });
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (!rows.length) return null;

  return (
    <section aria-live="polite" className="relative z-10 mx-auto mt-6 mb-12 max-w-[1600px] px-4 md:px-8">
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 text-white shadow">
            <Siren size={20} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-bold text-rose-900">
              {rows.length} open emergency {rows.length === 1 ? "alert" : "alerts"}
            </h3>
            <p className="text-xs text-rose-700">Someone pressed the Emergency button. Reach out, then mark it resolved.</p>
          </div>
        </div>

        <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-rose-100">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{r.display_name || `User #${r.user_id}`}</p>
                <p className="text-xs text-slate-500">
                  {roleLabel(r.user_role)}{r.department ? ` · ${r.department}` : ""} · {timeAgo(r.created_at)}
                  {Number(r.click_count) >= 2 && <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">Escalated</span>}
                </p>
                {r.phone && (
                  <a href={`tel:${r.phone}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                    <PhoneCall size={12} aria-hidden="true" />{r.phone}
                  </a>
                )}
                {r.note && <p className="mt-1 text-xs text-slate-600">{r.note}</p>}
              </div>
              <button
                onClick={() => resolve(r.id)}
                disabled={busy === r.id}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <CheckCircle2 size={13} aria-hidden="true" />
                {busy === r.id ? "Saving" : "Resolve"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
