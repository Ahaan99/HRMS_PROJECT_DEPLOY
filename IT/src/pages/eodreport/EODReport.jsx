import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import StatCard from "../../components/common/StatCard";
import HRNavbar from "../../components/hr/HRNavbar";
import EODFilters from "../../components/eodreport/EODFilters";
import EODTable from "../../components/eodreport/EODTable";

export default function EODReport() {
  const [stats, setStats] = useState({
    submitted: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "",
    department: "",
  });

  const token = localStorage.getItem("hrms_it_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.date) params.append("date", filters.date);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);

      const res = await axios.get(`${BASE}/hr/eod-reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res?.data?.data || res?.data || [];
      setRows(data);
      calculateStats(data);
    } catch (err) {
      toast.error(`EOD reports fetch error: ${err}`);
      setRows(mockEODData);
      calculateStats(mockEODData);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const submitted = data.filter((r) => r.status === "submitted").length;
    const pending = data.filter((r) => r.status === "pending").length;
    const approved = data.filter((r) => r.status === "approved").length;
    const rejected = data.filter((r) => r.status === "rejected").length;

    setStats({ submitted, pending, approved, rejected });
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

  return (
    <div className="p-6 space-y-6">
      <HRNavbar />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">EOD Report Submission</h2>
        <div className="text-sm text-gray-500">
          Track daily work summaries
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Submitted Today"
          value={stats.submitted}
          subText="Reports submitted"
          gradient="bg-gradient-to-tr from-blue-500 to-cyan-500"
          icon="📤"
        />

        <StatCard
          title="Pending Review"
          value={stats.pending}
          subText="Awaiting approval"
          gradient="bg-gradient-to-tr from-yellow-500 to-orange-500"
          icon="⏳"
        />

        <StatCard
          title="Approved"
          value={stats.approved}
          subText="Reports approved"
          gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
          icon="✅"
        />

        <StatCard
          title="Rejected"
          value={stats.rejected}
          subText="Need revision"
          gradient="bg-gradient-to-tr from-red-500 to-pink-500"
          icon="❌"
        />
      </div>

      <EODFilters filters={filters} onFilterChange={setFilters} />

      <EODTable rows={rows} loading={loading} onRefresh={fetchReports} />
    </div>
  );
}

const mockEODData = [
  { id: 1, reportId: "EOD001", employee: "John Smith", employeeId: "EMP001", department: "Engineering", date: new Date().toISOString().split("T")[0], tasksCompleted: 5, tasksInProgress: 2, hoursWorked: 9.5, summary: "Completed CRM update, fixed 3 bugs, code review for team", status: "submitted", submittedAt: "06:30 PM" },
  { id: 2, reportId: "EOD002", employee: "Sarah Johnson", employeeId: "EMP002", department: "Marketing", date: new Date().toISOString().split("T")[0], tasksCompleted: 4, tasksInProgress: 1, hoursWorked: 8.5, summary: "Prepared Q1 report, scheduled social posts, client meeting", status: "pending", submittedAt: "05:45 PM" },
  { id: 3, reportId: "EOD003", employee: "Mike Davis", employeeId: "EMP003", department: "Sales", date: new Date().toISOString().split("T")[0], tasksCompleted: 8, tasksInProgress: 3, hoursWorked: 10, summary: "Closed 2 deals, follow-ups with 5 prospects, demo presentation", status: "approved", submittedAt: "06:00 PM" },
  { id: 4, reportId: "EOD004", employee: "Emily Brown", employeeId: "EMP004", department: "HR", date: new Date().toISOString().split("T")[0], tasksCompleted: 3, tasksInProgress: 1, hoursWorked: 8, summary: "Processed 4 payrolls, interviews scheduled, onboarding docs", status: "approved", submittedAt: "05:30 PM" },
  { id: 5, reportId: "EOD005", employee: "David Wilson", employeeId: "EMP005", department: "Engineering", date: new Date().toISOString().split("T")[0], tasksCompleted: 2, tasksInProgress: 3, hoursWorked: 7, summary: "Started server migration, debugged API issues", status: "rejected", submittedAt: "04:30 PM", feedback: "Please add more details about the migration progress" },
  { id: 6, reportId: "EOD006", employee: "Lisa Anderson", employeeId: "EMP006", department: "Finance", date: new Date().toISOString().split("T")[0], tasksCompleted: 6, tasksInProgress: 1, hoursWorked: 9, summary: "Reconciled accounts, prepared budget report, vendor payments", status: "submitted", submittedAt: "06:15 PM" },
];
