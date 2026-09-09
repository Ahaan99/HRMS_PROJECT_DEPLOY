import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ExportButton from "../../components/common/ExportButton";
import {
  TrendingUp,
  Target,
  Users,
  IndianRupee,
  PiggyBank,
  Percent,
  X,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const money = (v) => `Rs. ${Number(v || 0).toLocaleString("en-IN")}`;

export default function RevenueAdvanced() {
  const token = localStorage.getItem("hrms_admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState(null);
  const [targets, setTargets] = useState([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetForm, setTargetForm] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    target_amount: "",
    incentive_rate: 5,
  });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        axios.get(
          `${BASE_URL}/revenues/advanced/summary?year=${year}&month=${month}`,
          { headers }
        ),
        axios.get(`${BASE_URL}/revenues/advanced/targets?year=${year}`, {
          headers,
        }),
      ]);
      setData(s.data);
      setTargets(Array.isArray(t.data) ? t.data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load revenue analytics");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTarget = async () => {
    if (!targetForm.target_amount) return;
    try {
      await axios.post(`${BASE_URL}/revenues/advanced/targets`, targetForm, {
        headers,
      });
      setShowTargetModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save target");
    }
  };

  const maxDaily = data?.daily?.length
    ? Math.max(...data.daily.map((d) => Number(d.amount)))
    : 0;
  const maxProfitBar = data?.profitability?.length
    ? Math.max(
        1,
        ...data.profitability.map((p) => Math.max(p.revenue, p.expense))
      )
    : 1;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 shadow-lg shadow-indigo-900/20 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -left-10 -bottom-16 h-36 w-36 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingUp className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Revenue Tracker — Advanced</h1>
            <p className="text-sm text-indigo-200">
              Targets, collections, recruiter billing, profitability and conversion analytics.
            </p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border-0 rounded-xl px-3 py-2 text-sm bg-white/95 text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border-0 rounded-xl px-3 py-2 text-sm bg-white/95 text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            {[year - 2, year - 1, year, year + 1]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </select>
          <button
            onClick={() => setShowTargetModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-bold shadow-md shadow-indigo-950/20 active:scale-95 transition-all"
          >
            <Target size={15} /> Set Target
          </button>
          <ExportButton
            data={data?.recruiterWise || []}
            filename={`revenue-recruiters-${year}`}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
                <IndianRupee size={14} /> {MONTHS[month - 1]} Revenue
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{money(data.monthRevenue)}</p>
              {data.target && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Target: {money(data.target.target_amount)}</span>
                    <span className="font-semibold">{data.targetProgress ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (data.targetProgress || 0) >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(data.targetProgress || 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {!data.target && (
                <p className="text-xs text-gray-400 mt-2">No target set for this month</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
                <PiggyBank size={14} /> Pending Collections
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{money(data.pending.amount)}</p>
              <p className="text-xs text-gray-400 mt-1">{data.pending.count} open invoice(s)</p>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
                <Users size={14} /> Lead Conversion ({year})
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.conversion.rate}%</p>
              <p className="text-xs text-gray-400 mt-1">
                {data.conversion.accepted} accepted of {data.conversion.leads} leads · {data.conversion.newClients} new clients
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
                <Percent size={14} /> Incentive Rate
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.target ? Number(data.target.incentive_rate) : 5}%
              </p>
              <p className="text-xs text-gray-400 mt-1">of collected amount per recruiter</p>
            </div>
          </div>

          {/* DAILY REVENUE + PROFITABILITY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">
                Daily Revenue — {MONTHS[month - 1]} {year}
              </h3>
              {data.daily.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No revenue recorded this month</p>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {data.daily.map((d) => (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center justify-end h-full"
                      title={`${new Date(d.day).toLocaleDateString("en-IN")}: ${money(d.amount)}`}
                    >
                      <div
                        className="w-full bg-emerald-400 hover:bg-emerald-500 rounded-t transition-colors"
                        style={{
                          height: `${maxDaily ? (Number(d.amount) / maxDaily) * 100 : 0}%`,
                          minHeight: "4px",
                        }}
                      />
                      <span className="text-[10px] text-gray-400 mt-1">
                        {new Date(d.day).getDate()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">
                Profitability by Month — {year}
              </h3>
              <div className="flex items-end gap-1.5 h-40">
                {data.profitability.map((p) => (
                  <div
                    key={p.month}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-0.5"
                    title={`${MONTHS[p.month - 1]}: Revenue ${money(p.revenue)} | Expense ${money(p.expense)} | Profit ${money(p.profit)}`}
                  >
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      <div
                        className="w-1/2 bg-blue-400 rounded-t"
                        style={{ height: `${(p.revenue / maxProfitBar) * 100}%`, minHeight: p.revenue ? "3px" : "0" }}
                      />
                      <div
                        className="w-1/2 bg-red-300 rounded-t"
                        style={{ height: `${(p.expense / maxProfitBar) * 100}%`, minHeight: p.expense ? "3px" : "0" }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{MONTHS[p.month - 1]}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-300 inline-block" /> Expense
                </span>
              </div>
            </div>
          </div>

          {/* RECRUITER BILLING + INCENTIVES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">
                Recruiter-wise Billing ({year})
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Recruiter</th>
                    <th className="px-4 py-2.5 text-right">Invoices</th>
                    <th className="px-4 py-2.5 text-right">Billed</th>
                    <th className="px-4 py-2.5 text-right">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recruiterWise.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                        No invoices this year
                      </td>
                    </tr>
                  )}
                  {data.recruiterWise.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{r.recruiter}</td>
                      <td className="px-4 py-2.5 text-right">{r.invoices}</td>
                      <td className="px-4 py-2.5 text-right">{money(r.billed)}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">
                        {money(r.collected)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">
                Incentive Calculation ({year})
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Recruiter</th>
                    <th className="px-4 py-2.5 text-right">Collected</th>
                    <th className="px-4 py-2.5 text-right">Rate</th>
                    <th className="px-4 py-2.5 text-right">Incentive</th>
                  </tr>
                </thead>
                <tbody>
                  {data.incentives.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                        No collections attributed to recruiters yet
                      </td>
                    </tr>
                  )}
                  {data.incentives.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{r.recruiter}</td>
                      <td className="px-4 py-2.5 text-right">{money(r.collected)}</td>
                      <td className="px-4 py-2.5 text-right">{r.rate}%</td>
                      <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                        {money(r.incentive)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>

          {/* CLIENT-WISE + PENDING */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">
                Client-wise Revenue ({year})
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Client</th>
                    <th className="px-4 py-2.5 text-right">Invoices</th>
                    <th className="px-4 py-2.5 text-right">Billed</th>
                    <th className="px-4 py-2.5 text-right">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clientWise.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                        No client invoices this year
                      </td>
                    </tr>
                  )}
                  {data.clientWise.map((c, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{c.client_name}</td>
                      <td className="px-4 py-2.5 text-right">{c.invoices}</td>
                      <td className="px-4 py-2.5 text-right">{money(c.billed)}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">
                        {money(c.collected)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>

            <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">
                Pending Invoice Tracker ({data.pending.count})
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Invoice</th>
                    <th className="px-4 py-2.5 text-left">Client</th>
                    <th className="px-4 py-2.5 text-right">Balance</th>
                    <th className="px-4 py-2.5 text-left">Due</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pending.invoices.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                        All invoices settled
                      </td>
                    </tr>
                  )}
                  {data.pending.invoices.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{p.invoice_no}</td>
                      <td className="px-4 py-2.5">{p.client_name}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {money(Number(p.total_amount) - Number(p.paid_amount || 0))}
                      </td>
                      <td className="px-4 py-2.5">
                        {p.due_date ? new Date(p.due_date).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            p.status === "Overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>

          {/* MONTHLY TARGETS */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-bold text-gray-900 text-sm">
              Monthly Targets ({year})
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Month</th>
                  <th className="px-4 py-2.5 text-right">Target</th>
                  <th className="px-4 py-2.5 text-right">Incentive Rate</th>
                  <th className="px-4 py-2.5 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                      No targets set for {year} — use the Set Target button
                    </td>
                  </tr>
                )}
                {targets.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-semibold text-gray-800">
                      {MONTHS[t.month - 1]} {t.year}
                    </td>
                    <td className="px-4 py-2.5 text-right">{money(t.target_amount)}</td>
                    <td className="px-4 py-2.5 text-right">{Number(t.incentive_rate)}%</td>
                    <td className="px-4 py-2.5 text-gray-500">{t.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      )}

      {/* TARGET MODAL */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Set Monthly Target</h3>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={targetForm.month}
                onChange={(e) => setTargetForm({ ...targetForm, month: Number(e.target.value) })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={targetForm.year}
                onChange={(e) => setTargetForm({ ...targetForm, year: Number(e.target.value) })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <input
              type="number"
              min="0"
              value={targetForm.target_amount}
              onChange={(e) => setTargetForm({ ...targetForm, target_amount: e.target.value })}
              placeholder="Target amount (Rs.)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
            <div>
              <label className="text-xs font-semibold text-gray-500">
                Incentive rate (% of collections)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={targetForm.incentive_rate}
                onChange={(e) =>
                  setTargetForm({ ...targetForm, incentive_rate: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-1"
              />
            </div>
            <button
              onClick={saveTarget}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              Save Target
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
