// Work Assignment & EOD System

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Eye,
  X,
  Users,
  Calendar,
  Send,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronDown,
  Loader2,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";
import * as workService from "../../services/workReportService.js";

const PRIORITY_CONFIG = {
  high: {
    label: "High",
    color: "bg-red-100 text-red-700",
    border: "border-red-500",
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-700",
    border: "border-yellow-500",
  },
  low: {
    label: "Low",
    color: "bg-green-100 text-green-700",
    border: "border-green-500",
  },
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  overdue: {
    label: "Overdue",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
};

const EOD_STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", color: "bg-green-100 text-green-700" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
};

export default function WorkReportSystem() {
  const [activeTab, setActiveTab] = useState("assignments");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openEODModal, setOpenEODModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [eodReports, setEODReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assignForm, setAssignForm] = useState({
    title: "",
    description: "",
    employeeId: "",
    assignedTo: "",
    assignedToName: "",
    department: "",
    departmentId: "",
    dueDate: "",
    priority: "medium",
  });

  const [eodForm, setEODForm] = useState({
    employeeId: "",
    employeeName: "",
    date: dayjs().format("YYYY-MM-DD"),
    tasksCompleted: "",
    tasksInProgress: "",
    blockers: "",
    tomorrowPlan: "",
    notes: "",
  });

  useEffect(() => {
    fetchAssignments();
    fetchEODReports();
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [departmentFilter, statusFilter, search]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await workService.getWorkAssignments({
        departmentId: departmentFilter,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search,
      });
      setAssignments(res.data.data);
    } catch {
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchEODReports = async () => {
    try {
      const res = await workService.getEODReports();
      setEODReports(res.data.data);
    } catch {
      toast.error("Failed to load EOD reports");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await workService.getEmployees();

      setEmployees(res.data.employees);
    } catch (err) {
      toast.error(`Failed to load employee ${err}`);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        String(a.title || "").toLowerCase().includes(q) ||
        String(a.assignedToName || "").toLowerCase().includes(q) ||
        String(a.assignedTo || "").toLowerCase().includes(q) ||
        String(a.description || "").toLowerCase().includes(q);

      const matchDept =
        departmentFilter === 0 || a.departmentId === departmentFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [assignments, search, departmentFilter, statusFilter]);

  const filteredEODReports = useMemo(() => {
    return eodReports.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        String(r.employeeName || "").toLowerCase().includes(q) ||
        String(r.employeeId || "").toLowerCase().includes(q) ||
        String(r.title || "").toLowerCase().includes(q);

      const matchDept =
        departmentFilter === 0 || r.departmentId === departmentFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [eodReports, search, departmentFilter, statusFilter]);

  const assignmentStats = useMemo(() => {
    return {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === "pending").length,
      inProgress: assignments.filter((a) => a.status === "in_progress").length,
      completed: assignments.filter((a) => a.status === "completed").length,
      overdue: assignments.filter((a) => a.status === "overdue").length,
    };
  }, [assignments]);

  const eodStats = useMemo(() => {
    return {
      total: eodReports.length,
      pending: eodReports.filter((r) => r.status === "pending").length,
      submitted: eodReports.filter((r) => r.status === "submitted").length,
      approved: eodReports.filter((r) => r.status === "approved").length,
      rejected: eodReports.filter((r) => r.status === "rejected").length,
    };
  }, [eodReports]);

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();

    try {
      const employee = employees.find(
        (emp) => emp.employeeCode === assignForm.assignedTo,
      );

      if (!employee) {
        toast.error("Please select employee");
        return;
      }

      if (!assignForm.dueDate) {
        toast.error("Please select due date");
        return;
      }

      if (!assignForm.title || !assignForm.description) {
        toast.error("Title and Description required");
        return;
      }

      const payload = {
        title: assignForm.title,
        description: assignForm.description,

        assignedTo: employee.employeeCode,
        assignedToName: employee.name,
        department: employee.departmentName,
        departmentId: employee.departmentId,

        priority: assignForm.priority,
        status: "pending",

        dueDate: assignForm.dueDate,
        progress: 0,
      };

      await workService.createWorkAssignment(payload);
      await fetchAssignments();

      toast.success("Work assignment created successfully!");
      setOpenAssignModal(false);
      resetAssignForm();
    } catch (err) {
      toast.error("Failed to create assignment");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await workService.getDepartments();
      setDepartments(res.data.departments);
    } catch (err) {
      toast.error("Failed to load departments");
    }
  };

  const handleSubmitEOD = async (e) => {
    e.preventDefault();

    try {
      const employee = employees.find(
        (emp) => emp.id === Number(eodForm.employeeId),
      );

      if (!employee) {
        toast.error("Employee not found");
        return;
      }

      const payload = {
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.departmentName || "",
        departmentId: employee.departmentId,

        date: eodForm.date,
        tasksCompleted: eodForm.tasksCompleted,
        tasksInProgress: eodForm.tasksInProgress,
        blockers: eodForm.blockers,
        tomorrowPlan: eodForm.tomorrowPlan,
        notes: eodForm.notes,

        status: "submitted",
      };

      const res = await workService.submitEODReport(payload);

      if (!res?.data?.success) {
        throw new Error("API failed");
      }

      await fetchEODReports(); // refresh table

      toast.success("EOD Report submitted successfully!");

      // ✅ FORCE CLOSE
      setOpenEODModal(false);
      resetEODForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit EOD");
    }
  };

  const handleUpdateAssignmentStatus = async (id, newStatus) => {
    try {
      await workService.updateWorkAssignment(id, {
        status: newStatus,
      });

      await fetchAssignments();

      toast.success(`Status updated`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleApproveEOD = async (id) => {
    try {
      await workService.approveEODReport(id);

      await fetchEODReports();

      toast.success("EOD approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleRejectEOD = async (id) => {
    try {
      await workService.rejectEODReport(id);
      await fetchEODReports();
      toast.success("EOD rejected");
    } catch (e) {
      toast.error("Reject failed");
    }
  };

  const handleDelete = async () => {
    try {
      if (activeTab === "assignments") {
        await workService.deleteWorkAssignment(deleteId);
        await fetchAssignments();
      } else {
        await workService.deleteEODReport(deleteId);
        await fetchEODReports();
      }

      toast.success("Deleted successfully!");
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setOpenDeleteModal(false);
      setDeleteId(null);
    }
  };

  const resetAssignForm = () => {
    setAssignForm({
      title: "",
      description: "",
      employeeId: "",
      assignedTo: "",
      assignedToName: "",
      department: "",
      departmentId: "",
      dueDate: "",
      priority: "medium",
    });
  };
  const resetEODForm = () => {
    setEODForm({
      employeeId: "",
      employeeName: "",
      date: dayjs().format("YYYY-MM-DD"),
      tasksCompleted: "",
      tasksInProgress: "",
      blockers: "",
      tomorrowPlan: "",
      notes: "",
    });
  };

  const tabs = [
    { id: "assignments", label: "Work Assignments", icon: Briefcase },
    { id: "eod", label: "EOD Reports", icon: FileText },
  ];

  return (
    <div>
      <PageHeader
        title="Work Assignment & EOD System"
        desc="Manage automated work assignments and track employee daily reports."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Assignments"
          value={assignmentStats.total}
          icon={<Briefcase size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Pending"
          value={assignmentStats.pending}
          icon={<Circle size={20} />}
          color="bg-gray-50 text-gray-600"
        />
        <StatCard
          title="In Progress"
          value={assignmentStats.inProgress}
          icon={<Clock size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Completed"
          value={assignmentStats.completed}
          icon={<CheckCircle size={20} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Overdue"
          value={assignmentStats.overdue}
          icon={<AlertTriangle size={20} />}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Work Assignments Tab */}
      {activeTab === "assignments" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or employee..."
                className="w-full md:w-80 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(Number(e.target.value))}
                className="w-full md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <div className="flex gap-2 ml-auto">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
                  <Download size={18} />
                  Export
                </button>
                <button
                  onClick={() => setOpenAssignModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
                >
                  <Plus size={18} />
                  Assign Work
                </button>
              </div>
            </div>
          </div>

          {/* Assignments Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((assignment) => {
              const priorityConfig = PRIORITY_CONFIG[assignment.priority];
              const statusConfig = STATUS_CONFIG[assignment.status];
              const StatusIcon = statusConfig.icon;
              const isOverdue =
                dayjs(assignment.due_date).isBefore(dayjs(), "day") &&
                assignment.status !== "completed";

              return (
                <div
                  key={assignment.id}
                  className={`bg-white rounded-2xl shadow border-l-4 ${priorityConfig.border} overflow-hidden`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${priorityConfig.color}`}
                        >
                          {priorityConfig.label}
                        </span>
                        <h3 className="font-bold text-gray-900 mt-2">
                          {assignment.title}
                        </h3>
                      </div>
                      <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}
                      >
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {assignment.description}
                    </p>

                    <div className="flex items-center gap-2 mb-4">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {assignment.assigned_to_name} ({assignment.assigned_to})
                      </span>
                      <span className="text-xs text-gray-400">
                        ({assignment.department})
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-semibold text-gray-700">
                          {assignment.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            assignment.status === "completed"
                              ? "bg-green-500"
                              : assignment.status === "overdue"
                                ? "bg-red-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${assignment.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Due: {dayjs(assignment.due_date).format("MMM D, YYYY")}
                      </span>
                      {isOverdue && (
                        <span className="text-red-500 font-semibold flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedItem(assignment);
                          setOpenViewModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <select
                        value={assignment.status}
                        onChange={(e) =>
                          handleUpdateAssignmentStatus(
                            assignment.id,
                            e.target.value,
                          )
                        }
                        className="flex-1 px-2 py-2 bg-gray-100 border-none rounded-lg text-sm font-medium cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => {
                          setDeleteId(assignment.id);
                          setOpenDeleteModal(true);
                        }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-10 text-center text-gray-500">
              No assignments found.
            </div>
          )}
        </>
      )}

      {/* EOD Reports Tab */}
      {activeTab === "eod" && (
        <>
          {/* EOD Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Pending"
              value={eodStats.pending}
              icon={<Clock size={20} />}
              color="bg-yellow-50 text-yellow-600"
            />
            <StatCard
              title="Submitted"
              value={eodStats.submitted}
              icon={<Send size={20} />}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Approved"
              value={eodStats.approved}
              icon={<CheckCircle size={20} />}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              title="Rejected"
              value={eodStats.rejected}
              icon={<X size={20} />}
              color="bg-red-50 text-red-600"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee..."
                className="w-full md:w-80 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(Number(e.target.value))}
                className="w-full md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="flex gap-2 ml-auto">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
                  <Download size={18} />
                  Export
                </button>
                <button
                  onClick={() => setOpenEODModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
                >
                  <Plus size={18} />
                  Submit EOD
                </button>
              </div>
            </div>
          </div>

          {/* EOD Reports Table */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-5 py-4 font-semibold">
                      Employee
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Department
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">Date</th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Tasks Completed
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Blockers
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Status
                    </th>
                    <th className="text-right px-5 py-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEODReports.map((report) => {
                    const statusConfig = EOD_STATUS_CONFIG[report.status];
                    return (
                      <tr
                        key={report.id}
                        className="border-t border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {report.employeeName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {report.employeeId}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {report.department}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {dayjs(report.date).format("MMM D, YYYY")}
                        </td>
                        <td className="px-5 py-4 text-gray-700 max-w-xs truncate">
                          {report.tasksCompleted}
                        </td>
                        <td className="px-5 py-4">
                          {report.blockers ? (
                            <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-lg">
                              {report.blockers.slice(0, 30)}...
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setSelectedItem(report);
                                setOpenViewModal(true);
                              }}
                              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            >
                              <Eye size={16} />
                            </button>
                            {report.status === "submitted" && (
                              <>
                                <button
                                  onClick={() => handleApproveEOD(report.id)}
                                  className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => handleRejectEOD(report.id)}
                                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setDeleteId(report.id);
                                setOpenDeleteModal(true);
                              }}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEODReports.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-5 py-10 text-center text-gray-500"
                      >
                        No EOD reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Assign Work Modal */}
      <Modal
        open={openAssignModal}
        title="Create Work Assignment"
        onClose={() => {
          setOpenAssignModal(false);
          resetAssignForm();
        }}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          <Input
            label="Task Title"
            value={assignForm.title}
            onChange={(e) =>
              setAssignForm({ ...assignForm, title: e.target.value })
            }
            placeholder="Enter task title"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={assignForm.description}
              onChange={(e) =>
                setAssignForm({ ...assignForm, description: e.target.value })
              }
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Describe the task in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To
              </label>
              <select
                value={assignForm.employeeId}
                onChange={(e) => {
                  const value = e.target.value;

                  if (!value) return;

                  const emp = employees.find((em) => em.id === Number(value));

                  if (!emp) {
                    console.error("Employee not found:", value);
                    return;
                  }

                  setAssignForm({
                    ...assignForm,
                    employeeId: emp.id,
                    assignedTo: emp.employeeCode,
                    assignedToName: emp.name,
                    department: emp.departmentName || "",
                    departmentId: emp.departmentId,
                  });
                }}
              >
                <option value="">Select Employee</option>

                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Due Date"
              type="date"
              value={assignForm.dueDate}
              onChange={(e) =>
                setAssignForm({ ...assignForm, dueDate: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="flex gap-3">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer border-2 transition ${
                    assignForm.priority === key
                      ? `${config.border} ${config.color}`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={key}
                    checked={assignForm.priority === key}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, priority: e.target.value })
                    }
                    className="hidden"
                  />
                  {config.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpenAssignModal(false);
                resetAssignForm();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold transition"
            >
              Assign Task
            </button>
          </div>
        </form>
      </Modal>

      {/* View Assignment/EOD Modal */}
      <Modal
        open={openViewModal}
        title={
          activeTab === "assignments"
            ? "Assignment Details"
            : "EOD Report Details"
        }
        onClose={() => {
          setOpenViewModal(false);
          setSelectedItem(null);
        }}
        width="max-w-2xl"
      >
        {selectedItem && (
          <div className="space-y-4">
            {console.log("------------", selectedItem)}
            {/* View Assignment */}
            {activeTab === "assignments" ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedItem.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Assigned to {selectedItem.assigned_to_name}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITY_CONFIG[selectedItem.priority].color}`}
                  >
                    {PRIORITY_CONFIG[selectedItem.priority].label} Priority
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{selectedItem.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {dayjs(selectedItem.due_date).format("MMMM D, YYYY")}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Days Left</p>
                    <p className="font-semibold text-gray-900">
                      {Math.max(
                        dayjs(selectedItem.due_date).diff(dayjs(), "day"),
                        0,
                      )}{" "}
                      days
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="font-semibold text-gray-900">
                      {selectedItem.progress}%
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Progress Bar</p>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        selectedItem.status === "completed"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${selectedItem.progress}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* view EOD Modal */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedItem.employeeName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedItem.employeeId} - {selectedItem.department}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${EOD_STATUS_CONFIG[selectedItem.status]?.color}`}
                  >
                    {EOD_STATUS_CONFIG[selectedItem.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold text-gray-900">
                      {dayjs(selectedItem.date).format("MMMM D, YYYY")}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Submitted At</p>
                    <p className="font-semibold text-gray-900">
                      {selectedItem.submittedAt}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 font-semibold mb-1">
                      Tasks Completed
                    </p>
                    <p className="text-gray-700">
                      {selectedItem.tasksCompleted}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-600 font-semibold mb-1">
                      Tasks In Progress
                    </p>
                    <p className="text-gray-700">
                      {selectedItem.tasksInProgress}
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-600 font-semibold mb-1">
                      Blockers
                    </p>
                    <p className="text-gray-700">
                      {selectedItem.blockers || "No blockers"}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-sm text-purple-600 font-semibold mb-1">
                      Tomorrow's Plan
                    </p>
                    <p className="text-gray-700">{selectedItem.tomorrowPlan}</p>
                  </div>

                  {selectedItem.notes && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500 font-semibold mb-1">
                        Additional Notes
                      </p>
                      <p className="text-gray-700">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>

                {selectedItem.approvedBy && (
                  <p className="text-sm text-gray-500">
                    Approved by:{" "}
                    <span className="font-semibold text-gray-700">
                      {selectedItem.approvedBy}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Submit EOD Modal */}
      <Modal
        open={openEODModal}
        title="Submit End of Day Report"
        onClose={() => {
          setOpenEODModal(false);
          resetEODForm();
        }}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmitEOD} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select
                value={eodForm.employeeId}
                onChange={(e) => {
                  const value = e.target.value;

                  // prevent empty selection crash
                  if (!value) {
                    setEODForm((prev) => ({
                      ...prev,
                      employeeId: "",
                      employeeName: "",
                    }));
                    return;
                  }

                  const emp = employees.find((em) => em.id === Number(value));

                  if (!emp) {
                    return;
                  }

                  setEODForm((prev) => ({
                    ...prev,
                    employeeId: emp.id,
                    employeeName: emp.name,
                    department: emp.departmentName || "",
                    departmentId: emp.departmentId,
                  }));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Date"
              type="date"
              value={eodForm.date}
              onChange={(e) =>
                setEODForm((prev) => ({
                  ...prev,
                  date: e.target.value,
                }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasks Completed Today *
            </label>
            <textarea
              value={eodForm.tasksCompleted}
              onChange={(e) =>
                setEODForm((prev) => ({
                  ...prev,
                  tasksCompleted: e.target.value,
                }))
              }
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="List all tasks completed today..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasks In Progress
            </label>
            <textarea
              value={eodForm.tasksInProgress}
              onChange={(e) =>
                setEODForm({ ...eodForm, tasksInProgress: e.target.value })
              }
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Tasks that are currently in progress..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blockers / Issues
            </label>
            <textarea
              value={eodForm.blockers}
              onChange={(e) =>
                setEODForm((prev) => ({
                  ...prev,
                  blockers: e.target.value,
                }))
              }
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Any blockers or issues faced today..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tomorrow's Plan
            </label>
            <textarea
              value={eodForm.tomorrowPlan}
              onChange={(e) =>
                setEODForm({ ...eodForm, tomorrowPlan: e.target.value })
              }
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="What you plan to work on tomorrow..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={eodForm.notes}
              onChange={(e) =>
                setEODForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpenEODModal(false);
                resetEODForm();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold transition"
            >
              Submit EOD Report
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setDeleteId(null);
        }}
        title={`Delete ${activeTab === "assignments" ? "Assignment" : "EOD Report"}`}
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
