import { useEffect, useState } from "react";
import { compensationService } from "../../services/compensationService";
import { getEmployees } from "../../services/employeesService";
import ExportButton from "../../components/common/ExportButton";
import { PageHero, StatCard, PillTab } from "../../components/common/Premium";
import { Wallet, Gift, Plus, Trash2, Check, X, Shield } from "lucide-react";
import toast from "react-hot-toast";

const TABS = ["Reimbursements", "Rewards", "Insurance"];

const INSURANCE_TYPES = ["Health", "Life", "Accident", "Term", "Other"];

const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const money = (n) =>
  n == null ? "—" : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

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
    Rejected: "bg-[#fdeef0] text-[#c73e4c]",
    Paid: "bg-[#eef2ff] text-[#4655c4]",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${map[status] || "bg-[#f1f3f8] text-[#33405c]"}`}
    >
      {status}
    </span>
  );
};

export default function Compensation() {
  const [tab, setTab] = useState("Reimbursements");
  const [loading, setLoading] = useState(false);
  const [reimbursements, setReimbursements] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [insForm, setInsForm] = useState({
    employee_id: "",
    policy_type: "Health",
    provider: "",
    policy_number: "",
    coverage_amount: "",
    premium_amount: "",
    start_date: "",
    end_date: "",
    nominee: "",
    notes: "",
  });
  const [rewardForm, setRewardForm] = useState({
    employee_id: "",
    reward_type: "Incentive",
    title: "",
    amount: "",
    award_date: "",
    period: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [r, w, i, e] = await Promise.all([
        compensationService.getReimbursements(),
        compensationService.getRewards(),
        compensationService.getInsurance().catch(() => ({ data: { data: [] } })),
        getEmployees().catch(() => ({ data: [] })),
      ]);
      setReimbursements(r.data?.data || []);
      setRewards(w.data?.data || []);
      setInsurance(i.data?.data || []);
      const empList = Array.isArray(e.data) ? e.data : e.data?.employees || e.data?.data || [];
      setEmployees(empList);
    } catch (err) {
      console.error("Compensation load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decideReimb = async (id, status) => {
    try {
      await compensationService.decideReimbursement(id, status);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update reimbursement");
    }
  };

  const addReward = async (e) => {
    e.preventDefault();
    if (!rewardForm.employee_id || !rewardForm.title || !rewardForm.amount) {
      toast.error("Employee, title and amount are required");
      return;
    }
    try {
      await compensationService.createReward(rewardForm);
      setRewardForm({
        employee_id: "",
        reward_type: "Incentive",
        title: "",
        amount: "",
        award_date: "",
        period: "",
        notes: "",
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create reward");
    }
  };

  const markRewardPaid = async (id) => {
    try {
      await compensationService.updateRewardStatus(id, "Paid");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update reward");
    }
  };

  const removeReward = async (id) => {
    if (!window.confirm("Delete this reward?")) return;
    try {
      await compensationService.deleteReward(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete reward");
    }
  };

  const addInsurance = async (e) => {
    e.preventDefault();
    if (!insForm.employee_id || !insForm.provider || !insForm.coverage_amount) {
      toast.error("Employee, provider and coverage amount are required");
      return;
    }
    try {
      await compensationService.createInsurance(insForm);
      setInsForm({
        employee_id: "",
        policy_type: "Health",
        provider: "",
        policy_number: "",
        coverage_amount: "",
        premium_amount: "",
        start_date: "",
        end_date: "",
        nominee: "",
        notes: "",
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add insurance policy");
    }
  };

  const setInsuranceStatus = async (id, status) => {
    try {
      await compensationService.updateInsuranceStatus(id, status);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update insurance policy");
    }
  };

  const removeInsurance = async (id) => {
    if (!window.confirm("Delete this insurance policy?")) return;
    try {
      await compensationService.deleteInsurance(id);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete insurance policy");
    }
  };

  const exportData =
    tab === "Reimbursements"
      ? reimbursements.map((r) => ({
          Employee: r.employee_name,
          Department: r.department,
          Category: r.category,
          Amount: r.amount,
          "Expense Date": r.expense_date,
          Status: r.status,
          "Decided By": r.decided_by || "",
        }))
      : tab === "Rewards"
      ? rewards.map((r) => ({
          Employee: r.employee_name,
          Department: r.department,
          Type: r.reward_type,
          Title: r.title,
          Amount: r.amount,
          "Award Date": r.award_date || "",
          Period: r.period || "",
          Status: r.status,
        }))
      : insurance.map((p) => ({
          Employee: p.employee_name,
          Department: p.department,
          "Policy Type": p.policy_type,
          Provider: p.provider,
          "Policy Number": p.policy_number || "",
          Coverage: p.coverage_amount,
          Premium: p.premium_amount || "",
          "Start Date": p.start_date || "",
          "End Date": p.end_date || "",
          Nominee: p.nominee || "",
          Status: p.status,
        }));

  return (
    <div className="space-y-5">
      <PageHero
        icon={Wallet}
        title="Compensation"
        subtitle="Reimbursements, incentives and bonuses"
        actions={
          <ExportButton
            data={exportData}
            filename={
              tab === "Reimbursements"
                ? "reimbursements"
                : tab === "Rewards"
                ? "rewards"
                : "insurance"
            }
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Reimbursements"
          value={reimbursements.filter((r) => r.status === "Pending").length}
          sub={`${reimbursements.length} total requests`}
          icon={Wallet}
          tone="amber"
        />
        <StatCard
          label="Rewards Granted"
          value={money(rewards.reduce((s, r) => s + Number(r.amount || 0), 0))}
          sub={`${rewards.length} incentives & bonuses`}
          icon={Gift}
          tone="green"
        />
        <StatCard
          label="Insurance Policies"
          value={insurance.length}
          sub={`${insurance.filter((p) => p.status === "Active").length} active`}
          icon={Shield}
          tone="indigo"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <PillTab key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </PillTab>
        ))}
      </div>

      {/* ── Reimbursements ── */}
      {tab === "Reimbursements" && (
        <div className="card-premium max-h-[65vh] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
              <tr className="border-b border-[#e6e9f0]">
                <Th>Employee</Th>
                <Th>Category</Th>
                <Th>Amount</Th>
                <Th>Expense Date</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {reimbursements.length === 0 && !loading && (
                <EmptyRow colSpan={7} text="No reimbursement requests" />
              )}
              {reimbursements.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#0b1220]">{r.employee_name || "—"}</div>
                    <div className="text-xs text-[#7b8698]">{r.department || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-[#33405c]">{r.category}</td>
                  <td className="num px-4 py-3 font-bold text-[#0b1220]">{money(r.amount)}</td>
                  <td className="num px-4 py-3 text-[#33405c]">{fmt(r.expense_date)}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[#7b8698]">
                    {r.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "Pending" ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => decideReimb(r.id, "Approved")}
                          className="rounded-lg bg-[#e9f9ef] p-1.5 text-[#1d9e55] transition hover:bg-[#d4f3e0]"
                          title="Approve"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => decideReimb(r.id, "Rejected")}
                          className="rounded-lg bg-[#fdeef0] p-1.5 text-[#c73e4c] transition hover:bg-[#fbdce0]"
                          title="Reject"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : r.status === "Approved" ? (
                      <button
                        onClick={() => decideReimb(r.id, "Paid")}
                        className="rounded-lg bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#4655c4] transition hover:bg-[#dfe6ff]"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-xs text-[#7b8698]">
                        {r.decided_by ? `by ${r.decided_by}` : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Rewards ── */}
      {tab === "Rewards" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <form onSubmit={addReward} className="card-premium h-fit space-y-4 p-5">
            <h3 className="card-header-premium flex items-center gap-2">
              <Plus size={16} /> Grant Incentive / Bonus
            </h3>
            <select
              value={rewardForm.employee_id}
              onChange={(e) => setRewardForm({ ...rewardForm, employee_id: e.target.value })}
              className="input-premium w-full"
              required
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <select
              value={rewardForm.reward_type}
              onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })}
              className="input-premium w-full"
            >
              <option value="Incentive">Incentive</option>
              <option value="Bonus">Bonus</option>
            </select>
            <input
              type="text"
              placeholder="Title (e.g. Q2 Sales Incentive)"
              value={rewardForm.title}
              onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })}
              className="input-premium w-full"
              required
            />
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Amount (₹)"
              value={rewardForm.amount}
              onChange={(e) => setRewardForm({ ...rewardForm, amount: e.target.value })}
              className="input-premium w-full"
              required
            />
            <input
              type="date"
              value={rewardForm.award_date}
              onChange={(e) => setRewardForm({ ...rewardForm, award_date: e.target.value })}
              className="input-premium w-full"
            />
            <input
              type="text"
              placeholder="Period (e.g. Q2 2026, July 2026)"
              value={rewardForm.period}
              onChange={(e) => setRewardForm({ ...rewardForm, period: e.target.value })}
              className="input-premium w-full"
            />
            <textarea
              placeholder="Notes (optional)"
              value={rewardForm.notes}
              onChange={(e) => setRewardForm({ ...rewardForm, notes: e.target.value })}
              className="input-premium w-full"
              rows={2}
            />
            <button type="submit" className="btn-premium w-full">
              <Gift size={16} /> Grant Reward
            </button>
          </form>

          <div className="card-premium max-h-[65vh] overflow-auto lg:col-span-2">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0]">
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>Title</Th>
                  <Th>Amount</Th>
                  <Th>Date / Period</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rewards.length === 0 && !loading && (
                  <EmptyRow colSpan={7} text="No incentives or bonuses granted yet" />
                )}
                {rewards.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0b1220]">{w.employee_name || "—"}</div>
                      <div className="text-xs text-[#7b8698]">{w.department || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-[#33405c]">{w.reward_type}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 font-semibold text-[#33405c]">
                      {w.title}
                    </td>
                    <td className="num px-4 py-3 font-bold text-[#0b1220]">{money(w.amount)}</td>
                    <td className="num px-4 py-3 text-[#7b8698]">
                      {w.award_date ? fmt(w.award_date) : w.period || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={w.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {w.status === "Pending" && (
                          <button
                            onClick={() => markRewardPaid(w.id)}
                            className="rounded-lg bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#4655c4] transition hover:bg-[#dfe6ff]"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => removeReward(w.id)}
                          className="rounded-lg p-1.5 text-[#c73e4c] transition hover:bg-[#fdeef0]"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insurance */}
      {tab === "Insurance" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <form
            onSubmit={addInsurance}
            className="card-premium h-fit space-y-3 p-5"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#0b1220]">
              <Shield size={16} /> Add Insurance Policy
            </h2>
            <select
              value={insForm.employee_id}
              onChange={(e) => setInsForm({ ...insForm, employee_id: e.target.value })}
              className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
              required
            >
              <option value="">Select employee…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <select
              value={insForm.policy_type}
              onChange={(e) => setInsForm({ ...insForm, policy_type: e.target.value })}
              className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
            >
              {INSURANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Provider (e.g. LIC, Star Health)"
              value={insForm.provider}
              onChange={(e) => setInsForm({ ...insForm, provider: e.target.value })}
              className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Policy number (optional)"
              value={insForm.policy_number}
              onChange={(e) => setInsForm({ ...insForm, policy_number: e.target.value })}
              className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Coverage (₹)"
                value={insForm.coverage_amount}
                onChange={(e) => setInsForm({ ...insForm, coverage_amount: e.target.value })}
                className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Premium (₹)"
                value={insForm.premium_amount}
                onChange={(e) => setInsForm({ ...insForm, premium_amount: e.target.value })}
                className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-bold text-[#7b8698]">
                Start date
                <input
                  type="date"
                  value={insForm.start_date}
                  onChange={(e) => setInsForm({ ...insForm, start_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold text-[#7b8698]">
                End date
                <input
                  type="date"
                  value={insForm.end_date}
                  onChange={(e) => setInsForm({ ...insForm, end_date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm font-normal"
                />
              </label>
            </div>
            <input
              type="text"
              placeholder="Nominee (optional)"
              value={insForm.nominee}
              onChange={(e) => setInsForm({ ...insForm, nominee: e.target.value })}
              className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Notes (optional)"
              value={insForm.notes}
              onChange={(e) => setInsForm({ ...insForm, notes: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-[#e6e9f0] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-[#0b1220] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2438]"
            >
              Add Policy
            </button>
          </form>

          <div className="card-premium max-h-[65vh] overflow-auto lg:col-span-2">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
                <tr className="border-b border-[#e6e9f0]">
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>Provider / Policy No.</Th>
                  <Th>Coverage</Th>
                  <Th>Premium</Th>
                  <Th>Validity</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {insurance.length === 0 && !loading && (
                  <EmptyRow colSpan={8} text="No insurance policies added yet" />
                )}
                {insurance.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0b1220]">
                        {p.employee_name || "—"}
                      </div>
                      <div className="text-xs text-[#7b8698]">{p.department || ""}</div>
                    </td>
                    <td className="px-4 py-3 text-[#33405c]">{p.policy_type}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#33405c]">{p.provider}</div>
                      <div className="text-xs text-[#7b8698]">{p.policy_number || "—"}</div>
                    </td>
                    <td className="num px-4 py-3 font-bold text-[#0b1220]">
                      {money(p.coverage_amount)}
                    </td>
                    <td className="num px-4 py-3 text-[#33405c]">
                      {money(p.premium_amount)}
                    </td>
                    <td className="num px-4 py-3 text-[#7b8698]">
                      {p.start_date ? fmt(p.start_date) : "—"} → {p.end_date ? fmt(p.end_date) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {p.status === "Active" && (
                          <>
                            <button
                              onClick={() => setInsuranceStatus(p.id, "Expired")}
                              className="rounded-lg bg-[#fff7e8] px-2.5 py-1 text-xs font-bold text-[#a8730a] transition hover:bg-[#ffedc9]"
                            >
                              Expire
                            </button>
                            <button
                              onClick={() => setInsuranceStatus(p.id, "Cancelled")}
                              className="rounded-lg bg-[#fdeef0] px-2.5 py-1 text-xs font-bold text-[#c73e4c] transition hover:bg-[#fadde1]"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {p.status !== "Active" && (
                          <button
                            onClick={() => setInsuranceStatus(p.id, "Active")}
                            className="rounded-lg bg-[#e9f9ef] px-2.5 py-1 text-xs font-bold text-[#1e7f46] transition hover:bg-[#d5f3e1]"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => removeInsurance(p.id)}
                          className="rounded-lg p-1.5 text-[#c73e4c] transition hover:bg-[#fdeef0]"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
