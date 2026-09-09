import {
  Users,
  IndianRupee,
  BadgeCheck,
  AlertTriangle,
  Wallet,
} from "lucide-react";

const SalesStats = ({ sales = [] }) => {
  // ===== aggregation =====
  const totalRevenue = sales.reduce(
    (sum, s) => sum + Number(s.amount_paid || 0),
    0,
  );

  const activeSubscriptions = sales.filter(
    (s) => s.subscription_status === "active",
  ).length;

  const overduePayments = sales.filter((s) => {
    const due = new Date(s.due_date);
    const today = new Date();
    return s.payment_status !== "paid" && due < today;
  }).length;

  const totalClients = new Set(sales.map((s) => s.client_id)).size;

  const outstandingAmount = sales.reduce((sum, s) => {
    const remaining = Number(s.amount || 0) - Number(s.amount_paid || 0);
    return sum + (remaining > 0 ? remaining : 0);
  }, 0);

  const stats = [
    {
      title: "Outstanding Amount",
      value: `\u20B9${outstandingAmount.toLocaleString("en-IN")}`,
      subText: "Yet to be received",
      icon: Wallet,
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
      accent: "from-amber-500 to-orange-500",
      glow: "hover:shadow-amber-100",
    },
    {
      title: "Total Clients",
      value: totalClients,
      subText: "Unique purchasing clients",
      icon: Users,
      iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
      accent: "from-blue-500 to-cyan-500",
      glow: "hover:shadow-blue-100",
    },
    {
      title: "Revenue Received",
      value: `\u20B9${totalRevenue.toLocaleString("en-IN")}`,
      subText: "Total amount collected",
      icon: IndianRupee,
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
      accent: "from-emerald-500 to-green-500",
      glow: "hover:shadow-emerald-100",
    },
    {
      title: "Active Plans",
      value: activeSubscriptions,
      subText: "Currently running subscriptions",
      icon: BadgeCheck,
      iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
      accent: "from-violet-500 to-purple-500",
      glow: "hover:shadow-violet-100",
    },
    {
      title: "Due Date Over",
      value: overduePayments,
      subText: "Payment pending after due date",
      icon: AlertTriangle,
      iconBg: "bg-gradient-to-br from-rose-500 to-red-500",
      accent: "from-rose-500 to-red-500",
      glow: "hover:shadow-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${stat.glow}`}
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {stat.title}
                </p>
                <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {stat.subText}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon size={19} aria-hidden="true" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SalesStats;
