import dayjs from "dayjs";
import { PieChart } from "lucide-react";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function ClientProfitAnalytics({ revenues, expenses }) {
  const today = dayjs();

  const calculate = (fromDate) => {
    const rev = revenues
      .filter((r) => dayjs(r.revenue_date).isAfter(fromDate))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const exp = expenses
      .filter((e) => dayjs(e.expense_date).isAfter(fromDate))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      revenue: rev,
      expenses: exp,
      profit: rev - exp,
    };
  };

  const todayData = calculate(today.startOf("day"));
  const weekData = calculate(today.subtract(7, "day"));
  const monthData = calculate(today.startOf("month"));

  const rows = [
    { label: "Today", ...todayData },
    { label: "Last 7 Days", ...weekData },
    { label: "This Month", ...monthData },
  ];

  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100 flex items-center justify-center">
          <PieChart className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="font-bold tracking-tight text-slate-900">
            Profit Analytics
          </p>
          <p className="text-xs text-slate-400">Period-wise breakdown</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {["Period", "Revenue", "Expenses", "Profit"].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-slate-100 last:border-0 hover:bg-indigo-50/40 transition-colors"
              >
                <td className="px-3 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                  {r.label}
                </td>
                <td className="px-3 py-3.5 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 text-xs font-semibold">
                    {inr(r.revenue)}
                  </span>
                </td>
                <td className="px-3 py-3.5 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-100 text-xs font-semibold">
                    {inr(r.expenses)}
                  </span>
                </td>
                <td
                  className={`px-3 py-3.5 font-bold whitespace-nowrap ${
                    r.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {inr(r.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
