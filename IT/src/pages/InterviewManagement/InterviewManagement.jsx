import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import StatCard from "../../components/common/StatCard";
import HrInterviewTable from "../../components/hr/HrInterviewTable";
import AddInterviewModal from "../../components/hr/AddInterviewModal";
import EditInterviewModal from "../../components/hr/EditInterviewModal";
import HRNavbar from "../../components/hr/HRNavbar";

export default function InterviewManagement() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    scheduled: 0,
    selected: 0,
    joined: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editData, setEditData] = useState(null);
  const [locations, setLocations] = useState([]);

  const token = localStorage.getItem("hrms_it_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  // ================= FETCH LOCATION
  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/hr/interviews/locations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = res?.data?.data || [];
      setLocations(data);
    } catch (err) {
      console.log("Location fetch error:", err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // ================= FETCH DASHBOARD
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${BASE}/hr/interviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res?.data?.data || [];
      setRows(data);

      // 🔥 calculate stats (HR scoped already from backend)
      const totalCalls = data.length;
      const scheduled = data.filter((r) => r.interview_date).length;
      const selected = data.filter(
        (r) => r.client_status === "accepted",
      ).length;
      const joined = data.filter((r) => r.joined === "Yes").length

      setStats({
        totalCalls,
        scheduled,
        selected,
        joined,
      });
    } catch (err) {
      toast.error(`HR dashboard error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <HRNavbar />
        {/* ================= CARDS */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard
            title="Total Calls"
            value={stats.totalCalls}
            subText="All candidates handled"
            gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
            icon="📞"
          />

          <StatCard
            title="Scheduled Interview"
            value={stats.scheduled}
            subText="Interviews planned"
            gradient="bg-gradient-to-tr from-purple-500 to-indigo-500"
            icon="📅"
          />

          <StatCard
            title="Total Selected"
            value={stats.selected}
            subText="Approved by client"
            gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
            icon="✅"
          />

          <StatCard
            title="Joined"
            value={stats.joined}
            subText="⚠️ placeholder"
            gradient="bg-gradient-to-tr from-orange-500 to-pink-500"
            icon="🎯"
          />
        </div>

        <div className="flex justify-center sm:justify-end">
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base w-full sm:w-auto rounded-xl bg-indigo-600 text-white font-medium hover:opacity-90"
          >
            + Add Interview
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <HrInterviewTable
          rows={rows}
          loading={loading}
          onEdit={setEditData}
          locations={locations}
        />

        <AddInterviewModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchDashboard}
          locations={locations}
        />

        <EditInterviewModal
          open={!!editData}
          data={editData}
          onClose={() => setEditData(null)}
          onSuccess={fetchDashboard}
          locations={locations}
        />
      </div>
    </>
  );
}
