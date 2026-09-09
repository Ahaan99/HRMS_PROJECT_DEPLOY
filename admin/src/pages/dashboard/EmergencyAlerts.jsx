import { useCallback, useEffect, useState } from "react";
import { Siren, CheckCircle2, RefreshCw, PhoneCall, Clock } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import API from "../../services/api";

const REFRESH_MS = 15000;

const timeAgo = (iso) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
};

const roleLabel = (r) => {
  const map = { hr: "HR", it: "IT", employee: "Employee", sales: "Sales", SUPER_ADMIN: "Super Admin", MANAGER: "Manager", TL: "Team Lead" };
  return map[r] || r || "Unknown";
};

export default function EmergencyAlerts() {
  const [tab, setTab] = useState("open");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ open: 0, escalated: 0, today: 0, resolved7d: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [list, sum] = await Promise.all([
        API.get("/emergency", { params: { status: tab, limit: 200 } }),
        API.get("/emergency/summary"),
      ]);
      setRows(list.data.data || []);
      setSummary(sum.data.data || {});
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load emergency alerts");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const resolve = async (id) => {
    try {
      await API.patch(`/emergency/${id}/resolve`, { note });
      setResolving(null);
      setNote("");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to resolve alert");
    }
  };

  const stat = (label, value, tone) => (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Alerts"
        desc="Live feed of the Emergency button pressed in the HR, IT and Employee portals."
        icon={Siren}
        actions={
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stat("Open alerts", summary.open ?? 0, summary.open ? "border-red-200 bg-red-50 text-red-800" : "border-gray-200 bg-white text-gray-800")}
        {stat("Escalated (2+ presses)", summary.escalated ?? 0, summary.escalated ? "border-orange-200 bg-orange-50 text-orange-800" : "border-gray-200 bg-white text-gray-800")}
        {stat("Triggered today", summary.today ?? 0, "border-gray-200 bg-white text-gray-800")}
        {stat("Resolved (7 days)", summary.resolved7d ?? 0, "border-emerald-200 bg-emerald-50 text-emerald-800")}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex gap-2" role="tablist" aria-label="Alert status">
            {[
              ["open", "Open"],
              ["resolved", "Resolved"],
              ["all", "All"],
            ].map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">Auto-refreshes every 15 seconds</p>
        </div>

        {error && <p className="px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Portal</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Loading alerts...</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-gray-500">
                    {tab === "open" ? "No open emergencies. All clear." : "No alerts to show."}
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const open = !r.resolved_at;
                const escalated = Number(r.click_count) >= 2;
                return (
                  <tr key={r.id} className={`border-t ${open ? (escalated ? "bg-orange-50/60" : "bg-red-50/40") : ""}`}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-800"><Clock size={14} className="text-gray-400" />{timeAgo(r.created_at)}</div>
                      <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.display_name || `User #${r.user_id}`}</div>
                      {r.department && <div className="text-xs text-gray-500">{r.department}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{roleLabel(r.user_role)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.phone ? (
                        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline"><PhoneCall size={13} />{r.phone}</a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {r.display_email && <div className="text-xs text-gray-500">{r.display_email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${escalated ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                        {escalated ? `Escalated x${r.click_count}` : "Step 1"}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-gray-600">{r.note || <span className="text-gray-400">-</span>}</td>
                    <td className="px-4 py-3">
                      {open ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />Open</span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} />Resolved</span>
                          <div className="text-xs text-gray-500">by {r.resolved_by || "-"} · {timeAgo(r.resolved_at)}</div>
                          {r.resolution_note && <div className="text-xs text-gray-500">{r.resolution_note}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {open && resolving !== r.id && (
                        <button onClick={() => { setResolving(r.id); setNote(""); }} className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800">
                          Resolve
                        </button>
                      )}
                      {open && resolving === r.id && (
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <input
                            autoFocus
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What was done? (optional)"
                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => resolve(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Confirm</button>
                            <button onClick={() => setResolving(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
