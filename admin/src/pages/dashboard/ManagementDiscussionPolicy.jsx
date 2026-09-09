import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  MessageSquare,
  Users,
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
  Coffee,
  AlertTriangle,
  ArrowUpCircle,
  Send,
  Search,
  Filter,
  RefreshCw,
  Download,
  Shield,
  MessageCircle,
  Briefcase,
  FileText,
  AlertCircle,
  CheckSquare,
  Ban,
  ArrowRight,
  Building,
  UserCheck,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const MANAGEMENT_LEVELS = [
  { id: 1, name: "Team Lead", level: 1 },
  { id: 2, name: "Department Manager", level: 2 },
  { id: 3, name: "Senior Manager", level: 3 },
  { id: 4, name: "Director", level: 4 },
  { id: 5, name: "HR Head", level: 5 },
  { id: 6, name: "CEO", level: 6 },
];

const DEFAULT_DISCUSSION_POLICIES = [
  {
    id: 1,
    title: "Meal & Lunch Break Policy",
    category: "meal",
    priority: "high",
    isActive: true,
    description: "Rules regarding meal discussions with management during lunch hours.",
    rules: [
      { key: "lunch_start", label: "Lunch Start Time", value: "1:00 PM", type: "text" },
      { key: "lunch_duration", label: "Lunch Duration", value: "60 minutes", type: "text" },
      { key: "discussion_allowed", label: "Discussion During Lunch", value: "Only urgent matters", type: "text" },
      { key: "no_discussion_period", label: "No Discussion Period", value: "12:30 PM - 1:30 PM", type: "text" },
      { key: "escalation_for_breach", label: "Escalation for Breach", value: "HR Head", type: "text" },
    ],
  },
  {
    id: 2,
    title: "Management Communication Policy",
    category: "communication",
    priority: "high",
    isActive: true,
    description: "Guidelines for communication with management regarding work policies.",
    rules: [
      { key: "meeting_request", label: "Meeting Request Process", value: "Through HR portal", type: "text" },
      { key: "response_time", label: "Management Response Time", value: "Within 24 hours", type: "text" },
      { key: "escalation_time", label: "Escalation After", value: "48 hours of no response", type: "text" },
      { key: "channel", label: "Primary Channel", value: "Official email only", type: "text" },
    ],
  },
  {
    id: 3,
    title: "Policy Dispute Resolution",
    category: "dispute",
    priority: "high",
    isActive: true,
    description: "Process for disputing policies with management.",
    rules: [
      { key: "step1", label: "Step 1 - Discussion", value: "Direct manager (24 hours)", type: "text" },
      { key: "step2", label: "Step 2 - Escalation", value: "HR (48 hours)", type: "text" },
      { key: "step3", label: "Step 3 - Review", value: "Policy Committee (5 days)", type: "text" },
      { key: "final_step", label: "Final Decision", value: "CEO/Board", type: "text" },
    ],
  },
  {
    id: 4,
    title: "No Meal Discussion Rule",
    category: "meal",
    priority: "medium",
    isActive: true,
    description: "Employees are not required to discuss work matters during meal times.",
    rules: [
      { key: "protected_time", label: "Protected Meal Time", value: "No work discussions", type: "text" },
      { key: "emergency_only", label: "Emergency Exception", value: "Only with explicit consent", type: "text" },
      { key: "complaint_channel", label: "Complaint Channel", value: "HR anonymous portal", type: "text" },
    ],
  },
  {
    id: 5,
    title: "Management Discussion Hours",
    category: "hours",
    priority: "medium",
    isActive: true,
    description: "Designated hours for management discussions.",
    rules: [
      { key: "discussion_start", label: "Discussion Window Start", value: "10:00 AM", type: "text" },
      { key: "discussion_end", label: "Discussion Window End", value: "4:00 PM", type: "text" },
      { key: "buffer_before_lunch", label: "Buffer Before Lunch", value: "30 minutes", type: "text" },
      { key: "buffer_after_lunch", label: "Buffer After Lunch", value: "15 minutes", type: "text" },
    ],
  },
  {
    id: 6,
    title: "Escalation Matrix Policy",
    category: "escalation",
    priority: "high",
    isActive: true,
    description: "Define escalation levels for policy discussions with management.",
    rules: [
      { key: "level1", label: "Level 1 - Direct", value: "Team Lead", type: "text" },
      { key: "level2", label: "Level 2 - Manager", value: "Department Manager", type: "text" },
      { key: "level3", label: "Level 3 - HR", value: "HR Head", type: "text" },
      { key: "level4", label: "Level 4 - CEO", value: "For policy changes only", type: "text" },
    ],
  },
  {
    id: 7,
    title: "Formal Grievance Policy",
    category: "grievance",
    priority: "high",
    isActive: true,
    description: "Formal process for raising grievances against management decisions.",
    rules: [
      { key: "submission", label: "Submission Method", value: "Written/Grievance Portal", type: "text" },
      { key: "acknowledgment", label: "Acknowledgment Time", value: "24 hours", type: "text" },
      { key: "resolution", label: "Resolution Time", value: "7 working days", type: "text" },
      { key: "confidentiality", label: "Confidentiality", value: "Fully confidential", type: "text" },
    ],
  },
  {
    id: 8,
    title: "Policy Amendment Process",
    category: "amendment",
    priority: "medium",
    isActive: false,
    description: "Process for requesting amendments to existing policies.",
    rules: [
      { key: "proposal", label: "Proposal Submission", value: "To HR with justification", type: "text" },
      { key: "review_period", label: "Review Period", value: "15 days", type: "text" },
      { key: "vote_required", label: "Employee Vote Required", value: "Yes - 70% majority", type: "text" },
      { key: "implementation", label: "Implementation", value: "After approval", type: "text" },
    ],
  },
];

