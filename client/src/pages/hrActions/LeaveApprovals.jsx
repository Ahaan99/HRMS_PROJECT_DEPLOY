import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, X, Plus } from "lucide-react";
import API from "../../services/api";

const inputClass =
  "w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors placeholder:text-slate-400 text-slate-700";

const badge = (s) =>
  s === "Approved"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
    : s === "Rejected"
      ? "bg-rose-50 text-rose-700 ring-rose-100"
      : "bg-amber-50 text-amber-700 ring-amber-100";

export default function LeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    client_employee_id: "",
    leave_type: "Casual",
    from_date: "",
    to_date: "",
    reason: "",
  });

  const load = async () => {
    // allSettled: a failure in the employee lookup must not blank the leave list
    const [l, e] = await Promise.allSettled([
      API.get("/client/leave-offer/leaves"),
      API.get("/client/search/employees?pageSize=100"),
    ]);
    if (l.status === "fulfilled") {
      setLeaves(Array.isArray(l.value.data?.data) ? l.value.data.data : []);
    } else {
      setMsg(l.reason?.response?.data?.message || "Failed to load leave requests");
    }
    if (e.status === "fulfilled") {
      setEmployees(Array.isArray(e.value.data?.data) ? e.value.data.data : []);
    }
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/client/leave-offer/leaves", form);
      setShowForm(false);
      setForm({ client_employee_id: "", leave_type: "Casual", from_date: "", to_date: "", reason: "" });
      flash("Leave request recorded");
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Failed to create leave");
    }
  };

  const decide = async (id, decision) => {
    setBusyId(id);
    try {
      await API.patch(`/client/leave-offer/leaves/${id}`, { decision });
      flash(`Leave ${decision.toLowerCase()}`);
      load();
    } catch (err) {
      flash(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const rows = useMemo(
    () => (filter ? leaves.filter((l) => l.status === filter) : leaves),
    [leaves, filter]
  );
  const pending = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center shrink-0">
            <CalendarDays size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Leave Approvals
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {pending} pending request{pending === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors text-slate-700"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition-colors"
          >
            <Plus size={15} /> New Request
          </button>
        </div>
      </div>

      {msg && (
        <div className="text-sm px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 font-medium">
          {msg}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="card-premium relative overflow-hidden p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
          <select
            required
            value={form.client_employee_id}
            onChange={(e) => setForm({ ...form, client_employee_id: e.target.value })}
            className={inputClass}
            aria-label="Select employee"
          >
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} {e.employeeCode ? `(${e.employeeCode})` : ""}</option>
            ))}
          </select>
          <select
            value={form.leave_type}
            onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            className={inputClass}
            aria-label="Leave type"
          >
            <option>Casual</option><option>Sick</option><option>Earned</option><option>Unpaid</option>
          </select>
          <div className="flex gap-2">
            <input required type="date" value={form.from_date}
              onChange={(e) => setForm({ ...form, from_date: e.target.value })}
              className={inputClass} aria-label="From date" />
            <input required type="date" value={form.to_date} min={form.from_date}
              onChange={(e) => setForm({ ...form, to_date: e.target.value })}
              className={inputClass} aria-label="To date" />
          </div>
          <input
            value={form.reason} placeholder="Reason (optional)"
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className={`md:col-span-2 ${inputClass}`}
          />
          <button type="submit" className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition-colors">
            Submit Request
          </button>
        </form>
      )}

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="max-h-[60vh] overflow-auto scrollbar-thin-premium">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-200 text-left">
                {["Employee", "Type", "Dates", "Days", "Reason", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                        <CalendarDays size={28} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">No leave requests</p>
                        <p className="text-sm text-slate-400 mt-0.5">New requests will appear here</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-800 whitespace-nowrap">{l.employee_name}</div>
                    {l.employeeCode && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold font-mono">
                        {l.employeeCode}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {l.leave_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                    {new Date(l.from_date).toLocaleDateString("en-IN")} - {new Date(l.to_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{Number(l.days)}</td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate">{l.reason || "-"}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${badge(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    {l.status === "Pending" ? (
                      <div className="inline-flex gap-1.5">
                        <button
                          disabled={busyId === l.id}
                          onClick={() => decide(l.id, "Approved")}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-500 transition-colors disabled:opacity-40"
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          disabled={busyId === l.id}
                          onClick={() => decide(l.id, "Rejected")}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-500 transition-colors disabled:opacity-40"
                        >
                          <X size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {l.decided_at ? new Date(l.decided_at).toLocaleDateString("en-IN") : "-"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
