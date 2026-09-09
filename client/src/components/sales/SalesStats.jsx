import StatCard from "../common/StatCard";
import { Users, IndianRupee, BadgeCheck, AlertTriangle } from "lucide-react";

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Outstanding Amount"
        value={`₹${outstandingAmount}`}
        subText="Yet to be received"
        icon={<IndianRupee />}
        gradient="bg-gradient-to-r from-amber-500/30 to-orange-500/30"
      />

      <StatCard
        title="Total Clients"
        value={totalClients}
        subText="Unique purchasing clients"
        icon={<Users />}
        gradient="bg-gradient-to-r from-blue-500/90 to-cyan-500/90"
      />

      <StatCard
        title="Revenue Received"
        value={`₹${totalRevenue}`}
        subText="Total amount collected"
        icon={<IndianRupee />}
        gradient="bg-gradient-to-r from-emerald-500/90 to-green-500/90"
      />

      <StatCard
        title="Active Plans"
        value={activeSubscriptions}
        subText="Currently running subscriptions"
        icon={<BadgeCheck />}
        gradient="bg-gradient-to-r from-violet-500/90 to-purple-500/90"
      />

      <StatCard
        title="Due Date Over"
        value={overduePayments}
        subText="Payment pending after due date"
        icon={<AlertTriangle />}
        gradient="bg-gradient-to-r from-red-500/90 to-rose-500/90"
      />
    </div>
  );
};

export default SalesStats;