const DEFAULT_DISCUSSION_REQUESTS = [
  { id: 1, employeeId: "EMP1003", employeeName: "Ankit Employee", subject: "Flexible Hours Request", category: "policy", status: "pending", priority: "high", assignedTo: "Rohit HR", createdAt: "2026-03-18", lastUpdate: "2026-03-19" },
  { id: 2, employeeId: "EMP1001", employeeName: "Harry Sharma", subject: "Leave Policy Clarification", category: "dispute", status: "in_progress", priority: "medium", assignedTo: "HR Team", createdAt: "2026-03-17", lastUpdate: "2026-03-20" },
  { id: 3, employeeId: "EMP1005", employeeName: "Vikram Dev", subject: "WFH Policy Discussion", category: "policy", status: "resolved", priority: "low", assignedTo: "Rohit HR", createdAt: "2026-03-15", lastUpdate: "2026-03-18" },
  { id: 4, employeeId: "EMP1004", employeeName: "Priya Manager", subject: "Overtime Compensation", category: "escalation", status: "escalated", priority: "high", assignedTo: "Senior Manager", createdAt: "2026-03-14", lastUpdate: "2026-03-20" },
];

const POLICY_CATEGORIES = [
  { id: "meal", name: "Meal & Break", icon: Coffee, color: "bg-orange-50 text-orange-600", borderColor: "border-orange-500" },
  { id: "communication", name: "Communication", icon: MessageCircle, color: "bg-blue-50 text-blue-600", borderColor: "border-blue-500" },
  { id: "dispute", name: "Dispute Resolution", icon: AlertCircle, color: "bg-red-50 text-red-600", borderColor: "border-red-500" },
  { id: "escalation", name: "Escalation", icon: ArrowUpCircle, color: "bg-purple-50 text-purple-600", borderColor: "border-purple-500" },
  { id: "grievance", name: "Grievance", icon: Shield, color: "bg-green-50 text-green-600", borderColor: "border-green-500" },
  { id: "hours", name: "Discussion Hours", icon: Clock, color: "bg-indigo-50 text-indigo-600", borderColor: "border-indigo-500" },
  { id: "amendment", name: "Policy Amendment", icon: FileText, color: "bg-gray-50 text-gray-600", borderColor: "border-gray-500" },
];

