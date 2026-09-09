import { useEffect, useState } from "react";
import axios from "axios";
import { Clock, Download } from "lucide-react";

export default function AttendanceFilters({ filters, onFilterChange }) {
  const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem("hrms_it_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (key, value) => {
    onFilterChange((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${BASE}/hr/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDepartments(res?.data?.departments || []);
      } catch (err) {
        console.error("Department fetch failed", err);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl px-6 py-4 shadow-lg">
      <div className="flex flex-wrap items-center gap-4">

        {/* DATE */}
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>

        {/* DEPARTMENT */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Department</label>
          <select
            value={filters.department}
            onChange={(e) => handleChange("department", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">All Departments</option>

            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        <div className="flex-1" />

        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  );
}