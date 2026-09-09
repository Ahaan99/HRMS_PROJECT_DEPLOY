import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Loader2,
  CircleDot,
  CheckCircle2,
} from "lucide-react";

const STATUS_STYLES = {
  open: "badge-premium bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  in_progress:
    "badge-premium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  resolved:
    "badge-premium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const PRIORITY_STYLES = {
  low: "badge-premium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  medium:
    "badge-premium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  high: "badge-premium bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

export default function ComplaintDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [reply, setReply] = useState("");
  const navigate = useNavigate();
  // 🔥 fetch detail
  const fetchDetail = async () => {
    try {
      const res = await API.get(`/complaints/${id}`);
      setData(res.data.data);
    } catch (err) {
      toast.error("Failed to load complaint");
    }
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      await fetchDetail();
    };

    load();
  }, [id]);

  // 🔥 get sender name
  const getSenderName = (r) => {
    return r.employee_name || r.client_name || "Unknown";
  };

  // 🔥 send reply
  const handleReply = async () => {
    if (!reply.trim()) return;

    try {
      await API.post(`/complaints/${id}/reply`, {
        message: reply,
      });

      toast.success("Reply added");
      setReply("");
      fetchDetail(); // refresh chat
    } catch (err) {
      toast.error("Reply failed");
    }
  };

  // 🔥 update status
  const handleStatus = async (status) => {
    try {
      await API.put(`/complaints/${id}/status`, { status });
      toast.success("Status updated");
      fetchDetail();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  // 🔥 loading safe
  if (!data || !data.complaint) {
    return (
      <div className="p-4 md:p-6">
        <div className="card-premium flex items-center justify-center gap-2 p-10 text-sm text-slate-400 dark:text-slate-500">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          Loading complaint…
        </div>
      </div>
    );
  }

  const statusClass =
    STATUS_STYLES[data.complaint.status] || STATUS_STYLES.open;
  const priorityClass =
    PRIORITY_STYLES[data.complaint.priority] || PRIORITY_STYLES.low;

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <button
        onClick={() => navigate("/complaint")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Complaints
      </button>

      {/* HEADER CARD */}
      <div className="card-premium overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <h1 className="text-lg font-bold text-slate-900 text-balance dark:text-slate-100">
            {data.complaint.title}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {data.complaint.description}
          </p>

          {/* META */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={statusClass}>
              {String(data.complaint.status).replace("_", " ")}
            </span>
            <span className={priorityClass}>
              {data.complaint.priority} priority
            </span>
          </div>
        </div>

        {/* STATUS BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-4">
          <button
            onClick={() => handleStatus("in_progress")}
            className="btn-secondary-premium"
          >
            <CircleDot size={15} aria-hidden="true" />
            In Progress
          </button>

          <button
            onClick={() => handleStatus("resolved")}
            className="btn-premium"
          >
            <CheckCircle2 size={15} aria-hidden="true" />
            Resolve
          </button>

          {data.complaint.created_by_role === "hr" && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Waiting for admin response…
            </p>
          )}
        </div>
      </div>

      {/* CHAT / REPLIES */}
      <div className="card-premium overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            <MessageSquare size={16} aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Conversation
          </h2>
        </div>

        <div className="space-y-3 p-5">
          {data.replies?.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">
              No replies yet
            </p>
          )}

          {data.replies?.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm dark:border-slate-800 dark:bg-slate-800/40"
            >
              <p className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {getSenderName(r)}
                <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
                  ({r.sender_role})
                </span>
              </p>

              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                {r.message}
              </p>

              <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* REPLY BOX */}
        <div className="flex gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                handleReply();
              }
            }}
            placeholder="Write reply…"
            className="input-premium flex-1"
          />

          <button onClick={handleReply} className="btn-premium shrink-0">
            <Send size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
