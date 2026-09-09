import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function EmergencyButton() {
  const [loading, setLoading] = useState(false);
  const BASE = import.meta.env.VITE_API_BASE_URL;
  const handleEmergency = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("hrms_it_Token");

      const res = await axios.post(
        `${BASE}/emergency`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success(res.data.msg);
    } catch (err) {
      console.error(err);
      toast.error("Emergency failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleEmergency}
      disabled={loading}
      className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base w-full sm:w-auto"
    >
      {loading ? "Sending..." : "Emergency"}
    </button>
  );
}
