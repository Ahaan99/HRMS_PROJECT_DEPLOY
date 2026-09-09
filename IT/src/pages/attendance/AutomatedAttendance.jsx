import axios from "axios";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import StatCard from "../../components/common/StatCard";
import HRNavbar from "../../components/hr/HRNavbar";
import AttendanceTable from "../../components/attendance/AttendanceTable";
import AttendanceFilters from "../../components/attendance/AttendanceFilters";
import LocationCapture from "../../components/attendance/LocationCapture";
import OfficeLocation from "../../components/attendance/OfficeLocation";
import ShiftTimings from "../../components/attendance/ShiftTimings";
import { MapPin, Users, Settings, Clock, UserCheck, UserX, AlarmClock, Plane } from "lucide-react";

export default function AutomatedAttendance() {
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    onLeave: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    department: "",
    status: "",
  });

  const [activeTab, setActiveTab] = useState("attendance");
  const [officeLocations, setOfficeLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [shiftTimings, setShiftTimings] = useState([]);

  const token = localStorage.getItem("hrms_it_Token");
  const BASE = import.meta.env.VITE_API_BASE_URL;

const fetchAttendance = async () => {
  try {
    setLoading(true);

    const params = new URLSearchParams();

    if (filters.date) params.append("date", filters.date);
    if (filters.status) params.append("status", filters.status);

    // 🔥 ADD THIS (MISSING)
    if (filters.department) params.append("department", filters.department);

    const res = await axios.get(`${BASE}/hr/attendance?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = res?.data?.data || [];
    setRows(data);

    const present = data.filter((r) => r.status === "present").length;
    const absent = data.filter((r) => r.status === "absent").length;
    const late = data.filter((r) => r.status === "late").length;
    const onLeave = data.filter((r) => r.status === "on_leave").length;

    setStats({ present, absent, late, onLeave });

  } catch (err) {
    toast.error(err?.response?.data?.message || "Fetch failed");
    setRows([]);
  } finally {
    setLoading(false);
  }
};

  const saveOfficeLocations = async (locations) => {
    try {
      await axios.post(`${BASE}/hr/office-locations`, locations, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      toast.error("Failed to save office locations");
    }
  };

  const handleLocationVerified = (locationData) => {
    setCurrentLocation(locationData);
  };

  const fetchShiftTimings = async () => {
    try {
      const res = await axios.get(`${BASE}/hr/attendance/shift-timings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setShiftTimings(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch shifts");
      setShiftTimings([]);
    }
  };

  const saveShiftTimings = async (shifts) => {
    try {
      await axios.post(`${BASE}/hr/attendance/shift-timings`, shifts, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Shift updated");
      fetchShiftTimings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save shift timings");
      throw err;
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchShiftTimings();
  }, [filters]);

  const tabs = [
    { id: "attendance", label: "Attendance", icon: Users },
    { id: "shifts", label: "Shift Timings", icon: Clock },
  ];

  return (
    <div className="p-6 space-y-6">
      <HRNavbar />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">
          Automated Attendance
        </h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
              activeTab === tab.id
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "attendance" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Present"
              value={stats.present}
              subText="Employees present today"
              gradient="bg-gradient-to-tr from-emerald-500 to-teal-500"
              icon={<UserCheck size={20} />}
            />

            <StatCard
              title="Absent"
              value={stats.absent}
              subText="Employees absent today"
              gradient="bg-gradient-to-tr from-red-500 to-pink-500"
              icon={<UserX size={20} />}
            />

            <StatCard
              title="Late Arrivals"
              value={stats.late}
              subText="Arrived after 10:00 AM"
              gradient="bg-gradient-to-tr from-amber-500 to-orange-500"
              icon={<AlarmClock size={20} />}
            />

            <StatCard
              title="On Leave"
              value={stats.onLeave}
              subText="Approved leave today"
              gradient="bg-gradient-to-tr from-blue-500 to-indigo-500"
              icon={<Plane size={20} />}
            />
          </div>

          <AttendanceFilters filters={filters} onFilterChange={setFilters} />
          <AttendanceTable
            rows={rows}
            loading={loading}
            onRefresh={fetchAttendance}
            shifts={shiftTimings}
          />
        </>
      )}

      {activeTab === "check-in" && (
        <div className="max-w-2xl">
          <div className="grid gap-6">
            <LocationCapture
              onLocationVerified={handleLocationVerified}
              officeLocations={officeLocations}
            />

            {currentLocation && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Today's Check-In
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p
                      className={`font-medium ${
                        currentLocation.verified
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {currentLocation.verified ? "Verified" : "Not Verified"}
                    </p>
                  </div>
                  {currentLocation.office && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Office</p>
                        <p className="font-medium text-gray-800">
                          {currentLocation.office.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Distance</p>
                        <p className="font-medium text-gray-800">
                          {currentLocation.distance?.toFixed(2)} km
                        </p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Coordinates</p>
                    <p className="font-medium text-gray-800">
                      {currentLocation.latitude?.toFixed(6)},{" "}
                      {currentLocation.longitude?.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "locations" && (
        <div className="max-w-3xl">
          <OfficeLocation
            onSave={saveOfficeLocations}
            initialLocations={officeLocations}
          />
        </div>
      )}

      {activeTab === "shifts" && (
        <div className="max-w-3xl">
          <ShiftTimings
            onSave={saveShiftTimings}
            initialShifts={shiftTimings}
          />
        </div>
      )}
    </div>
  );
}
