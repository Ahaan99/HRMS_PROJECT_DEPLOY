import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Phone,
  Save,
  Users,
  XCircle,
} from "lucide-react";
import HRNavbar from "../../components/hr/HRNavbar";
import AddInterviewModal from "../../components/hr/AddInterviewModal";

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    icon: Clock3,
    pill: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    pill: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300",
  },
};

const initials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "?";

export default function LeadDetails() {
  const { id } = useParams();
  const [leads, setLeads] = useState([]);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editedLeads, setEditedLeads] = useState({});
  const [savingId, setSavingId] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, batchesRes] = await Promise.all([
        API.get(`/hr/leads/batch/${id}`),
        API.get(`/hr/leads/batches`).catch(() => null),
      ]);
      setLeads(leadsRes.data?.data || []);
      const found = batchesRes?.data?.data?.find((b) => String(b.id) === String(id));
      setBatch(found || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [id]);

  const summary = useMemo(() => {
    const counts = { pending: 0, accepted: 0, rejected: 0 };
    for (const l of leads) counts[l.status] = (counts[l.status] || 0) + 1;
    const done = counts.accepted + counts.rejected;
    return { ...counts, done, pct: leads.length ? Math.round((done / leads.length) * 100) : 0 };
  }, [leads]);

  const handleChange = (leadId, field, value) => {
    setEditedLeads((prev) => ({ ...prev, [leadId]: { ...prev[leadId], [field]: value } }));
  };

  const handleSubmit = async (leadId) => {
    const original = leads.find((l) => l.id === leadId);
    const updated = editedLeads[leadId];
    if (!updated) return;

    const payload = {
      status: updated.status ?? original.status,
      remarks: updated.remarks ?? original.remarks ?? "",
    };

    setSavingId(leadId);
    try {
      await API.put(`/hr/leads/update/${leadId}`, payload);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...payload } : l)));
      setEditedLeads((prev) => {
        const copy = { ...prev };
        delete copy[leadId];
        return copy;
      });
      toast.success(`${original.name || "Lead"} updated`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSavingId(null);
    }
  };

  const thClass =
    "px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/40";

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 lg:p-6 dark:bg-[#0b0817]">
      <HRNavbar />

      <div className="mx-auto mt-6 max-w-[1600px] space-y-6">
        {/* HERO BAND */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-9 md:px-12">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #818cf8 1px, transparent 1px), linear-gradient(to bottom, #818cf8 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                to="/leads"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 transition hover:text-white"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                All batches
              </Link>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-indigo-300">Recruitment</p>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl text-balance">Lead Management</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Review batch leads, update statuses, and schedule interviews.
              </p>
            </div>

            {batch && (
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30">
                  <FileSpreadsheet size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{batch.file_name}</p>
                  <p className="text-xs text-slate-400">
                    Received{" "}
                    {new Date(batch.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY */}
        {leads.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total leads" value={leads.length} icon={Users} accent="from-indigo-500 to-violet-600" />
            <SummaryCard label="Pending" value={summary.pending} icon={Clock3} accent="from-amber-500 to-orange-500" />
            <SummaryCard label="Accepted" value={summary.accepted} icon={CheckCircle2} accent="from-emerald-500 to-teal-500" />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/40">Progress</p>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{summary.pct}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 transition-all"
                  style={{ width: `${summary.pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-white/40">
                {summary.done} of {leads.length} responded
              </p>
            </div>
          </div>
        )}

        {/* LEADS TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
          <div aria-hidden="true" className="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500" />

          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" aria-hidden="true" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Batch Leads</h3>
            </div>
            {leads.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-white/10 dark:text-white/60">
                {leads.length} lead{leads.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[14%]" />
                <col className="w-[30%]" />
                <col className="w-[30%]" />
              </colgroup>
              <thead className="bg-slate-50 dark:bg-[#100c1e]">
                <tr>
                  <th className={thClass}>Lead</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Remarks</th>
                  <th className={`${thClass} text-right`}>Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
                          <div className="flex flex-col gap-2">
                            <div className="h-3 w-32 rounded bg-slate-200 dark:bg-white/10" />
                            <div className="h-3 w-24 rounded bg-slate-100 dark:bg-white/5" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-white/10" /></td>
                      <td className="px-5 py-4"><div className="h-9 w-full rounded-xl bg-slate-100 dark:bg-white/5" /></td>
                      <td className="px-5 py-4"><div className="ml-auto h-9 w-48 rounded-xl bg-slate-100 dark:bg-white/5" /></td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                        <Users size={24} aria-hidden="true" />
                      </span>
                      <p className="text-sm font-semibold text-slate-700 dark:text-white/80">No leads in this batch</p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-white/40">
                        Leads assigned to you in this batch will appear here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => {
                    const edited = editedLeads[l.id] || {};
                    const currentStatus = edited.status ?? l.status ?? "pending";
                    const status = STATUS_STYLES[currentStatus] || STATUS_STYLES.pending;
                    const StatusIcon = status.icon;
                    const dirty = Boolean(editedLeads[l.id]);
                    const saving = savingId === l.id;

                    return (
                      <tr key={l.id} className="transition-colors hover:bg-violet-50/60 dark:hover:bg-white/[0.04]">
                        {/* LEAD */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 text-xs font-bold text-white shadow-md">
                              {initials(l.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white/90">
                                {l.name || <span className="italic text-slate-400">Unnamed lead</span>}
                              </p>
                              {l.phone ? (
                                <a
                                  href={`tel:${l.phone}`}
                                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-violet-600 dark:text-white/50 dark:hover:text-fuchsia-300"
                                >
                                  <Phone size={11} aria-hidden="true" />
                                  {l.phone}
                                </a>
                              ) : (
                                <p className="mt-0.5 text-xs italic text-slate-400 dark:text-white/30">No phone</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <label className={`inline-flex items-center gap-1.5 rounded-full border pl-2.5 pr-1 text-xs font-semibold ${status.pill}`}>
                            <StatusIcon size={13} aria-hidden="true" />
                            <select
                              aria-label={`Status for ${l.name || "lead"}`}
                              value={currentStatus}
                              onChange={(e) => handleChange(l.id, "status", e.target.value)}
                              className="cursor-pointer bg-transparent py-1.5 pr-1 text-xs font-semibold outline-none dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-200"
                            >
                              <option value="pending">Pending</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </label>
                        </td>

                        {/* REMARK */}
                        <td className="px-5 py-4">
                          <input
                            aria-label={`Remarks for ${l.name || "lead"}`}
                            value={edited.remarks ?? l.remarks ?? ""}
                            onChange={(e) => handleChange(l.id, "remarks", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229 && dirty) handleSubmit(l.id);
                            }}
                            placeholder="Add remark..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-fuchsia-500/60 dark:focus:ring-fuchsia-500/20"
                          />
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleSubmit(l.id)}
                              disabled={!dirty || saving}
                              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                                dirty
                                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 disabled:translate-y-0 disabled:opacity-70"
                                  : "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-white/30"
                              }`}
                            >
                              <Save size={13} aria-hidden="true" />
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLead(l);
                                setShowAdd(true);
                              }}
                              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30"
                            >
                              <CalendarPlus size={13} aria-hidden="true" />
                              Add Interview
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && leads.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/40">
              <span>
                Showing {leads.length} lead{leads.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs">
                Change a status or remark, then press <kbd className="rounded border border-slate-300 px-1 py-0.5 font-mono text-[10px] dark:border-white/20">Save</kbd>
              </span>
            </div>
          )}
        </div>
      </div>

      <AddInterviewModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => setShowAdd(false)}
        locations={[]}
        defaultData={selectedLead}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-24px_rgba(109,40,217,0.25)] dark:border-white/10 dark:bg-white/[0.04]">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-white/40">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
        <Icon size={20} aria-hidden="true" />
      </span>
    </div>
  );
}
