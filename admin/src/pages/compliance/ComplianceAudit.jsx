import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ShieldCheck, ScrollText, Wallet, Lock, Plus, Trash2, RefreshCw } from "lucide-react";
import { PageHero, PillTab } from "../../components/common/Premium";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TABS = [
  { key: "checklist", label: "Statutory Checklist", icon: ShieldCheck },
  { key: "payroll", label: "Salary Sync", icon: Wallet },
  { key: "audit", label: "Audit Trail", icon: ScrollText },
  { key: "security", label: "Security (2FA)", icon: Lock },
];

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const btnCls = "inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50";

const STATUS_TONE = {
  Pending: "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Overdue: "bg-red-50 text-red-700",
};

const inr = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const thisMonth = new Date().toISOString().slice(0, 7);

export default function ComplianceAudit() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const [tab, setTab] = useState("checklist");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [logs, setLogs] = useState([]);
  const [runs, setRuns] = useState([]);
  const [twoFA, setTwoFA] = useState(null);
  const [otpCfg, setOtpCfg] = useState({ otp_channel: "EMAIL", phone: "" });
  const [sessions, setSessions] = useState([]);
  const [saving, setSaving] = useState(false);

  const [ci, setCi] = useState({ title: "", category: "PF", frequency: "Monthly", due_date: "", notes: "" });
  const [syncMonth, setSyncMonth] = useState(thisMonth);
  const [otRate, setOtRate] = useState("");

  const loadChecklist = useCallback(async () => {
    const { data } = await axios.get(`${BASE_URL}/compliance`, { headers });
    setItems(data.items);
    setCounts(data.counts || {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAudit = useCallback(async () => {
    const { data } = await axios.get(`${BASE_URL}/compliance/audit/logs`, { headers });
    setLogs(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRuns = useCallback(async () => {
    const { data } = await axios.get(`${BASE_URL}/compliance/payroll/runs`, { headers });
    setRuns(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load2FA = useCallback(async () => {
    const [fa, cfg, ses] = await Promise.all([
      axios.get(`${BASE_URL}/super-admin/auth/2fa`, { headers }),
      axios.get(`${BASE_URL}/super-admin/auth/otp-settings`, { headers }),
      axios.get(`${BASE_URL}/super-admin/auth/sessions`, { headers }),
    ]);
    setTwoFA(fa.data.enabled);
    setOtpCfg({ otp_channel: cfg.data.otp_channel, phone: cfg.data.phone });
    setSessions(ses.data.sessions || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = { checklist: loadChecklist, audit: loadAudit, payroll: loadRuns, security: load2FA };
    map[tab]?.().catch((e) => console.error(e));
  }, [tab, loadChecklist, loadAudit, loadRuns, load2FA]);

  const addItem = async () => {
    setSaving(true);
    try {
      await axios.post(`${BASE_URL}/compliance`, ci, { headers });
      setCi({ title: "", category: "PF", frequency: "Monthly", due_date: "", notes: "" });
      await loadChecklist();
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id, status) => {
    await axios.put(`${BASE_URL}/compliance/${id}`, { status }, { headers });
    await loadChecklist();
  };

  const delItem = async (id) => {
    if (!confirm("Delete this compliance item?")) return;
    await axios.delete(`${BASE_URL}/compliance/${id}`, { headers });
    await loadChecklist();
  };

  const runSync = async () => {
    setSaving(true);
    try {
      const { data } = await axios.post(
        `${BASE_URL}/compliance/payroll/sync`,
        { month: syncMonth, ot_rate_per_hour: Number(otRate) || 0 },
        { headers }
      );
      toast.success(`Salary sync complete for ${data.month}: ${data.count} employees`);
      await loadRuns();
    } catch (e) {
      toast.error(e.response?.data?.message || "Sync failed");
    } finally {
      setSaving(false);
    }
  };

  const setRunStatus = async (id, status) => {
    await axios.put(`${BASE_URL}/compliance/payroll/runs/${id}`, { status }, { headers });
    await loadRuns();
  };

  const saveOtpCfg = async () => {
    setSaving(true);
    try {
      await axios.put(`${BASE_URL}/super-admin/auth/otp-settings`, otpCfg, { headers });
      toast.success("OTP settings saved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (id) => {
    if (!confirm("Sign out this device?")) return;
    await axios.delete(`${BASE_URL}/super-admin/auth/sessions/${id}`, { headers });
    await load2FA();
  };

  const revokeOthers = async () => {
    if (!confirm("Sign out ALL other devices?")) return;
    try {
      await axios.delete(`${BASE_URL}/super-admin/auth/sessions/others`, { headers });
      await load2FA();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const toggle2FA = async () => {
    const next = !twoFA;
    if (next && !confirm("Enable 2FA? You will be asked for an OTP at every login.")) return;
    const { data } = await axios.put(`${BASE_URL}/super-admin/auth/2fa`, { enabled: next }, { headers });
    setTwoFA(data.enabled);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Governance"
        title="Compliance &amp; Audit"
        subtitle="Statutory checklist, audit trail, salary sync and login security."
        icon={ShieldCheck}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <PillTab key={key} active={tab === key} onClick={() => setTab(key)} icon={Icon}>
            {label}
          </PillTab>
        ))}
      </div>

      {/* ---------- CHECKLIST ---------- */}
      {tab === "checklist" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Pending", counts.pending, "text-amber-600"],
              ["Due in 7 days", counts.due_soon, "text-sky-600"],
              ["Overdue", counts.overdue, "text-red-600"],
              ["Completed", counts.completed, "text-emerald-600"],
            ].map(([l, v, tone]) => (
              <div key={l} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase">{l}</p>
                <p className={`text-2xl font-bold mt-1 ${tone}`}>{v ?? 0}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-4">Add Compliance Item</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input className={inputCls} placeholder="Title (e.g. PF Return Filing) *" value={ci.title} onChange={(e) => setCi({ ...ci, title: e.target.value })} />
              <select className={inputCls} value={ci.category} onChange={(e) => setCi({ ...ci, category: e.target.value })}>
                {["PF", "ESIC", "TDS", "GST", "PT", "Labour", "Other"].map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className={inputCls} value={ci.frequency} onChange={(e) => setCi({ ...ci, frequency: e.target.value })}>
                {["Monthly", "Quarterly", "Yearly", "One-time"].map((f) => <option key={f}>{f}</option>)}
              </select>
              <input className={inputCls} type="date" value={ci.due_date} onChange={(e) => setCi({ ...ci, due_date: e.target.value })} />
            </div>
            <button className={`${btnCls} mt-4`} disabled={saving || !ci.title || !ci.due_date} onClick={addItem}>
              <Plus size={15} /> Add Item
            </button>
            <p className="text-xs text-gray-400 mt-2">Completing a recurring item automatically creates the next cycle.</p>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>{["Item", "Category", "Frequency", "Due Date", "Status", "Actions"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it) => (
                  <tr key={it.id} className={it.status === "Overdue" ? "bg-red-50/40" : ""}>
                    <td className="px-4 py-3 font-medium text-gray-900">{it.title}</td>
                    <td className="px-4 py-3">{it.category}</td>
                    <td className="px-4 py-3">{it.frequency}</td>
                    <td className="px-4 py-3 text-gray-500">{String(it.due_date).slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold rounded-full px-2 py-1 ${STATUS_TONE[it.status]}`}>{it.status}</span>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-2">
                      {it.status !== "Completed" && (
                        <button onClick={() => setStatus(it.id, "Completed")} className="text-xs font-semibold text-emerald-600 hover:underline">Mark Done</button>
                      )}
                      <button onClick={() => delItem(it.id)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No compliance items yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- SALARY SYNC ---------- */}
      {tab === "payroll" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-900 mb-1">Run Salary Sync</p>
            <p className="text-xs text-gray-400 mb-4">
              Computes each active employee&apos;s net salary from attendance (present/late/WFH/half-day), approved paid leave, unpaid-day deductions, and overtime beyond 9 hrs/day.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Month</label>
                <input className={inputCls} type="month" value={syncMonth} onChange={(e) => setSyncMonth(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">OT rate / hour (optional)</label>
                <input className={inputCls} type="number" placeholder="0" value={otRate} onChange={(e) => setOtRate(e.target.value)} />
              </div>
              <button className={btnCls} disabled={saving} onClick={runSync}>
                <RefreshCw size={15} /> {saving ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>{["Month", "Employee", "Base", "Working Days", "Present", "Paid Leave", "Unpaid", "OT Hrs", "OT Amt", "Deductions", "Net Salary", "Status"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.month}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.employee_name}</td>
                    <td className="px-4 py-3">{inr(r.base_salary)}</td>
                    <td className="px-4 py-3">{r.working_days}</td>
                    <td className="px-4 py-3">{r.present_days}</td>
                    <td className="px-4 py-3">{r.paid_leave_days}</td>
                    <td className="px-4 py-3 text-red-600">{r.unpaid_leave_days}</td>
                    <td className="px-4 py-3">{r.ot_hours}</td>
                    <td className="px-4 py-3">{inr(r.ot_amount)}</td>
                    <td className="px-4 py-3 text-red-600">{inr(r.deductions)}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{inr(r.net_salary)}</td>
                    <td className="px-4 py-3">
                      <select className="border border-gray-200 rounded-lg px-2 py-1 text-xs" value={r.status} onChange={(e) => setRunStatus(r.id, e.target.value)}>
                        {["Draft", "Approved", "Paid"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {!runs.length && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">No payroll runs yet. Pick a month and click Sync Now.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- AUDIT TRAIL ---------- */}
      {tab === "audit" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>{["When", "User", "Action", "Module", "Details"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{l.user_name}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold bg-gray-100 rounded-full px-2 py-1">{l.action}</span></td>
                  <td className="px-4 py-3">{l.module}</td>
                  <td className="px-4 py-3 text-gray-500">{l.details || "-"}</td>
                </tr>
              ))}
              {!logs.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No audit entries yet. Actions across compliance, payroll, verification and onboarding are logged here.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- SECURITY ---------- */}
      {tab === "security" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6 max-w-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Two-Factor Authentication (OTP)</p>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, logging in requires a 6-digit OTP after the password. The OTP is valid for 5 minutes.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Note: email delivery is not configured yet, so during development the OTP is shown on the login screen and printed in the server console.
              </p>
            </div>
            <button
              onClick={toggle2FA}
              disabled={twoFA === null}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${twoFA ? "bg-emerald-500" : "bg-gray-300"}`}
              aria-label="Toggle two-factor authentication"
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${twoFA ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <p className={`mt-4 text-sm font-semibold ${twoFA ? "text-emerald-600" : "text-gray-400"}`}>
            {twoFA === null ? "Loading..." : twoFA ? "2FA is ON" : "2FA is OFF"}
          </p>

          {/* OTP channel */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-sm font-bold text-gray-900">OTP Delivery Channel</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">
              Choose how the login OTP is delivered. SMS requires a phone number (and Twilio keys on the server; without them the OTP falls back to dev-mode display).
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={otpCfg.otp_channel}
                onChange={(e) => setOtpCfg({ ...otpCfg, otp_channel: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="EMAIL">Email OTP</option>
                <option value="SMS">Mobile SMS OTP</option>
              </select>
              {otpCfg.otp_channel === "SMS" && (
                <input
                  placeholder="+91 phone number"
                  value={otpCfg.phone}
                  onChange={(e) => setOtpCfg({ ...otpCfg, phone: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              )}
              <button onClick={saveOtpCfg} disabled={saving} className={btnCls}>
                Save
              </button>
            </div>
          </div>

          {/* Devices / sessions */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-900">Active Devices &amp; Sessions</p>
              <button
                onClick={revokeOthers}
                className="text-xs font-bold text-red-500 hover:text-red-600"
              >
                Sign out all other devices
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {s.device || "Unknown device"}
                      {s.current && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          THIS DEVICE
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.ip || "?"} &middot; last seen {new Date(s.last_seen).toLocaleString()}
                    </p>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => revokeSession(s.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 shrink-0"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              ))}
              {!sessions.length && (
                <p className="text-sm text-gray-400 py-3">
                  No tracked sessions yet. Sessions appear after your next login.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
