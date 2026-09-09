import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { getAllInterviews } from "../../services/interviewService";
import { getCandidateForms, deleteForm } from "../../services/formService";
import AdminInterviewTable from "../../components/Interview/AdminInterviewTable";
import CandidateForm from "../../components/candidates/CandidateForm";
import ExportButton from "../../components/common/ExportButton";
import { getJobPositions } from "../../services/jobPositionService";
import { getLanguages } from "../../services/languageService";
import API from "../../services/api";
import { UserRoundSearch, Plus, RotateCcw, Search, SlidersHorizontal, Users, ListFilter, Trash2 } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import toast from "react-hot-toast";
export default function CandidateManagement() {
  const table = "All Candidates";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobProfiles, setJobProfiles] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [openCandidateForm, setOpenCandidateForm] = useState(false);
  const [hrList, setHrList] = useState([]);

  // Quick Add state
  const [openQuickAdd, setOpenQuickAdd] = useState(false);
  const [quickForms, setQuickForms] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickPage, setQuickPage] = useState(1);
  const [quickTotalPages, setQuickTotalPages] = useState(1);
  const [quickError, setQuickError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    search: "",
    hr: "",
    status: "",
    call_status: "",
    joined: "",
    job_profile: "",
    language_id: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchMasterData = async () => {
    try {
      const [jobsRes, langRes, hrRes] = await Promise.all([
        getJobPositions(),
        getLanguages(),
        API.get("/super-admin/interviews/hr-list"),
      ]);
      setJobProfiles(jobsRes.data?.data || []);
      setLanguages(langRes.data?.data || []);
      setHrList(hrRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // ── Fix 1: getAllInterviews + getCandidateForms dono merge karke rows mein daalo ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const payload = {
        page,
        limit,
        search: debouncedSearch || undefined,
        hr: filters.hr || undefined,
        status: filters.status || undefined,
        call_status: filters.call_status || undefined,
        joined: filters.joined || undefined,
        job_profile: filters.job_profile || undefined,
        language_id: filters.language_id || undefined,
      };

      // Dono APIs parallel call karo
      const [interviewsRes, formsRes] = await Promise.allSettled([
        getAllInterviews(payload),
        getCandidateForms(page, limit),
      ]);

      const interviewRows =
        interviewsRes.status === "fulfilled"
          ? interviewsRes.value.data?.data?.rows || []
          : [];

      const formRows =
        formsRes.status === "fulfilled"
          ? (formsRes.value.forms || []).map((form) => ({
              id: `form_${form.id}`,
              candidate_name: form.full_name || "",
              candidate_phone: form.phone || "",
              job_profile: form.job_profile || "-",
              language_name: form.language_name || "-",
              experience: form.experience || "-",
              current_ctc: form.current_ctc || null,
              expected_ctc: form.expected_salary || null,
              notice_period: form.notice_period || "-",
              hr_name: form.hr_name || "-",
              company_name: form.company_name || "-",
              call_status_id: form.call_status_id || null,
              interview_date: form.interview_date || null,
              interview_time: form.interview_time || "-",
              selection_date: form.selection_date || null,
              joining_date: form.joining_date || null,
              cv_file: form.resume_path || null,
              client_status: form.client_status || "pending",
              client_remarks: form.client_remarks || "-",
              joined: form.joined || "No",
            }))
          : [];

      // Duplicate phone number ke basis pe filter karo
      const existingPhones = new Set(interviewRows.map((r) => r.candidate_phone));
      const uniqueFormRows = formRows.filter(
        (r) => !existingPhones.has(r.candidate_phone)
      );

      setRows([...interviewRows, ...uniqueFormRows]);
      setTotalPages(
        interviewsRes.status === "fulfilled"
          ? interviewsRes.value.data?.data?.totalPages || 1
          : 1
      );
    } catch (err) {
      console.error("Error fetching table data:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filters.hr, filters.status, filters.call_status, filters.joined, filters.job_profile, filters.language_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ search: "", hr: "", status: "", call_status: "", joined: "", job_profile: "", language_id: "" });
    setDebouncedSearch("");
    setPage(1);
  };

  // Quick Add modal ka data
  const fetchQuickForms = useCallback(async () => {
    try {
      setQuickLoading(true);
      setQuickError("");
      const res = await getCandidateForms(quickPage, 50);
      // Backend response shape flexible handle karo
      const list = Array.isArray(res) ? res : res.forms || res.data || [];
      setQuickForms(Array.isArray(list) ? list : []);
      setQuickTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      console.error("Error fetching quick forms:", err);
      setQuickForms([]);
      // Real error surface karo — empty list ke jaise mat dikhao
      setQuickError(
        err?.response?.data?.message ||
          (err?.response?.status
            ? `Server error (${err.response.status}) while loading forms`
            : "Could not reach the server. Check your connection / API URL.")
      );
    } finally {
      setQuickLoading(false);
    }
  }, [quickPage]);

  useEffect(() => {
    if (openQuickAdd) fetchQuickForms();
  }, [openQuickAdd, fetchQuickForms]);

  // ── Fix 2: Delete form ──
  const handleDeleteForm = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      setDeletingId(id);
      await deleteForm(id);
      setQuickForms((prev) => prev.filter((f) => f.id !== id));
      fetchData(); // All Candidates table bhi refresh karo
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalCandidatesCount = rows.length;
  const isAnyFilterActive = Object.values(filters).some((value) => value !== "");

  return (

    
    <div className="p-6 bg-[#F8FAFC] w-full antialiased text-slate-800">
      <div className="w-full space-y-6 mx-auto">

        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 shadow-lg shadow-indigo-200">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
                Candidate Management
              </h1>
              <p className="text-sm text-indigo-200 mt-1.5">
                Filter records, monitor statuses, and register profiles inline
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15">
                  <Users size={12} />
                  {totalCandidatesCount} {totalCandidatesCount === 1 ? "Record" : "Records"} on page
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-indigo-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15">
                  <UserRoundSearch size={12} />
                  {hrList.length} HRs
                </span>
                {isAnyFilterActive && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-100 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300/30">
                    <SlidersHorizontal size={12} />
                    Filters Active
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <ExportButton data={rows} filename="candidates" />
              <button
                onClick={() => setOpenCandidateForm(true)}
                className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Candidate
              </button>
            </div>
          </div>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -right-4 -bottom-24 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search candidates by name, profile, or contact number..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/60 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400/80 font-medium text-slate-700"
              />
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider rounded-xl border border-slate-200 transition-all duration-150 whitespace-nowrap"
            >
              <RotateCcw size={14} strokeWidth={2.5} />
              Reset Filters
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <SlidersHorizontal size={12} className="text-indigo-500" />
            <span>Refine Criteria</span>
            <div className="h-px bg-slate-100 flex-1 ml-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Assigned HR</label>
              <select value={filters.hr} onChange={(e) => handleFilterChange("hr", e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-600 font-medium">
                <option value="">All Appointed HRs</option>
                {hrList.map((hr, index) => (
                  <option key={hr.hr_name ?? index} value={hr.hr_name}>{hr.hr_name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Interview Status</label>
              <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-600 font-medium">
                <option value="">All Statuses</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="accepted">✅ Passed / Accepted</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Job Profile</label>
              <select value={filters.job_profile} onChange={(e) => handleFilterChange("job_profile", e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-600 font-medium">
                <option value="">All Profiles</option>
                {jobProfiles.map((job) => (
                  <option key={job.id || job.title} value={job.title || job.id}>{job.title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Language</label>
              <select value={filters.language_id} onChange={(e) => handleFilterChange("language_id", e.target.value)} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-600 font-medium">
                <option value="">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full overflow-hidden">
          <div className="w-full">
            <AdminInterviewTable rows={rows} table={table} loading={loading} hideButtons={true} />
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ListFilter size={14} className="text-slate-400" />
            <span>Showing <strong className="text-slate-800">{totalCandidatesCount}</strong> records on this view.</span>
            {isAnyFilterActive && (
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/60 text-[10px]">Filters Active</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {isAnyFilterActive && (
              <button onClick={handleResetFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors">
                <RotateCcw size={12} /> Clear
              </button>
            )}
            <button
              onClick={() => setOpenQuickAdd(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold tracking-wide uppercase rounded-lg shadow-sm transition-all"
            >
              <Plus size={14} strokeWidth={2.5} /> Quick Add Candidate
            </button>
          </div>
        </div>

      </div>

      {/* ✅ MODAL 1 — Add Candidate → CandidateForm */}
      {openCandidateForm &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
            onClick={() => setOpenCandidateForm(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Add Candidate"
            >
              <CandidateForm
                onSuccess={() => {
                  setOpenCandidateForm(false);
                  fetchData();
                }}
                onClose={() => setOpenCandidateForm(false)}
              />
            </div>
          </div>,
          document.body
        )}

      {/* ✅ MODAL 2 — Quick Add → getCandidateForms list with Delete */}
      {openQuickAdd && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col w-full max-w-3xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-900">Quick Add — Submitted Candidate Forms</h2>
              <button
                onClick={() => setOpenQuickAdd(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm"
              >
                Close
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {quickLoading ? (
                <p className="text-center text-slate-400 py-10 text-sm">Loading...</p>
              ) : quickError ? (
                <div className="text-center py-10">
                  <p className="text-sm font-semibold text-rose-600">{quickError}</p>
                  <button
                    onClick={fetchQuickForms}
                    className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-all"
                  >
                    Retry
                  </button>
                </div>
              ) : quickForms.length === 0 ? (
                <p className="text-center text-slate-400 py-10 text-sm">No submitted forms found.</p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Phone</th>
                      <th className="pb-3 pr-4">Job Profile</th>
                      <th className="pb-3 pr-4">Language</th>
                      <th className="pb-3 pr-4">Experience</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quickForms.map((form) => (
                      <tr key={form.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-slate-800">{form.full_name || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{form.phone || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{form.job_profile || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{form.language_name || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{form.experience || "—"}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteForm(form.id)}
                            disabled={deletingId === form.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200 transition-all disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                            {deletingId === form.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-400">{quickForms.length} records</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={quickPage === 1}
                  onClick={() => setQuickPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-slate-600">{quickPage} / {quickTotalPages}</span>
                <button
                  disabled={quickPage >= quickTotalPages}
                  onClick={() => setQuickPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
