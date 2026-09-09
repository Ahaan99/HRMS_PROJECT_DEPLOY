import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import API from "../../api/axios";

import StatCard from "../../components/common/StatCard";
import HRNavbar from "../../components/hr/HRNavbar";
import WorkAssignmentFilters from "../../components/workassignment/WorkAssignmentFilters";
import WorkAssignmentTable from "../../components/workassignment/WorkAssignmentTable";
import AssignWorkModal from "../../components/workassignment/AssignWorkModal";

export default function WorkAssignment() {
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    department: "",
  });

const fetchAssignments = async () => {
  try {
    setLoading(true);

    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v)
    );

    const query = new URLSearchParams(cleanFilters).toString();

    const res = await API.get(`/hr/work-assignment?${query}`);

    const data = res.data.data || [];

    setAssignments(data);
      calculateStats(data);
      setLastUpdated(new Date());
  } catch (err) {
    console.error("FETCH ERROR:", err);
      toast.error(err.response?.data?.message || "Failed to load work assignments");
  } finally {
    setLoading(false);
  }
};

  const calculateStats = (data) => {
    const assigned = data.filter((r) => r.status === "assigned").length;
    const inProgress = data.filter((r) => r.status === "in_progress").length;
    const completed = data.filter((r) => r.status === "completed").length;
    const overdue = data.filter((r) => r.status === "overdue").length;

    setStats({ assigned, inProgress, completed, overdue });
  };

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  return (
    <div className="p-6 space-y-6">
      <HRNavbar />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Automated Work Assignment
        </h2>
        <div className="text-sm text-gray-500">
          Auto-assign & track employee tasks
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned"
          value={stats.assigned}
          subText="New tasks assigned"
          gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
          icon="📋"
        />

        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subText="Tasks being worked on"
          gradient="bg-gradient-to-tr from-yellow-500 to-orange-500"
          icon="⚙️"
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          subText="Tasks finished"
          gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
          icon="✅"
        />

        <StatCard
          title="Overdue"
          value={stats.overdue}
          subText="Past deadline"
          gradient="bg-gradient-to-tr from-red-500 to-pink-500"
          icon="⏰"
        />
      </div>

      <div className="flex justify-between items-center">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500" aria-live="polite">
          {lastUpdated
            ? `Last updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Loading assignments..."}
        </p>
        <button
          type="button"
          onClick={fetchAssignments}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

        <WorkAssignmentFilters
          filters={filters}
          onFilterChange={setFilters}
          onChange={setFilters}
        />
        <button
          onClick={() => setShowAssign(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg transition"
        >
          + Assign New Task
        </button>
      </div>

      <WorkAssignmentTable
        rows={assignments}
        loading={loading}
        onRefresh={fetchAssignments}
      />

      <AssignWorkModal
        open={showAssign}
        onClose={() => setShowAssign(false)}
        onSuccess={fetchAssignments}
      />
    </div>
  );
}
