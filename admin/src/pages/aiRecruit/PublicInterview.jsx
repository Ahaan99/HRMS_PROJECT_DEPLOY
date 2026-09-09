import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BrainCircuit, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PublicInterview() {
  const { token } = useParams();
  const [state, setState] = useState("loading"); // loading | ready | done | error
  const [interview, setInterview] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/ai-recruit/public/${token}`)
      .then(({ data }) => {
        const iv = data.interview;
        iv.questions =
          typeof iv.questions === "string" ? JSON.parse(iv.questions) : iv.questions;
        setInterview(iv);
        setAnswers(new Array(iv.questions.length).fill(""));
        setState("ready");
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Interview not found");
        setState("error");
      });
  }, [token]);

  const submit = async () => {
    setBusy(true);
    try {
      await axios.post(`${BASE_URL}/ai-recruit/public/${token}/answers`, { answers });
      setState("done");
    } catch (err) {
      setError(err?.response?.data?.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
        Loading interview...
      </div>
    );

  if (state === "error")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-semibold">{error}</p>
      </div>
    );

  if (state === "done")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Interview submitted</h1>
          <p className="text-sm text-gray-500 mt-2">
            Thank you, {interview.candidate_name}. Our team will review your responses and get
            back to you soon.
          </p>
        </div>
      </div>
    );

  const q = interview.questions[idx];
  const total = interview.questions.length;
  const answered = answers.filter((a) => a.trim()).length;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-black text-white">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">
              {interview.job_title} — AI Interview
            </h1>
            <p className="text-xs text-gray-400">
              Candidate: {interview.candidate_name} &middot; Question {idx + 1} of {total}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-6">
          {interview.questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i === idx ? "bg-black" : answers[i].trim() ? "bg-emerald-400" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <p className="text-lg font-semibold text-gray-900 text-pretty mb-4">{q}</p>
        <textarea
          rows={7}
          value={answers[idx]}
          onChange={(e) => {
            const next = [...answers];
            next[idx] = e.target.value;
            setAnswers(next);
          }}
          placeholder="Type your answer here. Include concrete examples where possible."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex items-center gap-1 text-sm font-bold text-gray-500 disabled:opacity-30"
          >
            <ArrowLeft size={15} /> Previous
          </button>

          {idx < total - 1 ? (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="flex items-center gap-1.5 bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-900"
            >
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={busy || answered < total}
              title={answered < total ? "Answer all questions first" : ""}
              className="bg-emerald-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? "Submitting..." : `Submit (${answered}/${total} answered)`}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>
    </div>
  );
}
