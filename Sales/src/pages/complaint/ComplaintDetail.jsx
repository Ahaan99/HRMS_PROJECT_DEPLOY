import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
export default function ComplaintDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [reply, setReply] = useState("");
  const navigate = useNavigate();
  // 🔥 fetch detail
  const fetchDetail = async () => {
    try {
      const res = await API.get(`/complaints/${id}`);
      setData(res.data.data);
    } catch (err) {
      toast.error("Failed to load complaint");
    }
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      await fetchDetail();
    };

    load();
  }, [id]);

  // 🔥 get sender name
  const getSenderName = (r) => {
    return r.employee_name || r.client_name || "Unknown";
  };

  // 🔥 send reply
  const handleReply = async () => {
    if (!reply.trim()) return;

    try {
      await API.post(`/complaints/${id}/reply`, {
        message: reply,
      });

      toast.success("Reply added");
      setReply("");
      fetchDetail(); // refresh chat
    } catch (err) {
      toast.error("Reply failed");
    }
  };

  // 🔥 update status
  const handleStatus = async (status) => {
    try {
      await API.put(`/complaints/${id}/status`, { status });
      toast.success("Status updated");
      fetchDetail();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  // 🔥 loading safe
  if (!data || !data.complaint) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => navigate("/complaint")}
        className="text-sm text-blue-500 hover:underline mb-2"
      >
        ← Back to Complaints
      </button>

      {/* HEADER */}
      <div className="border-b pb-3">
        <h1 className="text-xl font-semibold">{data.complaint.title}</h1>

        <p className="text-gray-600 mt-1">{data.complaint.description}</p>
      </div>

      {/* META */}
      <div className="flex gap-4 text-sm text-gray-500">
        <span>Status: {data.complaint.status}</span>
        <span>Priority: {data.complaint.priority}</span>
      </div>

      {/* STATUS BUTTONS */}
      <div className="flex gap-2">
        <button
          onClick={() => handleStatus("in_progress")}
          className="px-3 py-1 bg-yellow-500 text-white rounded"
        >
          In Progress
        </button>

        <button
          onClick={() => handleStatus("resolved")}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Resolve
        </button>
      </div>

      {data.complaint.created_by_role === "hr" && (
        <p className="text-sm text-gray-400">Waiting for admin response...</p>
      )}

      {/* CHAT / REPLIES */}
      <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
        <h2 className="font-semibold">Conversation</h2>

        {data.replies?.length === 0 && (
          <p className="text-sm text-gray-400">No replies yet</p>
        )}

        {data.replies?.map((r) => (
          <div key={r.id} className="p-3 rounded-lg bg-white shadow-sm text-sm">
            <p className="font-semibold text-xs mb-1">
              {getSenderName(r)} ({r.sender_role})
            </p>

            <p>{r.message}</p>

            <p className="text-[10px] text-gray-400 mt-1">
              {new Date(r.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* REPLY BOX */}
      <div className="flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write reply..."
          className="flex-1 border p-2 rounded"
        />

        <button
          onClick={handleReply}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
