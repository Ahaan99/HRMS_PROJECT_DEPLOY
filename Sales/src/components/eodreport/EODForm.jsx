import { useState } from "react";
import toast from "react-hot-toast";
import API from "../../api/axios";
import {
  X,
  FileText,
  CheckCircle2,
  Clock,
  Timer,
  Send,
} from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

const labelClass =
  "mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700";

export default function EODForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    tasksCompleted: "",
    tasksInProgress: "",
    hoursWorked: "",
    summary: "",
  });

  const handleChange = (key, value) => {
    // allow only numbers for numeric fields
    if (["tasksCompleted", "tasksInProgress", "hoursWorked"].includes(key)) {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setForm((prev) => ({ ...prev, [key]: value }));
      }
    } else {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!form.tasksCompleted || !form.hoursWorked) {
      return toast.error("Please fill required fields");
    }

    try {
      await API.post("/sales/eod-reports", {
        ...form,
        tasksCompleted: Number(form.tasksCompleted),
        tasksInProgress: Number(form.tasksInProgress || 0),
        hoursWorked: Number(form.hoursWorked),
      });

      toast.success("EOD submitted");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to submit");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200">
              <FileText size={17} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Create EOD Report
              </h2>
              <p className="text-xs text-slate-500">
                Summarize your day&apos;s work
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tasks Completed */}
          <div>
            <label htmlFor="eod-completed" className={labelClass}>
              <CheckCircle2
                size={14}
                aria-hidden="true"
                className="text-emerald-500"
              />
              Tasks Completed *
            </label>
            <input
              id="eod-completed"
              type="number"
              min="0"
              placeholder="Enter number of completed tasks"
              value={form.tasksCompleted}
              onChange={(e) => handleChange("tasksCompleted", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Tasks In Progress */}
          <div>
            <label htmlFor="eod-progress" className={labelClass}>
              <Clock size={14} aria-hidden="true" className="text-amber-500" />
              Tasks In Progress
            </label>
            <input
              id="eod-progress"
              type="number"
              min="0"
              placeholder="Enter ongoing tasks"
              value={form.tasksInProgress}
              onChange={(e) => handleChange("tasksInProgress", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Hours Worked */}
          <div>
            <label htmlFor="eod-hours" className={labelClass}>
              <Timer size={14} aria-hidden="true" className="text-blue-500" />
              Hours Worked *
            </label>
            <input
              id="eod-hours"
              type="number"
              min="0"
              step="0.5"
              placeholder="Enter total hours (e.g. 8.5)"
              value={form.hoursWorked}
              onChange={(e) => handleChange("hoursWorked", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="eod-summary" className={labelClass}>
              <FileText
                size={14}
                aria-hidden="true"
                className="text-indigo-500"
              />
              Work Summary
            </label>
            <textarea
              id="eod-summary"
              rows="3"
              placeholder="Describe what you worked on today..."
              value={form.summary}
              onChange={(e) => handleChange("summary", e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300"
            >
              <Send size={14} aria-hidden="true" />
              Submit EOD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
