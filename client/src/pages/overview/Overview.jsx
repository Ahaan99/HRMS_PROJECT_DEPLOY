import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  FileText,
  ArrowRight,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import API from "../../services/api";
import { useClientAuth } from "../../context/ClientAuthContext";
import { isEmployeeRole } from "../../config/access";
import EmployeeOverview from "./EmployeeOverview";

// =========================
// HELPERS
// =========================
const asArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.rows)) return d.rows;
  if (Array.isArray(d?.list)) return d.list;
  return [];
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const STATUS_TONE = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  ABSENT: "bg-rose-50 text-rose-700 ring-rose-100",
  HALF_DAY: "bg-amber-50 text-amber-700 ring-amber-100",
  LEAVE: "bg-sky-50 text-sky-700 ring-sky-100",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-100",
};

function Tone({ value }) {
  const key = String(value || "").toUpperCase().replace(/\s+/g, "_");
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ring-1 ${
        STATUS_TONE[key] || "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {value || "-"}
    </span>
  );
}

// =========================
// STAT CARD (premium)
// =========================
const STAT_ACCENTS = [
  {
    bar: "from-indigo-500 to-violet-500",
    icon: "from-indigo-50 to-violet-100 ring-indigo-100 text-indigo-600",
  },
  {
    bar: "from-emerald-500 to-teal-500",
    icon: "from-emerald-50 to-teal-100 ring-emerald-100 text-emerald-600",
  },
  {
    bar: "from-amber-500 to-orange-500",
    icon: "from-amber-50 to-orange-100 ring-amber-100 text-amber-600",
  },
  {
    bar: "from-sky-500 to-indigo-500",
    icon: "from-sky-50 to-indigo-100 ring-sky-100 text-sky-600",
  },
  {
    bar: "from-violet-500 to-fuchsia-500",
    icon: "from-violet-50 to-fuchsia-100 ring-violet-100 text-violet-600",
  },
];

function StatCard({ icon: Icon, label, value, sub, to, accent }) {
  const a = STAT_ACCENTS[accent % STAT_ACCENTS.length];
  return (
    <Link
      to={to}
      className="card-premium group relative overflow-hidden p-5 flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10 transition-all"
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${a.bar}`}
      />
      <div
        className={`w-11 h-11 rounded-2xl bg-gradient-to-br ring-1 flex items-center justify-center shrink-0 ${a.icon}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-2xl font-bold tracking-tight text-slate-900 leading-tight mt-0.5">
          {value}
        </div>
        {sub && (
          <div className="text-xs text-slate-400 truncate mt-0.5">{sub}</div>
        )}
      </div>
      <ArrowRight
        size={14}
        className="absolute right-4 top-4 text-slate-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
      />
    </Link>
  );
}

// =========================
// PANEL (premium)
// =========================
function Panel({ title, sub, to, toLabel, children }) {
  return (
    <div className="card-premium p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            {title}
          </h2>
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
      <div className="max-h-[260px] overflow-y-auto overflow-x-auto scrollbar-thin-premium">
        {children}
      </div>
    </div>
  );
}

// =========================
// OVERVIEW PAGE
// =========================
export default function Overview() {
  const { client } = useClientAuth();
  if (isEmployeeRole(client)) return <EmployeeOverview employee={client} />;
  return <AdminOverview />;
}