const REQUEST_STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: MessageSquare },
  escalated: { label: "Escalated", color: "bg-red-100 text-red-700", icon: ArrowUpCircle },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-red-100 text-red-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "Low", color: "bg-green-100 text-green-700" },
};

export default function ManagementDiscussionPolicy() {
  const [activeTab, setActiveTab] = useState("policies");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [policies, setPolicies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [policyLogs, setPolicyLogs] = useState([]);

  const [openPolicyModal, setOpenPolicyModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [policyForm, setPolicyForm] = useState({
    title: "",
    category: "meal",
    priority: "medium",
    description: "",
    isActive: true,
    rules: [],
  });

  const [requestForm, setRequestForm] = useState({
    employeeId: "",
    employeeName: "",
    subject: "",
    category: "policy",
    priority: "medium",
    description: "",
    assignedTo: "",
  });

  const [newRule, setNewRule] = useState({ label: "", value: "", type: "text" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setPolicies(DEFAULT_DISCUSSION_POLICIES);
      setRequests(DEFAULT_DISCUSSION_REQUESTS);
      setPolicyLogs([
        { id: 1, action: "Policy Updated", policy: "Meal & Lunch Break Policy", user: "Admin", time: "2026-03-20 10:30" },
        { id: 2, action: "Request Resolved", policy: "WFH Policy Discussion", user: "Rohit HR", time: "2026-03-18 14:00" },
        { id: 3, action: "Policy Activated", policy: "Escalation Matrix Policy", user: "Admin", time: "2026-03-15 09:00" },
        { id: 4, action: "Escalated", policy: "Overtime Compensation", user: "HR Team", time: "2026-03-14 11:30" },
      ]);
      setLoading(false);
    }, 500);
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchCategory = !categoryFilter || p.category === categoryFilter;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [policies, categoryFilter, search]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch = !search || r.subject.toLowerCase().includes(search.toLowerCase()) || r.employeeName.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [requests, search]);

  const policyStats = useMemo(() => {
    const active = policies.filter((p) => p.isActive).length;
    const mealPolicies = policies.filter((p) => p.category === "meal" && p.isActive).length;
    const escalationPolicies = policies.filter((p) => p.category === "escalation" && p.isActive).length;
    return { total: policies.length, active, mealPolicies, escalationPolicies };
  }, [policies]);

  const requestStats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    escalated: requests.filter((r) => r.status === "escalated").length,
    resolved: requests.filter((r) => r.status === "resolved").length,
  }), [requests]);

  const handleTogglePolicy = (id) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
    toast.success("Policy status updated");
  };

  const handleAddRule = () => {
    if (!newRule.label || !newRule.value) return;
    setPolicyForm((prev) => ({
      ...prev,
      rules: [...prev.rules, { ...newRule, key: newRule.label.toLowerCase().replace(/\s+/g, "_") }],
    }));
    setNewRule({ label: "", value: "", type: "text" });
  };

  const handleRemoveRule = (index) => {
    setPolicyForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitPolicy = (e) => {
    e.preventDefault();
    if (!policyForm.title) {
      toast.error("Policy title is required");
      return;
    }

    const newPolicy = {
      id: Date.now(),
      ...policyForm,
    };

    setPolicies((prev) => [newPolicy, ...prev]);
    toast.success("Discussion policy created successfully!");
    setOpenPolicyModal(false);
    resetPolicyForm();
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!requestForm.subject || !requestForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newRequest = {
      id: Date.now(),
      ...requestForm,
      status: "pending",
      createdAt: dayjs().format("YYYY-MM-DD"),
      lastUpdate: dayjs().format("YYYY-MM-DD"),
    };

    setRequests((prev) => [newRequest, ...prev]);
    toast.success("Discussion request submitted successfully!");
    setOpenRequestModal(false);
    resetRequestForm();
  };

  const handleResolveRequest = (id) => {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "resolved", lastUpdate: dayjs().format("YYYY-MM-DD") } : r)
    );
    toast.success("Request resolved!");
  };

  const handleEscalateRequest = (id) => {
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "escalated", lastUpdate: dayjs().format("YYYY-MM-DD") } : r)
    );
    toast.success("Request escalated to higher management!");
  };

  const handleDelete = () => {
    setPolicies((prev) => prev.filter((p) => p.id !== deleteId));
    toast.success("Policy deleted successfully!");
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      title: "",
      category: "meal",
      priority: "medium",
      description: "",
      isActive: true,
      rules: [],
    });
    setNewRule({ label: "", value: "", type: "text" });
  };

  const resetRequestForm = () => {
    setRequestForm({
      employeeId: "",
      employeeName: "",
      subject: "",
      category: "policy",
      priority: "medium",
      description: "",
      assignedTo: "",
    });
  };

  const tabs = [
    { id: "policies", label: "Discussion Policies", icon: Shield },
    { id: "requests", label: "Discussion Requests", icon: MessageSquare },
    { id: "logs", label: "Activity Logs", icon: Clock },
  ];

  return (
    <div>
      <PageHeader
        title="Management Discussion & Meal Policy"
        desc="Handle employee-management discussions, meal policies, and automated policy routing."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Policies"
          value={policyStats.active}
          icon={<Shield size={20} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Meal Policies"
          value={policyStats.mealPolicies}
          icon={<Coffee size={20} />}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="Pending Requests"
          value={requestStats.pending}
          icon={<Clock size={20} />}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          title="Escalated"
          value={requestStats.escalated}
          icon={<ArrowUpCircle size={20} />}
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
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => {
              resetRequestForm();
              setOpenRequestModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
          >
            <Plus size={18} />
            New Request
          </button>
        </div>
      </div>

      {/* Policies Tab */}
      {activeTab === "policies" && (
        <>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoryFilter("")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                !categoryFilter ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Categories
            </button>
            {POLICY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(categoryFilter === cat.id ? "" : cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    categoryFilter === cat.id ? `${cat.color}` : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon size={16} />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Filters */}
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
              <button
                onClick={() => {
                  resetPolicyForm();
                  setOpenPolicyModal(true);
                }}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
              >
                <Plus size={18} />
                Add Policy
              </button>
            </div>
          </div>

          {/* Policies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPolicies.map((policy) => {
              const category = POLICY_CATEGORIES.find((c) => c.id === policy.category);
              const Icon = category?.icon || Shield;
              const priorityConfig = PRIORITY_CONFIG[policy.priority];

              return (
                <div
                  key={policy.id}
                  className={`bg-white rounded-2xl shadow border-l-4 ${category?.borderColor || "border-gray-300"} overflow-hidden`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category?.color || "bg-gray-100 text-gray-600"}`}>
                        <Icon size={20} />
                      </div>
                      <button
                        onClick={() => handleTogglePolicy(policy.id)}
                        className={`p-1 rounded transition ${
                          policy.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {policy.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2">{policy.title}</h3>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        policy.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{policy.description}</p>

                    <div className="text-xs text-gray-400 mb-4">
                      {policy.rules?.length || 0} rules configured
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
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
              No policies found.
            </div>
          )}
        </>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject or employee..."
                className="w-full md:w-80 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">Employee</th>
                  <th className="text-left px-5 py-4 font-semibold">Subject</th>
                  <th className="text-left px-5 py-4 font-semibold">Category</th>
                  <th className="text-left px-5 py-4 font-semibold">Priority</th>
                  <th className="text-left px-5 py-4 font-semibold">Status</th>
                  <th className="text-left px-5 py-4 font-semibold">Assigned To</th>
                  <th className="text-left px-5 py-4 font-semibold">Date</th>
                  <th className="text-right px-5 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const statusConfig = REQUEST_STATUS_CONFIG[request.status];
                  const StatusIcon = statusConfig.icon;
                  const priorityConfig = PRIORITY_CONFIG[request.priority];
                  const category = POLICY_CATEGORIES.find((c) => c.id === request.category);

                  return (
                    <tr key={request.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{request.employeeName}</p>
                          <p className="text-xs text-gray-500">{request.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">{request.subject}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {category?.name || request.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{request.assignedTo}</td>
                      <td className="px-5 py-4 text-gray-500">{request.createdAt}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedItem(request);
                              setOpenViewModal(true);
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          >
                            <Eye size={16} />
                          </button>
                          {request.status !== "resolved" && (
                            <>
                              <button
                                onClick={() => handleEscalateRequest(request.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                title="Escalate"
                              >
                                <ArrowUpCircle size={16} />
                              </button>
                              <button
                                onClick={() => handleResolveRequest(request.id)}
                                className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"
                                title="Resolve"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">Action</th>
                  <th className="text-left px-5 py-4 font-semibold">Policy</th>
                  <th className="text-left px-5 py-4 font-semibold">By</th>
                  <th className="text-left px-5 py-4 font-semibold">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {policyLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.action.includes("Resolved") ? "bg-green-100 text-green-700" :
                        log.action.includes("Escalated") ? "bg-red-100 text-red-700" :
                        log.action.includes("Activated") ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">{log.policy}</td>
                    <td className="px-5 py-4 text-gray-700">{log.user}</td>
                    <td className="px-5 py-4 text-gray-500">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Policy Modal */}
      <Modal
        open={openPolicyModal}
        title="Create Discussion Policy"
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
            onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
            placeholder="Enter policy title"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={policyForm.category}
                onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                {POLICY_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={policyForm.priority}
                onChange={(e) => setPolicyForm({ ...policyForm, priority: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={policyForm.description}
              onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Describe the policy..."
            />
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Policy Rules</label>
            <div className="space-y-2 mb-3">
              {policyForm.rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{rule.label}</p>
                    <p className="text-sm text-gray-500">{rule.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
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
                onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
                placeholder="Rule label"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              <input
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                placeholder="Value"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                Add
              </button>
            </div>
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

      {/* New Request Modal */}
      <Modal
        open={openRequestModal}
        title="Submit Discussion Request"
        onClose={() => {
          setOpenRequestModal(false);
          resetRequestForm();
        }}
        width="max-w-lg"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <Input
            label="Subject"
            value={requestForm.subject}
            onChange={(e) => setRequestForm({ ...requestForm, subject: e.target.value })}
            placeholder="Enter subject"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={requestForm.category}
                onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                {POLICY_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={requestForm.description}
              onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Describe your concern or request..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escalate To</label>
            <select
              value={requestForm.assignedTo}
              onChange={(e) => setRequestForm({ ...requestForm, assignedTo: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="">Select Management Level</option>
              {MANAGEMENT_LEVELS.map((level) => (
                <option key={level.id} value={level.name}>{level.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpenRequestModal(false);
                resetRequestForm();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={openViewModal}
        title={selectedItem?.rules ? "Policy Details" : "Request Details"}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedItem(null);
        }}
        width="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900">{selectedItem.title || selectedItem.subject}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITY_CONFIG[selectedItem.priority]?.color}`}>
                {PRIORITY_CONFIG[selectedItem.priority]?.label} Priority
              </span>
            </div>

            {selectedItem.description && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{selectedItem.description}</p>
              </div>
            )}

            {selectedItem.rules && selectedItem.rules.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Policy Rules</h4>
                <div className="space-y-2">
                  {selectedItem.rules.map((rule, index) => (
                    <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">{rule.label}</span>
                      <span className="font-semibold text-gray-900">{rule.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.employeeName && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-600 mb-1">Submitted By</p>
                <p className="font-semibold text-gray-900">{selectedItem.employeeName}</p>
                <p className="text-sm text-gray-500">{selectedItem.employeeId}</p>
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
        title="Delete Policy"
        message="Are you sure you want to delete this policy? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
