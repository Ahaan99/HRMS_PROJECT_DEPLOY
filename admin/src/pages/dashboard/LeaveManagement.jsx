import usePrompt from "../../hooks/usePrompt";
import PageHero from "../../components/common/PageHero";
import { useEffect, useState, useCallback } from "react";
import { leaveService } from "../../services/leaveService";
import ExportButton from "../../components/common/ExportButton";
import {
  CalendarDays,
  Check,
  X,
  Trash2,
  Plus,
  ListFilter,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";

const TABS = ["Applications", "Client Leaves", "Balances", "Holidays", "Comp-Offs", "Overtime", "Leave Types"];

/* soft chips on the ink/indigo premium palette */
const STATUS_STYLE = {
  Pending: "bg-[#fdf3e3] text-[#b45309]",
  Approved: "bg-[#e7f5f0] text-[#148662]",
  Rejected: "bg-[#fdeef0] text-[#c73e4c]",
  Cancelled: "bg-[#eceff4] text-[#7b8698]",
};

const Badge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
      STATUS_STYLE[status] || "bg-[#eceff4] text-[#7b8698]"
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status}
  </span>
);

const Th = ({ children, className = "" }) => (
  <th
    className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7b8698] ${className}`}
  >
    {children}
  </th>
);

const EmptyRow = ({ colSpan, text }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center">
      <Inbox size={22} className="mx-auto text-[#7b8698]" />
      <p className="mt-2 text-sm font-medium text-[#33405c]">{text}</p>
    </td>
  </tr>
);

/* approve / reject pair used on Applications + Comp-Offs */
const DecideButtons = ({ onApprove, onReject }) => (
  <div className="flex gap-1.5">
    <button
      onClick={onApprove}
      className="flex items-center gap-1 rounded-lg bg-[#e7f5f0] px-2.5 py-1.5 text-[11px] font-bold text-[#148662] transition hover:bg-[#148662] hover:text-white"
      title="Approve"
    >
      <Check size={13} strokeWidth={3} /> Approve
    </button>
    <button
      onClick={onReject}
      className="flex items-center gap-1 rounded-lg bg-[#fdeef0] px-2.5 py-1.5 text-[11px] font-bold text-[#c73e4c] transition hover:bg-[#c73e4c] hover:text-white"
      title="Reject"
    >
      <X size={13} strokeWidth={3} /> Reject
    </button>
  </div>
);

export default function LeaveManagement() {
  const { ask, PromptDialog } = usePrompt();
  const [tab, setTab] = useState("Applications");
  const [applications, setApplications] = useState([]);
  const [clientLeaves, setClientLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [compOffs, setCompOffs] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [types, setTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [holidayForm, setHolidayForm] = useState({ name: "", holiday_date: "", description: "" });
  const [typeForm, setTypeForm] = useState({ name: "", annual_quota: 0, is_paid: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "Applications") {
        // Always load the full list: the pending badge must not disappear when the
        // status filter is on, so filtering happens client-side below.
        const { data } = await leaveService.getApplications();
        setApplications(Array.isArray(data) ? data : []);
      } else if (tab === "Client Leaves") {
        const { data } = await leaveService.getClientLeaves();
        setClientLeaves(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      } else if (tab === "Balances") {
        const { data } = await leaveService.getBalances();
        setBalances(Array.isArray(data) ? data : []);
      } else if (tab === "Holidays") {
        const { data } = await leaveService.getHolidays();
        setHolidays(Array.isArray(data) ? data : []);
      } else if (tab === "Comp-Offs") {
        const { data } = await leaveService.getCompOffs();
        setCompOffs(Array.isArray(data) ? data : []);
      } else if (tab === "Overtime") {
        const { data } = await leaveService.getOvertime();
        setOvertimes(Array.isArray(data?.data?.requests) ? data.data.requests : []);
      } else if (tab === "Leave Types") {
        const { data } = await leaveService.getTypes();
        setTypes(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, status) => {
    let note = "";
    if (status === "Rejected") {
      const reason = await ask({
        title: "Reject leave request",
        label: "Reason for rejection",
        placeholder: "Shared with the employee",
        multiline: true,
        submitText: "Reject",
        danger: true,
      });
      if (reason === null) return;
      note = reason;
    }
    try {
      await leaveService.decide(id, status, note);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const decideClientLeave = async (id, decision) => {
    let note = "";
    if (decision === "Rejected") {
      const reason = await ask({
        title: "Reject client leave request",
        label: "Reason for rejection",
        placeholder: "Shared with the client employee",
        multiline: true,
        submitText: "Reject",
        danger: true,
      });
      if (reason === null) return;
      note = reason;
    }
    try {
      await leaveService.decideClientLeave(id, decision, note);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const decideCompOff = async (id, status) => {
    try {
      await leaveService.decideCompOff(id, status);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Action failed");
    }
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.name || !holidayForm.holiday_date) return;
    try {
      await leaveService.addHoliday(holidayForm);
      setHolidayForm({ name: "", holiday_date: "", description: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add holiday");
    }
  };

  const decideOvertime = async (id, status) => {
    try {
      await leaveService.decideOvertime(id, status);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update overtime request");
    }
  };

  const addType = async (e) => {
    e.preventDefault();
    if (!typeForm.name) return;
    try {
      await leaveService.addType(typeForm);
      setTypeForm({ name: "", annual_quota: 0, is_paid: true });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add leave type");
    }
  };

  const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

  const visibleApplications = statusFilter
    ? applications.filter((a) => a.status === statusFilter)
    : applications;

  const visibleClientLeaves = statusFilter
    ? clientLeaves.filter((a) => a.status === statusFilter)
    : clientLeaves;

  const exportData = {
    Applications: visibleApplications,
    "Client Leaves": visibleClientLeaves,
    Balances: balances,
    Holidays: holidays,
    "Comp-Offs": compOffs,
    Overtime: overtimes,
    "Leave Types": types,
  }[tab];

  const pendingCount = applications.filter((a) => a.status === "Pending").length;

  const employeeCell = (name, id, code) => (
    <td className="px-4 py-3">
      <div className="text-[13px] font-bold text-[#0b1220]">{name || `#${id}`}</div>
      {code ? (
        <div className="num mt-0.5 text-[11px] text-[#7b8698]">{code}</div>
      ) : null}
    </td>
  );

  return (
    <>
    <div className="space-y-5">
      {/* ── header ── */}
      <PageHero
        title="Leave Management"
        subtitle="Applications, balances, holiday calendar, comp-offs and leave types"
        chips={[
          ...(pendingCount > 0
            ? [
                {
                  icon: <CalendarDays size={12} />,
                  label: `${pendingCount} Pending ${pendingCount === 1 ? "Application" : "Applications"}`,
                },
              ]
            : []),
        ]}
        actions={
          <ExportButton
            data={exportData}
            filename={`leave-${tab.toLowerCase().replace(/\s/g, "-")}`}
          />
        }
      />

      {/* ── segmented tabs ── */}
      <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-[#e6e9f0] bg-[#f0f2f7] p-1">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
                active
                  ? "bg-white text-[#0b1220] shadow-[0_1px_3px_rgba(11,18,32,0.12)]"
                  : "text-[#7b8698] hover:text-[#33405c]"
              }`}
            >
              {t}
              {t === "Applications" && pendingCount > 0 && (
                <span
                  className={`num flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    active ? "bg-[#4f63f0] text-white" : "bg-[#dfe3ec] text-[#33405c]"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-[#f9dade] bg-[#fdeef0] px-4 py-3 text-sm font-medium text-[#c73e4c]">
          {error}
        </div>
      )}

      {/* ── Applications ── */}
      {tab === "Applications" && (
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e6e9f0] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <ListFilter size={15} className="text-[#7b8698]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-premium !w-auto !py-2 text-[13px]"
              >
                <option value="">All statuses</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
                <option>Cancelled</option>
              </select>
            </div>
            <span className="num text-xs font-semibold text-[#7b8698]">
              {visibleApplications.length} record{visibleApplications.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0]">
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {visibleApplications.length === 0 && !loading && (
                  <EmptyRow
                    colSpan={8}
                    text={
                      statusFilter
                        ? `No ${statusFilter.toLowerCase()} leave applications`
                        : "No leave applications found"
                    }
                  />
                )}
                {visibleApplications.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    {employeeCell(a.employee_name, a.employee_id, a.employeeCode)}
                    <td className="px-4 py-3 text-[#33405c]">{a.leave_type}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{fmt(a.from_date)}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{fmt(a.to_date)}</td>
                    <td className="num px-4 py-3 font-bold text-[#0b1220]">{Number(a.days)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#7b8698]" title={a.reason}>
                      {a.reason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "Pending" ? (
                        <DecideButtons
                          onApprove={() => decide(a.id, "Approved")}
                          onReject={() => decide(a.id, "Rejected")}
                        />
                      ) : (
                        <span className="text-xs text-[#7b8698]">
                          {a.approved_by ? `by ${a.approved_by}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Client Leaves (raised inside client portals) ── */}
      {tab === "Client Leaves" && (
        <div className="card-premium overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e6e9f0] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <ListFilter size={15} className="text-[#7b8698]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-premium !w-auto !py-2 text-[13px]"
              >
                <option value="">All statuses</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
            </div>
            <span className="num text-xs font-semibold text-[#7b8698]">
              {visibleClientLeaves.length} record{visibleClientLeaves.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0]">
                  <Th>Client</Th>
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {visibleClientLeaves.length === 0 && !loading && (
                  <EmptyRow
                    colSpan={9}
                    text={
                      statusFilter
                        ? `No ${statusFilter.toLowerCase()} client leave requests`
                        : "No leave requests raised in any client portal yet"
                    }
                  />
                )}
                {visibleClientLeaves.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    {employeeCell(a.client_name, a.client_id, a.client_code)}
                    {employeeCell(a.employee_name, a.client_employee_id, a.employeeCode)}
                    <td className="px-4 py-3 text-[#33405c]">{a.leave_type}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{fmt(a.from_date)}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{fmt(a.to_date)}</td>
                    <td className="num px-4 py-3 font-bold text-[#0b1220]">{Number(a.days)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#7b8698]" title={a.reason}>
                      {a.reason || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "Pending" ? (
                        <DecideButtons
                          onApprove={() => decideClientLeave(a.id, "Approved")}
                          onReject={() => decideClientLeave(a.id, "Rejected")}
                        />
                      ) : (
                        <span
                          className="block max-w-[180px] truncate text-xs text-[#7b8698]"
                          title={a.approver_note || ""}
                        >
                          {a.approver_note || fmt(a.decided_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Balances ── */}
      {tab === "Balances" && (
        <div className="card-premium max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
              <tr className="border-b border-[#e6e9f0]">
                <Th>Employee</Th>
                <Th>Leave Type</Th>
                <Th>Year</Th>
                <Th>Allocated</Th>
                <Th>Used</Th>
                <Th>Remaining</Th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 && !loading && (
                <EmptyRow
                  colSpan={6}
                  text="No balances yet — rows appear once employees apply for leave"
                />
              )}
              {balances.map((b) => {
                const remaining = Number(b.allocated) - Number(b.used);
                const pct =
                  Number(b.allocated) > 0
                    ? Math.max(0, Math.min(100, (remaining / Number(b.allocated)) * 100))
                    : 0;
                return (
                  <tr
                    key={b.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    {employeeCell(b.employee_name, b.employee_id, b.employeeCode)}
                    <td className="px-4 py-3 text-[#33405c]">{b.leave_type}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{b.year}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{Number(b.allocated)}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{Number(b.used)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="num w-6 text-sm font-bold text-[#0b1220]">
                          {remaining}
                        </span>
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#eceff4]">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct <= 25 ? "#c73e4c" : pct <= 50 ? "#b45309" : "#148662",
                            }}
                          />
                        </span>
                        {Number(b.pending) > 0 && (
                          <span className="num text-[11px] font-semibold text-[#b45309]">
                            {Number(b.pending)} pending
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Holidays ── */}
      {tab === "Holidays" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <form onSubmit={addHoliday} className="card-premium h-fit space-y-4 p-5">
            <div>
              <h3 className="card-header-premium flex items-center gap-2">
                <Plus size={15} /> Add Holiday
              </h3>
              <p className="card-sub-premium mt-0.5">Add a date to the company calendar</p>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-[#33405c]">Holiday Name</span>
              <input
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                placeholder="e.g. Diwali"
                className="input-premium mt-1.5"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#33405c]">Date</span>
              <input
                type="date"
                value={holidayForm.holiday_date}
                onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
                className="input-premium num mt-1.5"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#33405c]">
                Description <span className="font-normal text-[#7b8698]">(optional)</span>
              </span>
              <input
                value={holidayForm.description}
                onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                placeholder="Festival of lights"
                className="input-premium mt-1.5"
              />
            </label>
            <button type="submit" className="btn-premium w-full">
              Add to Calendar
            </button>
          </form>

          <div className="card-premium overflow-x-auto lg:col-span-2">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0]">
                  <Th>Date</Th>
                  <Th>Holiday</Th>
                  <Th>Description</Th>
                  <Th className="w-16"> </Th>
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 && !loading && (
                  <EmptyRow colSpan={4} text="No holidays added yet" />
                )}
                {holidays.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    <td className="num px-4 py-3 font-bold text-[#0b1220]">
                      {fmt(h.holiday_date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#33405c]">{h.name}</td>
                    <td className="px-4 py-3 text-[#7b8698]">{h.description || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          window.confirm("Delete this holiday?") &&
                          leaveService.deleteHoliday(h.id).then(load)
                        }
                        className="rounded-lg p-1.5 text-[#c73e4c] transition hover:bg-[#fdeef0]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Comp-Offs ── */}
      {tab === "Comp-Offs" && (
        <div className="card-premium max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
              <tr className="border-b border-[#e6e9f0]">
                <Th>Employee</Th>
                <Th>Worked Date</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {compOffs.length === 0 && !loading && (
                <EmptyRow colSpan={5} text="No comp-off requests" />
              )}
              {compOffs.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                >
                  {employeeCell(c.employee_name, c.employee_id, c.employeeCode)}
                  <td className="num px-4 py-3 text-[#33405c]">{fmt(c.worked_date)}</td>
                  <td className="px-4 py-3 text-[#7b8698]">{c.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "Pending" ? (
                      <DecideButtons
                        onApprove={() => decideCompOff(c.id, "Approved")}
                        onReject={() => decideCompOff(c.id, "Rejected")}
                      />
                    ) : (
                      <span className="text-xs text-[#7b8698]">
                        {c.approved_by ? `by ${c.approved_by}` : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Overtime ── */}
      {tab === "Overtime" && (
        <div className="card-premium max-h-[60vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
              <tr className="border-b border-[#e6e9f0]">
                <Th>Employee</Th>
                <Th>OT Date</Th>
                <Th>Hours</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {overtimes.length === 0 && !loading && (
                <EmptyRow colSpan={6} text="No overtime requests" />
              )}
              {overtimes.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                >
                  {employeeCell(o.employee_name, o.employee_id)}
                  <td className="num px-4 py-3 text-[#33405c]">{fmt(o.ot_date)}</td>
                  <td className="num px-4 py-3 font-bold text-[#0b1220]">{o.hours}</td>
                  <td className="px-4 py-3 text-[#7b8698]">{o.reason || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "Pending" ? (
                      <DecideButtons
                        onApprove={() => decideOvertime(o.id, "Approved")}
                        onReject={() => decideOvertime(o.id, "Rejected")}
                      />
                    ) : (
                      <span className="text-xs text-[#7b8698]">
                        {o.decided_by ? `by ${o.decided_by}` : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Leave Types ── */}
      {tab === "Leave Types" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <form onSubmit={addType} className="card-premium h-fit space-y-4 p-5">
            <div>
              <h3 className="card-header-premium flex items-center gap-2">
                <Plus size={15} /> Add Leave Type
              </h3>
              <p className="card-sub-premium mt-0.5">Define a new category with its quota</p>
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-[#33405c]">Type Name</span>
              <input
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="e.g. Paternity Leave"
                className="input-premium mt-1.5"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#33405c]">Annual quota (days)</span>
              <input
                type="number"
                min="0"
                value={typeForm.annual_quota}
                onChange={(e) => setTypeForm({ ...typeForm, annual_quota: e.target.value })}
                className="input-premium num mt-1.5"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#e6e9f0] bg-[#f7f8fb] px-3.5 py-3">
              <input
                type="checkbox"
                checked={typeForm.is_paid}
                onChange={(e) => setTypeForm({ ...typeForm, is_paid: e.target.checked })}
                className="h-4 w-4 accent-[#4f63f0]"
              />
              <span className="text-[13px] font-semibold text-[#33405c]">Paid leave</span>
            </label>
            <button type="submit" className="btn-premium w-full">
              Add Type
            </button>
          </form>

          <div className="card-premium overflow-x-auto lg:col-span-2">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0]">
                  <Th>Type</Th>
                  <Th>Annual Quota</Th>
                  <Th>Paid</Th>
                  <Th className="w-16"> </Th>
                </tr>
              </thead>
              <tbody>
                {types.length === 0 && !loading && (
                  <EmptyRow colSpan={4} text="No leave types defined yet" />
                )}
                {types.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    <td className="px-4 py-3 font-bold text-[#0b1220]">{t.name}</td>
                    <td className="num px-4 py-3 text-[#33405c]">{t.annual_quota} days</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          t.is_paid
                            ? "bg-[#e7f5f0] text-[#148662]"
                            : "bg-[#eceff4] text-[#7b8698]"
                        }`}
                      >
                        {t.is_paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          window.confirm(`Delete "${t.name}"?`) &&
                          leaveService.deleteType(t.id).then(load)
                        }
                        className="rounded-lg p-1.5 text-[#c73e4c] transition hover:bg-[#fdeef0]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-[#7b8698]">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#d5dae4] border-t-[#4f63f0]" />
          Loading…
        </div>
      )}
    </div>
      <PromptDialog />
    </>
  );
}
