import dayjs from "dayjs";

export default function ProfitAnalyticsTable({ revenues, expenses }) {

  const today = dayjs();

  const calculate = (fromDate) => {

    const rev = revenues
      .filter(r => dayjs(r.revenue_date).isAfter(fromDate))
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const exp = expenses
      .filter(e => dayjs(e.expense_date).isAfter(fromDate))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      revenue: rev,
      expenses: exp,
      profit: rev - exp
    };
  };

  const todayData = calculate(today.startOf("day"));
  const weekData = calculate(today.subtract(7, "day"));
  const monthData = calculate(today.startOf("month"));

  const rows = [
    {
      period: "Today",
      range: today.format("DD MMM YYYY"),
      ...todayData
    },
    {
      period: "Last 7 Days",
      range: `${today.subtract(7,"day").format("DD MMM")} - ${today.format("DD MMM")}`,
      ...weekData
    },
    {
      period: "This Month",
      range: today.format("MMMM YYYY"),
      ...monthData
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow p-5">

      <h2 className="font-semibold mb-4">Profit Analytics</h2>

      <div className="overflow-x-auto"><table className="w-full text-sm">

        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Period</th>
            <th className="p-2">Date Range</th>
            <th className="p-2">Revenue</th>
            <th className="p-2">Expenses</th>
            <th className="p-2">Profit</th>
          </tr>
        </thead>

        <tbody>

          {rows.map((r,i) => (

            <tr key={i} className="border-t">

              <td className="p-2">{r.period}</td>
              <td className="p-2">{r.range}</td>
              <td className="p-2 text-green-600">₹{r.revenue}</td>
              <td className="p-2 text-red-600">₹{r.expenses}</td>
              <td className="p-2 font-semibold">₹{r.profit}</td>

            </tr>

          ))}

        </tbody>

      </table></div>

    </div>
  );
}