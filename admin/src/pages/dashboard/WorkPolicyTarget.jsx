// Work Policy & Target Management

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import axios from "axios";
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Target as TargetIcon,
  Award,
  CheckSquare,
  Square,
  BarChart3,
  ChevronDown,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const WORK_POLICY_TEMPLATES = [
  {
    id: "meeting",
    name: "Meeting Policy",
    icon: "Users",
    rules: [
      {
        key: "max_daily_meetings",
        label: "Max Daily Meetings",
        value: "3",
        type: "number",
      },
      {
        key: "meeting_duration",
        label: "Max Meeting Duration",
        value: "60 minutes",
        type: "text",
      },
      {
        key: "prep_time",
        label: "Required Prep Time",
        value: "15 minutes",
        type: "text",
      },
    ],
  },
  {
    id: "deadline",
    name: "Deadline Policy",
    icon: "Clock",
    rules: [
      {
        key: "task_deadline",
        label: "Task Completion Deadline",
        value: "Same day or next morning",
        type: "text",
      },
      {
        key: "escalation",
        label: "Escalation After",
        value: "2 hours of delay",
        type: "text",
      },
      {
        key: "extensions",
        label: "Extension Requests",
        value: "Max 2 per week",
        type: "text",
      },
    ],
  },
  {
    id: "reporting",
    name: "Reporting Policy",
    icon: "FileText",
    rules: [
      {
        key: "daily_report",
        label: "Daily EOD Report",
        value: "Mandatory",
        type: "text",
      },
      {
        key: "weekly_report",
        label: "Weekly Summary",
        value: "Every Friday",
        type: "text",
      },
      {
        key: "report_timing",
        label: "Report Submission Time",
        value: "Before 6 PM",
        type: "text",
      },
    ],
  },
  {
    id: "productivity",
    name: "Productivity Policy",
    icon: "TrendingUp",
    rules: [
      {
        key: "task_per_day",
        label: "Min Tasks Per Day",
        value: "3",
        type: "number",
      },
      {
        key: "focus_hours",
        label: "Focus Hours Required",
        value: "4 hours",
        type: "text",
      },
      {
        key: "break_interval",
        label: "Break Interval",
        value: "Every 90 minutes",
        type: "text",
      },
    ],
  },
  {
    id: "communication",
    name: "Communication Policy",
    icon: "MessageSquare",
    rules: [
      {
        key: "response_time",
        label: "Email Response Time",
        value: "Within 4 hours",
        type: "text",
      },
      {
        key: "status_update",
        label: "Status Update Frequency",
        value: "Every 2 hours",
        type: "text",
      },
      {
        key: "standup",
        label: "Daily Standup",
        value: "9:15 AM",
        type: "text",
      },
    ],
  },
  {
    id: "overtime",
    name: "Overtime Policy",
    icon: "Clock",
    rules: [
      {
        key: "approval_required",
        label: "Approval Required",
        value: "Yes - Manager approval",
        type: "text",
      },
      {
        key: "max_hours",
        label: "Max Overtime Per Week",
        value: "10 hours",
        type: "text",
      },
      {
        key: "compensation",
        label: "Compensation",
        value: "1.5x or TOIL",
        type: "text",
      },
    ],
  },
];

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-red-100 text-red-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "Low", color: "bg-green-100 text-green-700" },
};

const TARGET_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700",
    bg: "bg-gray-50",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    bg: "bg-blue-50",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    bg: "bg-green-50",
  },
  overdue: {
    label: "Overdue",
    color: "bg-red-100 text-red-700",
    bg: "bg-red-50",
  },
};

