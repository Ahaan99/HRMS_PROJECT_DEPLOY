import { useEffect, useState } from "react";
import API from "../../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import HRNavbar from "../../components/hr/HRNavbar";

export default function LeadList() {
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();

  const fetchBatches = async () => {
    try {
      const res = await API.get("/hr/leads/batches");
      setBatches(res.data.data || []);
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch batches");
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  return (
    <div className="p-6 space-y-6">
    <HRNavbar />
      <h1 className="text-2xl font-bold">My Leads</h1>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {batches.map((b) => {
          const progress = b.total
            ? Math.round((b.completed / b.total) * 100)
            : 0;

          return (
            <div
              key={b.id}
              onClick={() => navigate(`/leads/${b.id}`)}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg cursor-pointer hover:scale-105 transition"
            >
              <h2 className="font-bold text-lg">{b.file_name}</h2>

              <p className="text-sm mt-2">
                📅 {new Date(b.created_at).toDateString()}
              </p>

              <div className="mt-4">
                <div className="h-2 bg-white/30 rounded">
                  <div
                    className="h-2 bg-white rounded"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs mt-2">
                  {b.completed} / {b.total} done
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!batches.length && (
        <p className="text-gray-400 text-center">No leads assigned</p>
      )}
    </div>
  );
}