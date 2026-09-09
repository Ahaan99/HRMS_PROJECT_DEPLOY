import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { GitPullRequest, ExternalLink } from "lucide-react";
import API from "../../api/axios";
import ITShell from "./ITShell";

const STATUS_STYLE = {
  Open: "bg-blue-50 text-blue-700 border-blue-100",
  "Changes Requested": "bg-amber-50 text-amber-700 border-amber-100",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Merged: "bg-purple-50 text-purple-700 border-purple-100",
};

export default function CodeReviewStatus() {
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ pr_title: "", pr_link: "", reviewer_id: "" });

  const fetchAll = useCallback(async () => {
    try {
      const [r, e] = await Promise.all([
        API.get("/it/code-reviews"),
        API.get("/it/employees"),
      ]);
      setRows(r.data || []);
      setEmployees(e.data || []);
    } catch {
      toast.error("Failed to load code reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.post("/it/code-reviews", {
        ...form,
        reviewer_id: form.reviewer_id || null,
      });
      toast.success("Review requested");
      setForm({ pr_title: "", pr_link: "", reviewer_id: "" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request review");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (row, status) => {
    try {
      await API.patch(`/it/code-reviews/${row.id}`, {
        status,
        comments: row.comments,
      });
      fetchAll();
    } catch {
      toast.error("Failed to update review");
    }
  };

  return (
    <ITShell
      title="Code Review Status"
      subtitle="Request reviews and track PRs from open to merged"
      icon={GitPullRequest}
    >
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
      >
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-gray-500">PR title *</label>
          <input
            value={form.pr_title}
            onChange={(e) =>
              setForm((f) => ({ ...f, pr_title: e.target.value }))
            }
            placeholder="e.g. feat: add payroll auto-generation"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">PR link</label>
          <input
            type="url"
            value={form.pr_link}
            onChange={(e) =>
              setForm((f) => ({ ...f, pr_link: e.target.value }))
            }
            placeholder="https://github.com/..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={form.reviewer_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, reviewer_id: e.target.value }))
            }
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1"
          >
            <option value="">Any reviewer</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "..." : "Request"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500 text-sm">
          No code reviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}
                  >
                    {r.status}
                  </span>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {r.pr_title}
                  </p>
                  {r.pr_link && (
                    <a
                      href={r.pr_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-500 hover:text-indigo-700"
                      aria-label="Open PR link"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  by {r.author_name || "-"} · reviewer{" "}
                  {r.reviewer_name || "anyone"} ·{" "}
                  {new Date(r.updated_at).toLocaleString()}
                </p>
              </div>
              <select
                value={r.status}
                onChange={(e) => setStatus(r, e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-xs shrink-0"
                aria-label={`Status of ${r.pr_title}`}
              >
                {Object.keys(STATUS_STYLE).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </ITShell>
  );
}
