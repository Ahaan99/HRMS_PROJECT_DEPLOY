import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function RevenueExpenseChart({ data }) {

  const chartData = [
    {
      name: "Finance",
      Revenue: data.revenue,
      Expenses: data.expenses
    }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <h2 className="font-semibold mb-4">
        Revenue vs Expenses
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Bar dataKey="Revenue" />
          <Bar dataKey="Expenses" />

        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}