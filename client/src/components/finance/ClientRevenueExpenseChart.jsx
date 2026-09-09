import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { BarChart3 } from "lucide-react";

export default function ClientRevenueExpenseChart({ data }) {
  const chartData = [
    {
      name: "Finance",
      Revenue: data.revenue,
      Expenses: data.expenses,
    },
  ];

  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="font-bold tracking-tight text-slate-900">
            Revenue vs Expenses
          </p>
          <p className="text-xs text-slate-400">Overall comparison</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} barGap={12}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => `₹${Number(value || 0).toLocaleString("en-IN")}`}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              fontSize: "13px",
            }}
            cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
          />

          <Bar
            dataKey="Revenue"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            maxBarSize={56}
          />
          <Bar
            dataKey="Expenses"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
            maxBarSize={56}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