function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const [emp, att, lev, intv, inv] = await Promise.allSettled([
        API.get("/client/employees"),
        API.get("/client/attendance"),
        API.get("/client/leave-offer/leaves"),
        API.get("/client/interviews"),
        API.get("/client/invoices"),
      ]);

      if (!alive) return;
      if (emp.status === "fulfilled") setEmployees(asArray(emp.value));
      if (att.status === "fulfilled") setAttendance(asArray(att.value));
      if (lev.status === "fulfilled") setLeaves(asArray(lev.value));
      if (intv.status === "fulfilled") setInterviews(asArray(intv.value));
      if (inv.status === "fulfilled") setInvoices(asArray(inv.value));
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ---- derived stats ----
  const today = todayStr();
  const todayRows = attendance.filter(
    (a) => String(a.date || a.attendance_date || "").slice(0, 10) === today,
  );
  const presentToday = todayRows.filter(
    (a) => String(a.status || "").toUpperCase() === "PRESENT",
  ).length;

  const pendingLeaves = leaves.filter(
    (l) => String(l.status || "").toUpperCase() === "PENDING",
  );

  const deptCounts = employees.reduce((acc, e) => {
    const d = e.department_name || e.department || "Unassigned";
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const deptList = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const maxDept = deptList.length ? deptList[0][1] : 1;

  if (loading) {
    return (
      <div>
        <PageHeader title="Overview" desc="Loading your workspace..." />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="card-premium p-4 h-24 animate-pulse bg-slate-50"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Overview"
        desc="A live snapshot of your workforce, attendance, and approvals."
      />

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Employees"
          value={employees.length}
          sub={`${deptList.length} departments`}
          to="/employees"
          accent={0}
        />
        <StatCard
          icon={CalendarCheck}
          label="Present Today"
          value={presentToday}
          sub={`${todayRows.length} marked today`}
          to="/attendance"
          accent={1}
        />
        <StatCard
          icon={CalendarClock}
          label="Pending Leaves"
          value={pendingLeaves.length}
          sub={`${leaves.length} total requests`}
          to="/leave-approvals"
          accent={2}
        />
        <StatCard
          icon={ClipboardList}
          label="Interviews"
          value={interviews.length}
          sub="Tracked in pipeline"
          to="/interviews"
          accent={3}
        />
        <StatCard
          icon={FileText}
          label="Invoices"
          value={invoices.length}
          sub="All invoices"
          to="/invoices"
          accent={4}
        />
      </div>

      {/* ===== PANELS ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Departments */}
        <Panel
          title="Team by Department"
          sub={`${employees.length} team member${employees.length === 1 ? "" : "s"}`}
          to="/employees"
        >
          {deptList.length === 0 && (
            <p className="text-sm text-slate-400">No employees yet.</p>
          )}
          <div className="flex flex-col gap-3.5">
            {deptList.map(([dept, count]) => (
              <div key={dept}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">{dept}</span>
                  <span className="font-semibold text-slate-400">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${(count / maxDept) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Pending leaves */}
        <Panel
          title="Leave Requests"
          sub={`${pendingLeaves.length} pending approval`}
          to="/leave-approvals"
        >
          {leaves.length === 0 && (
            <p className="text-sm text-slate-400">No leave requests.</p>
          )}
          <table className="w-full min-w-[280px] text-sm">
            <tbody>
              {leaves.slice(0, 8).map((l, i) => (
                <tr
                  key={l.id ?? i}
                  className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="py-2.5 pr-2 font-semibold text-slate-800 whitespace-nowrap">
                    {l.employee_name || l.name || `#${l.employee_id}`}
                    <div className="text-[11px] font-normal text-slate-400">
                      {l.leave_type || l.type || ""}
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-xs text-slate-500 whitespace-nowrap">
                    {String(l.from_date || l.start_date || "").slice(0, 10)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Tone value={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Recent attendance */}
        <Panel
          title="Recent Attendance"
          sub={`${todayRows.length} marked today`}
          to="/attendance"
        >
          {attendance.length === 0 && (
            <p className="text-sm text-slate-400">No attendance records.</p>
          )}
          <table className="w-full min-w-[280px] text-sm">
            <tbody>
              {attendance.slice(0, 8).map((a, i) => (
                <tr
                  key={a.id ?? i}
                  className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/30 transition-colors"
                >
                  <td className="py-2.5 pr-2 font-semibold text-slate-800 whitespace-nowrap">
                    {a.employee_name || a.name || `#${a.employee_id}`}
                  </td>
                  <td className="py-2.5 pr-2 text-xs text-slate-500 whitespace-nowrap">
                    {String(a.date || a.attendance_date || "").slice(0, 10)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Tone value={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
