import { Fragment, useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  ExternalLink,
  Settings2,
  Activity,
  Video,
  VideoOff,
  X,
} from "lucide-react";

import { PageHero } from "../../components/common/Premium";

const ROBO_URL =
  import.meta.env.VITE_AI_ROBO_URL ||
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/hr-robo`;
/* Public interview portal URL (own domain in production); falls back to the backend-served UI */
const PORTAL_URL = import.meta.env.VITE_AI_ROBO_APP_URL || `${ROBO_URL}/`;

/* /api/integration/* is protected with the HRMS JWT (same token as every other page) */
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("hrms_admin_token") || ""}` });
const roboGet = async (p) => {
  const r = await fetch(`${ROBO_URL}${p}`, { headers: authHeaders() });
  if (r.status === 401 || r.status === 403) throw new Error("AUTH");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

export default function AIPlatformAudit() {
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary] = useState(null);
  const [syncedAt, setSyncedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [video, setVideo] = useState(null); // {url, name, duration, uploadedAt}

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r1, r2] = await Promise.all([
        roboGet("/api/integration/proctor-logs"),
        roboGet("/api/integration/summary"),
      ]);
      setLogs(r1.proctor_logs || []);
      setConfig(r1.config || {});
      setCandidates(r1.candidates || []);
      setSyncedAt(r1.synced_at);
      setSummary(r2);
    } catch (e) {
      setError(
        e?.message === "AUTH"
          ? "Your session is not authorised to view AI interview data. Please log in again."
          : "AI Interview Portal is not reachable. Make sure the HRMS backend is running on " + ROBO_URL,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const candOf = (id) => candidates.find((c) => c.id === id) || {};
  const integColor = (v) =>
    v >= 80 ? "text-emerald-600" : v >= 50 ? "text-amber-600" : "text-red-600";
  const fmtDuration = (sec) => {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };
  const openRecording = (l, name) =>
    setVideo({
      url: `${ROBO_URL}${l.video_url}`,
      name: name || `#${l.candidate_id}`,
      duration: l.video_duration,
      uploadedAt: l.video_uploaded_at,
    });

  const CONFIG_LABELS = {
    maxWarnings: "Max warnings before termination",
    gazeEnabled: "Face monitoring (camera)",
    faceConsistency: "Face consistency check",
    speakerDetection: "Speaker detection",
    techMonitoring: "Technical monitoring",
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <PageHero
          eyebrow="AI Platform"
          title="AI Interview Platform — Audit & Monitoring"
          subtitle={`Superadmin control: platform integrity, proctoring audit & configuration${syncedAt ? ` · synced ${new Date(syncedAt).toLocaleString()}` : ""}`}
          icon={Activity}
          actions={
            <>
              <button
                onClick={load}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <RefreshCw size={15} /> Refresh
              </button>
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-md transition hover:bg-indigo-50"
              >
                <ExternalLink size={15} /> Open Portal
              </a>
            </>
          }
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* Monitoring widgets */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Proctored Interviews", value: logs.length },
            { label: "Avg Integrity", value: summary.avg_integrity != null ? `${summary.avg_integrity}%` : "—" },
            { label: "Auto-Terminated", value: summary.terminated },
            { label: "Candidates on Platform", value: summary.total_candidates },
          ].map((w) => (
            <div key={w.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-2xl font-bold text-gray-800">{w.value ?? "—"}</p>
              <p className="text-xs text-gray-500">{w.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Platform configuration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Settings2 size={16} className="text-indigo-600" /> Current Proctoring Configuration
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.keys(CONFIG_LABELS).map((k) => {
            const v = config[k];
            const on = typeof v === "boolean" ? v : v != null;
            return (
              <span
                key={k}
                className={`px-3 py-1.5 rounded-full border ${
                  on
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                {CONFIG_LABELS[k]}: {typeof v === "boolean" ? (v ? "ON" : "OFF") : (v ?? "default")}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Configuration is managed in the Interview Portal&apos;s Proctor Control panel.
        </p>
      </div>

      {/* Integrity audit table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Integrity</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Face Check</th>
                <th className="px-4 py-3">Violations</th>
                <th className="px-4 py-3">Recording</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Loading audit data…
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && !error && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No proctored interviews recorded yet.
                  </td>
                </tr>
              )}
              {logs.map((l, i) => {
                const c = candOf(l.candidate_id);
                return (
                  <Fragment key={l.candidate_id ?? i}>
                    <tr className="border-b last:border-0 hover:bg-indigo-50/40">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {c.name || `#${l.candidate_id}`}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${integColor(l.integrity ?? 100)}`}>
                        <span className="inline-flex items-center gap-1">
                          {(l.integrity ?? 100) >= 80 ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <ShieldAlert size={14} />
                          )}
                          {l.integrity ?? 100}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {l.terminated ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            TERMINATED
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {l.face_consistency || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {(l.violations || []).length}
                        <span className="text-gray-400 text-xs"> / {(l.events || []).length} events</span>
                      </td>
                      <td className="px-4 py-3">
                        {l.has_video ? (
                          <button
                            onClick={() => openRecording(l, c.name)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <Video size={13} /> Watch
                            {fmtDuration(l.video_duration) && (
                              <span className="text-indigo-400 font-normal">
                                {fmtDuration(l.video_duration)}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                            <VideoOff size={13} /> None
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {l.at ? new Date(l.at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setOpen(open === i ? null : i)}
                          className="text-indigo-600 text-xs font-medium hover:underline"
                        >
                          {open === i ? "Hide" : "Audit"}
                        </button>
                      </td>
                    </tr>
                    {open === i && (
                      <tr className="bg-slate-50 border-b">
                        <td colSpan={8} className="px-6 py-4">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">
                            Violation log
                          </h4>
                          {(l.violations || []).length === 0 && (
                            <p className="text-xs text-gray-400">Clean record — no violations.</p>
                          )}
                          <ul className="space-y-1">
                            {(l.violations || []).map((v, j) => (
                              <li key={j} className="text-xs text-gray-600 flex gap-2">
                                <span className="text-red-500 shrink-0">▸</span>
                                <span>
                                  <b>{v.type}</b>
                                  {v.at && ` · ${new Date(v.at).toLocaleTimeString()}`}
                                  {v.detail && ` · ${v.detail}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interview recording player modal */}
      {video && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`Interview recording of ${video.name}`}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Video size={16} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Interview Recording — {video.name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {fmtDuration(video.duration) ? `Duration ${fmtDuration(video.duration)}` : ""}
                    {video.uploadedAt
                      ? `${fmtDuration(video.duration) ? " · " : ""}Uploaded ${new Date(video.uploadedAt).toLocaleString()}`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVideo(null)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close recording player"
              >
                <X size={18} />
              </button>
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              src={video.url}
              controls
              autoPlay
              playsInline
              preload="auto"
              className="max-h-[70vh] w-full bg-black"
              onLoadedMetadata={(e) => {
                // MediaRecorder webm files have no duration metadata
                // (duration === Infinity) — seek far ahead once to force the
                // browser to compute it, then jump back and play.
                const v = e.currentTarget;
                if (v.duration === Infinity || Number.isNaN(v.duration)) {
                  const restore = () => {
                    v.removeEventListener("timeupdate", restore);
                    v.currentTime = 0;
                    v.play().catch(() => {});
                  };
                  v.addEventListener("timeupdate", restore);
                  v.currentTime = 1e7;
                }
              }}
              onError={(e) => {
                const err = e.currentTarget.error;
                console.error(
                  "Recording playback error:",
                  err ? `code ${err.code} — ${err.message || ""}` : "unknown",
                );
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
