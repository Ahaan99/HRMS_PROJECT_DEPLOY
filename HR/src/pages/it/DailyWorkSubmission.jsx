import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarCheck } from "lucide-react";
import API from "../../api/axios";
import ITShell from "./ITShell";

const today = () => new Date().toISOString().slice(0, 10);

export default function DailyWorkSubmission() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    work_date: today(),
    summary: "",
    hours_spent: "8",
    blockers: "",
  });

  const fetchAll = useCallback(async () => {
    try {
      const res = await API.get("/it/daily-work");
      setRows(res.data || []);
    } catch {
      toast.error("Failed to load submissions");
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
      await API.post("/it/daily-work", form);
      toast.success("Daily work submitted");
      setForm({ work_date: today(), summary: "", hours_spent: "8", blockers: "" });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITShell
      title="Daily Work Submission"
      subtitle="Submit what you worked on today; one entry per day (resubmitting updates it)"
      icon={CalendarCheck}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={submit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 h-fit"
        >
          <h3 className="font-semibold text-gray-800 text-sm">
            Submit today&apos;s work
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Date</label>
              <input
                type="date"
                value={form.work_date}
                max={today()}
                onChange={(e) =>
                  setForm((f) => ({ ...f, work_date: e.target.value }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Hours spent</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.hours_spent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hours_spent: e.target.value }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <textarea
            value={form.summary}
            onChange={(e) =>
              setForm((f) => ({ ...f, summary: e.target.value }))
            }
            rows={4}
            placeholder="What did you work on? *"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
          <textarea
            value={form.blockers}
            onChange={(e) =>
              setForm((f) => ({ ...f, blockers: e.target.value }))
            }
            rows={2}
            placeholder="Any blockers? (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Daily Work"}
          </button>
        </form>

        <div className="lg:col-span-2">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">
            Recent submissions
          </h3>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500 text-sm">
              No submissions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      {r.employee_name || "Employee #" + r.employee_id}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.work_date).toLocaleDateString()} ·{" "}
                      {Number(r.hours_spent)}h
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{r.summary}</p>
                  {r.blockers && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mt-2">
                      Blocker: {r.blockers}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ITShell>
  );
}
