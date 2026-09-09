import usePrompt from "../../hooks/usePrompt";
import { useEffect, useState } from "react";
import { salaryService } from "../../services/salaryService";
import { getEmployees } from "../../services/employeesService";
import ExportButton from "../../components/common/ExportButton";
import { PageHero, StatCard, PillTab } from "../../components/common/Premium";
import {
  TrendingUp,
  Plus,
  Check,
  X,
  History,
  SlidersHorizontal,
  Clock,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const TABS = [
  { key: "Revisions", icon: TrendingUp },
  { key: "Approval Matrix", icon: SlidersHorizontal },
  { key: "History", icon: History },
];

/* Safely parse approver/required roles that may arrive as a JSON string,
   a plain comma-separated string, an array, or null. Never throws. */
const parseRoles = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const DASH = "\u2014"; // em dash
const RUPEE = "\u20B9";
const ARROW = " \u2192 ";
const RANGE = " \u2013 "; // en dash

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : DASH);
const money = (n) =>
  n == null
    ? DASH
    : `${RUPEE}${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const Th = ({ children, className = "" }) => (
  <th
    className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#7b8698] ${className}`}
  >
    {children}
  </th>
);

const EmptyRow = ({ colSpan, text }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-[#7b8698]">
      {text}
    </td>
  </tr>
);

const Badge = ({ status }) => {
  const map = {
    Pending: "bg-[#fff7e8] text-[#b97a1a]",
    Approved: "bg-[#e9f9ef] text-[#1d9e55]",
    Applied: "bg-[#eef2ff] text-[#4655c4]",
    Rejected: "bg-[#fdeef0] text-[#c73e4c]",
    Cancelled: "bg-[#f1f3f8] text-[#33405c]",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${map[status] || "bg-[#f1f3f8] text-[#33405c]"}`}
    >
      {status}
    </span>
  );
};

export default function SalaryRevisions() {
  const { ask, PromptDialog } = usePrompt();
  const [tab, setTab] = useState("Revisions");
  const [loading, setLoading] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: "",
    proposed_salary: "",
    reason: "",
    effective_from: "",
  });
  const [matrixEdit, setMatrixEdit] = useState(null); // { id, min_percent, max_percent, approver_roles }

  const load = async () => {
    setLoading(true);
    try {
      const [r, m, h, e] = await Promise.all([
        salaryService.getRevisions(),
        salaryService.getMatrix(),
        salaryService.getHistory(),
        getEmployees().catch(() => []),
      ]);
      setRevisions(r.data?.data || []);
      setMatrix(m.data?.data || []);
      setHistory(h.data?.data || []);
      const body = e?.data ?? e;
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body?.employees)
        ? body.employees
        : Array.isArray(body?.data)
        ? body.data
        : [];
      setEmployees(list);
    } catch (err) {
      console.error("Salary load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitRevision = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.proposed_salary) {
      toast.error("Employee and proposed salary are required");
      return;
    }
    try {
      await salaryService.createRevision(form);
      setForm({ employee_id: "", proposed_salary: "", reason: "", effective_from: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create revision");
    }
  };

  const decide = async (id, action) => {
    const remarks = await ask({
      title: `${action} salary revision`,
      label: "Remarks",
      placeholder: "Optional note for the record",
      multiline: true,
      submitText: action,
      danger: String(action).toLowerCase().includes("reject"),
    });
    if (remarks === null) return;
    try {
      await salaryService.decideRevision(id, action, remarks);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update revision");
    }
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this revision request?")) return;
    try {
      await salaryService.cancelRevision(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel revision");
    }
  };

  const saveMatrixRule = async (e) => {
    e.preventDefault();
    try {
      await salaryService.updateMatrixRule(matrixEdit.id, {
        min_percent: matrixEdit.min_percent,
        max_percent: matrixEdit.max_percent === "" ? null : matrixEdit.max_percent,
        approver_roles: matrixEdit.approver_roles,
      });
      setMatrixEdit(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update rule");
    }
  };

  const toggleRole = (role) => {
    const roles = matrixEdit.approver_roles.includes(role)
      ? matrixEdit.approver_roles.filter((r) => r !== role)
      : [...matrixEdit.approver_roles, role];
    setMatrixEdit({ ...matrixEdit, approver_roles: roles });
  };

  const pendingCount = revisions.filter((r) => r.status === "Pending").length;
  const appliedCount = revisions.filter(
    (r) => r.status === "Approved" || r.status === "Applied",
  ).length;

  const exportData =
    tab === "Revisions"
      ? revisions.map((r) => ({
          Employee: r.employee_name,
          "Current Salary": r.current_salary,
          "Proposed Salary": r.proposed_salary,
          "Change %": r.change_percent,
          Status: r.status,
          "Effective From": r.effective_from,
          "Requested By": r.requested_by,
          Reason: r.reason,
        }))
      : tab === "History"
        ? history.map((h) => ({
            Employee: h.employee_name,
            "Old Salary": h.old_salary,
            "New Salary": h.new_salary,
            "Changed By": h.changed_by,
            Source: h.change_source,
            Date: h.created_at,
          }))
        : matrix.map((m) => ({
            Rule: m.rule_name,
            "Min %": m.min_percent,
            "Max %": m.max_percent ?? "No limit",
            Approvers: parseRoles(m.approver_roles).join(ARROW),
          }));

  return (
    <>
    <div className="space-y-6">
      <PageHero
        icon={TrendingUp}
        title="Salary Revisions"
        subtitle="Salary change requests, multi-level approval matrix, and full salary history"
        actions={
          <ExportButton
            data={exportData}
            filename={`salary-${tab.toLowerCase().replace(/\s+/g, "-")}`}
          />
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={revisions.length}
          icon={TrendingUp}
          tone="indigo"
        />
        <StatCard label="Pending Approval" value={pendingCount} icon={Clock} tone="amber" />
        <StatCard
          label="Approved / Applied"
          value={appliedCount}
          icon={BadgeCheck}
          tone="green"
        />
        <StatCard
          label="History Entries"
          value={history.length}
          icon={History}
          tone="slate"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <PillTab
            key={t.key}
            active={tab === t.key}
            onClick={() => setTab(t.key)}
            icon={t.icon}
          >
            {t.key}
          </PillTab>
        ))}
      </div>

      {tab === "Revisions" && (
        <>
          {/* New revision form */}
          <form
            onSubmit={submitRevision}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-[#e4e8f0] bg-white p-4 shadow-[0_1px_2px_rgba(11,18,32,0.04)] md:grid-cols-5"
          >
            <select
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              className="rounded-xl border border-[#e4e8f0] px-3 py-2 text-sm"
            >
              <option value="">{"Select employee\u2026"}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Proposed salary"
              value={form.proposed_salary}
              onChange={(e) => setForm({ ...form, proposed_salary: e.target.value })}
              className="rounded-xl border border-[#e4e8f0] px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.effective_from}
              onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
              className="rounded-xl border border-[#e4e8f0] px-3 py-2 text-sm"
              title="Effective from (optional; applies immediately on final approval if empty)"
            />
            <input
              placeholder="Reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="rounded-xl border border-[#e4e8f0] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f2c4d] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              <Plus size={16} /> Request Revision
            </button>
          </form>

          <div className="overflow-x-auto rounded-2xl border border-[#e4e8f0] bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04)]">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-[#e4e8f0] bg-[#f8fafc]">
                <tr>
                  <Th>Employee</Th>
                  <Th>Current</Th>
                  <Th>Proposed</Th>
                  <Th>Change</Th>
                  <Th>Approval Progress</Th>
                  <Th>Effective</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <EmptyRow colSpan={8} text={"Loading\u2026"} />
                ) : revisions.length === 0 ? (
                  <EmptyRow colSpan={8} text="No salary revisions yet" />
                ) : (
                  revisions.map((r) => {
                    const roles = parseRoles(r.required_roles);
                    return (
                      <tr key={r.id} className="border-b border-[#f1f3f8] last:border-0">
                        <td className="px-4 py-3 font-semibold text-[#1f2c4d]">
                          {r.employee_name}
                        </td>
                        <td className="px-4 py-3">{money(r.current_salary)}</td>
                        <td className="px-4 py-3 font-semibold">{money(r.proposed_salary)}</td>
                        <td
                          className={`px-4 py-3 font-bold ${Number(r.change_percent) >= 0 ? "text-[#1d9e55]" : "text-[#c73e4c]"}`}
                        >
                          {Number(r.change_percent) >= 0 ? "+" : ""}
                          {r.change_percent}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {roles.map((role, i) => (
                              <span
                                key={role}
                                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                  i < r.current_level
                                    ? "bg-[#e9f9ef] text-[#1d9e55]"
                                    : i === r.current_level && r.status === "Pending"
                                      ? "bg-[#fff7e8] text-[#b97a1a]"
                                      : "bg-[#f1f3f8] text-[#7b8698]"
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">{fmt(r.effective_from)}</td>
                        <td className="px-4 py-3">
                          <Badge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {r.status === "Pending" && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => decide(r.id, "Approved")}
                                className="rounded-lg bg-[#e9f9ef] p-1.5 text-[#1d9e55] hover:opacity-80"
                                title="Approve"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => decide(r.id, "Rejected")}
                                className="rounded-lg bg-[#fdeef0] p-1.5 text-[#c73e4c] hover:opacity-80"
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={() => cancel(r.id)}
                                className="rounded-lg bg-[#f1f3f8] px-2 py-1 text-xs font-bold text-[#33405c] hover:opacity-80"
                                title="Cancel request"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Approval Matrix" && (
        <div className="overflow-x-auto rounded-2xl border border-[#e4e8f0] bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04)]">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-[#e4e8f0] bg-[#f8fafc]">
              <tr>
                <Th>Rule</Th>
                <Th>Change Range</Th>
                <Th>Approval Chain</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {matrix.length === 0 ? (
                <EmptyRow colSpan={4} text="No matrix rules configured" />
              ) : (
                matrix.map((m) => {
                  const roles = parseRoles(m.approver_roles);
                  const editing = matrixEdit?.id === m.id;
                  return (
                    <tr key={m.id} className="border-b border-[#f1f3f8] last:border-0">
                      <td className="px-4 py-3 font-semibold text-[#1f2c4d]">
                        <span className="inline-flex items-center gap-2">
                          <SlidersHorizontal size={14} className="text-[#7b8698]" />
                          {m.rule_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <span className="flex items-center gap-2">
                            <input
                              type="number"
                              value={matrixEdit.min_percent}
                              onChange={(e) =>
                                setMatrixEdit({ ...matrixEdit, min_percent: e.target.value })
                              }
                              className="w-20 rounded-lg border border-[#e4e8f0] px-2 py-1"
                            />
                            {"\u2013"}
                            <input
                              type="number"
                              value={matrixEdit.max_percent ?? ""}
                              placeholder="No limit"
                              onChange={(e) =>
                                setMatrixEdit({ ...matrixEdit, max_percent: e.target.value })
                              }
                              className="w-20 rounded-lg border border-[#e4e8f0] px-2 py-1"
                            />
                            %
                          </span>
                        ) : (
                          <>
                            {m.min_percent}%{RANGE}
                            {m.max_percent == null ? "no limit" : `${m.max_percent}%`}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <div className="flex flex-wrap gap-1.5">
                            {["TL", "MANAGER", "SUPER_ADMIN"].map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  matrixEdit.approver_roles.includes(role)
                                    ? "bg-[#1f2c4d] text-white"
                                    : "bg-[#f1f3f8] text-[#7b8698]"
                                }`}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="font-semibold">{roles.join(ARROW)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={saveMatrixRule}
                              className="rounded-lg bg-[#1f2c4d] px-3 py-1.5 text-xs font-bold text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setMatrixEdit(null)}
                              className="rounded-lg bg-[#f1f3f8] px-3 py-1.5 text-xs font-bold text-[#33405c]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setMatrixEdit({
                                id: m.id,
                                min_percent: m.min_percent,
                                max_percent: m.max_percent,
                                approver_roles: roles,
                              })
                            }
                            className="rounded-lg bg-[#eef2ff] px-3 py-1.5 text-xs font-bold text-[#4655c4] hover:opacity-80"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "History" && (
        <div className="overflow-x-auto rounded-2xl border border-[#e4e8f0] bg-white shadow-[0_1px_2px_rgba(11,18,32,0.04)]">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b border-[#e4e8f0] bg-[#f8fafc]">
              <tr>
                <Th>Employee</Th>
                <Th>Old Salary</Th>
                <Th>New Salary</Th>
                <Th>Changed By</Th>
                <Th>Source</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <EmptyRow colSpan={6} text="No salary changes recorded yet" />
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="border-b border-[#f1f3f8] last:border-0">
                    <td className="px-4 py-3 font-semibold text-[#1f2c4d]">
                      <span className="inline-flex items-center gap-2">
                        <History size={14} className="text-[#7b8698]" />
                        {h.employee_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">{money(h.old_salary)}</td>
                    <td className="px-4 py-3 font-semibold">{money(h.new_salary)}</td>
                    <td className="px-4 py-3">{h.changed_by || DASH}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#f1f3f8] px-2.5 py-1 text-xs font-bold text-[#33405c]">
                        {h.change_source}
                      </span>
                    </td>
                    <td className="px-4 py-3">{fmt(h.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
      <PromptDialog />
    </>
  );
}
