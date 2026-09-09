import PageHero from "../../components/common/PageHero";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";

import ExportButton from "../../components/common/ExportButton";
import ConfirmModal from "../../components/ui/ConfirmModal";

import AddAttendanceModal from "../../components/attendance/AddAttendanceModal";
import EditAttendanceModal from "../../components/attendance/EditAttendanceModal";

import {
  ClipboardCheck,
  Search,
  Plus,
  Pencil,
  Trash2,
  Inbox,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* soft chips on the ink/indigo premium palette */
const STATUS_CHIP = {
  PRESENT: "bg-[#e7f5f0] text-[#148662]",
  ABSENT: "bg-[#fdeef0] text-[#c73e4c]",
  LATE: "bg-[#fdf3e3] text-[#b45309]",
  "HALF DAY": "bg-[#fff8e1] text-[#8a6d1a]",
  WFH: "bg-[#eef0fe] text-[#4f63f0]",
  LEAVE: "bg-[#f3eefe] text-[#7c5cd6]",
};

export default function AttendanceTracker() {
  const token = localStorage.getItem("hrms_admin_token");

  // =========================
  // STATUS
  // =========================
  const statusList = useMemo(
    () => [
      { id: 1, name: "PRESENT", value: "PRESENT" },
      { id: 2, name: "ABSENT", value: "ABSENT" },
      { id: 3, name: "LATE", value: "LATE" },
      { id: 4, name: "HALF DAY", value: "HALF_DAY" },
      { id: 5, name: "WFH", value: "WFH" },
      { id: 6, name: "LEAVE", value: "LEAVE" },
    ],
    [],
  );

  const statusById = useMemo(() => {
    const obj = {};
    statusList.forEach((s) => (obj[s.id] = s));
    return obj;
  }, [statusList]);

  // =========================
  // STATE
  // =========================
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(0);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // =========================
  // FETCH DATA
  // =========================
  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/super-admin/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          status: statusFilter === 0 ? "" : statusById[statusFilter]?.value,
        },
      });

      const mapped = res.data.data.map((r) => ({
        id: r.id,
        attendanceId: `ATT${r.id}`,
        employeeId: r.employee_id,
        employeeName: r.employee_name,
        date: r.date,
        checkInTime: r.check_in,
        checkOutTime: r.check_out,
        statusId: statusList.find((s) => s.value === r.status)?.id || 1,
        isActive: r.is_active ? 1 : 0,
        createdAt: r.created_at,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to fetch attendance: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [search, statusFilter]);

  // =========================
  // CREATE
  // =========================
  const handleCreate = async (payload) => {
    try {
      await axios.post(
        `${BASE_URL}/super-admin/attendance`,
        {
          employee_id: payload.employeeId,
          employee_name: payload.employeeName,
          date: payload.date,
          check_in: payload.checkInTime,
          check_out: payload.checkOutTime,
          status: statusById[payload.statusId]?.value,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Attendance added");
      setOpenAdd(false);
      fetchAttendance();
    } catch (err) {
      toast.error("Create failed");
    }
  };

  // =========================
  // EDIT
  // =========================
  const openEditModal = (record) => {
    setSelectedRecord(record);
    setOpenEdit(true);
  };

  const handleUpdate = async (updated) => {
    try {
      await axios.put(
        `${BASE_URL}/super-admin/attendance/${updated.id}`,
        {
          employee_name: updated.employeeName,
          date: updated.date,
          check_in: updated.checkInTime,
          check_out: updated.checkOutTime,
          status: statusById[updated.statusId]?.value,
          is_active: updated.isActive === 1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Updated");
      setOpenEdit(false);
      fetchAttendance();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // =========================
  // DELETE
  // =========================
  const openDeleteModal = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/super-admin/attendance/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Deleted");
      setOpenDelete(false);
      fetchAttendance();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const filteredRecords = records;

  /* per-status counts for the summary strip */
  const statusCounts = useMemo(() => {
    const counts = {};
    records.forEach((r) => {
      const name = statusById[r.statusId]?.name;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [records, statusById]);

  return (
    <div className="space-y-5">
      {/* ── header ── */}
      <PageHero
        title="Attendance Tracker"
        subtitle="Manage and monitor employee attendance"
        chips={[
          {
            icon: <ClipboardCheck size={12} />,
            label: `${records.length} ${records.length === 1 ? "Record" : "Records"}`,
          },
        ]}
        actions={
          <>
            <ExportButton data={filteredRecords} filename="attendance" />
            <button
              onClick={() => setOpenAdd(true)}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              <Plus size={15} />
              Add Attendance
            </button>
          </>
        }
      />

      {/* ── status summary strip ── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter(0)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
            statusFilter === 0
              ? "bg-[#0b1220] text-white"
              : "bg-white text-[#33405c] shadow-[inset_0_0_0_1px_#e6e9f0] hover:bg-[#f7f8fb]"
          }`}
        >
          All <span className="num ml-1">{records.length}</span>
        </button>
        {statusList.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(statusFilter === s.id ? 0 : s.id)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              statusFilter === s.id
                ? "bg-[#0b1220] text-white"
                : `${STATUS_CHIP[s.name]} hover:opacity-80`
            }`}
          >
            {s.name}
            <span className="num ml-1 opacity-70">{statusCounts[s.name] || 0}</span>
          </button>
        ))}
      </div>

      {/* ── table card ── */}
      <div className="card-premium overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e6e9f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8698]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee / ID…"
              className="input-premium !py-2 !pl-9 text-[13px]"
            />
          </div>
          <span className="num shrink-0 text-xs font-semibold text-[#7b8698]">
            {filteredRecords.length} record{filteredRecords.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="sticky top-0 z-10 bg-[#f7f8fb]">
              <tr className="border-b border-[#e6e9f0]">
                {["ID", "Employee", "Date", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7b8698]"
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7b8698]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((r) => {
                const statusName = statusById[r.statusId]?.name;

                return (
                  <tr
                    key={r.id}
                    className="border-b border-[#eceff4] last:border-0 hover:bg-[#f9faff]"
                  >
                    <td className="num px-4 py-3 text-xs font-bold text-[#7b8698]">
                      {r.attendanceId}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-[13px] font-bold text-[#0b1220]">
                        {r.employeeName}
                      </div>
                      <div className="num mt-0.5 text-[11px] text-[#7b8698]">
                        #{r.employeeId}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="num text-[13px] font-semibold text-[#33405c]">
                        {new Date(r.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#7b8698]">
                        {new Date(r.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          STATUS_CHIP[statusName] || "bg-[#eceff4] text-[#7b8698]"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusName}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(r)}
                          className="flex items-center gap-1 rounded-lg bg-[#eef0fe] px-2.5 py-1.5 text-[11px] font-bold text-[#4f63f0] transition hover:bg-[#4f63f0] hover:text-white"
                          title="Edit record"
                        >
                          <Pencil size={12} /> Edit
                        </button>

                        <button
                          onClick={() => openDeleteModal(r.id)}
                          className="flex items-center gap-1 rounded-lg bg-[#fdeef0] px-2.5 py-1.5 text-[11px] font-bold text-[#c73e4c] transition hover:bg-[#c73e4c] hover:text-white"
                          title="Delete record"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <Inbox size={22} className="mx-auto text-[#7b8698]" />
                    <p className="mt-2 text-sm font-medium text-[#33405c]">
                      No attendance records found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      <AddAttendanceModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        statusList={statusList}
        onCreate={handleCreate}
      />

      <EditAttendanceModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        record={selectedRecord}
        statusList={statusList}
        onUpdate={handleUpdate}
      />

      <ConfirmModal
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
