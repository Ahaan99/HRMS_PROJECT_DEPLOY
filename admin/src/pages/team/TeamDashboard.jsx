import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Building2,
  CalendarCheck,
  CalendarX,
  Clock,
  PartyPopper,
  ClipboardList,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Crown,
} from "lucide-react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

/* ---------- tiny UI helpers ---------- */

const STAT_THEMES = {
  indigo: { tile: "bg-indigo-600", soft: "bg-indigo-50", text: "text-indigo-700", bar: "from-indigo-500 to-violet-500" },
  emerald: { tile: "bg-emerald-600", soft: "bg-emerald-50", text: "text-emerald-700", bar: "from-emerald-500 to-teal-500" },
  amber: { tile: "bg-amber-500", soft: "bg-amber-50", text: "text-amber-700", bar: "from-amber-400 to-orange-500" },
  rose: { tile: "bg-rose-500", soft: "bg-rose-50", text: "text-rose-700", bar: "from-rose-400 to-pink-500" },
};

function StatCard({ icon: Icon, label, value, sub, theme = "indigo" }) {
  const t = STAT_THEMES[theme];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.bar} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 truncate text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.tile} text-white shadow-md`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, sub, children, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-900">{title}</h3>
            {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const STATUS_STYLES = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  LATE: "bg-amber-50 text-amber-700",
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-rose-50 text-rose-700",
};

function Pill({ children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[children] || "bg-slate-100 text-slate-600"}`}
    >
      {children}
    </span>
  );
}

/* ---------- main dashboard ---------- */

export default function TeamDashboard({ role = "MANAGER" }) {
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(null);

  const isManager = role === "MANAGER";
  const RoleIcon = isManager ? Crown : ShieldCheck;
  const roleLabel = isManager ? "Manager" : "Team Leader";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await API.get("/super-admin/team-dashboard/summary");
      setData(res.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decideLeave = async (id, status) => {
    try {
      setDeciding(id + status);
      await API.patch(`/super-admin/team-dashboard/leaves/${id}`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    } finally {
      setDeciding(null);
    }
  };

  const t = data?.totals || {};

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                <RoleIcon size={18} />
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {roleLabel} Dashboard
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              Welcome, {auth?.user?.name || roleLabel}
            </h1>
            <p className="mt-1 text-sm text-indigo-100">
              Your team&apos;s attendance, leaves and headcount — live.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Team Members" value={loading ? "…" : (t.employees ?? 0)} sub="Total employees" theme="indigo" />
        <StatCard icon={CalendarCheck} label="Present Today" value={loading ? "…" : (t.presentToday ?? 0)} sub={`${t.lateToday ?? 0} late check-ins`} theme="emerald" />
        <StatCard icon={CalendarX} label="Not Checked In" value={loading ? "…" : (t.absentToday ?? 0)} sub="No attendance yet today" theme="rose" />
        <StatCard icon={ClipboardList} label="Pending Leaves" value={loading ? "…" : (t.pendingLeaves ?? 0)} sub={`${t.pendingCompOffs ?? 0} comp-offs pending`} theme="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Leave approvals */}
        <div className="xl:col-span-2">
          <SectionCard
            icon={ClipboardList}
            title="Leave Requests"
            sub="Approve or reject directly from here"
          >
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
            ) : !data?.recentLeaves?.length ? (
              <p className="py-6 text-center text-sm text-slate-400">No leave applications yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-4 font-semibold">Employee</th>
                      <th className="py-2 pr-4 font-semibold">Type</th>
                      <th className="py-2 pr-4 font-semibold">Dates</th>
                      <th className="py-2 pr-4 font-semibold">Days</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentLeaves.map((l) => (
                      <tr key={l.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-800">
                          {l.employee_name || `#${l.employee_id}`}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{l.leave_type || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">
                          {l.from_date} → {l.to_date}
                        </td>
                        <td className="py-3 pr-4 text-slate-600">{l.days}</td>
                        <td className="py-3 pr-4">
                          <Pill>{l.status}</Pill>
                        </td>
                        <td className="py-3">
                          {l.status === "Pending" ? (
                            <div className="flex items-center gap-2">
                              <button
                                disabled={deciding === l.id + "Approved"}
                                onClick={() => decideLeave(l.id, "Approved")}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>
                              <button
                                disabled={deciding === l.id + "Rejected"}
                                onClick={() => decideLeave(l.id, "Rejected")}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Decided</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SectionCard icon={PartyPopper} title="Upcoming Holidays" sub="Next 5 company holidays">
            {loading ? (
              <p className="py-4 text-center text-sm text-slate-400">Loading…</p>
            ) : !data?.upcomingHolidays?.length ? (
              <p className="py-4 text-center text-sm text-slate-400">No upcoming holidays.</p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingHolidays.map((h) => (
                  <li key={h.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <PartyPopper size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{h.name}</p>
                      <p className="text-xs text-slate-500">{h.holiday_date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard icon={Building2} title="Team by Department" sub="Headcount split">
            {loading ? (
              <p className="py-4 text-center text-sm text-slate-400">Loading…</p>
            ) : !data?.deptBreakdown?.length ? (
              <p className="py-4 text-center text-sm text-slate-400">No departments found.</p>
            ) : (
              <ul className="space-y-3">
                {data.deptBreakdown.map((d) => {
                  const max = Math.max(...data.deptBreakdown.map((x) => Number(x.count) || 0), 1);
                  const pct = Math.round(((Number(d.count) || 0) / max) * 100);
                  return (
                    <li key={d.department}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-slate-700">{d.department}</span>
                        <span className="shrink-0 text-xs font-bold text-slate-500">{d.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Today's attendance */}
      <SectionCard icon={Clock} title="Today's Attendance" sub="Live check-ins from your team">
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
        ) : !data?.attendanceToday?.length ? (
          <p className="py-6 text-center text-sm text-slate-400">No check-ins yet today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4 font-semibold">Employee</th>
                  <th className="py-2 pr-4 font-semibold">Check In</th>
                  <th className="py-2 pr-4 font-semibold">Check Out</th>
                  <th className="py-2 pr-4 font-semibold">Method</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.attendanceToday.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {a.employee_name || `#${a.employee_id}`}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{a.check_in || "—"}</td>
                    <td className="py-3 pr-4 text-slate-600">{a.check_out || "—"}</td>
                    <td className="py-3 pr-4 text-slate-600">{a.method || "—"}</td>
                    <td className="py-3">
                      <Pill>{a.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
