import dayjs from "dayjs";

export default function ExpenseTable({ expenses }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-semibold mb-4">Expense Records</h2>

      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">Category</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Date</th>
            <th className="p-2">Description</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-2">{e.category}</td>
              <td className="p-2">₹{e.amount}</td>
              <td className="p-2">
                {dayjs(e.range).format("DD MMM YYYY")}
              </td>{" "}
              <td className="p-2">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}
