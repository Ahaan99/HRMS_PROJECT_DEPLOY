import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import axios from "axios";
import {
  Clock,
  LogIn,
  LogOut,
  Users,
  Calendar,
  Settings,
  Search,
  Plus,
  Edit2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Monitor,
  CalendarClock,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/ui/Modal";
import StatCard from "../../components/common/StatCard";

export default function LoginTimeSettings() {
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(0);

  const [openSetTimeModal, setOpenSetTimeModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("hrms_admin_token");
  const [globalSettings, setGlobalSettings] = useState({
    defaultLoginTime: "09:30",
    defaultLogoutTime: "18:00",
    gracePeriod: 10,
    allowLateLogin: true,
    allowEarlyLogout: false,
    overtimeApprovalRequired: true,
    halfDayThreshold: 240,
    lateThreshold: 15,
    flexiHoursEnabled: false,
    flexiStartTime: "08:00",
    flexiEndTime: "20:00",
  });

  const [employeeSettings, setEmployeeSettings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);

  const [timeForm, setTimeForm] = useState({
    employeeId: "",
    employeeName: "",
    loginTime: "09:30",
    logoutTime: "18:00",
    isCustom: false,
    isFlexible: false,
    flexiStartTime: "08:00",
    flexiEndTime: "20:00",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  // ONLY IMPORTANT CHANGES SHOWN — UI untouched, only logic replaced

  // =========================
  // LOAD DATA (REPLACED)
  // =========================
  const loadData = async () => {
    try {
      setLoading(true);

      const [settingsRes, logsRes, todayRes, empRes, , shiftsRes] = await Promise.all([
        axios.get(`${BASE_URL}/super-admin/login-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/login-settings/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/login-settings/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/super-admin/login-settings/shifts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const calculateHours = (login, logout) => {
  if (!login || !logout || login === "00:00:00" || logout === "00:00:00") {
    return null;
  }

  let start = new Date(`1970-01-01T${login}`);
  let end = new Date(`1970-01-01T${logout}`);

  // 🔥 FIX: if logout < login → next day
  if (end <= start) {
    end = new Date(`1970-01-02T${logout}`);
  }

  const diff = (end - start) / 3600000;

  return diff > 0 ? diff : null;
};
      // 🔥 GLOBAL SETTINGS
      setGlobalSettings({
        defaultLoginTime:
          settingsRes.data.global?.default_login_time || "09:30",
        defaultLogoutTime:
          settingsRes.data.global?.default_logout_time || "18:00",
        gracePeriod: settingsRes.data.global?.grace_period ?? 10,
        lateThreshold: settingsRes.data.global?.late_threshold ?? 15,
        allowLateLogin: settingsRes.data.global?.allow_late_login ?? true,
        allowEarlyLogout: settingsRes.data.global?.allow_early_logout ?? false,
        overtimeApprovalRequired:
          settingsRes.data.global?.overtime_approval_required ?? true,
        flexiHoursEnabled:
          settingsRes.data.global?.flexi_hours_enabled ?? false,
        flexiStartTime: settingsRes.data.global?.flexi_start_time || "08:00",
        flexiEndTime: settingsRes.data.global?.flexi_end_time || "20:00",
      });
      // 🔥 EMPLOYEE SETTINGS
      setEmployeeSettings(
        settingsRes.data.employeeSettings.map((e) => ({
          id: e.id,
          employeeId: e.employeeCode,
          employeeName: e.name,
          department: e.department,
          shiftId: e.shift_id ?? null,
          shiftName: e.shift_name || null,
          loginTime: e.login_time || "—",
          logoutTime: e.logout_time || "—",
          isCustom: !!e.is_custom,
          isFlexible: !!e.is_flexible,
          flexiStartTime: e.flexi_start_time || "08:00",
          flexiEndTime: e.flexi_end_time || "20:00",
          lastUpdated: e.updated_at?.split("T")[0] || "-",
        })),
      );
      // 🔥 LOGS
setLoginLogs(
  logsRes.data.data.map((l) => {
    const hours = calculateHours(l.check_in, l.check_out);

    return {
      id: l.id,
      employeeName: l.name,
      employeeId: l.employeeCode,
      date: l.date,
      loginTime: l.check_in === "00:00:00" ? "" : l.check_in,
      logoutTime: l.check_out === "00:00:00" ? "" : l.check_out,
      workedHours: hours,
      status:
        l.check_in && l.check_in !== "00:00:00"
          ? "present"
          : "absent",
    };
  })
);
setTodayLogs(
  todayRes.data.data.map((l) => {
    const login = l.check_in;
    const logout = l.check_out;

    const hours = calculateHours(login, logout);

    let status = "absent";

    if (login && login !== "00:00:00") {
      if (!logout || logout === "00:00:00") {
        status = "active";
      } else if (hours < 4) {
        status = "half-day";
      } else {
        status = "present";
      }
    }

    return {
      id: l.id,
      employeeId: l.employeeCode,
      employeeName: l.name,
      loginTime: login === "00:00:00" ? "" : login,
      logoutTime: logout === "00:00:00" ? "" : logout,
      workedHours: hours,
      status,
    };
  })
);
      // 🔥 EMPLOYEES
      setEmployees(empRes.data.data);
      setShifts(shiftsRes.data?.data || []);
      setUnassignedCount(shiftsRes.data?.unassigned ?? 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employeeSettings.filter((e) => {
      const matchSearch =
        search === "" ||
        e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(search.toLowerCase());

      const matchDept =
        departmentFilter === 0 || e.departmentId === departmentFilter;

      return matchSearch && matchDept;
    });
  }, [employeeSettings, search, departmentFilter]);

  const stats = useMemo(() => {
    const today = todayLogs || [];

    return {
      totalEmployees: employees?.length || 0,

      loggedIn: today.filter((l) => l.loginTime).length,

      activeNow: today.filter((l) => l.status === "active").length,

      notLoggedIn: today.filter((l) => !l.loginTime).length,

      avgWorkedHours:
        today.filter((l) => l.workedHours).length > 0
          ? today
              .filter((l) => l.workedHours)
              .reduce((sum, l) => sum + l.workedHours, 0) /
            today.filter((l) => l.workedHours).length
          : 0,
    };
  }, [todayLogs, employees]);

  const handleOpenSetTime = (emp) => {
    const existing = employeeSettings.find((e) => e.id === emp.id);
    setSelectedEmployee(emp);
    setTimeForm({
      employeeId: emp.employeeId,
      employeeName: emp.name,
      loginTime: existing?.loginTime || globalSettings.defaultLoginTime,
      logoutTime: existing?.logoutTime || globalSettings.defaultLogoutTime,
      isCustom: existing?.isCustom || false,
      isFlexible: existing?.isFlexible || false,
      flexiStartTime: existing?.flexiStartTime || "08:00",
      flexiEndTime: existing?.flexiEndTime || "20:00",
      notes: "",
    });
    setOpenSetTimeModal(true);
  };

  const handleSaveTimeSettings = async () => {
    try {
      await axios.post(
        `${BASE_URL}/super-admin/login-settings/employee`,
        {
          employee_id: selectedEmployee.id,
          ...timeForm,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Saved successfully");
      setOpenSetTimeModal(false);
      loadData();
    } catch (err) {
      toast.error("Save failed");
    }
  };

  
  const handleAssignShift = async (emp, value) => {
    const shiftId = value === "" ? null : Number(value);
    try {
      await axios.put(
        `${BASE_URL}/super-admin/login-settings/employee/${emp.id}/shift`,
        { shift_id: shiftId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEmployeeSettings((prev) =>
        prev.map((e) =>
          e.id === emp.id
            ? { ...e, shiftId, shiftName: shifts.find((s) => s.id === shiftId)?.name || null }
            : e,
        ),
      );
      toast.success(shiftId ? `${emp.employeeName} moved to ${shifts.find((s) => s.id === shiftId)?.name}` : "Shift cleared - follows default");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not assign shift");
    }
  };

  // The minute after which a check-in is marked LATE for this shift.
  const lateAfter = (s) => {
    const [h, m] = String(s.check_in_end).split(":").map(Number);
    const t = h * 60 + m + Number(s.grace_minutes || 0);
    return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };

  const handleSaveGlobalSettings = async () => {
    try {
      await axios.put(
        `${BASE_URL}/super-admin/login-settings/global`,
        globalSettings,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Global settings saved");
    } catch (err) {
      toast.error("Save failed");
    }
  };
  const getStatusBadge = (status) => {
    if (status === "present")
      return {
        label: "Present",
        color: "bg-green-100 text-green-700",
        icon: CheckCircle,
      };
    if (status === "late")
      return {
        label: "Late",
        color: "bg-orange-100 text-orange-700",
        icon: AlertCircle,
      };
    if (status === "active")
      return {
        label: "Active Now",
        color: "bg-blue-100 text-blue-700",
        icon: Monitor,
      };
    if (status === "absent")
      return {
        label: "Absent",
        color: "bg-red-100 text-red-700",
        icon: XCircle,
      };
    if (status === "half-day")
  return { label: "Half Day", color: "bg-yellow-100 text-yellow-700", icon: AlertCircle };
    return {
      label: "Unknown",
      color: "bg-gray-100 text-gray-700",
      icon: Clock,
    };
  };

  const tabs = [
    { id: "settings", label: "Global Settings", icon: Settings },
    { id: "employees", label: "Employee Times", icon: Users },
    { id: "shifts", label: "Shifts", icon: CalendarClock },
    { id: "today", label: "Today's Logs", icon: Calendar },
    { id: "history", label: "Login History", icon: Clock },
  ];

  return (
    <div>
      <PageHeader
        title="Login & Logout Time Settings"
        desc="Set default and custom login/logout times for employees. Track attendance patterns."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={<Users size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Logged In"
          value={stats.loggedIn}
          icon={<LogIn size={20} />}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          title="Active Now"
          value={stats.activeNow}
          icon={<Monitor size={20} />}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Not Logged In"
          value={stats.notLoggedIn}
          icon={<LogOut size={20} />}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          title="Avg Hours"
          value={stats.avgWorkedHours.toFixed(1) + "h"}
          icon={<Clock size={20} />}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-auto max-h-[60vh]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Default Working Hours
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              APPLIES TO ALL
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LogIn size={16} className="inline mr-2" />
                Default Login Time
              </label>
              <input
                type="time"
                value={globalSettings.defaultLoginTime || ""}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    defaultLoginTime: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                All employees will be expected to login by this time
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LogOut size={16} className="inline mr-2" />
                Default Logout Time
              </label>
              <input
                type="time"
                value={globalSettings.defaultLogoutTime || ""}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    defaultLogoutTime: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Standard logout time for all employees
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grace Period (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={globalSettings.gracePeriod || ""}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    gracePeriod: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Late arrivals within grace period won't be marked as late
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Late Threshold (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={globalSettings.lateThreshold || ""}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    lateThreshold: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Employees arriving after this will be marked as late
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">
              Policy Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Allow Late Login</p>
                  <p className="text-sm text-gray-500">
                    Allow employees to login late
                  </p>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings({
                      ...globalSettings,
                      allowLateLogin: !globalSettings.allowLateLogin,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition ${globalSettings.allowLateLogin ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition transform ${globalSettings.allowLateLogin ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">
                    Allow Early Logout
                  </p>
                  <p className="text-sm text-gray-500">
                    Allow employees to logout early
                  </p>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings({
                      ...globalSettings,
                      allowEarlyLogout: !globalSettings.allowEarlyLogout,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition ${globalSettings.allowEarlyLogout ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition transform ${globalSettings.allowEarlyLogout ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Overtime Approval</p>
                  <p className="text-sm text-gray-500">
                    Require approval for overtime
                  </p>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings({
                      ...globalSettings,
                      overtimeApprovalRequired:
                        !globalSettings.overtimeApprovalRequired,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition ${globalSettings.overtimeApprovalRequired ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition transform ${globalSettings.overtimeApprovalRequired ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Flexible Hours</p>
                  <p className="text-sm text-gray-500">
                    Enable flexible working hours
                  </p>
                </div>
                <button
                  onClick={() =>
                    setGlobalSettings({
                      ...globalSettings,
                      flexiHoursEnabled: !globalSettings.flexiHoursEnabled,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition ${globalSettings.flexiHoursEnabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition transform ${globalSettings.flexiHoursEnabled ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {globalSettings.flexiHoursEnabled && (
            <div className="border-t border-gray-100 pt-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Flexible Hours Window
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Earliest Login
                  </label>
                  <input
                    type="time"
                    value={globalSettings.flexiStartTime || ""}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        flexiStartTime: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latest Logout
                  </label>
                  <input
                    type="time"
                    value={globalSettings.flexiEndTime || ""}
                    onChange={(e) =>
                      setGlobalSettings({
                        ...globalSettings,
                        flexiEndTime: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSaveGlobalSettings}
              className="flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-semibold transition"
            >
              <Save size={18} />
              Save Global Settings
            </button>
          </div>
        </div>
      )}

      {/* Employee Times Tab */}
      {activeTab === "employees" && (
        <>
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full md:w-80 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(Number(e.target.value))}
                className="w-full md:w-48 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value={0}>All Departments</option>

                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-5 py-4 font-semibold">
                      Employee
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Department
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Shift
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Login Time
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Logout Time
                    </th>
                    <th className="text-left px-5 py-4 font-semibold">Type</th>
                    <th className="text-left px-5 py-4 font-semibold">
                      Last Updated
                    </th>
                    <th className="text-right px-5 py-4 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {emp.employeeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {emp.employeeId}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {emp.department}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={emp.shiftId ?? ""}
                          onChange={(e) => handleAssignShift(emp, e.target.value)}
                          aria-label={`Shift for ${emp.employeeName}`}
                          className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-black"
                        >
                          <option value="">
                            {shifts[0] ? `Default (${shifts[0].name})` : "Default"}
                          </option>
                          {shifts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 font-semibold text-green-700">
                          <LogIn size={14} />
                          {emp.loginTime}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 font-semibold text-red-700">
                          <LogOut size={14} />
                          {emp.logoutTime}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {emp.isFlexible ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">
                            FLEXIBLE
                          </span>
                        ) : emp.isCustom ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                            CUSTOM
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg">
                            DEFAULT
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {emp.lastUpdated}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenSetTime(emp)}
                          className="px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition"
                        >
                          Set Time
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Shifts Tab (read-only mirror of IT/HR -> Automated Attendance -> Shift Timings) */}
      {activeTab === "shifts" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900">Shift Timings</h3>
              <p className="text-sm text-gray-500 mt-1">
                Defined by the IT / HR team under Automated Attendance &rarr; Shift Timings.
                Assign each employee to a shift in the Employee Times tab; unassigned employees follow the first shift.
              </p>
            </div>
            <span
              className={`self-start md:self-center whitespace-nowrap px-3 py-1 text-xs font-bold rounded-full ${
                unassignedCount ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
              }`}
            >
              {unassignedCount} unassigned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shifts.map((s, i) => (
              <div key={s.id} className="bg-white rounded-2xl shadow border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{s.name}</p>
                    {i === 0 && (
                      <p className="text-[11px] font-bold text-blue-700 mt-0.5">DEFAULT FOR UNASSIGNED</p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg whitespace-nowrap">
                    {s.assigned_count} {Number(s.assigned_count) === 1 ? "employee" : "employees"}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500">Login window</dt>
                    <dd className="font-semibold text-green-700">{s.check_in_start} &ndash; {s.check_in_end}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Logout window</dt>
                    <dd className="font-semibold text-red-700">{s.check_out_start} &ndash; {s.check_out_end}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Grace</dt>
                    <dd className="font-semibold text-gray-900">{s.grace_minutes} min</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Marked late after</dt>
                    <dd className="font-semibold text-orange-700">{lateAfter(s)}</dd>
                  </div>
                </dl>
              </div>
            ))}
            {!shifts.length && (
              <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
                No shifts configured yet. Ask the IT or HR team to add them under Automated Attendance.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Logs Tab */}
      {activeTab === "today" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">
              Today's Login/Logout Logs
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {dayjs().format("DD MMM YYYY")}
            </span>
          </div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">
                    Employee
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Login Time
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Logout Time
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">
                    Hours Worked
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log) => {
                  const status = getStatusBadge(log.status);
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={log.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {log.employeeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.employeeId}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {log.loginTime ? (
                          <span className="flex items-center gap-2 text-green-700 font-semibold">
                            <LogIn size={14} />
                            {log.loginTime}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not Logged In</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {log.logoutTime ? (
                          <span className="flex items-center gap-2 text-red-700 font-semibold">
                            <LogOut size={14} />
                            {log.logoutTime}
                          </span>
                        ) : (
                          <span className="text-gray-400">Still Active</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {log.workedHours ? (
                          <span className="font-semibold">
                            {log.workedHours.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Login History</h3>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">
              <Download size={18} />
              Export
            </button>
          </div>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">
                    Employee
                  </th>
                  <th className="text-left px-5 py-4 font-semibold">Date</th>
                  <th className="text-left px-5 py-4 font-semibold">Login</th>
                  <th className="text-left px-5 py-4 font-semibold">Logout</th>
                  <th className="text-left px-5 py-4 font-semibold">Hours</th>
                  <th className="text-left px-5 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginLogs.map((log) => {
                  const status = getStatusBadge(log.status);
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={log.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {log.employeeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.employeeId}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {dayjs(log.date).format("DD MMM YYYY")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-green-700">
                          <LogIn size={14} />
                          {log.loginTime}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2 text-red-700">
                          <LogOut size={14} />
                          {log.logoutTime}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {log.workedHours ? `${log.workedHours.toFixed(1)}h` : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Set Time Modal */}
      <Modal
        open={openSetTimeModal}
        title={`Set Login/Logout Time - ${selectedEmployee?.name}`}
        onClose={() => {
          setOpenSetTimeModal(false);
          setSelectedEmployee(null);
        }}
        width="max-w-lg"
      >
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Employee ID</p>
            <p className="font-semibold text-gray-900">
              {selectedEmployee?.employeeId}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LogIn size={16} className="inline mr-2 text-green-600" />
                Login Time
              </label>
              <input
                type="time"
                value={timeForm.loginTime}
                onChange={(e) =>
                  setTimeForm({ ...timeForm, loginTime: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LogOut size={16} className="inline mr-2 text-red-600" />
                Logout Time
              </label>
              <input
                type="time"
                value={timeForm.logoutTime}
                onChange={(e) =>
                  setTimeForm({ ...timeForm, logoutTime: e.target.value })
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Flexible Hours</p>
              <p className="text-sm text-gray-500">
                Allow this employee flexible timing
              </p>
            </div>
            <button
              onClick={() =>
                setTimeForm({ ...timeForm, isFlexible: !timeForm.isFlexible })
              }
              className={`w-12 h-6 rounded-full transition ${timeForm.isFlexible ? "bg-green-500" : "bg-gray-300"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition transform ${timeForm.isFlexible ? "translate-x-6" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          {timeForm.isFlexible && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Earliest Login
                </label>
                <input
                  type="time"
                  value={timeForm.flexiStartTime || ""}
                  onChange={(e) =>
                    setTimeForm({ ...timeForm, flexiStartTime: e.target.value })
                  }
                  className="w-full border border-purple-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Latest Logout
                </label>
                <input
                  type="time"
                  value={timeForm.flexiEndTime || ""}
                  onChange={(e) =>
                    setTimeForm({ ...timeForm, flexiEndTime: e.target.value })
                  }
                  className="w-full border border-purple-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={timeForm.notes}
              onChange={(e) =>
                setTimeForm({ ...timeForm, notes: e.target.value })
              }
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setOpenSetTimeModal(false);
                setSelectedEmployee(null);
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTimeSettings}
              className="flex-1 px-4 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl font-medium transition"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
