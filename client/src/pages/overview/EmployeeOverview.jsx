import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  TrendingUp,
  PhoneCall,
  IndianRupee,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import API from "../../services/api";
import { useClientAuth } from "../../context/ClientAuthContext";

const asArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const fmtDate = (v) => {
  if (!v) return "-";
  const d = new Date(String(v).slice(0, 10));
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtMoney = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(n) || 0,
  );

const todayISO = () => new Date().toISOString().slice(0, 10);

const STATUS_TONE = {
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  IN_PROGRESS: "bg-sky-50 text-sky-700 ring-sky-100",
  ASSIGNED: "bg-slate-100 text-slate-600 ring-slate-200",
  OVERDUE: "bg-rose-50 text-rose-700 ring-rose-100",
  ACCEPTED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-100",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  FOLLOW_UP: "bg-amber-50 text-amber-700 ring-amber-100",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-100",
  UNPAID: "bg-rose-50 text-rose-700 ring-rose-100",
};

function Tone({ value }) {
  const key = String(value || "").toUpperCase().replace(/[\s-]+/g, "_");
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ring-1 capitalize ${
        STATUS_TONE[key] || "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {String(value || "-").replace(/_/g, " ")}
    </span>
  );
}

const ACCENTS = [
  { bar: "from-indigo-500 to-violet-500", icon: "from-indigo-50 to-violet-100 ring-indigo-100 text-indigo-600" },
  { bar: "from-emerald-500 to-teal-500", icon: "from-emerald-50 to-teal-100 ring-emerald-100 text-emerald-600" },
  { bar: "from-amber-500 to-orange-500", icon: "from-amber-50 to-orange-100 ring-amber-100 text-amber-600" },
  { bar: "from-sky-500 to-indigo-500", icon: "from-sky-50 to-indigo-100 ring-sky-100 text-sky-600" },
  { bar: "from-violet-500 to-fuchsia-500", icon: "from-violet-50 to-fuchsia-100 ring-violet-100 text-violet-600" },
];

function StatCard({ icon: Icon, label, value, sub, to, accent, enabled = true }) {
  const a = ACCENTS[accent % ACCENTS.length];
  const Wrapper = enabled ? Link : "div";
  return (
    <Wrapper
      to={enabled ? to : undefined}
      className={`card-premium group relative overflow-hidden p-5 flex items-start gap-4 transition-all ${
        enabled ? "hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10" : "opacity-60"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${a.bar}`} />
      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ring-1 flex items-center justify-center shrink-0 ${a.icon}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 leading-tight mt-0.5 tabular-nums">{value}</div>
        {sub && <div className="text-xs text-slate-400 truncate mt-0.5">{sub}</div>}
      </div>
      {enabled && (
        <ArrowRight
          size={14}
          className="absolute right-4 top-4 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
        />
      )}
    </Wrapper>
  );
}

