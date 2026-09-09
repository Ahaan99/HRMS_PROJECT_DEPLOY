import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Inbox, UserPlus, Archive, MailOpen } from "lucide-react";
import HRNavbar from "../../components/hr/HRNavbar";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_hr_Token")}`,
});

const TYPE_LABELS = {
  contact: "Contact",
  job_application: "Job Application",
  enquiry: "Enquiry",
  demo_request: "Demo Request",
  vendor_registration: "Vendor Registration",
  employee_new_joining: "New Joining",
};

const STATUS_COLORS = {
  New: "bg-sky-100 text-sky-700",
  Read: "bg-slate-100 text-slate-600",
  Converted: "bg-emerald-100 text-emerald-700",
  Archived: "bg-amber-100 text-amber-700",
};

export default function WebFormsInbox() {
  const [subs, setSubs] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/web-forms/submissions${filter ? `?status=${filter}` : ""}`,
        { headers: authHeaders() },
      );
      setSubs(data.submissions || []);
      setCounts(data.counts || {});
    } catch (err) {
      toast.error(err?.response?.data?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      await axios.patch(
        `${BASE_URL}/web-forms/submissions/${id}/status`,
        { status },
        { headers: authHeaders() },
      );
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const convert = async (id) => {
    try {
      await axios.post(
        `${BASE_URL}/web-forms/submissions/${id}/convert`,
        {},
        { headers: authHeaders() },
      );
      toast.success("Converted to candidate");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Convert failed");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <HRNavbar />
      {/* ── HERO BAND ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-8 md:px-10">
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

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
            Inbound
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">
            Website Forms
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {counts.total || 0} submissions &middot; {counts.unread || 0} new
          </p>
        </div>
      </div>

      {/* ── FILTER PILLS ────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {["", "New", "Read", "Converted", "Archived"].map((f) => (
          <button
            key={f || "all"}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f || "All"}
          </button>
        ))}
      </div>

      {/* ── SUBMISSIONS ─────────────────────────────────────── */}
      <div className="space-y-3">
        {subs.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 ring-1 ring-indigo-100">
                    {TYPE_LABELS[s.form_type] || s.form_type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-600"}`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  {s.email || "no email"} &middot; {s.phone || "no phone"}{" "}
                  &middot; {new Date(s.created_at).toLocaleString()} &middot;
                  via {s.source}
                </p>
                {s.subject && (
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {s.subject}
                  </p>
                )}
                {s.message && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {s.message}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-1.5">
                {s.status === "New" && (
                  <button
                    onClick={() => setStatus(s.id, "Read")}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition-colors hover:bg-slate-100"
                    title="Mark read"
                    aria-label="Mark read"
                  >
                    <MailOpen size={15} aria-hidden="true" />
                  </button>
                )}
                {s.status !== "Converted" && (
                  <button
                    onClick={() => convert(s.id)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100"
                    title="Convert to candidate"
                    aria-label="Convert to candidate"
                  >
                    <UserPlus size={15} aria-hidden="true" />
                  </button>
                )}
                {s.status !== "Archived" && (
                  <button
                    onClick={() => setStatus(s.id, "Archived")}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-600 transition-colors hover:bg-amber-100"
                    title="Archive"
                    aria-label="Archive"
                  >
                    <Archive size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && subs.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox size={22} aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              No submissions yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Submissions from company websites will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
