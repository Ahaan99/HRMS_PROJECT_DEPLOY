import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  CreditCard,
  Package,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  RefreshCw,
  Download,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Building2,
  Star,
  Zap,
  Crown,
  Shield,
  Sparkles,
  Timer,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toggle from "../../components/ui/Toggle";
import StatCard from "../../components/common/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const PLAN_COLORS = {
  basic: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700", badge: "bg-gray-100 text-gray-700" },
  standard: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  premium: { bg: "bg-purple-50", border: "border-purple-400", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
  enterprise: { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700" },
};

const DEFAULT_PLANS = [
  {
    id: 1,
    name: "Basic Plan",
    tier: "basic",
    price: 1999,
    billingCycle: "monthly",
    maxEmployees: 10,
    maxStorage: "5 GB",
    features: ["Basic HRM", "Employee Management", "Attendance Tracking", "Email Support", "Basic Reports"],
    notIncluded: ["Advanced Analytics", "API Access", "Custom Integrations", "Priority Support", "White Labeling"],
    isActive: true,
    isPopular: false,
    color: "basic",
  },
  {
    id: 2,
    name: "Standard Plan",
    tier: "standard",
    price: 4999,
    billingCycle: "monthly",
    maxEmployees: 50,
    maxStorage: "25 GB",
    features: ["Everything in Basic", "Performance Reviews", "Leave Management", "Chat Support", "Standard Reports", "Mobile App"],
    notIncluded: ["Advanced Analytics", "API Access", "Custom Integrations", "Priority Support", "White Labeling"],
    isActive: true,
    isPopular: true,
    color: "standard",
  },
  {
    id: 3,
    name: "Premium Plan",
    tier: "premium",
    price: 9999,
    billingCycle: "monthly",
    maxEmployees: 200,
    maxStorage: "100 GB",
    features: ["Everything in Standard", "Advanced Analytics", "API Access", "Payroll Module", "Custom Reports", "Priority Support"],
    notIncluded: ["Custom Integrations", "White Labeling", "Dedicated Account Manager"],
    isActive: true,
    isPopular: false,
    color: "premium",
  },
  {
    id: 4,
    name: "Enterprise Plan",
    tier: "enterprise",
    price: 24999,
    billingCycle: "monthly",
    maxEmployees: -1,
    maxStorage: "Unlimited",
    features: ["Everything in Premium", "Custom Integrations", "White Labeling", "Dedicated Account Manager", "On-premise Option", "SLA Guarantee", "24/7 Phone Support"],
    notIncluded: [],
    isActive: true,
    isPopular: false,
    color: "enterprise",
  },
];

const DEFAULT_SUBSCRIPTIONS = [
  { id: 1, clientName: "Acme Corp", clientEmail: "billing@acme.com", plan: "Premium Plan", tier: "premium", status: "active", startDate: "2026-01-01", endDate: "2027-01-01", employees: 45, price: 9999, billingCycle: "monthly", lastPayment: "2026-03-01", nextPayment: "2026-04-01" },
  { id: 2, clientName: "TechStart Inc", clientEmail: "finance@techstart.com", plan: "Standard Plan", tier: "standard", status: "active", startDate: "2025-11-15", endDate: "2026-11-15", employees: 28, price: 4999, billingCycle: "monthly", lastPayment: "2026-03-15", nextPayment: "2026-04-15" },
  { id: 3, clientName: "Global Solutions", clientEmail: "accounts@globalsol.com", plan: "Enterprise Plan", tier: "enterprise", status: "active", startDate: "2025-06-01", endDate: "2026-06-01", employees: 120, price: 24999, billingCycle: "monthly", lastPayment: "2026-03-01", nextPayment: "2026-04-01" },
  { id: 4, clientName: "StartUp Hub", clientEmail: "admin@startuphub.com", plan: "Basic Plan", tier: "basic", status: "expired", startDate: "2025-01-01", endDate: "2026-01-01", employees: 8, price: 1999, billingCycle: "monthly", lastPayment: "2025-12-01", nextPayment: "-" },
  { id: 5, clientName: "Innovation Labs", clientEmail: "billing@innolabs.com", plan: "Standard Plan", tier: "standard", status: "pending", startDate: "2026-04-01", endDate: "2027-04-01", employees: 35, price: 4999, billingCycle: "monthly", lastPayment: "-", nextPayment: "2026-04-01" },
  { id: 6, clientName: "Digital Dynamics", clientEmail: "ops@digitaldyn.com", plan: "Premium Plan", tier: "premium", status: "cancelled", startDate: "2025-08-01", endDate: "2026-08-01", employees: 60, price: 9999, billingCycle: "monthly", lastPayment: "2026-02-01", nextPayment: "-" },
];

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-green-100 text-green-700", icon: CheckCircle },
  expired: { label: "Expired", color: "bg-red-100 text-red-700", icon: XCircle },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: XCircle },
  trial: { label: "Trial", color: "bg-blue-100 text-blue-700", icon: Zap },
};

