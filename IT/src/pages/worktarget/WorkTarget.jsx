import API from "../../api/axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import StatCard from "../../components/common/StatCard";
import HRNavbar from "../../components/hr/HRNavbar";
import TargetFilters from "../../components/worktarget/TargetFilters";
import TargetTable from "../../components/worktarget/TargetTable";
import AddTargetModal from "../../components/worktarget/AddTargetModal";

export default function WorkTarget() {
  const [stats, setStats] = useState({
    active: 0,
    achieved: 0,
    inProgress: 0,
    missed: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({
    quarter: "Q1",
    year: new Date().getFullYear(),
    status: "",
    department: "",
  });

const fetchTargets = async () => {
  try {
    setLoading(true);

    const params = new URLSearchParams();

    if (filters.quarter) params.append("quarter", filters.quarter);
    if (filters.year) params.append("year", filters.year);
    if (filters.status) params.append("status", filters.status);
    if (filters.department) params.append("department", filters.department);

    const res = await API.get(`/hr/work-targets?${params}`);

    const data = res.data.data || [];

    setRows(data);
    calculateStats(data);
  } catch (err) {
    console.error(`FETCH ERROR: ${err}`);
    setRows([]); // ❌ no mock
  } finally {
    setLoading(false);
  }
};

  const calculateStats = (data) => {
    const active = data.filter((r) => r.status === "active").length;
    const achieved = data.filter((r) => r.status === "achieved").length;
    const inProgress = data.filter((r) => r.status === "in_progress").length;
    const missed = data.filter((r) => r.status === "missed").length;

    setStats({ active, achieved, inProgress, missed });
  };

  useEffect(() => {
    fetchTargets();
  }, [filters]);

  return (
    <div className="p-6 space-y-6">
      <HRNavbar />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Work Target Sheet</h2>
        <div className="text-sm text-gray-500">
          {filters.quarter} {filters.year} Targets
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Targets"
          value={stats.active}
          subText="Ongoing this quarter"
          gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
          icon="🎯"
        />

        <StatCard
          title="Achieved"
          value={stats.achieved}
          subText="Targets completed"
          gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
          icon="🏆"
        />

        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subText="Working towards goal"
          gradient="bg-gradient-to-tr from-yellow-500 to-orange-500"
          icon="⚡"
        />

        <StatCard
          title="Missed"
          value={stats.missed}
          subText="Targets not met"
          gradient="bg-gradient-to-tr from-red-500 to-pink-500"
          icon="❌"
        />
      </div>

      <div className="flex justify-between items-center">
        <TargetFilters filters={filters} onFilterChange={setFilters} />
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg transition"
        >
          + Set New Target
        </button>
      </div>

      <TargetTable rows={rows} loading={loading} onRefresh={fetchTargets} />

      <AddTargetModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={fetchTargets}
      />
    </div>
  );
}
