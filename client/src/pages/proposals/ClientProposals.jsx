import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import API from "../../services/api";

/* ---------- helpers ---------- */

const money = (n, cur = "INR") =>
  `${cur === "INR" ? "\u20B9" : cur + " "}${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;

const fmtDate = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return isNaN(x)
    ? "—"
    : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const daysLeft = (d) => {
  if (!d) return null;
  const x = new Date(d);
  if (isNaN(x)) return null;
  const diff = Math.ceil((x - new Date()) / 864e5);
  return diff;
};

const STATUS_META = {
  SENT: {
    label: "Awaiting your response",
    short: "Pending",
    chip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    dot: "bg-blue-500",
    bar: "from-blue-500 to-indigo-500",
    headerBadge: "bg-blue-400/20 text-blue-100 ring-1 ring-blue-300/40",
  },
  ACCEPTED: {
    label: "Accepted",
    short: "Accepted",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    bar: "from-emerald-500 to-teal-500",
    headerBadge: "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40",
  },
  REJECTED: {
    label: "Rejected",
    short: "Rejected",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
    bar: "from-rose-500 to-pink-500",
    headerBadge: "bg-rose-400/20 text-rose-100 ring-1 ring-rose-300/40",
  },
  EXPIRED: {
    label: "Expired",
    short: "Expired",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
    bar: "from-amber-500 to-orange-500",
    headerBadge: "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/40",
  },
};

/* ---------- page ---------- */

export default function ClientProposals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [respondNote, setRespondNote] = useState("");
  const [responding, setResponding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/client/proposals");
      setRows(data.data || []);
    } catch (e) {
      const status = e.response?.status;
      toast.error(
        e.response?.data?.message ||
          (status === 404
            ? "Proposals API not found (404) — restart the backend so the proposals module is loaded."
            : status === 401 || status === 403
              ? "Session expired — please log in again."
              : `Failed to load proposals${status ? ` (HTTP ${status})` : e.message ? ` — ${e.message}` : ""}`),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setRespondNote("");
    try {
      const { data } = await API.get(`/client/proposals/${id}`);
      setSelected(data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to load proposal");
    } finally {
      setDetailLoading(false);
    }
  };

  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    if (!selected || downloading) return;
    setDownloading(true);
    try {
      const res = await API.get(`/client/proposals/${selected.id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected.proposal_number || `proposal-${selected.id}`}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to download proposal PDF");
    } finally {
      setDownloading(false);
    }
  };

  const respond = async (action) => {
    if (!selected) return;
    const verb = action === "ACCEPT" ? "accept" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} this proposal?`)) return;
    setResponding(true);
    try {
      await API.post(`/client/proposals/${selected.id}/respond`, {
        action,
        note: respondNote || undefined,
      });
      toast.success(action === "ACCEPT" ? "Proposal accepted" : "Proposal rejected");
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to submit response");
    } finally {
      setResponding(false);
    }
  };

  const counts = useMemo(() => {
    const c = { SENT: 0, ACCEPTED: 0, REJECTED: 0, EXPIRED: 0 };
    rows.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status] += 1;
    });
    return c;
  }, [rows]);

  const pending = counts.SENT;

  return (
    <div className="p-6 space-y-6">
      {/* ---------- Hero ---------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5347E8] via-[#4534DA] to-[#3526BD] p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/25">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(129,140,248,0.35), transparent), radial-gradient(ellipse 40% 40% at 10% 100%, rgba(99,102,241,0.25), transparent)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <svg className="h-7 w-7 text-indigo-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">Proposals</h1>
              <p className="mt-1 text-sm text-indigo-200/90">
                Business proposals shared with you by the Recruweb team
              </p>
            </div>
          </div>
          {pending > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/20 backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-300" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight">{pending} awaiting your response</p>
                <p className="text-xs text-indigo-200/80">Review and respond below</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Status chips ---------- */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <div
              key={key}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${meta.chip}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {key.charAt(0) + key.slice(1).toLowerCase()}
              <span className="font-bold">{counts[key]}</span>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Content ---------- */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="mt-3 h-5 w-3/4 rounded bg-gray-200" />
              <div className="mt-6 h-8 w-32 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
              />
            </svg>
          </div>
          <h2 className="mt-5 text-lg font-semibold text-gray-900">No proposals yet</h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">
            When the Recruweb team shares a proposal with your account, it will appear here
            for you to review, accept or reject.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((r) => {
            const meta = STATUS_META[r.status] || STATUS_META.SENT;
            const dl = r.status === "SENT" ? daysLeft(r.valid_until) : null;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => openDetail(r.id)}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.bar}`}
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-md bg-gray-50 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-gray-600 ring-1 ring-gray-200">
                    {r.proposal_number}
                  </span>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.short}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold leading-snug text-gray-900 text-pretty group-hover:text-indigo-700">
                  {r.title}
                </h3>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-dashed border-gray-100 pt-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total value</p>
                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900">
                      {money(r.total, r.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Valid until</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-700">{fmtDate(r.valid_until)}</p>
                    {dl !== null && dl >= 0 && (
                      <p className={`mt-0.5 text-xs font-semibold ${dl <= 3 ? "text-amber-600" : "text-gray-400"}`}>
                        {dl === 0 ? "Expires today" : `${dl} day${dl === 1 ? "" : "s"} left`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                  {r.status === "SENT" ? "Review & respond" : "View details"}
                  <svg
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ---------- Detail modal ---------- */}
      {(detailLoading || selected) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => !responding && setSelected(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !selected ? (
              <div className="flex items-center justify-center px-6 py-24">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <svg className="h-5 w-5 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Loading proposal...
                </div>
              </div>
            ) : (
              (() => {
                const meta = STATUS_META[selected.status] || STATUS_META.SENT;
                const items = Array.isArray(selected.items)
                  ? selected.items
                  : (() => {
                      try {
                        return JSON.parse(selected.items || "[]");
                      } catch {
                        return [];
                      }
                    })();
                const dl = selected.status === "SENT" ? daysLeft(selected.valid_until) : null;
                return (
                  <>
                    {/* ----- Document letterhead (matches admin proposal document) ----- */}
                    <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#5347E8] via-[#4534DA] to-[#3526BD] text-white">
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 opacity-[0.07]"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
                          backgroundSize: "36px 36px",
                        }}
                      />
                      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
                        <div className="flex flex-wrap items-start justify-between gap-5">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-lg font-black tracking-tight text-white shadow-lg shadow-indigo-500/30">
                                R
                              </div>
                              <div>
                                <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                  RECRUWEB
                                </h2>
                                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                  Ardhnarishwar HRMS
                                </p>
                              </div>
                            </div>
                            <h3 className="mt-4 text-lg font-bold leading-snug tracking-tight text-white text-balance">
                              {selected.title}
                            </h3>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="text-right">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-200">
                                Business Proposal
                              </p>
                              <p className="mt-1 font-mono text-lg font-bold tracking-wide text-white">
                                {selected.proposal_number}
                              </p>
                              <span
                                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${meta.headerBadge}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                {meta.short}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={downloadPdf}
                              disabled={downloading || responding}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-60"
                              aria-label="Download proposal as PDF"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                              </svg>
                              {downloading ? "Preparing..." : "Download PDF"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelected(null)}
                              disabled={responding}
                              className="rounded-xl bg-white/10 p-2 ring-1 ring-white/15 transition hover:bg-white/20"
                              aria-label="Close"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                              </svg>
                            </button>
                            </div>
                          </div>
                        </div>

                        {/* meta strip — same as admin document */}
                        <div className="relative mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Received
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">{fmtDate(selected.sent_at)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/80">
                              Valid until
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">{fmtDate(selected.valid_until)}</p>
                            {dl !== null && dl >= 0 && (
                              <p className="text-[11px] font-semibold text-indigo-300/80">
                                {dl === 0 ? "Expires today" : `${dl} day${dl === 1 ? "" : "s"} left`}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Currency
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">{selected.currency || "INR"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200/80">
                              Total value
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">
                              {money(selected.total, selected.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ----- Scrollable document body ----- */}
                    <div className="flex-1 space-y-7 overflow-y-auto p-6 sm:p-7">
                      {selected.intro && (
                        <div className="relative rounded-2xl border-l-4 border-indigo-500 bg-indigo-50/50 py-4 pl-5 pr-4">
                          <p className="text-sm leading-relaxed text-gray-700">{selected.intro}</p>
                        </div>
                      )}

                      {/* Line items */}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                            Services &amp; pricing
                          </h3>
                          <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                        </div>
                        <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-gray-200">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-[#4534DA] text-left text-[11px] uppercase tracking-wider text-white">
                                <th className="px-4 py-3 font-semibold">Service</th>
                                <th className="px-4 py-3 text-center font-semibold">Qty</th>
                                <th className="px-4 py-3 text-right font-semibold">MRP</th>
                                <th className="px-4 py-3 text-right font-semibold">Offer Rate</th>
                                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {items.map((it, i) => (
                                <tr key={i} className="bg-white transition-colors hover:bg-indigo-50/40">
                                  <td className="px-4 py-3.5">
                                    <p className="font-semibold text-gray-900">{it.service}</p>
                                    {it.description && (
                                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{it.description}</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 text-center tabular-nums text-gray-600">{it.qty}</td>
                                  <td className="px-4 py-3.5 text-right tabular-nums">
                                    {Number(it.mrp) > Number(it.rate) ? (
                                      <span className="text-gray-400 line-through">
                                        {money(it.mrp, selected.currency)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">{"\u2014"}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                                    <span className="font-semibold text-gray-900">
                                      {money(it.rate, selected.currency)}
                                    </span>
                                    {it.unit && (
                                      <span className="block text-[10px] text-gray-400">{it.unit}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-gray-900">
                                    {money(Number(it.qty) * Number(it.rate), selected.currency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Totals — invoice style, right aligned */}
                      <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-2.5">
                          {(() => {
                            const mrpSavings = items.reduce((sum, it) => {
                              const mrp = Number(it.mrp) || 0;
                              const rate = Number(it.rate) || 0;
                              const qty = Number(it.qty) || 0;
                              return mrp > rate ? sum + (mrp - rate) * qty : sum;
                            }, 0);
                            return mrpSavings > 0 ? (
                              <div className="flex items-center justify-between text-sm font-semibold text-emerald-600">
                                <span>You save (vs. MRP)</span>
                                <span className="tabular-nums">
                                  {money(mrpSavings, selected.currency)}
                                </span>
                              </div>
                            ) : null;
                          })()}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-semibold tabular-nums text-gray-800">
                              {money(selected.subtotal, selected.currency)}
                            </span>
                          </div>
                          {Number(selected.discount_amount) > 0 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Discount ({Number(selected.discount_pct)}%)</span>
                              <span className="font-semibold tabular-nums text-rose-600">
                                − {money(selected.discount_amount, selected.currency)}
                              </span>
                            </div>
                          )}
                          {Number(selected.tax_amount) > 0 && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Tax / GST ({Number(selected.tax_pct)}%)</span>
                              <span className="font-semibold tabular-nums text-gray-800">
                                + {money(selected.tax_amount, selected.currency)}
                              </span>
                            </div>
                          )}
                          <div className="border-t-2 border-dashed border-gray-200 pt-3">
                            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#5347E8] to-[#3526BD] px-5 py-4 text-white shadow-lg shadow-indigo-600/25">
                              <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">
                                Grand total
                              </span>
                              <span className="text-xl font-bold tracking-tight tabular-nums">
                                {money(selected.total, selected.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {(Number(selected.token_amount) > 0 ||
                        Number(selected.agreement_months) > 0 ||
                        Number(selected.replacement_months) > 0) && (
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Commercial terms
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            {Number(selected.token_amount) > 0 && (
                              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  Token amount
                                </p>
                                <p className="mt-1 text-sm font-bold text-gray-900 tabular-nums">
                                  {money(selected.token_amount, selected.currency)}
                                </p>
                                <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                                  Payable to start; adjustable against the final invoice.
                                </p>
                              </div>
                            )}
                            {Number(selected.agreement_months) > 0 && (
                              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  Agreement period
                                </p>
                                <p className="mt-1 text-sm font-bold text-gray-900">
                                  {Number(selected.agreement_months)} months
                                </p>
                                <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                                  Service agreement duration from the date of signing.
                                </p>
                              </div>
                            )}
                            {Number(selected.replacement_months) > 0 && (
                              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  Replacement policy
                                </p>
                                <p className="mt-1 text-sm font-bold text-gray-900">
                                  {Number(selected.replacement_months)} months
                                </p>
                                <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                                  Free replacement if the candidate leaves within this period.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selected.terms && (
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                              Terms &amp; conditions
                            </h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                          </div>
                          <p className="mt-3 whitespace-pre-line rounded-2xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-600 ring-1 ring-gray-100">
                            {selected.terms}
                          </p>
                        </div>
                      )}

                      {selected.response_note && (
                        <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                          <svg
                            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7 8h10M7 12h6m-9 8l3.5-3.5H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h-1z"
                            />
                          </svg>
                          <div className="text-sm text-amber-800">
                            <span className="font-bold">Your note: </span>
                            {selected.response_note}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ----- Sticky response bar ----- */}
                    {selected.status === "SENT" && (
                      <div className="shrink-0 border-t border-gray-100 bg-white/95 p-5 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)] backdrop-blur">
                        <textarea
                          id="respond-note"
                          value={respondNote}
                          onChange={(e) => setRespondNote(e.target.value)}
                          rows={2}
                          placeholder="Add an optional note with your response..."
                          aria-label="Note (optional)"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-sm transition focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => respond("ACCEPT")}
                            disabled={responding}
                            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:shadow-xl hover:shadow-emerald-200 hover:brightness-110 disabled:opacity-60"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            {responding ? "Submitting..." : "Accept Proposal"}
                          </button>
                          <button
                            type="button"
                            onClick={() => respond("REJECT")}
                            disabled={responding}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