export default function SubscriptionPlans() {
  const [activeTab, setActiveTab] = useState("plans");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [openSubscriptionModal, setOpenSubscriptionModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState("plan");

  const [planForm, setPlanForm] = useState({
    name: "",
    tier: "basic",
    price: "",
    billingCycle: "monthly",
    maxEmployees: "",
    maxStorage: "",
    features: [],
    isActive: true,
    isPopular: false,
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    clientName: "",
    clientEmail: "",
    planId: "",
    planName: "",
    startDate: "",
    endDate: "",
    billingCycle: "monthly",
  });

  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      setPlans(DEFAULT_PLANS);
      setSubscriptions(DEFAULT_SUBSCRIPTIONS);
      setLoading(false);
    }, 500);
  };

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchSearch =
        !search ||
        s.clientName.toLowerCase().includes(search.toLowerCase()) ||
        s.clientEmail.toLowerCase().includes(search.toLowerCase()) ||
        s.plan.toLowerCase().includes(search.toLowerCase());

      const matchStatus = !statusFilter || s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [subscriptions, search, statusFilter]);

  const stats = useMemo(() => {
    const totalMRR = subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.price, 0);
    
    return {
      totalPlans: plans.length,
      activePlans: plans.filter((p) => p.isActive).length,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter((s) => s.status === "active").length,
      mrr: totalMRR,
      arr: totalMRR * 12,
      expiringThisMonth: subscriptions.filter((s) => {
        if (s.status !== "active") return false;
        const endDate = dayjs(s.endDate);
        return endDate.isAfter(dayjs()) && endDate.isBefore(dayjs().add(30, "day"));
      }).length,
    };
  }, [plans, subscriptions]);

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setPlanForm((prev) => ({
      ...prev,
      features: [...prev.features, newFeature.trim()],
    }));
    setNewFeature("");
  };

  const handleRemoveFeature = (index) => {
    setPlanForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitPlan = (e) => {
    e.preventDefault();
    if (!planForm.name || !planForm.price) {
      toast.error("Please fill in required fields");
      return;
    }

    const newPlan = {
      id: Date.now(),
      ...planForm,
      price: parseInt(planForm.price),
      maxEmployees: planForm.maxEmployees ? parseInt(planForm.maxEmployees) : -1,
      color: planForm.tier,
    };

    setPlans((prev) => [newPlan, ...prev]);
    toast.success("Plan created successfully!");
    setOpenPlanModal(false);
    resetPlanForm();
  };

  const handleSubmitSubscription = (e) => {
    e.preventDefault();
    if (!subscriptionForm.clientName || !subscriptionForm.planId) {
      toast.error("Please fill in required fields");
      return;
    }

    const plan = plans.find((p) => p.id === parseInt(subscriptionForm.planId));

    const newSubscription = {
      id: Date.now(),
      clientName: subscriptionForm.clientName,
      clientEmail: subscriptionForm.clientEmail,
      plan: plan?.name || "",
      tier: plan?.tier || "",
      status: "active",
      startDate: subscriptionForm.startDate,
      endDate: subscriptionForm.endDate,
      employees: 0,
      price: plan?.price || 0,
      billingCycle: subscriptionForm.billingCycle,
      lastPayment: subscriptionForm.startDate,
      nextPayment: subscriptionForm.endDate,
    };

    setSubscriptions((prev) => [newSubscription, ...prev]);
    toast.success("Subscription created successfully!");
    setOpenSubscriptionModal(false);
    resetSubscriptionForm();
  };

  const handleCancelSubscription = (id) => {
    setSubscriptions((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: "cancelled" } : s)
    );
    toast.success("Subscription cancelled");
  };

  const handleRenewSubscription = (id) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newEndDate = dayjs(s.endDate).add(1, "year").format("YYYY-MM-DD");
        return {
          ...s,
          status: "active",
          endDate: newEndDate,
          nextPayment: newEndDate,
        };
      })
    );
    toast.success("Subscription renewed!");
  };

  const handleDelete = () => {
    if (deleteType === "plan") {
      setPlans((prev) => prev.filter((p) => p.id !== deleteId));
    } else {
      setSubscriptions((prev) => prev.filter((s) => s.id !== deleteId));
    }
    toast.success(`${deleteType === "plan" ? "Plan" : "Subscription"} deleted successfully!`);
    setOpenDeleteModal(false);
    setDeleteId(null);
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: "",
      tier: "basic",
      price: "",
      billingCycle: "monthly",
      maxEmployees: "",
      maxStorage: "",
      features: [],
      isActive: true,
      isPopular: false,
    });
    setNewFeature("");
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      clientName: "",
      clientEmail: "",
      planId: "",
      planName: "",
      startDate: "",
      endDate: "",
      billingCycle: "monthly",
    });
  };

  const tabs = [
    { id: "plans", label: "Subscription Plans", icon: Package },
    { id: "subscriptions", label: "Active Subscriptions", icon: CreditCard },
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        desc="Manage subscription plans, pricing, and client subscriptions."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total MRR" value={`₹${stats.mrr.toLocaleString()}`} icon={<DollarSign size={20} />} color="bg-green-50 text-green-600" />
        <StatCard title="ARR" value={`₹${stats.arr.toLocaleString()}`} icon={<TrendingUp size={20} />} color="bg-blue-50 text-blue-600" />
        <StatCard title="Active Plans" value={stats.activePlans} icon={<Package size={20} />} color="bg-purple-50 text-purple-600" />
        <StatCard title="Subscriptions" value={stats.activeSubscriptions} icon={<CreditCard size={20} />} color="bg-indigo-50 text-indigo-600" />
        <StatCard title="Expiring Soon" value={stats.expiringThisMonth} icon={<Clock size={20} />} color="bg-yellow-50 text-yellow-600" />
        <StatCard title="Total Clients" value={subscriptions.length} icon={<Building2 size={20} />} color="bg-gray-50 text-gray-600" />
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
            <Download size={18} />
            Export
          </button>
          {activeTab === "plans" && (
            <button
              onClick={() => {
                resetPlanForm();
                setOpenPlanModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
            >
              <Plus size={18} />
              Add Plan
            </button>
          )}
          {activeTab === "subscriptions" && (
            <button
              onClick={() => {
                resetSubscriptionForm();
                setOpenSubscriptionModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
            >
              <Plus size={18} />
              Add Subscription
            </button>
          )}
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const colors = PLAN_COLORS[plan.color] || PLAN_COLORS.basic;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${colors.border} overflow-hidden ${
                  plan.isPopular ? "ring-2 ring-blue-500 ring-offset-2" : ""
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center py-1 text-xs font-bold">
                    MOST POPULAR
                  </div>
                )}
                <div className={`${colors.bg} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.tier === "enterprise" && <Crown size={24} className="text-yellow-500" />}
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-gray-900">₹{plan.price.toLocaleString()}</span>
                    <span className="text-gray-500">/{plan.billingCycle === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Users size={16} className={colors.text} />
                      {plan.maxEmployees === -1 ? "Unlimited Employees" : `Up to ${plan.maxEmployees} Employees`}
                    </p>
                    <p className="flex items-center gap-2">
                      <Package size={16} className={colors.text} />
                      {plan.maxStorage} Storage
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Features:</h4>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedItem(plan);
                        setOpenViewModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setDeleteId(plan.id);
                        setDeleteType("plan");
                        setOpenDeleteModal(true);
                      }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by client name or email..."
                className="w-full md:w-80 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-5 py-4 font-semibold">Client</th>
                    <th className="text-left px-5 py-4 font-semibold">Plan</th>
                    <th className="text-left px-5 py-4 font-semibold">Price</th>
                    <th className="text-left px-5 py-4 font-semibold">Employees</th>
                    <th className="text-left px-5 py-4 font-semibold">Status</th>
                    <th className="text-left px-5 py-4 font-semibold">Next Payment</th>
                    <th className="text-left px-5 py-4 font-semibold">End Date</th>
                    <th className="text-right px-5 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => {
                    const statusConfig = STATUS_CONFIG[sub.status];
                    const StatusIcon = statusConfig.icon;
                    const colors = PLAN_COLORS[sub.tier] || PLAN_COLORS.basic;

                    return (
                      <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{sub.clientName}</p>
                            <p className="text-xs text-gray-500">{sub.clientEmail}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${colors.badge}`}>
                            {sub.plan}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          ₹{sub.price.toLocaleString()}/mo
                        </td>
                        <td className="px-5 py-4 text-gray-700">{sub.employees}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {sub.nextPayment !== "-" ? dayjs(sub.nextPayment).format("MMM D, YYYY") : "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-700">
                          {dayjs(sub.endDate).format("MMM D, YYYY")}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setSelectedItem(sub);
                                setOpenViewModal(true);
                              }}
                              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                            >
                              <Eye size={16} />
                            </button>
                            {sub.status === "active" && (
                              <button
                                onClick={() => handleRenewSubscription(sub.id)}
                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                                title="Renew"
                              >
                                <RefreshCw size={16} />
                              </button>
                            )}
                            {(sub.status === "active" || sub.status === "expired") && (
                              <button
                                onClick={() => handleCancelSubscription(sub.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                                title="Cancel"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setDeleteId(sub.id);
                                setDeleteType("subscription");
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
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Plan Modal */}
      <Modal
        open={openPlanModal}
        title="Create Subscription Plan"
        onClose={() => {
          setOpenPlanModal(false);
          resetPlanForm();
        }}
        width="max-w-2xl"
      >
        <form onSubmit={handleSubmitPlan} className="space-y-4">
          <Input
            label="Plan Name"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
            placeholder="e.g., Professional Plan"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={planForm.tier}
                onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Input
              label="Price (₹)"
              type="number"
              value={planForm.price}
              onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              placeholder="4999"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Employees"
              type="number"
              value={planForm.maxEmployees}
              onChange={(e) => setPlanForm({ ...planForm, maxEmployees: e.target.value })}
              placeholder="-1 for unlimited"
            />
            <Input
              label="Storage"
              value={planForm.maxStorage}
              onChange={(e) => setPlanForm({ ...planForm, maxStorage: e.target.value })}
              placeholder="e.g., 50 GB"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="space-y-2 mb-3">
              {planForm.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="flex-1 text-sm text-gray-700">{feature}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPopular"
                checked={planForm.isPopular}
                onChange={(e) => setPlanForm({ ...planForm, isPopular: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isPopular" className="text-sm text-gray-700">Mark as Popular</label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpenPlanModal(false);
                resetPlanForm();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold transition"
            >
              Create Plan
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Subscription Modal */}
      <Modal
        open={openSubscriptionModal}
        title="Create Subscription"
        onClose={() => {
          setOpenSubscriptionModal(false);
          resetSubscriptionForm();
        }}
        width="max-w-lg"
      >
        <form onSubmit={handleSubmitSubscription} className="space-y-4">
          <Input
            label="Client Name"
            value={subscriptionForm.clientName}
            onChange={(e) => setSubscriptionForm({ ...subscriptionForm, clientName: e.target.value })}
            placeholder="Company Name"
            required
          />
          <Input
            label="Client Email"
            type="email"
            value={subscriptionForm.clientEmail}
            onChange={(e) => setSubscriptionForm({ ...subscriptionForm, clientEmail: e.target.value })}
            placeholder="billing@company.com"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan</label>
            <select
              value={subscriptionForm.planId}
              onChange={(e) => {
                const plan = plans.find((p) => p.id === parseInt(e.target.value));
                setSubscriptionForm({
                  ...subscriptionForm,
                  planId: e.target.value,
                  planName: plan?.name || "",
                });
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              required
            >
              <option value="">Select a plan</option>
              {plans.filter((p) => p.isActive).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ₹{plan.price.toLocaleString()}/mo
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={subscriptionForm.startDate}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={subscriptionForm.endDate}
              onChange={(e) => setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setOpenSubscriptionModal(false);
                resetSubscriptionForm();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold transition"
            >
              Create Subscription
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={openViewModal}
        title={selectedItem?.price ? "Plan Details" : "Subscription Details"}
        onClose={() => {
          setOpenViewModal(false);
          setSelectedItem(null);
        }}
        width="max-w-lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            {selectedItem.price ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{selectedItem.name}</h3>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${PLAN_COLORS[selectedItem.color]?.badge || ""}`}>
                    {selectedItem.tier?.toUpperCase()}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-extrabold text-gray-900">₹{selectedItem.price?.toLocaleString()}</p>
                  <p className="text-gray-500">per month</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Max Employees</p>
                    <p className="font-semibold text-gray-900">{selectedItem.maxEmployees === -1 ? "Unlimited" : selectedItem.maxEmployees}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Storage</p>
                    <p className="font-semibold text-gray-900">{selectedItem.maxStorage}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                  <ul className="space-y-1">
                    {selectedItem.features?.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle size={14} className="text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{selectedItem.clientName}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[selectedItem.status]?.color}`}>
                    {STATUS_CONFIG[selectedItem.status]?.label}
                  </span>
                </div>
                <p className="text-gray-500">{selectedItem.clientEmail}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Plan</p>
                    <p className="font-semibold text-gray-900">{selectedItem.plan}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Price</p>
                    <p className="font-semibold text-gray-900">₹{selectedItem.price?.toLocaleString()}/mo</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Employees</p>
                    <p className="font-semibold text-gray-900">{selectedItem.employees}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500">Next Payment</p>
                    <p className="font-semibold text-gray-900">{selectedItem.nextPayment !== "-" ? dayjs(selectedItem.nextPayment).format("MMM D, YYYY") : "-"}</p>
                  </div>
                </div>
              </>
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
        title={`Delete ${deleteType === "plan" ? "Plan" : "Subscription"}`}
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
