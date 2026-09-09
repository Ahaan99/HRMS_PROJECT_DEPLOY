import { useState } from "react";
import { Siren } from "lucide-react";
import toast from "react-hot-toast";
import API from "../../api/axios";

/**
 * One-tap emergency alert. Raises an alert that Super Admin (Emergency Alerts page)
 * and HR (dashboard panel) see immediately. Two taps are required so a mis-click
 * on mobile does not page the whole company.
 */
export default function EmergencyButton() {
  const [armed, setArmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    try {
      setLoading(true);
      const res = await API.post("/emergency", {});
      toast.success(res.data?.msg || res.data?.message || "Emergency alert sent");
    } catch (err) {
      toast.error(err.response?.data?.msg || err.response?.data?.message || "Emergency alert failed");
    } finally {
      setLoading(false);
      setArmed(false);
    }
  };

  if (armed) {
    return (
      <div className="flex items-center gap-2" role="group" aria-label="Confirm emergency alert">
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Confirm alert"}
        </button>
        <button
          type="button"
          onClick={() => setArmed(false)}
          disabled={loading}
          className="rounded-xl border border-gray-200 bg-white/60 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setArmed(true)}
      aria-label="Raise emergency alert"
      title="Raise emergency alert"
      className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-600 hover:text-white"
    >
      <Siren size={16} aria-hidden="true" />
      <span className="hidden sm:inline">Emergency</span>
    </button>
  );
}