export default function WorkPolicyTarget() {
  const [activeTab, setActiveTab] = useState("policies");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [workPolicies, setWorkPolicies] = useState([]);
  const [targets, setTargets] = useState([]);

  const [openPolicyModal, setOpenPolicyModal] = useState(false);
  const [openTargetModal, setOpenTargetModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState("policy");
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [departmentFilter, setDepartmentFilter] = useState(0);
  const token = localStorage.getItem("hrms_admin_token");

  const [policyForm, setPolicyForm] = useState({
    title: "",
    category: "productivity",
    priority: "medium",
    isActive: true,
    rules: [],
    autoApply: true,
  });

  const [targetForm, setTargetForm] = useState({
    title: "",
    employeeId: "",
    employeeName: "",
    department: "",
    targetValue: "",
    unit: "",
    deadline: "",
    priority: "medium",
  });

  const [newRule, setNewRule] = useState({
    label: "",
    value: "",
    type: "text",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [policyRes, targetRes, empRes, deptRes] = await Promise.all([
        axios.get(`${BASE_URL}/super-admin/policies`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/targets`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // ✅ POLICIES
      setWorkPolicies(
        (policyRes.data?.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          priority: p.priority,
          isActive: p.is_active,
          description: p.description || "", // ✅ ADD THIS
          rules: p.rules || [],
        })),
      );

      // ✅ TARGETS
      setTargets(
        (targetRes.data?.data || []).map((t) => ({
          id: t.id,
          title: t.title,
          employeeId: t.employee_id,
          employeeName: t.employee_name,
          department: t.department_name,
          targetValue: t.target_value,
          currentValue: t.current_value,
          unit: t.unit,
          deadline: t.deadline,
          status: t.status,
          priority: t.priority,
        })),
      );

      // ✅ DEPARTMENTS
      setDepartments([
        { id: 0, name: "All Departments" },
        ...(deptRes.data?.designations || []),
      ]);

      // ✅ EMPLOYEES
      setEmployees(empRes.data?.employees || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredTargets = useMemo(() => {
    return (targets || []).filter((t) => {
      // 🔍 SEARCH
      const matchSearch =
        !search ||
        t.title?.toLowerCase().includes(search.toLowerCase()) ||
        t.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
        String(t.employeeId || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      // 🏢 DEPARTMENT FILTER
      let matchDept = true;

      if (departmentFilter !== 0) {
        const selectedDept = (departments || []).find(
          (d) => d.id === departmentFilter,
        )?.name;

        matchDept = t.department === selectedDept;
      }

      return matchSearch && matchDept;
    });
  }, [targets, search, departmentFilter, departments]);

  const filteredPolicies = useMemo(() => {
    return workPolicies.filter(
      (p) =>
        !search ||
        String(p.title || "")
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    );
  }, [workPolicies, search]);

  const targetStats = useMemo(() => {
    const total = targets.length;
    const completed = targets.filter((t) => t.status === "completed").length;
    const inProgress = targets.filter((t) => t.status === "in_progress").length;
    const overdue = targets.filter((t) => t.status === "overdue").length;
    const avgProgress =
      targets.length > 0
        ? Math.round(
            targets.reduce(
              (sum, t) => sum + (t.currentValue / t.targetValue) * 100,
              0,
            ) / targets.length,
          )
        : 0;

    return { total, completed, inProgress, overdue, avgProgress };
  }, [targets]);

  const policyStats = useMemo(
    () => ({
      total: workPolicies.length,
      active: workPolicies.filter((p) => p.isActive).length,
    }),
    [workPolicies],
  );

  const handleTogglePolicy = async (id) => {
    try {
      await axios.patch(
        `${BASE_URL}/super-admin/policies/toggle/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Policy updated");
      loadData(); // refresh from backend
    } catch (err) {
      toast.error("Toggle failed");
    }
  };

  const handleAddPolicyRule = () => {
    if (!newRule.label || !newRule.value) return;
    setPolicyForm((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        { ...newRule, key: newRule.label.toLowerCase().replace(/\s+/g, "_") },
      ],
    }));
    setNewRule({ label: "", value: "", type: "text" });
  };

  const handleRemovePolicyRule = (index) => {
    setPolicyForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleApplyTemplate = (template) => {
    setPolicyForm((prev) => ({
      ...prev,
      title: template.name,
      category: template.id,
      rules: [...template.rules],
    }));
    toast.success(`Applied ${template.name} template`);
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: policyForm.title,
        category: policyForm.category,
        priority: policyForm.priority,
        isActive: policyForm.isActive,
        autoApply: policyForm.autoApply,
        description: policyForm.description || "",
        rules: (policyForm.rules || []).map((r) => ({
          label: r.label,
          value: r.value,
          type: r.type || "text",
        })),
      };

      await axios.post(`${BASE_URL}/super-admin/policies`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Policy created");
      setOpenPolicyModal(false);
      loadData();
    } catch (err) {
      toast.error(`Failed: ${err}`);
    }
  };

  const handleSubmitTarget = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${BASE_URL}/super-admin/targets`,
        {
          title: targetForm.title,
          employeeId: targetForm.employeeId,
          targetValue: Number(targetForm.targetValue),
          unit: targetForm.unit,
          deadline: targetForm.deadline,
          priority: targetForm.priority,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Target assigned");
      setOpenTargetModal(false);
      loadData();
    } catch (err) {
      toast.error("Failed");
    }
  };

  const handleUpdateProgress = async (targetId, newValue) => {
    try {
      await axios.patch(
        `${BASE_URL}/super-admin/targets/progress/${targetId}`,
        { currentValue: newValue },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Progress updated!");

      // 🔥 IMPORTANT → refresh from backend
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update progress");
    }
  };

  const handleDelete = async () => {
    try {
      const url =
        deleteType === "policy"
          ? `${BASE_URL}/super-admin/policies/${deleteId}`
          : `${BASE_URL}/super-admin/targets/${deleteId}`;

      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Deleted successfully!");
      loadData(); // refresh from backend
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setOpenDeleteModal(false);
      setDeleteId(null);
    }
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      title: "",
      category: "productivity",
      priority: "medium",
      isActive: true,
      rules: [],
      autoApply: true,
    });
    setNewRule({ label: "", value: "", type: "text" });
  };

  const resetTargetForm = () => {
    setTargetForm({
      title: "",
      employeeId: "",
      employeeName: "",
      department: "",
      targetValue: "",
      unit: "",
      deadline: "",
      priority: "medium",
    });
  };

  const getProgressPercentage = (target) => {
    return Math.min(
      Math.round((target.currentValue / target.targetValue) * 100),
      100,
    );
  };

  const tabs = [
    { id: "policies", label: "Work Policies", icon: TargetIcon },
    { id: "targets", label: "Work Targets", icon: Award },
  ];

  return (
    <div>
      <PageHeader
        title="Work Policy & Target Management"
        desc="Set automated work policies and assign work targets to employees."
      />

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

      {/* Work Policies Tab */}
      {activeTab === "policies" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              title="Total Policies"
              value={policyStats.total}
              icon={<TargetIcon size={20} />}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Active Policies"
              value={policyStats.active}
              icon={<CheckCircle size={20} />}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              title="Inactive Policies"
              value={policyStats.total - policyStats.active}
              icon={<XCircle size={20} />}
              color="bg-red-50 text-red-600"
            />
          </div>

          {/* Filters & Actions */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search policies..."
                className="w-full md:w-80 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => {
                    resetPolicyForm();
                    setOpenPolicyModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
                >
                  <Plus size={18} />
                  Add Policy
                </button>
              </div>
            </div>
          </div>

          {/* Policy Templates */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">
              Quick Policy Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {WORK_POLICY_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-black hover:bg-gray-50 transition text-left"
                >
                  <p className="font-semibold text-gray-900 text-sm">
                    {template.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {template.rules.length} rules
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Policies List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPolicies.map((policy) => {
              const priorityConfig = PRIORITY_CONFIG[policy.priority];
              return (
                <div
                  key={policy.id}
                  className={`bg-white rounded-2xl shadow border-l-4 overflow-hidden ${
                    policy.isActive ? "border-green-500" : "border-gray-300"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900">
                        {policy.title}
                      </h3>
                      <button
                        onClick={() => handleTogglePolicy(policy.id)}
                        className={`p-1 rounded transition ${
                          policy.isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {policy.isActive ? (
                          <ToggleRight size={24} />
                        ) : (
                          <ToggleLeft size={24} />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${priorityConfig.color}`}
                      >
                        {priorityConfig.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          policy.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {policy.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 capitalize">
                      {policy.category} Policy
                    </p>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedItem(policy);
                          setOpenViewModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(policy.id);
                          setDeleteType("policy");
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

          {filteredPolicies.length === 0 && (
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-10 text-center text-gray-500">
              No work policies found.
            </div>
          )}
        </>
      )}

      {/* Work Targets Tab */}
      {activeTab === "targets" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Total Targets"
              value={targetStats.total}
              icon={<TargetIcon size={20} />}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Completed"
              value={targetStats.completed}
              icon={<CheckCircle size={20} />}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              title="In Progress"
              value={targetStats.inProgress}
              icon={<Clock size={20} />}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="Overdue"
              value={targetStats.overdue}
              icon={<AlertCircle size={20} />}
              color="bg-red-50 text-red-600"
            />
            <StatCard
              title="Avg Progress"
              value={`${targetStats.avgProgress}%`}
              icon={<TrendingUp size={20} />}
              color="bg-purple-50 text-purple-600"
            />
          </div>

          {/* Filters & Actions */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 mb-6">
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
                <option value={0}>All Departments</option>

                {(departments || []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
                <Download size={18} />
                Export
              </button>
              <button
                onClick={() => {
                  resetTargetForm();
                  setOpenTargetModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
              >
                <Plus size={18} />
                Assign Target
              </button>
            </div>
          </div>

          {/* Targets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTargets.map((target) => {
              const progress = getProgressPercentage(target);
              const statusConfig = TARGET_STATUS_CONFIG[target.status];
              const priorityConfig = PRIORITY_CONFIG[target.priority];
              const isOverdue =
                dayjs(target.deadline).isBefore(dayjs()) &&
                target.status !== "completed";

              return (
                <div
                  key={target.id}
                  className={`bg-white rounded-2xl shadow border-2 overflow-hidden ${
                    target.status === "completed"
                      ? "border-green-500"
                      : isOverdue
                        ? "border-red-500"
                        : "border-gray-200"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${priorityConfig.color}`}
                        >
                          {priorityConfig.label}
                        </span>
                        <h3 className="font-bold text-gray-900 mt-2 line-clamp-2">
                          {target.title}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}
                      >
                        {isOverdue ? "Overdue" : statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {target.employeeName}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({target.department})
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-semibold text-gray-900">
                          {target.currentValue}/{target.targetValue}{" "}
                          {target.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            target.status === "completed"
                              ? "bg-green-500"
                              : isOverdue
                                ? "bg-red-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {progress}%
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar size={14} />
                        Due: {dayjs(target.deadline).format("MMM D, YYYY")}
                      </span>
                      {isOverdue && (
                        <span className="text-red-500 font-semibold">
                          Overdue!
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => {
                          const newValue = Math.min(
                            target.currentValue + 1,
                            target.targetValue,
                          );
                          handleUpdateProgress(target.id, newValue);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition"
                      >
                        <Plus size={14} />
                        Update
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(target);
                          setOpenViewModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(target.id);
                          setDeleteType("target");
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

          {filteredTargets.length === 0 && (
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-10 text-center text-gray-500">
              No targets found.
            </div>
          )}
        </>
      )}

      {/* Add Policy Modal */}
      <Modal
        open={openPolicyModal}
        title="Create Work Policy"
        onClose={() => {
          setOpenPolicyModal(false);
          resetPolicyForm();
        }}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmitPolicy} className="space-y-4">
          <Input
            label="Policy Title"
            value={policyForm.title}
            onChange={(e) =>
              setPolicyForm({ ...policyForm, title: e.target.value })
            }
            placeholder="Enter policy title"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={policyForm.category}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, category: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="productivity">Productivity</option>
                <option value="deadline">Deadline</option>
                <option value="reporting">Reporting</option>
                <option value="communication">Communication</option>
                <option value="meeting">Meeting</option>
                <option value="overtime">Overtime</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={policyForm.priority}
                onChange={(e) =>
                  setPolicyForm({ ...policyForm, priority: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Auto Apply</p>
              <p className="text-sm text-gray-500">Apply to all employees</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setPolicyForm({
                  ...policyForm,
                  autoApply: !policyForm.autoApply,
                })
              }
              className={`w-12 h-6 rounded-full transition ${policyForm.autoApply ? "bg-green-500" : "bg-gray-300"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition transform ${policyForm.autoApply ? "translate-x-6" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          {/* Policy Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Rules
            </label>
            <div className="space-y-2 mb-3">
              {policyForm.rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{rule.label}</p>
                    <p className="text-sm text-gray-500">{rule.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePolicyRule(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newRule.label}
                onChange={(e) =>
                  setNewRule({ ...newRule, label: e.target.value })
                }
                placeholder="Rule label"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              <input
                value={newRule.value}
                onChange={(e) =>
                  setNewRule({ ...newRule, value: e.target.value })
                }
                placeholder="Value"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />

              <button
                type="button"
                onClick={handleAddPolicyRule}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                Add
              </button>
            </div>
            <Input
              label="Description"
              value={policyForm.description}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, description: e.target.value })
              }
              placeholder="Enter policy description"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpenPolicyModal(false);
                resetPolicyForm();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold transition"
            >
              Create Policy
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Target Modal */}
      <Modal
        open={openTargetModal}
        title="Assign Work Target"
        onClose={() => {
          setOpenTargetModal(false);
          resetTargetForm();
        }}
        width="max-w-lg"
      >
        <form onSubmit={handleSubmitTarget} className="space-y-4">
          <Input
            label="Target Title"
            value={targetForm.title}
            onChange={(e) =>
              setTargetForm({ ...targetForm, title: e.target.value })
            }
            placeholder="e.g., Complete 20 bug fixes"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              value={targetForm.employeeId || ""}
              onChange={(e) =>
                setTargetForm((prev) => ({
                  ...prev,
                  employeeId: Number(e.target.value),
                }))
              }
              className="border px-3 py-2 rounded-xl w-full"
            >
              <option value="">Select Employee</option>

              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Value"
              type="number"
              value={targetForm.targetValue}
              onChange={(e) =>
                setTargetForm({ ...targetForm, targetValue: e.target.value })
              }
              placeholder="e.g., 20"
              required
            />
            <Input
              label="Unit"
              value={targetForm.unit}
              onChange={(e) =>
                setTargetForm({ ...targetForm, unit: e.target.value })
              }
              placeholder="e.g., tasks, bugs, calls"
            />
          </div>

          <Input
            label="Deadline"
            type="date"
            value={targetForm.deadline}
            onChange={(e) =>
              setTargetForm({ ...targetForm, deadline: e.target.value })
            }
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <div className="flex gap-3">
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <label
                  key={key}
                  className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl cursor-pointer border-2 transition ${
                    targetForm.priority === key
                      ? `${config.color.replace("text-", "border-")} ${config.color}`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={key}
                    checked={targetForm.priority === key}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, priority: e.target.value })
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
                setOpenTargetModal(false);
                resetTargetForm();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold transition"
            >
              Assign Target
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={openViewModal}
        title={activeTab === "policies" ? "Policy Details" : "Target Details"}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedItem(null);
        }}
        width="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                <span>Title : </span> {selectedItem.title}
                {selectedItem.description && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
                    <span>Description : </span> {selectedItem.description}
                  </p>
                )}
                {console.log(selectedItem)}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITY_CONFIG[selectedItem.priority]?.color}`}
              >
                {PRIORITY_CONFIG[selectedItem.priority]?.label} Priority
              </span>
            </div>

            {selectedItem.employeeName && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">
                    {selectedItem.employeeName}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedItem.employeeId} - {selectedItem.department}
                </p>
              </div>
            )}

            {selectedItem.rules && selectedItem.rules.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Policy Rules
                </h4>
                <div className="space-y-2">
                  {selectedItem.rules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <span className="text-gray-600">{rule.label}</span>
                      <span className="font-semibold text-gray-900">
                        {rule.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.targetValue && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Progress</h4>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      {selectedItem.currentValue} / {selectedItem.targetValue}{" "}
                      {selectedItem.unit}
                    </span>
                    <span className="font-semibold">
                      {getProgressPercentage(selectedItem)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        selectedItem.status === "completed"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{
                        width: `${getProgressPercentage(selectedItem)}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Deadline:{" "}
                  {dayjs(selectedItem.deadline).format("MMMM D, YYYY")}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Days Left:{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.max(
                      dayjs(selectedItem.deadline).diff(dayjs(), "day"),
                      0,
                    )}{" "}
                    days
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setDeleteId(null);
        }}
        title={`Delete ${deleteType === "policy" ? "Policy" : "Target"}`}
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
