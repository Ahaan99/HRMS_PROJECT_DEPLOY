import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../services/api.js";
import toast from "react-hot-toast";

export default function LeadBatchDetail() {
  const { id } = useParams();
  const [leads, setLeads] = useState([]);

  const fetchLeads = async () => {
    try {
      const res = await API.get(`/super-admin/leads?batch_id=${id}`);
      setLeads(res.data.data);
    } catch {
      toast.error("Failed to load leads");
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [id]);

return (
  <div className="p-4 md:p-6 space-y-6">

    {/* HEADER */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <h1 className="text-xl md:text-2xl font-bold text-gray-800">
        Lead Details
      </h1>
      <span className="text-sm text-gray-500">
        Total: {leads.length}
      </span>
    </div>

    {/* DESKTOP TABLE */}
    <div className="hidden md:block bg-white rounded-2xl shadow border overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full text-sm">
        
        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Remarks</th>
          </tr>
        </thead>

        <tbody>
          {leads.map((l) => {
            const statusColor =
              l.status === "accepted"
                ? "bg-green-100 text-green-700"
                : l.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700";

            return (
              <tr key={l.id} className="border-t hover:bg-gray-50 transition">
                <td className="p-3 font-medium">{l.name}</td>
                <td className="p-3 text-gray-600">{l.phone}</td>

                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
                    {l.status}
                  </span>
                </td>

                <td className="p-3 text-gray-600">
                  {l.remarks || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </div>

    {/* MOBILE CARDS */}
    <div className="md:hidden space-y-4">
      {leads.map((l) => {
        const statusColor =
          l.status === "accepted"
            ? "bg-green-100 text-green-700"
            : l.status === "rejected"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";

        return (
          <div
            key={l.id}
            className="bg-white p-4 rounded-xl shadow border space-y-2"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">
                {l.name}
              </h2>
              <span className={`px-2 py-1 text-xs rounded-full ${statusColor}`}>
                {l.status}
              </span>
            </div>

            <p className="text-sm text-gray-600">
              📞 {l.phone}
            </p>

            <p className="text-sm text-gray-500">
              {l.remarks || "No remarks"}
            </p>
          </div>
        );
      })}
    </div>

    {/* EMPTY STATE */}
    {!leads.length && (
      <div className="text-center text-gray-400 py-10">
        No leads found in this batch
      </div>
    )}
  </div>
);
}