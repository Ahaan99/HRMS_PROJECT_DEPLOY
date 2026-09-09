import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import axios from "axios";

import {
  FileText,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Coffee,
  Users,
  Briefcase,
  Shield,
  File,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  BookOpen,
  Scale,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const POLICY_CATEGORIES = [
  {
    id: "leave",
    name: "Leave Policy",
    icon: Calendar,
    description: "Annual leave, sick leave, casual leave rules",
  },
  {
    id: "time",
    name: "Time & Attendance",
    icon: Clock,
    description: "Working hours, shifts, late arrival rules",
  },
  {
    id: "lunch",
    name: "Lunch & Breaks",
    icon: Coffee,
    description: "Break times, lunch duration policies",
  },
  {
    id: "attendance",
    name: "Attendance",
    icon: Users,
    description: "Absent, present, half-day, WFH policies",
  },
  {
    id: "salary",
    name: "Salary & Compensation",
    icon: DollarSign,
    description: "Salary structure, bonuses, increments",
  },
  {
    id: "penalty",
    name: "Deductions & Penalties",
    icon: Scale,
    description: "Late fines, absent penalties, deductions",
  },
];

const PRIORITY_CONFIG = {
  high: { label: "High", color: "bg-red-50 text-red-600 border border-red-100" },
  medium: { label: "Medium", color: "bg-amber-50 text-amber-600 border border-amber-100" },
  low: { label: "Low", color: "bg-gray-100 text-gray-500 border border-gray-200" },
};

export default function CompanyPolicies() {
  const [activeTab, setActiveTab] = useState("policies");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [policies, setPolicies] = useState([]);
  const [policyLogs, setPolicyLogs] = useState([]);

  const [openPolicyModal, setOpenPolicyModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("hrms_admin_token");

  const [policyForm, setPolicyForm] = useState({
    title: "",
    category: "leave",
    priority: "medium",
    description: "",
    isActive: true,
    rules: [],
    autoApply: true,
  });

  const [newRule, setNewRule] = useState({
    label: "",
    value: "",
    type: "text",
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);

      const [policyRes, logsRes] = await Promise.all([
        axios.get(`${BASE_URL}/super-admin/policies`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/policies/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // 🔥 MAP POLICIES
      const mappedPolicies = policyRes.data.data.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        priority: p.priority,
        description: p.description,
        isActive: !!p.is_active,
        autoApply: !!p.auto_apply,
        rules: p.rules || [],
      }));

      setPolicies(mappedPolicies);

      // 🔥 MAP LOGS
      const mappedLogs = logsRes.data.data.map((l) => ({
        id: l.id,
        action: l.action,
        policy: l.policy_title,
        user: l.user,
        time: l.created_at,
      }));

      setPolicyLogs(mappedLogs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchCategory =
        !selectedCategory || p.category === selectedCategory;
      const matchSearch =
        !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [policies, selectedCategory, search]);

  const categoryStats = useMemo(() => {
    const stats = {};
    POLICY_CATEGORIES.forEach((cat) => {
      const catPolicies = policies.filter((p) => p.category === cat.id);
      stats[cat.id] = {
        total: catPolicies.length,
        active: catPolicies.filter((p) => p.isActive).length,
      };
    });
    return stats;
  }, [policies]);

  const totalActive = policies.filter((p) => p.isActive).length;

  const handleTogglePolicy = async (id) => {
    try {
      await axios.patch(
        `${BASE_URL}/super-admin/policies/toggle/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      loadPolicies();
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  const handleViewPolicy = (policy) => {
    setSelectedPolicy(policy);
    setOpenViewModal(true);
  };

  const handleAddRule = () => {
    if (!newRule.label || !newRule.value) {
      toast.error("Please fill in rule label and value");
      return;
    }

    setPolicyForm((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          label: newRule.label,
          value: newRule.value,
          type: newRule.type,
        },
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

    if (!policyForm.title) {
      toast.error("Policy title is required");
      return;
    }

    try {
      const payload = {
        title: policyForm.title,
        category: policyForm.category,
        priority: policyForm.priority,
        description: policyForm.description,
        isActive: policyForm.isActive,
        autoApply: policyForm.autoApply,
        rules: (policyForm.rules || []).map((r) => ({
          label: r.label,
          value: r.value,
          type: r.type || "text",
        })),
      };

      if (selectedPolicy) {
        // ✅ UPDATE
        await axios.put(
          `${BASE_URL}/super-admin/policies/${selectedPolicy.id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        toast.success("Policy updated");
      } else {
        // ✅ CREATE
        await axios.post(`${BASE_URL}/super-admin/policies`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success("Policy created");
      }

      setOpenPolicyModal(false);
      setSelectedPolicy(null);
      resetForm();
      loadPolicies();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/super-admin/policies/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Policy deleted!");
      setOpenDeleteModal(false);
      setDeleteId(null);
      loadPolicies();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setPolicyForm({
      title: "",
      category: "leave",
      priority: "medium",
      description: "",
      isActive: true,
      rules: [],
      autoApply: true,
    });
    setNewRule({ label: "", value: "", type: "text" });
  };

  const tabs = [
    { id: "policies", label: "All Policies", icon: BookOpen },
    { id: "logs", label: "Policy Logs", icon: FileText },
  ];

  return (
    <div>
      <PageHeader
        title="Company Policies"
        desc="Manage automated company policies for leave, attendance, salary, and penalties."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {POLICY_CATEGORIES.slice(0, 6).map((cat) => {
          const Icon = cat.icon;
          const stats = categoryStats[cat.id] || { total: 0, active: 0 };
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
              }
              aria-pressed={selectedCategory === cat.id}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedCategory === cat.id
                  ? "border-gray-900 bg-gray-900 shadow-md"
                  : "border-gray-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div
                className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  selectedCategory === cat.id
                    ? "bg-white/10 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Icon size={17} />
              </div>
              <p
                className={`text-xs font-medium leading-snug ${
                  selectedCategory === cat.id ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {cat.name}
              </p>
              <p
                className={`mt-0.5 text-2xl font-bold tracking-tight ${
                  selectedCategory === cat.id ? "text-white" : "text-gray-900"
                }`}
              >
                {stats.total}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  selectedCategory === cat.id ? "text-gray-400" : "text-gray-400"
                }`}
              >
                {stats.active} active
              </p>
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900">
            <Download size={15} />
            Export
          </button>
          <button
            onClick={() => {
              resetForm();
              setOpenPolicyModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            <Plus size={15} />
            Add Policy
          </button>
        </div>
      </div>

      {/* Policies Tab */}
      {activeTab === "policies" && (
        <>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies..."
              className="min-w-[200px] flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/5"
            />
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/5 md:w-48"
            >
              <option value="">All Categories</option>
              {POLICY_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={loadPolicies}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-semibold text-gray-900">{totalActive}</span>
              <span className="text-gray-400">Active</span>
              <span className="mx-1.5 h-4 w-px bg-gray-200" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="font-semibold text-gray-900">
                {policies.length - totalActive}
              </span>
              <span className="text-gray-400">Inactive</span>
            </div>
          </div>

          {/* Policies List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPolicies.map((policy) => {
              const category = POLICY_CATEGORIES.find(
                (c) => c.id === policy.category,
              );
              const Icon = category?.icon || FileText;
              const priorityConfig = PRIORITY_CONFIG[policy.priority];

              return (
                <div
                  key={policy.id}
                  className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                        <Icon size={18} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${priorityConfig.color}`}
                        >
                          {priorityConfig.label}
                        </span>
                        <button
                          onClick={() => handleTogglePolicy(policy.id)}
                          aria-label={policy.isActive ? "Deactivate policy" : "Activate policy"}
                          className={`rounded p-1 transition ${
                            policy.isActive
                              ? "text-emerald-600 hover:bg-emerald-50"
                              : "text-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {policy.isActive ? (
                            <ToggleRight size={24} />
                          ) : (
                            <ToggleLeft size={24} />
                          )}
                        </button>
                      </div>
                    </div>

                    <h3 className="mb-1.5 font-bold text-gray-900">
                      {policy.title}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
                        policy.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          policy.isActive ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {policy.isActive ? "Active" : "Inactive"}
                    </span>

                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                      {category?.description}
                    </p>

                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                      <button
                        onClick={() => handleViewPolicy(policy)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setPolicyForm({
                            title: policy.title,
                            category: policy.category,
                            priority: policy.priority,
                            description: policy.description || "",
                            isActive: policy.isActive,
                            rules: [],
                            autoApply: true,
                          });
                          setOpenPolicyModal(true);
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(policy.id);
                          setOpenDeleteModal(true);
                        }}
                        aria-label="Delete policy"
                        className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
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
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <BookOpen size={24} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">
                No policies yet
              </h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Create your first policy to automate leave, attendance, salary,
                and penalty rules across your organization.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setOpenPolicyModal(true);
                }}
                className="mt-5 flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                <Plus size={15} />
                Add Policy
              </button>
            </div>
          )}
        </>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Policy Change Logs</h3>
          </div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">Action</th>
                  <th className="text-left px-5 py-4 font-semibold">Policy</th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Changed By
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {policyLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          log.action.includes("Created")
                            ? "bg-green-100 text-green-700"
                            : log.action.includes("Updated")
                              ? "bg-blue-100 text-blue-700"
                              : log.action.includes("Activated")
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {log.policy}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{log.user}</td>
                    <td className="px-5 py-4 text-gray-500">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Policy Modal */}
      <Modal
        open={openPolicyModal}
        title={selectedPolicy ? "Edit Policy" : "Create New Policy"}
        onClose={() => {
          setOpenPolicyModal(false);
          setSelectedPolicy(null);
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
              >
                {POLICY_CATEGORIES.map((cat) => (
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
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Describe the policy..."
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Auto Apply</p>
              <p className="text-sm text-gray-500">
                Automatically apply this policy to all employees
              </p>
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
                placeholder="Rule label (e.g., Max Days)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              <input
                value={newRule.value}
                onChange={(e) =>
                  setNewRule({ ...newRule, value: e.target.value })
                }
                placeholder="Value (e.g., 18)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                Add Rule
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpenPolicyModal(false);
                setSelectedPolicy(null);
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
              {selectedPolicy ? "Update Policy" : "Create Policy"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Policy Modal */}
      <Modal
        open={openViewModal}
        title={selectedPolicy?.title}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedPolicy(null);
        }}
        width="max-w-lg"
      >
        {selectedPolicy && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${selectedPolicy.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
              >
                {selectedPolicy.isActive ? "Active" : "Inactive"}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${PRIORITY_CONFIG[selectedPolicy.priority]?.color}`}
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

            {selectedPolicy.autoApply !== undefined && (
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl">
                <CheckCircle size={18} className="text-blue-600" />
                <span className="text-blue-700 font-medium">
                  {selectedPolicy.autoApply
                    ? "Auto Applied to All Employees"
                    : "Manual Application Required"}
                </span>
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
