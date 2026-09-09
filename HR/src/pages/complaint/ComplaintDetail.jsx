import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios.js";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import HRNavbar from "../../components/hr/HRNavbar";

export default function ComplaintDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [reply, setReply] = useState("");
  const navigate = useNavigate();

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

  const getSenderName = (r) => {
    return r.employee_name || r.client_name || "Unknown";
  };

  const handleReply = async () => {
    if (!reply.trim()) return;

    try {
      await API.post(`/complaints/${id}/reply`, {
        message: reply,
      });

      toast.success("Reply added");
      setReply("");
      fetchDetail();
    } catch (err) {
      toast.error("Reply failed");
    }
  };

  const handleStatus = async (status) => {
    try {
      await API.put(`/complaints/${id}/status`, { status });
      toast.success("Status updated");
      fetchDetail();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  if (!data || !data.complaint) {
    return (
      <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6 dark:bg-[#0b0817]">
        <HRNavbar />
        <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40">
          <RefreshCw
            className="mx-auto mb-3 h-8 w-8 animate-spin text-violet-500"
            aria-hidden="true"
          />
          Loading complaint...
        </div>
      </div>
    );
  }

  const { complaint, replies } = data;

  const statusBadge =
    complaint.status === "resolved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30"
      : complaint.status === "in_progress"
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30"
        : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-400/30";

  const priorityBadge =
    complaint.priority === "high"
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-400/30"
      : complaint.priority === "medium"
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/30"
        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-400/30";

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6 dark:bg-[#0b0817]">
      <HRNavbar />

      <div className="mx-auto mt-6 max-w-3xl space-y-6 pb-14">
        {/* BACK */}
        <button
          onClick={() => navigate("/complaint")}
          className="flex items-center gap-2 text-sm font-semibold text-violet-600 transition-colors hover:text-violet-500 dark:text-fuchsia-300 dark:hover:text-fuchsia-200"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Complaints
        </button>

        {/* HERO / HEADER CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-8 md:px-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl"
          />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Complaint #{id}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white text-balance">
              {complaint.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              {complaint.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadge}`}
              >
                {complaint.status.replace("_", " ")}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${priorityBadge}`}
              >
                {complaint.priority} priority
              </span>
            </div>
          </div>
        </div>

        {/* STATUS ACTIONS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleStatus("in_progress")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30"
          >
            <Clock size={15} aria-hidden="true" />
            Mark In Progress
          </button>

          <button
            onClick={() => handleStatus("resolved")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30"
          >
            <CheckCircle2 size={15} aria-hidden="true" />
            Resolve
          </button>

          {complaint.created_by_role === "hr" && (
            <p className="text-xs font-medium text-slate-400 dark:text-white/40">
              Waiting for admin response...
            </p>
          )}
        </div>

        {/* CONVERSATION */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-white/10">
            <span
              className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
              aria-hidden="true"
            />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Conversation
            </h2>
          </div>

          <div className="space-y-3 p-6">
            {replies?.length === 0 && (
              <div className="py-8 text-center">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                  <MessageSquare size={24} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-slate-700 dark:text-white/80">
                  No replies yet
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                  Responses to this complaint will appear here.
                </p>
              </div>
            )}

            {replies?.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-xs font-bold text-white shadow-md">
                    {getSenderName(r).charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white/90">
                      {getSenderName(r)}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 dark:text-fuchsia-300">
                      {r.sender_role}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-700 dark:text-white/70">
                  {r.message}
                </p>

                <p className="mt-2 text-[10px] text-slate-400 dark:text-white/30">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* REPLY BOX */}
          <div className="flex gap-2 border-t border-slate-100 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
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
              placeholder="Write a reply..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-500/60 dark:focus:ring-fuchsia-500/20"
            />

            <button
              onClick={handleReply}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30"
            >
              <Send size={15} aria-hidden="true" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
