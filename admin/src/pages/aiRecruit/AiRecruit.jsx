import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { PageHero, PillTab } from "../../components/common/Premium";
import {
  BrainCircuit,
  FileScan,
  Link2,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  UploadCloud,
  FileText,
  X,
  ClipboardType,
  CheckCircle2,
  XCircle,
  Lightbulb,
  UserPlus,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

const scoreColor = (s) =>
  s >= 7 ? "text-emerald-600" : s >= 4 ? "text-amber-600" : "text-red-500";

const atsColor = (s) =>
  s >= 75 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-red-500";
const atsStroke = (s) => (s >= 75 ? "#059669" : s >= 50 ? "#d97706" : "#ef4444");
const atsLabel = (s) =>
  s >= 75 ? "Excellent — ATS friendly" : s >= 50 ? "Decent — can improve" : "Needs work";
const barColor = (pct) =>
  pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400";

/* Animated circular gauge */
function ScoreGauge({ score }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setVal(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={atsStroke(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * val) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold ${atsColor(score)}`}>{val}</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          ATS Score
        </span>
      </div>
    </div>
  );
}

export default function AiRecruit() {
  const [tab, setTab] = useState("screening");
  const [interviews, setInterviews] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [expandedScreen, setExpandedScreen] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ candidate_name: "", candidate_email: "", job_title: "" });
  const [resume, setResume] = useState({ resume_text: "", job_title: "", job_keywords: "" });
  const [inputMode, setInputMode] = useState("upload"); // upload | paste
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [screenResult, setScreenResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    const [iv, sc] = await Promise.all([
      axios.get(`${BASE_URL}/ai-recruit/interviews`, { headers: authHeaders() }),
      axios.get(`${BASE_URL}/ai-recruit/screenings`, { headers: authHeaders() }),
    ]);
    setInterviews(iv.data.interviews || []);
    setScreenings(sc.data.screenings || []);
  }, []);

  useEffect(() => {
    load().catch((err) =>
      toast.error(
        err?.response?.data?.message ||
          (err?.response?.status
            ? `Load failed (server error ${err.response.status})`
            : "Load failed — could not reach the server")
      )
    );
  }, [load]);

  const createInterview = async () => {
    if (!form.candidate_name.trim() || !form.job_title.trim())
      return toast.error("Candidate name and job title are required");
    setBusy(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/ai-recruit/interviews`, form, {
        headers: authHeaders(),
      });
      toast.success(
        data.ai_generated ? "Interview created (AI questions)" : "Interview created (question bank)",
      );
      copyLink(data.token);
      setCreating(false);
      setForm({ candidate_name: "", candidate_email: "", job_title: "" });
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/interview/${token}`;
    navigator.clipboard?.writeText(url);
    toast.success("Candidate link copied");
  };

  const pickFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "txt", "md"].includes(ext))
      return toast.error("Upload a PDF, DOCX, or TXT resume");
    if (f.size > 10 * 1024 * 1024) return toast.error("Max file size is 10MB");
    setFile(f);
  };

  const runScreen = async () => {
    if (inputMode === "upload" && !file) return toast.error("Upload a resume file first");
    if (inputMode === "paste" && resume.resume_text.trim().length < 40)
      return toast.error("Paste at least a few lines of resume text");
    setBusy(true);
    setScreenResult(null);
    try {
      let data;
      if (inputMode === "upload") {
        const fd = new FormData();
        fd.append("job_title", resume.job_title);
        fd.append("job_keywords", resume.job_keywords);
        fd.append("resume", file);
        ({ data } = await axios.post(`${BASE_URL}/ai-recruit/screen-resume-upload`, fd, {
          headers: authHeaders(),
        }));
      } else {
        ({ data } = await axios.post(`${BASE_URL}/ai-recruit/screen-resume`, resume, {
          headers: authHeaders(),
        }));
      }
      setScreenResult(data);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Screening failed");
    } finally {
      setBusy(false);
    }
  };

  const inviteFromScreening = (parsed, jobTitle) => {
    setForm({
      candidate_name: parsed?.candidate_name || "",
      candidate_email: parsed?.email || "",
      job_title: jobTitle || "",
    });
    setTab("interviews");
    setCreating(true);
    toast.success("Interview form pre-filled from screening");
  };

  const parseJson = (v) => {
    if (!v) return null;
    if (typeof v === "object") return v;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };

  return (
    <div className="p-6 space-y-5">
      <PageHero
        eyebrow="Recruitment"
        title="AI Recruitment"
        subtitle="ATS resume screening and AI interviews"
        icon={BrainCircuit}
      />

      <div className="flex flex-wrap items-center gap-3">
        <PillTab active={tab === "screening"} onClick={() => setTab("screening")} icon={FileScan}>
          Resume Screening
        </PillTab>
        <PillTab active={tab === "interviews"} onClick={() => setTab("interviews")} icon={Sparkles}>
          Interviews
        </PillTab>
      </div>

      {tab === "interviews" && (
        <div className="space-y-4">
          <button
            onClick={() => setCreating((c) => !c)}
            className="flex items-center gap-1.5 bg-black text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-900"
          >
            <Plus size={15} /> New AI Interview
          </button>

          {creating && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid gap-3 sm:grid-cols-3">
              <input
                placeholder="Candidate name *"
                value={form.candidate_name}
                onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                placeholder="Candidate email"
                value={form.candidate_email}
                onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                placeholder="Job title *"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={createInterview}
                disabled={busy}
                className="sm:col-span-3 bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? "Generating questions..." : "Create & Copy Candidate Link"}
              </button>
            </div>
          )}

          {interviews.map((iv) => {
            const ev = parseJson(iv.evaluation);
            const qs = parseJson(iv.questions) || [];
            const ans = parseJson(iv.answers) || [];
            const open = expanded === iv.id;
            return (
              <div key={iv.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-gray-900">
                      {iv.candidate_name}
                      <span className="text-gray-400 font-medium"> — {iv.job_title}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(iv.created_at).toLocaleString()} &middot; {iv.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {iv.score !== null && (
                      <span className={`text-lg font-extrabold ${scoreColor(Number(iv.score))}`}>
                        {Number(iv.score).toFixed(1)}/10
                      </span>
                    )}
                    {iv.status === "Pending" && (
                      <button
                        onClick={() => copyLink(iv.token)}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      >
                        <Link2 size={13} /> Copy link
                      </button>
                    )}
                    {iv.status === "Evaluated" && (
                      <button
                        onClick={() => setExpanded(open ? null : iv.id)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600"
                      >
                        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    )}
                  </div>
                </div>

                {open && ev && (
                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold">Summary:</span> {ev.summary}
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">
                        {ev.mode}
                      </span>
                    </p>
                    {(ev.per_question || []).map((pq, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm font-semibold text-gray-800">
                          Q{i + 1}. {pq.question}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {ans[i] || "—"}
                        </p>
                        <p className={`text-xs font-bold mt-1.5 ${scoreColor(pq.score)}`}>
                          {pq.score}/10 &middot;{" "}
                          <span className="text-gray-400 font-medium">{pq.feedback}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {interviews.length === 0 && (
            <p className="text-center text-gray-400 py-10">No interviews yet.</p>
          )}
        </div>
      )}

      {tab === "screening" && (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* left: input */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-900">Screen a Resume</p>
                <div className="flex rounded-lg bg-gray-100 p-0.5">
                  <button
                    onClick={() => setInputMode("upload")}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md ${
                      inputMode === "upload" ? "bg-white shadow text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <UploadCloud size={13} /> Upload
                  </button>
                  <button
                    onClick={() => setInputMode("paste")}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-md ${
                      inputMode === "paste" ? "bg-white shadow text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <ClipboardType size={13} /> Paste
                  </button>
                </div>
              </div>

              <input
                placeholder="Job title (e.g. Frontend Developer)"
                value={resume.job_title}
                onChange={(e) => setResume({ ...resume, job_title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                placeholder="Job keywords, comma separated (react, node, sql)"
                value={resume.job_keywords}
                onChange={(e) => setResume({ ...resume, job_keywords: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />

              {inputMode === "upload" ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                    dragOver
                      ? "border-black bg-gray-50"
                      : file
                        ? "border-emerald-300 bg-emerald-50/40"
                        : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={22} className="text-emerald-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-400">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                        aria-label="Remove file"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={26} className="mx-auto text-gray-400" />
                      <p className="text-sm font-bold text-gray-700 mt-2">
                        Drop resume here or click to browse
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT — max 10MB</p>
                    </>
                  )}
                </div>
              ) : (
                <textarea
                  placeholder="Paste resume text here..."
                  rows={9}
                  value={resume.resume_text}
                  onChange={(e) => setResume({ ...resume, resume_text: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              )}

              <button
                onClick={runScreen}
                disabled={busy}
                className="w-full bg-black text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-gray-900 disabled:opacity-50"
              >
                {busy ? "Analyzing resume..." : "Analyze ATS Score"}
              </button>
            </div>

            {/* recent screenings */}
            <div className="space-y-2.5">
              <p className="font-bold text-gray-900">Recent Screenings</p>
              {screenings.map((s) => {
                const bd = parseJson(s.ats_breakdown) || [];
                const open = expandedScreen === s.id;
                const ats = s.ats_score !== null ? Number(s.ats_score) : null;
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5"
                  >
                    <div
                      className="flex items-center justify-between gap-2 cursor-pointer"
                      onClick={() => setExpandedScreen(open ? null : s.id)}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {s.candidate_name || s.email || "Unknown"}
                          {s.job_title && <span className="text-gray-400"> — {s.job_title}</span>}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {new Date(s.created_at).toLocaleString()}
                          {s.file_name ? ` · ${s.file_name}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ats !== null && (
                          <span className={`font-extrabold ${atsColor(ats)}`}>{ats.toFixed(0)}</span>
                        )}
                        {bd.length > 0 &&
                          (open ? (
                            <ChevronUp size={14} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={14} className="text-gray-400" />
                          ))}
                      </div>
                    </div>
                    {open && bd.length > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                        {bd.map((b) => {
                          const pct = (b.score / b.max) * 100;
                          return (
                            <div key={b.category}>
                              <div className="flex justify-between text-xs font-semibold text-gray-600">
                                <span>{b.category}</span>
                                <span>
                                  {b.score}/{b.max}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                                <div
                                  className={`h-full rounded-full ${barColor(pct)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {screenings.length === 0 && (
                <p className="text-gray-400 text-sm">No screenings yet.</p>
              )}
            </div>
          </div>

          {/* right: result */}
          <div className="lg:col-span-3">
            {!screenResult ? (
              <div className="h-full min-h-[320px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8">
                <FileScan size={34} className="text-gray-300" />
                <p className="font-bold text-gray-500 mt-3">ATS analysis appears here</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">
                  Upload a resume to get an ATS-friendliness score with a full category
                  breakdown and improvement suggestions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* score card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-center gap-6">
                  <ScoreGauge score={screenResult.ats_score} />
                  <div className="flex-1 text-center sm:text-left">
                    <p className={`text-lg font-extrabold ${atsColor(screenResult.ats_score)}`}>
                      {atsLabel(screenResult.ats_score)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {screenResult.parsed?.candidate_name || "Candidate"}
                      {resume.job_title ? ` · ${resume.job_title}` : ""}
                      {screenResult.match_score !== null &&
                        ` · ${screenResult.match_score}% keyword match`}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">
                      {(screenResult.parsed?.skills || []).slice(0, 10).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() =>
                        inviteFromScreening(screenResult.parsed, resume.job_title)
                      }
                      className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-700"
                    >
                      <UserPlus size={14} /> Invite to AI Interview
                    </button>
                  </div>
                </div>

                {/* breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-900 mb-4">Score Breakdown</p>
                  <div className="space-y-4">
                    {(screenResult.breakdown || []).map((b) => {
                      const pct = (b.score / b.max) * 100;
                      return (
                        <div key={b.category}>
                          <div className="flex justify-between text-sm font-semibold text-gray-700">
                            <span>{b.category}</span>
                            <span className={atsColor(pct)}>
                              {b.score}/{b.max}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 mt-1.5">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${barColor(pct)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{b.details.join(" · ")}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* keywords */}
                {(screenResult.matched_keywords?.length > 0 ||
                  screenResult.missing_keywords?.length > 0) && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="font-bold text-gray-900 mb-3">Job Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {screenResult.matched_keywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700"
                        >
                          <CheckCircle2 size={12} /> {k}
                        </span>
                      ))}
                      {screenResult.missing_keywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600"
                        >
                          <XCircle size={12} /> {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* suggestions */}
                {screenResult.suggestions?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                      <Lightbulb size={16} className="text-amber-500" /> Improvement Suggestions
                    </p>
                    <ul className="space-y-2">
                      {screenResult.suggestions.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-600">
                          <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
