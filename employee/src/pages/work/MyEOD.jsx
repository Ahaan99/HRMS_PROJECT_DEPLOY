import { useEffect, useState } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Calendar,
} from "lucide-react";

import EmployeeNavbar from "../../components/layout/EmployeeNavbar";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertCircle,
  },

  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },

  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },

  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export default function MyEOD() {
  const [reports, setReports] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [openModal, setOpenModal] =
    useState(false);

  const [viewModal, setViewModal] =
    useState(false);

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [editId, setEditId] =
    useState(null);

  const [form, setForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),

    tasksCompleted: "",

    tasksInProgress: "",

    blockers: "",

    tomorrowPlan: "",

    notes: "",
  });

  const fetchReports = async () => {
    try {
      setLoading(true);

      const res = await API.get(
        "/employee/eod"
      );

      setReports(res.data.data || []);
    } catch (err) {
      console.error(err);

      toast.error(
        "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const resetForm = () => {
    setForm({
      date: dayjs().format(
        "YYYY-MM-DD"
      ),

      tasksCompleted: "",

      tasksInProgress: "",

      blockers: "",

      tomorrowPlan: "",

      notes: "",
    });

    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!form.tasksCompleted) {
        toast.error(
          "Tasks completed required"
        );

        return;
      }

      if (editId) {
        await API.patch(
          `/employee/eod/${editId}`,
          form
        );

        toast.success(
          "EOD updated"
        );
      } else {
        await API.post(
          "/employee/eod",
          form
        );

        toast.success(
          "EOD submitted"
        );
      }

      setOpenModal(false);

      resetForm();

      fetchReports();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          "Action failed"
      );
    }
  };

  const handleEdit = (report) => {
    setEditId(report.id);

    setForm({
      date: dayjs(report.date).format(
        "YYYY-MM-DD"
      ),

      tasksCompleted:
        report.tasksCompleted || "",

      tasksInProgress:
        report.tasksInProgress || "",

      blockers:
        report.blockers || "",

      tomorrowPlan:
        report.tomorrowPlan || "",

      notes: report.notes || "",
    });

    setOpenModal(true);
  };

  return (
    <div className="p-4">
      <EmployeeNavbar />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-black text-white">
            <FileText size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              My EOD Reports
            </h1>

            <p className="text-sm text-gray-500">
              Submit and manage your
              daily reports
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();

            setOpenModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-black hover:bg-gray-900 text-white font-semibold"
        >
          <Plus size={18} />
          Submit EOD
        </button>
      </div>

      {/* CARDS */}
      {loading ? (
        <div className="text-center py-10">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reports.map((report) => {
            const status =
              STATUS_CONFIG[
                report.status
              ];

            const StatusIcon =
              status.icon;

            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl shadow border overflow-hidden"
              >
                <div className="p-5">
                  {/* TOP */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-bold text-lg">
                        EOD Report
                      </h2>

                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Calendar size={14} />

                        {dayjs(
                          report.date
                        ).format(
                          "MMM D, YYYY"
                        )}
                      </div>
                    </div>

                    <span
                      className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold ${status.color}`}
                    >
                      <StatusIcon size={12} />

                      {status.label}
                    </span>
                  </div>

                  {/* TASKS */}
                  <div className="space-y-3 mb-5">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Tasks Completed
                      </p>

                      <p className="text-sm text-gray-700 line-clamp-2">
                        {
                          report.tasksCompleted
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Tomorrow Plan
                      </p>

                      <p className="text-sm text-gray-700 line-clamp-2">
                        {
                          report.tomorrowPlan
                        }
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedReport(
                          report
                        );

                        setViewModal(
                          true
                        );
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-medium"
                    >
                      <Eye size={15} />
                      View
                    </button>

                    {report.status !==
                      "approved" && report.status !== "rejected" && (
                      <button
                        onClick={() =>
                          handleEdit(
                            report
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium"
                      >
                        <Edit size={15} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!reports.length &&
        !loading && (
          <div className="bg-white rounded-3xl shadow border p-10 text-center text-gray-500">
            No EOD reports found
          </div>
        )}

      {/* CREATE / EDIT MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editId
                  ? "Edit EOD"
                  : "Submit EOD"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setOpenModal(false);
                  resetForm();
                }}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                aria-label="Close"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date
                </label>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date:
                        e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                />
              </div>

              {[
                [
                  "tasksCompleted",
                  "Tasks Completed",
                ],

                [
                  "tasksInProgress",
                  "Tasks In Progress",
                ],

                [
                  "blockers",
                  "Blockers",
                ],

                [
                  "tomorrowPlan",
                  "Tomorrow Plan",
                ],

                ["notes", "Notes"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">
                    {label}
                  </label>

                  <textarea
                    rows={2}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]:
                          e.target.value,
                      })
                    }
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal(
                      false
                    );

                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-black text-white"
                >
                  {editId
                    ? "Update"
                    : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{/* VIEW MODAL */}
{viewModal &&
  selectedReport && (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-gray-800 px-8 py-7 text-white">
          
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white" />
          </div>

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <FileText size={26} />
                </div>

                <div>
                  <h2 className="text-3xl font-bold">
                    EOD Report
                  </h2>

                  <p className="text-gray-300 text-sm mt-1">
                    Daily work summary and progress report
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur text-sm">
                  📅{" "}
                  {dayjs(
                    selectedReport.date
                  ).format(
                    "MMMM D, YYYY"
                  )}
                </div>

                <div
                  className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                    STATUS_CONFIG[
                      selectedReport.status
                    ]?.color
                  }`}
                >
                  {
                    STATUS_CONFIG[
                      selectedReport.status
                    ]?.label
                  }
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setViewModal(false)
              }
              className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-8 overflow-y-auto max-h-[70vh]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* TASK COMPLETED */}
            <div className="group bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-3xl p-6 hover:shadow-lg transition">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
                  <CheckCircle size={22} />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Tasks Completed
                  </h3>

                  <p className="text-sm text-gray-500">
                    Successfully finished work
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedReport.tasksCompleted ||
                  "No completed tasks"}
              </p>
            </div>

            {/* IN PROGRESS */}
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-3xl p-6 hover:shadow-lg transition">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Clock size={22} />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    In Progress
                  </h3>

                  <p className="text-sm text-gray-500">
                    Ongoing tasks and activities
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedReport.tasksInProgress ||
                  "No active tasks"}
              </p>
            </div>

            {/* BLOCKERS */}
            <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-3xl p-6 hover:shadow-lg transition">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Blockers
                  </h3>

                  <p className="text-sm text-gray-500">
                    Issues or roadblocks faced
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedReport.blockers ||
                  "No blockers reported"}
              </p>
            </div>

            {/* TOMORROW PLAN */}
            <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-3xl p-6 hover:shadow-lg transition">
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Calendar size={22} />
                </div>

                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    Tomorrow Plan
                  </h3>

                  <p className="text-sm text-gray-500">
                    Planned work for next day
                  </p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedReport.tomorrowPlan ||
                  "No plans added"}
              </p>
            </div>
          </div>

          {/* NOTES */}
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-3xl p-6">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-200 text-gray-700 flex items-center justify-center">
                <Edit size={22} />
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900">
                  Additional Notes
                </h3>

                <p className="text-sm text-gray-500">
                  Extra comments and observations
                </p>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedReport.notes ||
                "No additional notes"}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t bg-gray-50 flex justify-end">
          <button
            onClick={() =>
              setViewModal(false)
            }
            className="px-6 py-3 rounded-2xl bg-black hover:bg-gray-900 text-white font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
)}
    </div>
  );
}