import { useEffect, useState, useCallback } from "react";
import HRNavbar from "../../components/hr/HRNavbar";
import {
  Bot,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Inbox,
} from "lucide-react";

/* HR Robo now lives inside the unified HRMS backend at /api/hr-robo */
const ROBO_URL =
  import.meta.env.VITE_AI_ROBO_URL ||
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/hr-robo`;
/* Public interview portal URL (own domain in production); falls back to the backend-served UI */
const PORTAL_URL = import.meta.env.VITE_AI_ROBO_APP_URL || `${ROBO_URL}/`;

/* /api/integration/* is protected with the HRMS JWT (same token as every other page) */
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("hrms_hr_Token") || ""}` });
const roboGet = async (p) => {
  const r = await fetch(`${ROBO_URL}${p}`, { headers: authHeaders() });
  if (r.status === 401 || r.status === 403) throw new Error("AUTH");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

const VERDICT_STYLES = {
  "STRONG HIRE": "bg-emerald-100 text-emerald-700",
  HIRE: "bg-green-100 text-green-700",
  CONSIDER: "bg-amber-100 text-amber-700",
  "INCOMPLETE — RE-INTERVIEW NEEDED": "bg-amber-100 text-amber-700",
  "NOT RECOMMENDED": "bg-rose-100 text-rose-700",
};

export default function AIInterviews() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r1, r2] = await Promise.all([
        roboGet("/api/integration/reports"),
        roboGet("/api/integration/summary"),
      ]);
      setData(r1);
      setSummary(r2);
    } catch (e) {
      setError(
        e?.message === "AUTH"
          ? "Your session is not authorised to view AI interview data. Please log in again."
          : "AI Interview Portal is not reachable. Make sure the HRMS backend is running on " +
          ROBO_URL,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reports = data?.reports || [];
  const candidates = data?.candidates || [];
  const candOf = (id) => candidates.find((c) => c.id === id) || {};

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6">
      <HRNavbar />

      <div className="mx-auto mt-6 max-w-6xl space-y-6 pb-10">
        {/* ── HERO BAND ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-9 md:px-12">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
                <Bot size={24} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                  Automation
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white md:text-3xl text-balance">
                  AI Robot Interviews
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                  Candidate scores, assessments &amp; hire recommendations from
                  the AI Interview Portal
                  {data?.synced_at &&
                    ` · synced ${new Date(data.synced_at).toLocaleString()}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
              >
                <RefreshCw size={15} aria-hidden="true" /> Refresh
              </button>
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-colors hover:bg-indigo-500"
              >
                <ExternalLink size={15} aria-hidden="true" /> Open Interview
                Portal
              </a>
            </div>
          </div>
        </div>

        {/* ── SUMMARY TILES ─────────────────────────────────── */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Interviews Done",
                value: summary.total_interviews,
                bar: "bg-indigo-500",
              },
              {
                label: "Candidates",
                value: summary.total_candidates,
                bar: "bg-sky-500",
              },
              {
                label: "Avg Integrity",
                value:
                  summary.avg_integrity != null
                    ? `${summary.avg_integrity}%`
                    : "—",
                bar: "bg-emerald-500",
              },
              {
                label: "Terminated",
                value: summary.terminated,
                bar: "bg-rose-500",
              },
            ].map((w) => (
              <div
                key={w.label}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${w.bar}`} />
                <p className="text-3xl font-bold text-slate-900">
                  {w.value ?? "—"}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {w.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* ── REPORTS TABLE ─────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Integrity</th>
                  <th className="px-4 py-3">Recommendation</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Loading interview results…
                    </td>
                  </tr>
                )}
                {!loading && reports.length === 0 && !error && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Inbox size={22} aria-hidden="true" />
                      </span>
                      <p className="mt-3 text-sm font-medium text-slate-600">
                        No AI interviews completed yet
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Schedule one from the Interview Portal.
                      </p>
                    </td>
                  </tr>
                )}
                {reports.map((r, i) => {
                  const c = candOf(r.candidate_id);
                  const rec = r.recommendation || {};
                  const integ = rec.integrity;
                  return (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-indigo-50/40"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {c.name || `#${r.candidate_id}`}
                        <p className="text-xs font-normal text-slate-400">
                          {c.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.position_title || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {rec.composite ?? r.interview_score ?? "—"}%
                      </td>
                      <td className="px-4 py-3">
                        {integ != null ? (
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              integ >= 80
                                ? "text-emerald-600"
                                : integ >= 50
                                  ? "text-amber-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {integ >= 80 ? (
                              <ShieldCheck size={14} aria-hidden="true" />
                            ) : (
                              <ShieldAlert size={14} aria-hidden="true" />
                            )}
                            {integ}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            VERDICT_STYLES[rec.verdict] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rec.verdict || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {r.generated_at || r.created_at
                          ? new Date(
                              r.generated_at || r.created_at,
                            ).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setSelected(selected === i ? null : i)
                          }
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                        >
                          {selected === i ? "Hide" : "Review"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detail drawer */}
          {selected != null && reports[selected] && (
            <div className="border-t border-slate-200 bg-slate-50 p-6">
              {(() => {
                const r = reports[selected];
                const rec = r.recommendation || {};
                return (
                  <div className="grid gap-6 text-sm sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Assessment
                      </h4>
                      <ul className="space-y-1.5 text-slate-600">
                        {(rec.reasons || []).map((reason, j) => (
                          <li key={j} className="flex gap-2 leading-relaxed">
                            <span className="shrink-0 text-indigo-500">•</span>
                            {reason}
                          </li>
                        ))}
                        {!(rec.reasons || []).length && (
                          <li className="text-slate-400">
                            No assessment notes.
                          </li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Skill Scores
                      </h4>
                      <div className="space-y-3">
                        {(Array.isArray(r.skill_scores)
                          ? r.skill_scores.map((s) => [s.skill, s.score])
                          : Object.entries(r.skill_scores || {})
                        ).map(
                          ([skill, score]) => (
                            <div key={skill}>
                              <div className="mb-1 flex justify-between text-xs text-slate-600">
                                <span className="font-medium">{skill}</span>
                                <span>{score}%</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full ${
                                    score >= 70
                                      ? "bg-emerald-500"
                                      : score >= 40
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          ),
                        )}
                        {!(Array.isArray(r.skill_scores)
                          ? r.skill_scores.length
                          : Object.keys(r.skill_scores || {}).length) && (
                          <p className="text-xs text-slate-400">
                            No per-skill scores recorded.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
