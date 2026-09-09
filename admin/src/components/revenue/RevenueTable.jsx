import dayjs from "dayjs";

export default function RevenueTable({ revenues }) {
  return (
    <div className="bg-white shadow rounded-xl p-6">
      <h2 className="font-semibold mb-4">Revenue Records</h2>

      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Description</th>
          </tr>
        </thead>

        <tbody>
          {revenues.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-400">
                No revenue records
              </td>
            </tr>
          ) : (
            revenues.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.category}</td>
                <td className="p-2">₹{r.amount}</td>
                <td className="p-2">
                  {dayjs(r.range).format("DD MMM YYYY")}
                </td>
                <td className="p-2">{r.description}</td>
              </tr>
            ))
          )}
        </tbody>
      </table></div>
    </div>
  );
}
