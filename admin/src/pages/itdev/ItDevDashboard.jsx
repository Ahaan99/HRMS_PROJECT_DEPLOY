import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ExportButton from "../../components/common/ExportButton";
import { PageHero } from "../../components/common/Premium";
import {
  Code2,
  Bug,
  Clock,
  Rocket,
  Flag,
  BarChart3,
  Plus,
  X,
  Trash2,
  FolderArchive,
  Video,
  FileText,
  Download,
  CalendarCheck,
  AlertTriangle,
  Search,
  GitPullRequest,
  ExternalLink,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Statuses mirror the IT portal exactly - both dashboards share the same it_* tables
const TASK_STATUSES = ["To Do", "In Progress", "Review", "Done"];
const BUG_STATUSES = ["Open", "In Progress", "Fixed", "Closed", "Reopened"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const MS_STATUSES = ["Not Started", "On Track", "At Risk", "Delayed", "Completed"];
const ENVIRONMENTS = ["Development", "Staging", "Production"];

const PILL = {
  "To Do": "bg-gray-100 text-gray-600",
  "In Progress": "bg-blue-100 text-blue-700",
  Review: "bg-violet-100 text-violet-700",
  Done: "bg-emerald-100 text-emerald-700",
  Merged: "bg-purple-100 text-purple-700",
  "Changes Requested": "bg-amber-100 text-amber-700",
  "Not Submitted": "bg-gray-100 text-gray-500",
  "Not Started": "bg-gray-100 text-gray-600",
  Open: "bg-red-100 text-red-700",
  Fixed: "bg-emerald-100 text-emerald-700",
  Verified: "bg-teal-100 text-teal-700",
  Closed: "bg-gray-100 text-gray-500",
  Reopened: "bg-orange-100 text-orange-700",
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
  Planned: "bg-gray-100 text-gray-600",
  "On Track": "bg-emerald-100 text-emerald-700",
  "At Risk": "bg-amber-100 text-amber-700",
  Delayed: "bg-red-100 text-red-700",
  Completed: "bg-teal-100 text-teal-700",
  Success: "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
  "Rolled Back": "bg-orange-100 text-orange-700",
  "Not Submitted": "bg-gray-100 text-gray-500",
  "Pending Review": "bg-blue-100 text-blue-700",
  "Changes Requested": "bg-orange-100 text-orange-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Today: "bg-indigo-100 text-indigo-700",
};

const Pill = ({ value }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PILL[value] || "bg-gray-100 text-gray-600"}`}>
    {value}
  </span>
);

const TABS = [
  { key: "dailywork", label: "Daily Work", icon: CalendarCheck },
  { key: "codereviews", label: "Code Reviews", icon: GitPullRequest },
  { key: "tasks", label: "Tasks", icon: Code2 },
  { key: "bugs", label: "Bugs", icon: Bug },
  { key: "timesheets", label: "Timesheets", icon: Clock },
  { key: "deployments", label: "Deployments", icon: Rocket },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "performance", label: "Performance", icon: BarChart3 },
  { key: "deliverables", label: "Deliverables", icon: FolderArchive },
];

const DELIVERABLE_KINDS = [
  { key: "video", label: "Videos", icon: Video },
  { key: "project_report", label: "Project Reports", icon: FileText },
  { key: "source_code", label: "Source Code", icon: FolderArchive },
];

const isToday = (d) => d && new Date(d).toDateString() === new Date().toDateString();
const initials = (name) =>
  (name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const fmtSize = (b) => {
  const n = Number(b) || 0;
  if (n >= 1024 ** 3) return (n / 1024 ** 3).toFixed(1) + " GB";
  if (n >= 1024 ** 2) return (n / 1024 ** 2).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(0) + " KB";
  return n + " B";
};

export default function ItDevDashboard() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState("dailywork");
  const [dailyWork, setDailyWork] = useState([]);
  const [codeReviews, setCodeReviews] = useState([]);
  const [crFilter, setCrFilter] = useState("All");
  const [dwQuery, setDwQuery] = useState("");
  const [dwBlockersOnly, setDwBlockersOnly] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [perf, setPerf] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [delivKind, setDelivKind] = useState("video");
  const [message, setMessage] = useState(null);

  const [modal, setModal] = useState(null); // 'task' | 'bug' | 'time' | 'deploy' | 'milestone'
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try {
      const [t, b, ts, d, m, p, emp, dl, dw, cr] = await Promise.all([
        axios.get(`${BASE_URL}/itdev/tasks`, { headers }),
        axios.get(`${BASE_URL}/itdev/bugs`, { headers }),
        axios.get(`${BASE_URL}/itdev/timesheets`, { headers }),
        axios.get(`${BASE_URL}/itdev/deployments`, { headers }),
        axios.get(`${BASE_URL}/itdev/milestones`, { headers }),
        axios.get(`${BASE_URL}/itdev/performance`, { headers }),
        axios.get(`${BASE_URL}/finance/employees-expense`, { headers }),
        axios.get(`${BASE_URL}/it-deliverables`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${BASE_URL}/itdev/daily-work`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${BASE_URL}/itdev/code-reviews`, { headers }).catch(() => ({ data: [] })),
      ]);
      setTasks(t.data || []);
      setBugs(b.data || []);
      setTimesheets(ts.data || []);
      setDeployments(d.data || []);
      setMilestones(m.data || []);
      setPerf(p.data || null);
      setEmployees(Array.isArray(emp.data) ? emp.data : []);
      setDeliverables(Array.isArray(dl.data?.data) ? dl.data.data : []);
      setDailyWork(Array.isArray(dw.data) ? dw.data : []);
      setCodeReviews(Array.isArray(cr.data) ? cr.data : []);
    } catch (err) {
      console.error("ITDev load error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const openModal = (kind) => {
    setForm({});
    setModal(kind);
  };

  const submitModal = async () => {
    const endpoints = {
      task: "tasks",
      bug: "bugs",
      time: "timesheets",
      deploy: "deployments",
      milestone: "milestones",
    };
    try {
      await axios.post(`${BASE_URL}/itdev/${endpoints[modal]}`, form, { headers });
      setModal(null);
      flash("success", "Saved");
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Save failed");
    }
  };

  const patch = async (kind, id, body) => {
    try {
      await axios.put(`${BASE_URL}/itdev/${kind}/${id}`, body, { headers });
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Update failed");
    }
  };

  const remove = async (kind, id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await axios.delete(`${BASE_URL}/itdev/${kind}/${id}`, { headers });
      load();
    } catch (err) {
      flash("error", err.response?.data?.message || "Delete failed");
    }
  };

  const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "-");
  const fmtDT = (d) => (d ? new Date(d).toLocaleString("en-IN") : "-");

  const openBlockers = dailyWork.filter((w) => w.blockers && w.blockers.trim());
  const submittedToday = new Set(dailyWork.filter((w) => isToday(w.work_date)).map((w) => w.employee_id)).size;
  const visibleDailyWork = dailyWork.filter((w) => {
    if (dwBlockersOnly && !(w.blockers && w.blockers.trim())) return false;
    if (!dwQuery.trim()) return true;
    const q = dwQuery.toLowerCase();
    return [w.employee, w.summary, w.blockers].some((v) => (v || "").toLowerCase().includes(q));
  });

  const CR_STATUSES = ["Open", "Changes Requested", "Approved", "Merged"];
  const crCounts = Object.fromEntries(CR_STATUSES.map((st) => [st, codeReviews.filter((c) => c.status === st).length]));
  const visibleCodeReviews = crFilter === "All" ? codeReviews : codeReviews.filter((c) => c.status === crFilter);

  const exportData =
    {
      dailywork: visibleDailyWork,
      codereviews: visibleCodeReviews,
      tasks,
      bugs,
      timesheets,
      deployments,
      milestones,
      deliverables,
      performance: perf?.taskStats || [],
    }[tab] || [];

  // Timesheets are the developer's own record: Super Admin reviews, never logs or deletes.
  const addButton = {
    tasks: ["task", "New Task"],
    bugs: ["bug", "Report Bug"],
    deployments: ["deploy", "Log Deployment"],
    milestones: ["milestone", "New Milestone"],
  }[tab];

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm";

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <PageHero
        eyebrow="Engineering"
        title="IT Developer Dashboard"
        subtitle="Tasks, bugs, timesheets, deployments and milestone tracking"
        icon={Code2}
        actions={
          <>
            <ExportButton data={exportData} filename={`itdev-${tab}`} />
            {addButton && (
              <button
                onClick={() => openModal(addButton[0])}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
              >
                <Plus size={16} /> {addButton[1]}
              </button>
            )}
          </>
        }
      />

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* KPI */}
      {perf?.counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            ["Blockers Raised", openBlockers.length, openBlockers.length ? "text-amber-700 bg-amber-50" : "text-gray-500 bg-gray-50"],
            ["Open Tasks", perf.counts.open_tasks, "text-blue-600 bg-blue-50"],
            ["Open Bugs", perf.counts.open_bugs, "text-red-600 bg-red-50"],
            ["In Code Review", perf.counts.in_review, "text-violet-600 bg-violet-50"],
            ["Deployments (30d)", perf.counts.deployments_30d, "text-emerald-600 bg-emerald-50"],
          ].map(([label, value, cls]) => (
            <div key={label} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
              <p className={`text-2xl font-bold mt-1.5 inline-block px-2.5 py-0.5 rounded-lg ${cls}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === key
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* DAILY WORK (read-only review of IT developers' end-of-day submissions) */}
      {tab === "dailywork" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={dwQuery}
                onChange={(e) => setDwQuery(e.target.value)}
                placeholder="Search developer, summary or blocker..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm"
              />
            </label>
            <button
              onClick={() => setDwBlockersOnly((v) => !v)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border ${
                dwBlockersOnly
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <AlertTriangle size={15} /> Blockers only
              {openBlockers.length > 0 && (
                <span className={`rounded-full px-1.5 text-xs ${dwBlockersOnly ? "bg-white/25" : "bg-amber-100 text-amber-800"}`}>
                  {openBlockers.length}
                </span>
              )}
            </button>
            <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600">
              <span className="font-bold text-gray-900 mr-1.5">{submittedToday}</span> submitted today
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <ul className="divide-y divide-gray-100">
              {visibleDailyWork.map((w) => {
                const hasBlocker = Boolean(w.blockers && w.blockers.trim());
                return (
                  <li key={w.id} className={`flex gap-4 p-4 sm:p-5 ${hasBlocker ? "bg-amber-50/40" : ""}`}>
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                      {initials(w.employee)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">{w.employee || `#${w.employee_id}`}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(w.work_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                          </span>
                          {isToday(w.work_date) && <Pill value="Today" />}
                        </div>
                        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          {Number(w.hours_spent) || 0}h
                        </span>
                      </div>
                      <p className="mt-1.5 whitespace-pre-line text-sm text-gray-700">{w.summary}</p>
                      {hasBlocker && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                            <AlertTriangle size={13} /> Blocker
                          </p>
                          <p className="mt-0.5 whitespace-pre-line text-sm text-amber-900">{w.blockers}</p>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
              {!visibleDailyWork.length && (
                <li className="px-5 py-12 text-center text-gray-400">
                  {dailyWork.length
                    ? "No submissions match this filter"
                    : "No daily work submitted by the IT team yet"}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* CODE REVIEWS (read-only: reviewing is owned by the IT team) */}
      {tab === "codereviews" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["All", ...CR_STATUSES].map((st) => (
              <button
                key={st}
                onClick={() => setCrFilter(st)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold ${
                  crFilter === st ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {st}
                <span className={`rounded-full px-1.5 text-xs ${crFilter === st ? "bg-white/20" : "bg-gray-100 text-gray-600"}`}>
                  {st === "All" ? codeReviews.length : crCounts[st]}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Pull Request</th>
                  <th className="px-4 py-3 text-left font-semibold">Linked Task</th>
                  <th className="px-4 py-3 text-left font-semibold">Author</th>
                  <th className="px-4 py-3 text-left font-semibold">Reviewer</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleCodeReviews.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        {c.pr_title}
                        {c.pr_link && (
                          <a href={c.pr_link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800" title="Open PR">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      {c.comments && <p className="mt-0.5 text-xs text-gray-500">{c.comments}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.task_title ? (
                        c.task_title
                      ) : c.task_id ? (
                        <span className="text-gray-400" title="The linked task was deleted after this review was requested">
                          Task #{c.task_id} (deleted)
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.author || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{c.reviewer || <span className="text-gray-400">Any</span>}</td>
                    <td className="px-4 py-3"><Pill value={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(c.updated_at || c.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
                {!visibleCodeReviews.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      {codeReviews.length ? "No pull requests in this state" : "No code reviews requested by the IT team yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TASKS */}
      {tab === "tasks" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Task</th>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Assignee</th>
                <th className="px-4 py-3 text-left font-semibold">Priority</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Code Review</th>
                <th className="px-4 py-3 text-left font-semibold">Due</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.project || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{t.assignee || "-"}</td>
                  <td className="px-4 py-3"><Pill value={t.priority} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => patch("tasks", t.id, { status: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {/* Read-only: review status is set by the IT team in their portal */}
                    <div className="flex flex-col gap-1">
                      <Pill v={t.review_status || "Not Submitted"} />
                      {t.pr_link && (
                        <a href={t.pr_link} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 hover:underline">
                          View PR{t.reviewer ? ` - ${t.reviewer}` : ""}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmt(t.due_date)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove("tasks", t.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!tasks.length && (
                <tr><td colSpan="8" className="px-5 py-10 text-center text-gray-400">No tasks yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* BUGS */}
      {tab === "bugs" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Bug</th>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Severity</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Assignee</th>
                <th className="px-4 py-3 text-left font-semibold">Reported By</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{b.title}</p>
                    {b.description && <p className="text-xs text-gray-400 truncate max-w-xs">{b.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.project || "-"}</td>
                  <td className="px-4 py-3"><Pill value={b.severity} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => patch("bugs", b.id, { status: e.target.value })}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                    >
                      {BUG_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.assignee || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{b.reported_by || "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove("bugs", b.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!bugs.length && (
                <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">No bugs reported</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TIMESHEETS */}
      {tab === "timesheets" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Developer</th>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-right font-semibold">Hours</th>
                <th className="px-4 py-3 text-left font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((ts) => (
                <tr key={ts.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmt(ts.work_date)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{ts.employee || `#${ts.employee_id}`}</td>
                  <td className="px-4 py-3 text-gray-600">{ts.project || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{Number(ts.hours)}</td>
                  <td className="px-4 py-3 text-gray-500">{ts.summary || "-"}</td>
                </tr>
              ))}
              {!timesheets.length && (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-gray-400">No time logged by the IT team yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DELIVERABLES (read-only mirror of IT uploads) */}
      {tab === "deliverables" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DELIVERABLE_KINDS.map(({ key, label, icon: Icon }) => {
              const n = deliverables.filter((d) => d.type === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setDelivKind(key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border ${
                    delivKind === key
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={15} /> {label}
                  <span className={`ml-1 px-1.5 rounded-md text-xs ${delivKind === key ? "bg-white/20" : "bg-gray-100"}`}>{n}</span>
                </button>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Title</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Uploaded by</th>
                  <th className="px-4 py-3 text-left font-semibold">File</th>
                  <th className="px-4 py-3 text-right font-semibold">Size</th>
                  <th className="px-4 py-3 text-left font-semibold">Uploaded</th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {deliverables.filter((d) => d.type === delivKind).map((d) => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{d.title}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{d.description || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{d.uploaded_by_name || (d.uploaded_by ? `#${d.uploaded_by}` : "-")}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.file_name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmtSize(d.file_size)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDT(d.created_at)}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`${BASE_URL.replace(/\/api\/?$/, "")}${d.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                      >
                        <Download size={13} /> {delivKind === "video" ? "Watch" : "Download"}
                      </a>
                    </td>
                  </tr>
                ))}
                {!deliverables.filter((d) => d.type === delivKind).length && (
                  <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">Nothing uploaded by the IT team in this category yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPLOYMENTS */}
      {tab === "deployments" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Project</th>
                <th className="px-4 py-3 text-left font-semibold">Version</th>
                <th className="px-4 py-3 text-left font-semibold">Environment</th>
                <th className="px-4 py-3 text-left font-semibold">Features</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">By / When</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{d.project}</td>
                  <td className="px-4 py-3 text-gray-700">{d.version_tag || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{d.environment}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{d.features || "-"}</td>
                  <td className="px-4 py-3"><Pill value={d.status} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {d.deployed_by || "-"}<br />{fmtDT(d.deployed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove("deployments", d.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {!deployments.length && (
                <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-400">No deployments logged</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MILESTONES */}
      {tab === "milestones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl shadow border border-gray-100 p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-indigo-500 uppercase">{m.project}</p>
                  <p className="font-bold text-gray-900">{m.title}</p>
                </div>
                <button onClick={() => remove("milestones", m.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Pill value={m.status} />
                <span className="text-xs text-gray-500">Target: {fmt(m.target_date)}</span>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{m.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      m.progress >= 100 ? "bg-emerald-500" : m.status === "At Risk" || m.status === "Delayed" ? "bg-red-400" : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min(m.progress, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={m.progress}
                  onBlur={(e) => Number(e.target.value) !== m.progress && patch("milestones", m.id, { progress: e.target.value })}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-xs"
                />
                <select
                  value={m.status}
                  onChange={(e) => patch("milestones", m.id, { status: e.target.value })}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                >
                  {MS_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {m.notes && <p className="text-xs text-gray-400">{m.notes}</p>}
            </div>
          ))}
          {!milestones.length && (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 py-10 text-center text-gray-400">
              No milestones yet
            </div>
          )}
        </div>
      )}

      {/* PERFORMANCE */}
      {tab === "performance" && perf && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">Tasks by Developer</div>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Developer</th>
                  <th className="px-4 py-2.5 text-right">Done / Total</th>
                  <th className="px-4 py-2.5 text-right">Approved</th>
                </tr>
              </thead>
              <tbody>
                {perf.taskStats.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{r.developer}</td>
                    <td className="px-4 py-2.5 text-right">{r.done}/{r.total_tasks}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{r.approved_reviews}</td>
                  </tr>
                ))}
                {!perf.taskStats.length && (
                  <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">Bugs Fixed</div>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Developer</th>
                  <th className="px-4 py-2.5 text-right">Fixed / Assigned</th>
                </tr>
              </thead>
              <tbody>
                {perf.bugStats.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{r.developer}</td>
                    <td className="px-4 py-2.5 text-right">{r.fixed}/{r.assigned}</td>
                  </tr>
                ))}
                {!perf.bugStats.length && (
                  <tr><td colSpan="2" className="px-4 py-8 text-center text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">Hours (Last 30 Days)</div>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Developer</th>
                  <th className="px-4 py-2.5 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {perf.hoursByDev.map((r, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{r.developer}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{Number(r.hours)}</td>
                  </tr>
                ))}
                {!perf.hoursByDev.length && (
                  <tr><td colSpan="2" className="px-4 py-8 text-center text-gray-400">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODALS */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {{ task: "New Task", bug: "Report Bug", deploy: "Log Deployment", milestone: "New Milestone" }[modal]}
              </h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {(modal === "task" || modal === "bug") && (
              <>
                <input
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Title"
                  className={inputCls}
                />
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className={inputCls}
                />
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.assignee_id || ""}
                    onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Assignee...</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <select
                    value={form[modal === "task" ? "priority" : "severity"] || "Medium"}
                    onChange={(e) =>
                      setForm({ ...form, [modal === "task" ? "priority" : "severity"]: e.target.value })
                    }
                    className={inputCls}
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {modal === "task" && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500">Due date</label>
                    <input
                      type="date"
                      value={form.due_date || ""}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                )}
              </>
            )}

            {modal === "time" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.work_date || ""}
                    onChange={(e) => setForm({ ...form, work_date: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={form.hours || ""}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="Hours"
                    className={inputCls}
                  />
                </div>
                <select
                  value={form.employee_id || ""}
                  onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Developer...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <input
                  value={form.summary || ""}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="What was done?"
                  className={inputCls}
                />
              </>
            )}

            {modal === "deploy" && (
              <>
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.version_tag || ""}
                    onChange={(e) => setForm({ ...form, version_tag: e.target.value })}
                    placeholder="Version (v1.2.0)"
                    className={inputCls}
                  />
                  <select
                    value={form.environment || "Production"}
                    onChange={(e) => setForm({ ...form, environment: e.target.value })}
                    className={inputCls}
                  >
                    {ENVIRONMENTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={form.features || ""}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  placeholder="Features / changes deployed"
                  rows={2}
                  className={inputCls}
                />
                <select
                  value={form.status || "Success"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputCls}
                >
                  <option>Success</option>
                  <option>Failed</option>
                  <option>Rolled Back</option>
                </select>
              </>
            )}

            {modal === "milestone" && (
              <>
                <input
                  value={form.project || ""}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Project"
                  className={inputCls}
                />
                <input
                  value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Milestone title"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.target_date || ""}
                    onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                    className={inputCls}
                  />
                  <select
                    value={form.status || "Planned"}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className={inputCls}
                  >
                    {MS_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <input
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes"
                  className={inputCls}
                />
              </>
            )}

            <button
              onClick={submitModal}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