function Panel({ title, sub, to, toLabel, children }) {
  return (
    <div className="card-premium p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
        {to && (
          <Link
            to={to}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            {toLabel || "View all"} <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div className="max-h-[280px] overflow-y-auto overflow-x-auto scrollbar-thin-premium">{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <p className="text-sm text-slate-400 py-2">{text}</p>;
}

export default function EmployeeOverview({ employee }) {
  const { enabledFeatures = [] } = useClientAuth();
  const has = (k) => enabledFeatures.includes(k);

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [calls, setCalls] = useState([]);
  const [sales, setSales] = useState([]);
  const [leadBatches, setLeadBatches] = useState([]);

  useEffect(() => {
    let alive = true;
    const req = (ok, url) => (ok ? API.get(url) : Promise.resolve({ data: [] }));

    (async () => {
      const [t, p, c, s, l] = await Promise.allSettled([
        req(has("WORK_ASSIGNMENT"), "/client/work-assignment"),
        req(has("PERFORMANCE_TRACKER"), "/client/performance"),
        req(has("SALES_REPORT"), "/client/sales"),
        req(has("SALES_REPORT"), "/client/sales-report"),
        req(has("LEADS"), "/client/leads/batches"),
      ]);
      if (!alive) return;
      if (t.status === "fulfilled") setTasks(asArray(t.value));
      if (p.status === "fulfilled") setReviews(asArray(p.value));
      if (c.status === "fulfilled") setCalls(asArray(c.value));
      if (s.status === "fulfilled") setSales(asArray(s.value));
      if (l.status === "fulfilled") setLeadBatches(asArray(l.value));
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledFeatures.join(",")]);

  const today = todayISO();

  const taskStats = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "completed");
    const overdue = open.filter((t) => t.deadline && String(t.deadline).slice(0, 10) < today);
    const done = tasks.length - open.length;
    return { open: open.length, overdue: overdue.length, done, total: tasks.length };
  }, [tasks, today]);

  const latestReview = useMemo(
    () =>
      [...reviews].sort((a, b) => String(b.reviewDate || "").localeCompare(String(a.reviewDate || "")))[0] || null,
    [reviews],
  );
  const avgScore = reviews.length
    ? (reviews.reduce((s, r) => s + (Number(r.score) || 0), 0) / reviews.length).toFixed(1)
    : null;

  const callStats = useMemo(() => {
    const todayCalls = calls.filter((c) => String(c.call_date || "").slice(0, 10) === today);
    const accepted = calls.filter((c) => String(c.status).toLowerCase() === "accepted").length;
    return { today: todayCalls.length, accepted, total: calls.length };
  }, [calls, today]);

  const revenue = useMemo(
    () => ({
      billed: sales.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      collected: sales.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0),
    }),
    [sales],
  );

  const leadsTotal = leadBatches.reduce((s, b) => s + (Number(b.total_leads ?? b.lead_count ?? b.count) || 0), 0);

  const taskProgress = (t) => {
    if (t.status === "completed") return 100;
    const target = Number(t.target_value) > 0 ? Number(t.target_value) : 100;
    return Math.min(100, Math.max(0, Math.round(((Number(t.current_value) || 0) / target) * 100)));
  };
  const taskStatus = (t) =>
    t.status !== "completed" && t.deadline && String(t.deadline).slice(0, 10) < today ? "overdue" : t.status;

  const firstName = employee?.name?.split(" ")[0] || "there";

  if (loading) {
    return (
      <div>
        <PageHeader title={`Hi, ${firstName}`} desc="Loading your workspace..." />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-premium p-4 h-24 animate-pulse bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName}`}
        desc="Your tasks, performance and sales at a glance. Only your own records are shown here."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={ClipboardList}
          label="Open tasks"
          value={taskStats.open}
          sub={taskStats.overdue ? `${taskStats.overdue} overdue` : `${taskStats.done} of ${taskStats.total} completed`}
          to="/work-assignment"
          accent={0}
          enabled={has("WORK_ASSIGNMENT")}
        />
        <StatCard
          icon={TrendingUp}
          label="Performance"
          value={latestReview ? `${latestReview.score}/5` : "-"}
          sub={
            latestReview
              ? `${String(latestReview.month).slice(0, 3)} ${latestReview.year}${reviews.length > 1 ? ` - avg ${avgScore}` : ""}`
              : "No review yet"
          }
          to="/performance"
          accent={1}
          enabled={has("PERFORMANCE_TRACKER")}
        />
        <StatCard
          icon={PhoneCall}
          label="Calls today"
          value={callStats.today}
          sub={`${callStats.accepted} accepted of ${callStats.total}`}
          to="/sales"
          accent={2}
          enabled={has("SALES_REPORT")}
        />
        <StatCard
          icon={IndianRupee}
          label="Collected"
          value={fmtMoney(revenue.collected)}
          sub={`of ${fmtMoney(revenue.billed)} billed`}
          to="/sales-report"
          accent={3}
          enabled={has("SALES_REPORT")}
        />
        <StatCard
          icon={Target}
          label="Assigned leads"
          value={leadsTotal}
          sub={`${leadBatches.length} batch${leadBatches.length === 1 ? "" : "es"}`}
          to="/leads"
          accent={4}
          enabled={has("LEADS")}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel title="My tasks" sub={`${taskStats.open} open`} to={has("WORK_ASSIGNMENT") ? "/work-assignment" : null}>
          {tasks.length === 0 && <Empty text="No tasks assigned to you." />}
          <div className="flex flex-col gap-3.5">
            {[...tasks]
              .sort((a, b) => (a.status === "completed") - (b.status === "completed"))
              .slice(0, 6)
              .map((t) => {
                const pct = taskProgress(t);
                const st = taskStatus(t);
                return (
                  <div key={t.id}>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 truncate">{t.title}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400">{fmtDate(t.deadline)}</span>
                        <Tone value={st} />
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          st === "completed"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : st === "overdue"
                              ? "bg-gradient-to-r from-rose-500 to-orange-500"
                              : "bg-gradient-to-r from-indigo-500 to-violet-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>

        <Panel title="Recent calls" sub={`${callStats.total} logged`} to={has("SALES_REPORT") ? "/sales" : null}>
          {calls.length === 0 && <Empty text="No calls logged yet." />}
          <table className="w-full text-sm">
            <tbody>
              {[...calls]
                .sort((a, b) => String(b.call_date + b.call_time).localeCompare(String(a.call_date + a.call_time)))
                .slice(0, 8)
                .map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 pr-3 font-semibold text-slate-800 min-w-0">
                      <span className="line-clamp-1">{c.customer_name}</span>
                      <div className="text-[11px] font-normal text-slate-400">
                        {fmtDate(c.call_date)}
                        {c.call_time ? ` - ${String(c.call_time).slice(0, 5)}` : ""}
                        <span className="font-mono"> - {c.call_id}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <Tone value={c.status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="My sales" sub={`${sales.length} plan${sales.length === 1 ? "" : "s"} sold`} to={has("SALES_REPORT") ? "/sales-report" : null}>
          {sales.length === 0 && <Empty text="No sales recorded yet." />}
          <table className="w-full text-sm">
            <tbody>
              {[...sales]
                .sort((a, b) => String(b.purchase_date || "").localeCompare(String(a.purchase_date || "")))
                .slice(0, 8)
                .map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 pr-2 font-semibold text-slate-800">
                      <span className="line-clamp-1">{s.plan_name}</span>
                      <div className="text-[11px] font-normal text-slate-400">{fmtDate(s.purchase_date)}</div>
                    </td>
                    <td className="py-2.5 pr-2 text-xs text-slate-700 whitespace-nowrap text-right tabular-nums">
                      {fmtMoney(s.amount_paid)}
                      <div className="text-[11px] text-slate-400">of {fmtMoney(s.amount)}</div>
                    </td>
                    <td className="py-2.5 text-right">
                      <Tone value={s.payment_status} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {taskStats.overdue > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            You have {taskStats.overdue} overdue task{taskStats.overdue === 1 ? "" : "s"}.{" "}
            <Link to="/work-assignment" className="font-semibold underline underline-offset-2">
              Update progress
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
