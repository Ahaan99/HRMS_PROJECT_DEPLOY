import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarCheck, Search, Plus, Pencil, Trash2 } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import ConfirmModal from "../../components/ui/ConfirmModal";

import AddAttendanceModal from "../../components/attendance/AddAttendanceModal";
import EditAttendanceModal from "../../components/attendance/EditAttendanceModal";

import {
  getAttendanceList,
  deleteAttendance,
} from "../../services/clientAttendanceService";

// =========================
// STATUS OPTIONS
// =========================
const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "LEAVE", label: "Leave" },
];

const inputClass =
  "px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors placeholder:text-slate-400 text-slate-700";

export default function AttendanceTracker() {
  // =========================
  // STATE
  // =========================
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // =========================
  // FETCH
  // =========================
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await getAttendanceList();
      setRows(res.data?.data || []);
    } catch (err) {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // =========================
  // FILTER
  // =========================
  const filteredRows = useMemo(() => {
    const q = (search || "").toLowerCase();

    return (rows || []).filter((r) => {
      if (!r) return false;

      const matchSearch =
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeCode || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ? true : r.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  // =========================
  // ACTIONS
  // =========================
  const handleEdit = (row) => {
    setSelectedRow(row);
    setOpenEdit(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAttendance(deleteId);
      toast.success("Deleted successfully");
      setOpenDelete(false);
      fetchAttendance();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ===== helpers =====
  // The API returns literal MySQL strings ("2026-09-07", "2026-09-07 09:00:00").
  // Parse them by hand: new Date("YYYY-MM-DD HH:MM:SS") is Chrome-only.
  const formatDate = (date) => {
    const m = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return "-";
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dt) => {
    const m = String(dt || "").match(/(\d{2}):(\d{2})(?::\d{2})?$/);
    if (!m) return null;
    const h = Number(m[1]);
    return `${String(h % 12 || 12).padStart(2, "0")}:${m[2]} ${h >= 12 ? "pm" : "am"}`;
  };

  const TimePill = ({ value, tone }) => {
    const label = formatTime(value);
    if (!label) return <span className="text-slate-400">-</span>;
    return (
      <span className={`px-2.5 py-1 rounded-full ring-1 text-xs font-semibold ${tone}`}>
        {label}
      </span>
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "PRESENT":
        return "bg-emerald-50 text-emerald-700 ring-emerald-100";
      case "ABSENT":
        return "bg-rose-50 text-rose-700 ring-rose-100";
      case "HALF_DAY":
        return "bg-amber-50 text-amber-700 ring-amber-100";
      case "LEAVE":
        return "bg-sky-50 text-sky-700 ring-sky-100";
      default:
        return "bg-slate-100 text-slate-600 ring-slate-200";
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="space-y-6 animate-fadeUp">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          icon={CalendarCheck}
          title="Attendance Tracker"
          desc="Track daily attendance and employee presence"
        />

        <button
          onClick={() => setOpenAdd(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-violet-500 transition-colors"
        >
          <Plus size={15} /> Add Attendance
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="card-premium p-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-full pl-10`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputClass}
          aria-label="Filter by status"
        >
          <option value="ALL">All Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="ml-auto text-sm font-medium text-slate-500">
          Total: <span className="font-bold text-slate-700">{filteredRows.length}</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="card-premium overflow-hidden">
        <div className="max-h-[60vh] overflow-auto scrollbar-thin-premium">
          <table className="w-full min-w-[720px] text-sm">
            {/* HEADER */}
            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
              <tr className="border-b border-slate-200 text-left">
                {["Employee", "Date", "Check In", "Check Out", "Status"].map((h) => (
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
                  <td colSpan="6" className="px-5 py-14 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="p-4 rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                        <CalendarCheck size={28} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">No attendance found</p>
                        <p className="text-sm text-slate-400 mt-0.5">
                          Records will appear here once attendance is marked
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors"
                  >
                    {/* EMPLOYEE */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 whitespace-nowrap">
                        {row.employeeName}
                      </div>
                      {row.employeeCode && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-bold font-mono">
                          {row.employeeCode}
                        </span>
                      )}
                    </td>

                    {/* DATE */}
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {formatDate(row.attendance_date)}
                    </td>

                    {/* CHECK IN */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <TimePill value={row.check_in} tone="bg-emerald-50 text-emerald-700 ring-emerald-100" />
                    </td>

                    {/* CHECK OUT */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <TimePill value={row.check_out} tone="bg-sky-50 text-sky-700 ring-sky-100" />
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${getStatusStyle(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => handleEdit(row)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 transition-colors"
                        >
                          <Pencil size={12} /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteClick(row.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS (unchanged) */}
      <AddAttendanceModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={fetchAttendance}
      />

      <EditAttendanceModal
        open={openEdit}
        attendance={selectedRow}
        onClose={() => setOpenEdit(false)}
        onSuccess={fetchAttendance}
      />

      <ConfirmModal
        open={openDelete}
        title="Delete Attendance"
        message="Are you sure you want to delete this record?"
        onConfirm={handleDeleteConfirm}
        onClose={() => setOpenDelete(false)}
      />
    </div>
  );
}
