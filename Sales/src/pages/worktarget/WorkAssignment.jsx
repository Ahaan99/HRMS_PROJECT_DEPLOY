import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import API from "../../api/axios";

import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import WorkAssignmentFilters from "../../components/workassignment/WorkAssignmentFilters";
import WorkAssignmentTable from "../../components/workassignment/WorkAssignmentTable";
import {  ClipboardList,
  Loader,
  CheckCircle2,
  AlarmClockOff,
  RefreshCw,
} from "lucide-react";

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
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    department: "",
  });

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v),
      );

      const query = new URLSearchParams(cleanFilters).toString();

      const res = await API.get(`/sales/work-assignment?${query}`);
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
    <div className="space-y-6 p-6">
      <PageHeader
        title="Automated Work Assignment"
        desc="Auto-assign & track employee tasks"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned"
          value={stats.assigned}
          subText="New tasks assigned"
          gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
          icon={<ClipboardList aria-hidden="true" />}
        />

        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subText="Tasks being worked on"
          gradient="bg-gradient-to-tr from-amber-500 to-orange-500"
          icon={<Loader aria-hidden="true" />}
        />

        <StatCard
          title="Completed"
          value={stats.completed}
          subText="Tasks finished"
          gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
          icon={<CheckCircle2 aria-hidden="true" />}
        />

        <StatCard
          title="Overdue"
          value={stats.overdue}
          subText="Past deadline"
          gradient="bg-gradient-to-tr from-rose-500 to-pink-500"
          icon={<AlarmClockOff aria-hidden="true" />}
        />
      </div>

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

      <WorkAssignmentFilters filters={filters} onFilterChange={setFilters} />

      <WorkAssignmentTable
        rows={assignments}
        loading={loading}
        onRefresh={fetchAssignments}
      />
    </div>
  );
}
