import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import dayjs from "dayjs";
import {
  Briefcase,
  Users,
  UserCheck,
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
  FileText,
  AlertTriangle,
  RefreshCw,
  Download,
  Search,
  Filter,
  Shield,
  Zap,
  MessageSquare,
  Phone,
  Mail,
  Home,
  Settings,
  TrendingUp,
  CheckSquare,
  BriefcaseIcon,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

// const DEFAULT_CLIENT_POLICIES = [
//   {
//     id: 1,
//     title: "Client Meeting Policy",
//     category: "meeting",
//     priority: "high",
//     isActive: true,
//     description: "Guidelines for scheduling and conducting client meetings.",
//     rules: [
//       { key: "response_time", label: "Response Time", value: "Within 2 hours", type: "text" },
//       { key: "meeting_notice", label: "Meeting Notice", value: "24 hours advance", type: "text" },
//       { key: "agenda_required", label: "Agenda Required", value: "Yes - 48 hours before", type: "text" },
//       { key: "minutes", label: "Minutes Distribution", value: "Within 24 hours", type: "text" },
//     ],
//   },
//   {
//     id: 2,
//     title: "Project Delivery Policy",
//     category: "delivery",
//     priority: "high",
//     isActive: true,
//     description: "Rules for timely project delivery and milestone tracking.",
//     rules: [
//       { key: "deadline_buffer", label: "Deadline Buffer", value: "2 days before client deadline", type: "text" },
//       { key: "delay_notification", label: "Delay Notification", value: "Immediate - within 4 hours", type: "text" },
//       { key: "daily_updates", label: "Daily Updates", value: "For delayed projects", type: "text" },
//       { key: "escalation", label: "Escalation Level", value: "After 1 day delay", type: "text" },
//     ],
//   },
//   {
//     id: 3,
//     title: "Client Communication Policy",
//     category: "communication",
//     priority: "high",
//     isActive: true,
//     description: "Standards for professional client communication.",
//     rules: [
//       { key: "channel", label: "Primary Channel", value: "Official Email", type: "text" },
//       { key: "response_sla", label: "Email Response SLA", value: "4 business hours", type: "text" },
//       { key: "escalation_sla", label: "Escalation SLA", value: "24 hours", type: "text" },
//       { key: "tone", label: "Communication Tone", value: "Professional & Friendly", type: "text" },
//     ],
//   },
//   {
//     id: 4,
//     title: "Client Feedback Policy",
//     category: "feedback",
//     priority: "medium",
//     isActive: true,
//     description: "Process for collecting and responding to client feedback.",
//     rules: [
//       { key: "survey_frequency", label: "Survey Frequency", value: "Quarterly", type: "text" },
//       { key: "response_time", label: "Feedback Response", value: "Within 48 hours", type: "text" },
//       { key: "nps_target", label: "NPS Score Target", value: "8+ out of 10", type: "text" },
//       { key: "review_meeting", label: "Review Meetings", value: "Monthly", type: "text" },
//     ],
//   },
//   {
//     id: 5,
//     title: "Client Onboarding Policy",
//     category: "onboarding",
//     priority: "high",
//     isActive: true,
//     description: "Standard process for onboarding new clients.",
//     rules: [
//       { key: "onboarding_time", label: "Onboarding Timeframe", value: "5 business days", type: "text" },
//       { key: "kickoff", label: "Kickoff Meeting", value: "Within 3 days of sign", type: "text" },
//       { key: "documentation", label: "Documentation", value: "Contract, NDA, SOW", type: "text" },
//       { key: "account_manager", label: "Account Manager", value: "Assigned within 24 hours", type: "text" },
//     ],
//   },
//   {
//     id: 6,
//     title: "Client Escalation Policy",
//     category: "escalation",
//     priority: "high",
//     isActive: true,
//     description: "Procedures for escalating client issues.",
//     rules: [
//       { key: "level1", label: "Level 1", value: "Team Lead (4 hours)", type: "text" },
//       { key: "level2", label: "Level 2", value: "Account Manager (8 hours)", type: "text" },
//       { key: "level3", label: "Level 3", value: "Director (24 hours)", type: "text" },
//       { key: "emergency", label: "Emergency Contact", value: "24/7 Helpline", type: "text" },
//     ],
//   },
// ];

// const DEFAULT_CANDIDATE_POLICIES = [
//   {
//     id: 101,
//     title: "Resume Screening Policy",
//     category: "screening",
//     priority: "high",
//     isActive: true,
//     description: "Guidelines for screening candidate resumes.",
//     rules: [
//       { key: "screening_time", label: "Screening Timeframe", value: "Within 48 hours", type: "text" },
//       { key: "shortlist_criteria", label: "Shortlist Criteria", value: "Relevant experience + Skills match", type: "text" },
//       { key: "response", label: "Status Update", value: "Within 5 days", type: "text" },
//       { key: " ATS", label: "ATS Entry", value: "Mandatory within 24 hours", type: "text" },
//     ],
//   },
//   {
//     id: 102,
//     title: "Interview Scheduling Policy",
//     category: "interview",
//     priority: "high",
//     isActive: true,
//     description: "Standards for scheduling and conducting interviews.",
//     rules: [
//       { key: "notice_period", label: "Candidate Notice", value: "48 hours minimum", type: "text" },
//       { key: "interviewers", label: "Interview Panel", value: "2-3 interviewers", type: "text" },
//       { key: "duration", label: "Interview Duration", value: "45-60 minutes", type: "text" },
//       { key: "feedback", label: "Feedback Submission", value: "Within 24 hours", type: "text" },
//     ],
//   },
//   {
//     id: 103,
//     title: "Offer Letter Policy",
//     category: "offer",
//     priority: "high",
//     isActive: true,
//     description: "Guidelines for preparing and sending offer letters.",
//     rules: [
//       { key: "timeline", label: "Offer Timeline", value: "Within 48 hours of decision", type: "text" },
//       { key: "validity", label: "Offer Validity", value: "7 working days", type: "text" },
//       { key: "negotiation", label: "Negotiation Window", value: "3 days", type: "text" },
//       { key: "joining_period", label: "Standard Joining", value: "15-30 days", type: "text" },
//     ],
//   },
//   {
//     id: 104,
//     title: "Background Verification Policy",
//     category: "verification",
//     priority: "high",
//     isActive: true,
//     description: "Process for conducting background verification.",
//     rules: [
//       { key: "initiation", label: "Verification Initiation", value: "Post offer acceptance", type: "text" },
//       { key: "completion", label: "Completion Time", value: "7-10 working days", type: "text" },
//       { key: "criteria", label: "Verification Scope", value: "Employment, Education, Criminal", type: "text" },
//       { key: "threshold", label: "Discrepancy Action", value: "HR + Legal Review", type: "text" },
//     ],
//   },
//   {
//     id: 105,
//     title: "Candidate Experience Policy",
//     category: "experience",
//     priority: "medium",
//     isActive: true,
//     description: "Standards for providing positive candidate experience.",
//     rules: [
//       { key: "acknowledgment", label: "Application Acknowledgment", value: "Instant - Auto email", type: "text" },
//       { key: "update_frequency", label: "Status Updates", value: "Every 5 working days", type: "text" },
//       { key: "rejection", label: "Rejection Communication", value: "Personal call + Email", type: "text" },
//       { key: "wait_time", label: "Max Wait Time", value: "15 minutes for interviews", type: "text" },
//     ],
//   },
//   {
//     id: 106,
//     title: "Candidate Onboarding Policy",
//     category: "onboarding",
//     priority: "high",
//     isActive: true,
//     description: "Standard process for onboarding selected candidates.",
//     rules: [
//       { key: "pre_joining", label: "Pre-Joining Comms", value: "Weekly check-in calls", type: "text" },
//       { key: "documents", label: "Document Submission", value: "5 days before joining", type: "text" },
//       { key: "orientation", label: "Orientation Duration", value: "3 days", type: "text" },
//       { key: "buddy", label: "Buddy Assignment", value: "First week", type: "text" },
//     ],
//   },
//   {
//     id: 107,
//     title: "Salary Negotiation Policy",
//     category: "negotiation",
//     priority: "high",
//     isActive: true,
//     description: "Guidelines for salary and benefits negotiation.",
//     rules: [
//       { key: "budget", label: "Budget Flexibility", value: "Up to 10% from initial", type: "text" },
//       { key: "approval", label: "Above Budget Approval", value: "HR Head required", type: "text" },
//       { key: "benefits", label: "Benefits Discussion", value: "After base salary settled", type: "text" },
//       { key: "final", label: "Final Offer Authority", value: "Director level", type: "text" },
//     ],
//   },
//   {
//     id: 108,
//     title: "Interview Cancellation Policy",
//     category: "interview",
//     priority: "medium",
//     isActive: true,
//     description: "Procedures for cancelling or rescheduling interviews.",
//     rules: [
//       { key: "reschedule_limit", label: "Reschedule Limit", value: "Max 2 times per candidate", type: "text" },
//       { key: "reschedule_notice", label: "Reschedule Notice", value: "24 hours minimum", type: "text" },
//       { key: "emergency", label: "Emergency Cancellation", value: "Immediate notification + New slot", type: "text" },
//       { key: "no_show", label: "No-Show Policy", value: "Reschedule once, then reject", type: "text" },
//     ],
//   },
// ];

const POLICY_CATEGORIES = {
  client: [
    {
      id: "meeting",
      name: "Meeting",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "delivery",
      name: "Delivery",
      icon: Target,
      color: "bg-green-50 text-green-600",
    },
    {
      id: "communication",
      name: "Communication",
      icon: MessageSquare,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "feedback",
      name: "Feedback",
      icon: CheckCircle,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      id: "onboarding",
      name: "Onboarding",
      icon: Home,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "escalation",
      name: "Escalation",
      icon: AlertTriangle,
      color: "bg-red-50 text-red-600",
    },
  ],
  candidate: [
    {
      id: "screening",
      name: "Screening",
      icon: Search,
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "interview",
      name: "Interview",
      icon: Calendar,
      color: "bg-green-50 text-green-600",
    },
    {
      id: "offer",
      name: "Offer",
      icon: FileText,
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "verification",
      name: "Verification",
      icon: Shield,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      id: "experience",
      name: "Experience",
      icon: CheckCircle,
      color: "bg-pink-50 text-pink-600",
    },
    {
      id: "onboarding",
      name: "Onboarding",
      icon: Home,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      id: "negotiation",
      name: "Negotiation",
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
  ],
};

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-red-100 text-red-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  low: { label: "Low", color: "bg-green-100 text-green-700" },
};

export default function ClientCandidatePolicies() {
  const [activeTab, setActiveTab] = useState("client");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [clientPolicies, setClientPolicies] = useState([]);
  const [candidatePolicies, setCandidatePolicies] = useState([]);

  const [openPolicyModal, setOpenPolicyModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [policyForm, setPolicyForm] = useState({
    title: "",
    category: "",
    priority: "medium",
    description: "",
    isActive: true,
    rules: [],
  });

  const [newRule, setNewRule] = useState({
    label: "",
    value: "",
    type: "text",
  });

  useEffect(() => {
    loadData();
  }, []);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("hrms_admin_token");

  const loadData = async () => {
    try {
      setLoading(true);

      const [clientRes, candidateRes] = await Promise.all([
        axios.get(`${BASE_URL}/super-admin/client-policies`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/candidate-policies`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // CLIENT
      setClientPolicies(
        (clientRes.data?.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          priority: p.priority,
          description: p.description,
          isActive: Boolean(p.isActive),
          rules: p.rules || [],
        })),
      );

      // CANDIDATE
      setCandidatePolicies(
        (candidateRes.data?.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          priority: p.priority,
          description: p.description,
          isActive: Boolean(p.isActive),
          rules: p.rules || [],
        })),
      );

    } catch (err) {
      toast.error(`Failed to load policies ${err}`);
    } finally {
      setLoading(false);
    }
  };
  const currentPolicies =
    activeTab === "client" ? clientPolicies : candidatePolicies;
  const currentCategories = POLICY_CATEGORIES[activeTab];

  const filteredPolicies = useMemo(() => {
    return currentPolicies.filter((p) => {
      const matchSearch =
        !search || p.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !activeCategory || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [currentPolicies, search, activeCategory]);

  const stats = useMemo(() => {
    const policies =
      activeTab === "client" ? clientPolicies : candidatePolicies;
    return {
      total: policies.length,
      active: policies.filter((p) => p.isActive).length,
      highPriority: policies.filter((p) => p.priority === "high").length,
      categories: new Set(policies.map((p) => p.category)).size,
    };
  }, [activeTab, clientPolicies, candidatePolicies]);

  const handleTogglePolicy = async (id) => {
    try {
      const url =
        activeTab === "client"
          ? `${BASE_URL}/super-admin/client-policies/toggle/${id}`
          : `${BASE_URL}/super-admin/candidate-policies/toggle/${id}`;

      await axios.patch(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      loadData();
      toast.success("Updated");
    } catch (err) {
      toast.error("Toggle failed");
    }
  };

  const handleAddRule = () => {
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

  const handleRemoveRule = (index) => {
    setPolicyForm((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();

    try {
      const url =
        activeTab === "client"
          ? `${BASE_URL}/super-admin/client-policies`
          : `${BASE_URL}/super-admin/candidate-policies`;

      await axios.post(
        url,
        {
          title: policyForm.title,
          category: policyForm.category,
          priority: policyForm.priority,
          description: policyForm.description,
          isActive: policyForm.isActive,
          rules: policyForm.rules,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Policy created");
      setOpenPolicyModal(false);
      loadData();
      resetForm();
    } catch (err) {
      toast.error("Create failed");
    }
  };

  const handleDelete = async () => {
    try {
      const url =
        activeTab === "client"
          ? `${BASE_URL}/super-admin/client-policies/${deleteId}`
          : `${BASE_URL}/super-admin/candidate-policies/${deleteId}`;

      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Deleted");
      loadData();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setOpenDeleteModal(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setPolicyForm({
      title: "",
      category: activeTab === "client" ? "meeting" : "screening",
      priority: "medium",
      description: "",
      isActive: true,
      rules: [],
    });
    setNewRule({ label: "", value: "", type: "text" });
  };

  const tabs = [
    { id: "client", label: "Client Policies", icon: Briefcase },
    { id: "candidate", label: "Candidate Policies", icon: UserCheck },
  ];

  return (
    <div>
      <PageHeader
        title="Client & Candidate Work Policies"
        desc="Automated work policies for client management and candidate hiring processes."
      />

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setActiveCategory("");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Policies"
          value={stats.total}
          icon={
            activeTab === "client" ? (
              <Briefcase size={20} />
            ) : (
              <UserCheck size={20} />
            )
          }
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Policies"
          value={stats.active}
          icon={<CheckCircle size={20} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="High Priority"
          value={stats.highPriority}
          icon={<AlertTriangle size={20} />}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="Categories"
          value={stats.categories}
          icon={<Settings size={20} />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            !activeCategory
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Categories
        </button>
        {currentCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategory(activeCategory === cat.id ? "" : cat.id)
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeCategory === cat.id
                  ? cat.color
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon size={16} />
              {cat.name}
            </button>
          );
        })}
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
          <button
            onClick={() => {
              resetForm();
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-auto pr-1">
        {filteredPolicies.map((policy) => {
          const category = currentCategories.find(
            (c) => c.id === policy.category,
          );
          const Icon = category?.icon || Shield;
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
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${category?.color || "bg-gray-100 text-gray-600"}`}
                  >
                    <Icon size={20} />
                  </div>
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

                <h3 className="font-bold text-gray-900 mb-2">{policy.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {policy.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
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

                <div className="text-xs text-gray-400 mb-4">
                  {policy.rules?.length || 0} rules configured
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedPolicy(policy);
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

      {/* Add Policy Modal */}
      <Modal
        open={openPolicyModal}
        title={`Create ${activeTab === "client" ? "Client" : "Candidate"} Policy`}
        onClose={() => {
          setOpenPolicyModal(false);
          resetForm();
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
                required
              >
                <option value="">Select Category</option>
                {currentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={policyForm.description}
              onChange={(e) =>
                setPolicyForm({ ...policyForm, description: e.target.value })
              }
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Brief description..."
            />
          </div>

          {/* Rules */}
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
                resetForm();
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

      {/* View Modal */}
      <Modal
        open={openViewModal}
        title="Policy Details"
        onClose={() => {
          setOpenViewModal(false);
          setSelectedPolicy(null);
        }}
        width="max-w-lg"
      >
        {selectedPolicy && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedPolicy.title}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITY_CONFIG[selectedPolicy.priority]?.color}`}
              >
                {PRIORITY_CONFIG[selectedPolicy.priority]?.label} Priority
              </span>
            </div>

            {selectedPolicy.description && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{selectedPolicy.description}</p>
              </div>
            )}

            {selectedPolicy.rules && selectedPolicy.rules.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  Policy Rules
                </h4>
                <div className="space-y-2">
                  {selectedPolicy.rules.map((rule, index) => (
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

            <div
              className={`flex items-center gap-2 p-4 rounded-xl ${selectedPolicy.isActive ? "bg-green-50" : "bg-gray-50"}`}
            >
              {selectedPolicy.isActive ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <XCircle size={18} className="text-gray-400" />
              )}
              <span
                className={`font-medium ${selectedPolicy.isActive ? "text-green-700" : "text-gray-600"}`}
              >
                {selectedPolicy.isActive
                  ? "Policy is Active"
                  : "Policy is Inactive"}
              </span>
            </div>
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
