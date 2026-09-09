import { useEffect, useState } from "react";
import axios from "axios";
import { ClipboardList, Phone, Check, X } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import toast from "react-hot-toast";

const inputClass =
  "px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors placeholder:text-slate-400 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400";

export default function InterviewTracker() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [decision, setDecision] = useState({});

  const token = localStorage.getItem("hrms_client_Token");

  // row lock check
  const isLocked = (item) => item.client_status !== "pending";

  // ================= FETCH
  const fetchInterviews = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/client/interviews`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const rows = res.data.data || [];
      setData(rows);

      // preload remarks & decision from DB
      const remarksMap = {};
      const decisionMap = {};

      rows.forEach((row) => {
        if (row.client_remarks) {
          remarksMap[row.id] = row.client_remarks;
        }
        if (row.client_status && row.client_status !== "pending") {
          decisionMap[row.id] = row.client_status;
        }
      });

      setRemarks(remarksMap);
      setDecision(decisionMap);
    } catch (err) {
      console.error("fetchInterviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // ================= SUBMIT
  const handleSubmit = async (id) => {
    try {
      if (!decision[id]) {
        return toast.error("Select Accept or Reject");
      }

      if (!remarks[id]?.trim()) {
        return toast.error("Remarks required");
      }

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/client/interviews/${id}/decision`,
        {
          client_status: decision[id],
          client_remarks: remarks[id],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      fetchInterviews();
    } catch (err) {
      console.error("decision error:", err);
    }
  };

  // ===== helpers =====
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";
    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ===== UI =====
  return (
    <div className="space-y-6 animate-fadeUp">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={ClipboardList}
          title="Interview Tracker"
          desc="Review scheduled candidates and record your decision"
        />

        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 px-3 py-1.5 rounded-full self-start">
          {data.length} Candidate{data.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* TABLE */}
      <div className="card-premium overflow-hidden">
        <div className="max-h-[65vh] overflow-auto scrollbar-thin-premium">
          <table className="w-full min-w-[820px] text-sm">
            {/* HEADER */}
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-200 text-left">
                {["Candidate", "Schedule", "Remarks", "Decision"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap text-right">
                  Action
                </th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                        <ClipboardList size={28} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">No interviews found</p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          Scheduled interviews will appear here
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    className="group border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors"
                  >
                    {/* CANDIDATE */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 whitespace-nowrap group-hover:text-indigo-700 transition-colors">
                        {item.candidate_name}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Phone size={11} />
                        {item.candidate_phone}
                      </div>
                    </td>

                    {/* DATE + TIME */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {formatDate(item.interview_date)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatTime(item.interview_time)}
                      </div>
                    </td>

                    {/* REMARKS */}
                    <td className="px-5 py-3.5">
                      <input
                        type="text"
                        disabled={isLocked(item)}
                        className={`${inputClass} w-52`}
                        placeholder="Add remarks..."
                        value={remarks[item.id] || ""}
                        onChange={(e) =>
                          setRemarks({
                            ...remarks,
                            [item.id]: e.target.value,
                          })
                        }
                      />
                    </td>

                    {/* DECISION */}
                    <td className="px-5 py-3.5">
                      {isLocked(item) ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                            item.client_status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              : "bg-rose-50 text-rose-700 ring-rose-100"
                          }`}
                        >
                          {item.client_status === "accepted" ? (
                            <Check size={12} />
                          ) : (
                            <X size={12} />
                          )}
                          <span className="capitalize">{item.client_status}</span>
                        </span>
                      ) : (
                        <select
                          className={inputClass}
                          value={decision[item.id] || ""}
                          onChange={(e) =>
                            setDecision({
                              ...decision,
                              [item.id]: e.target.value,
                            })
                          }
                          aria-label="Decision"
                        >
                          <option value="">Select</option>
                          <option value="accepted">Accept</option>
                          <option value="rejected">Reject</option>
                        </select>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        disabled={isLocked(item)}
                        onClick={() => handleSubmit(item.id)}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                          isLocked(item)
                            ? "bg-slate-100 text-slate-400 ring-1 ring-slate-200 cursor-not-allowed"
                            : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500"
                        }`}
                      >
                        {isLocked(item) ? "Submitted" : "Submit"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
