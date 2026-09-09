import { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { Briefcase, Plus, Users } from "lucide-react";
import { PageHero } from "../../components/common/Premium";

const scoreColor = (s) =>
  s >= 70
    ? "bg-emerald-100 text-emerald-700"
    : s >= 40
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-600";

const APP_STATUS_STYLE = {
  NEW: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CONVERTED: "bg-purple-100 text-purple-700",
};

export default function JobBoardATS() {
  const [tab, setTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [apps, setApps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    job_type: "Full-time",
    salary_range: "",
    description: "",
    keywords: "",
  });

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        API.get("/job-board/posts"),
        API.get("/job-board/applications"),
      ]);
      setPosts(p.data.data);
      setApps(a.data.data);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load job board");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPost = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Job title is required");
    try {
      await API.post("/job-board/posts", form);
      toast.success("Job posted to the public board");
      setShowForm(false);
      setForm({
        title: "", department: "", location: "", job_type: "Full-time",
        salary_range: "", description: "", keywords: "",
      });
      load();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Failed to post job");
    }
  };

  const togglePost = async (p) => {
    await API.patch(`/job-board/posts/${p.id}`, {
      status: p.status === "OPEN" ? "CLOSED" : "OPEN",
    });
    load();
  };

  const decide = async (id, status) => {
    try {
      const { data } = await API.patch(`/job-board/applications/${id}`, { status });
      toast.success(data.message);
      setViewing(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    }
  };

  const publicUrl = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/api$/, "")}/api/job-board/public/jobs`;

  return (
    <div className="p-6 space-y-6">
      <PageHero
        eyebrow="Recruitment"
        title="Job Board &amp; ATS"
        subtitle="Public job postings, applications and resume screening"
        icon={Briefcase}
        actions={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50"
          >
            <Plus size={16} /> Post a job
          </button>
        }
      />

      <p className="text-xs text-gray-400">
        Public API for your website: <code className="bg-gray-100 px-1 rounded">{publicUrl}</code>{" "}
        · apply endpoint: <code className="bg-gray-100 px-1 rounded">POST .../job-board/public/apply</code>
      </p>

      {showForm && (
        <form
          onSubmit={createPost}
          className="bg-white rounded-2xl border border-gray-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Job title *" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            placeholder="Department" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="Location" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <select value={form.job_type} onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            {["Full-time", "Part-time", "Contract", "Internship"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input value={form.salary_range} onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}
            placeholder="Salary range e.g. 4-6 LPA" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            placeholder="ATS keywords (comma separated) e.g. react, node, mysql"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3} placeholder="Job description"
            className="md:col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <div className="md:col-span-2">
            <button className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
              Publish job
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        {["posts", "applications"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
              tab === t ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t} {t === "applications" && `(${apps.length})`}
          </button>
        ))}
      </div>

      {tab === "posts" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[p.department, p.location, p.job_type].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === "OPEN"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              {p.salary_range && (
                <p className="text-sm text-gray-600 mt-2">{p.salary_range}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Users size={14} /> {p.applications} applications
                </span>
                <button
                  onClick={() => togglePost(p)}
                  className="text-xs font-semibold text-indigo-600"
                >
                  {p.status === "OPEN" ? "Close job" : "Reopen"}
                </button>
              </div>
            </div>
          ))}
          {!posts.length && (
            <p className="text-gray-400 text-sm col-span-full py-8 text-center">
              No jobs posted yet
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="py-2 pr-4">Applicant</th>
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">ATS Score</th>
                <th className="py-2 pr-4">Skills</th>
                <th className="py-2 pr-4">Experience</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4">
                    <p className="font-medium text-gray-800">{a.applicant_name}</p>
                    <p className="text-xs text-gray-400">{a.email || a.phone || "—"}</p>
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{a.job_title}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreColor(a.ats_score)}`}>
                      {a.ats_score}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500 max-w-[180px] truncate">
                    {a.parsed_skills || "—"}
                  </td>
                  <td className="py-2 pr-4 text-gray-600">{a.parsed_experience || "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${APP_STATUS_STYLE[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    <button onClick={() => setViewing(a)} className="text-xs font-semibold text-indigo-600 mr-3">
                      View
                    </button>
                    <button onClick={() => decide(a.id, "SHORTLISTED")} className="text-xs font-semibold text-emerald-600 mr-3">
                      Shortlist
                    </button>
                    <button onClick={() => decide(a.id, "CONVERTED")} className="text-xs font-semibold text-purple-600 mr-3">
                      To candidate
                    </button>
                    <button onClick={() => decide(a.id, "REJECTED")} className="text-xs font-semibold text-red-500">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
              {!apps.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Resume viewer */}
      {viewing && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">{viewing.applicant_name}</h3>
                <p className="text-sm text-gray-500">
                  {viewing.job_title} · ATS score {viewing.ats_score}/100
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 text-xl leading-none">
                &times;
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-400">Email:</span> {viewing.email || "—"}</p>
              <p><span className="text-gray-400">Phone:</span> {viewing.phone || "—"}</p>
              <p className="col-span-2"><span className="text-gray-400">Skills:</span> {viewing.parsed_skills || "—"}</p>
              <p><span className="text-gray-400">Experience:</span> {viewing.parsed_experience || "—"}</p>
              <p><span className="text-gray-400">Education:</span> {viewing.parsed_education || "—"}</p>
            </div>
            <h4 className="font-semibold text-gray-800 mt-5 mb-2 text-sm">Resume text</h4>
            <pre className="text-xs bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-gray-600 max-h-64 overflow-y-auto">
              {viewing.resume_text || "No resume text submitted"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
