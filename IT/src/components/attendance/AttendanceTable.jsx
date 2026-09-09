import { RefreshCw, CheckCircle, XCircle, Clock, Coffee } from "lucide-react";

export default function AttendanceTable({ rows, loading, onRefresh = [] }) {

  const formatTime = (time) => {
    if (!time || time === "-") return "-";
    return time;
  };

const getTimeStatus = (actualTime, expectedTime, isLogin = true) => {
  if (!actualTime || !expectedTime) return null;

  try {
    const [actualHour, actualMin] = actualTime.split(":").map(Number);
    const [expectedHour, expectedMin] = expectedTime.split(":").map(Number);

    const actualMinutes = actualHour * 60 + actualMin;
    const expectedMinutes = expectedHour * 60 + expectedMin;

    const diff = actualMinutes - expectedMinutes;

    if (isLogin) {
      if (diff <= 0) return { label: "On Time", color: "text-emerald-600" };
      if (diff <= 15) return { label: "Late", color: "text-amber-600" };
      return { label: "Very Late", color: "text-red-600" };
    } else {
      if (diff >= 0) return { label: "On Time", color: "text-emerald-600" };
      if (diff >= -30) return { label: "Early", color: "text-amber-600" };
      return { label: "Very Early", color: "text-red-600" };
    }
  } catch {
    return null;
  }
};

  const getStatusBadge = (status) => {
    // normalize: "HALF_DAY", "Half Day", "half-day" -> "half_day"
    const key = String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    const styles = {
      present: "bg-emerald-100 text-emerald-700 border-emerald-200",
      absent: "bg-red-100 text-red-700 border-red-200",
      late: "bg-amber-100 text-amber-700 border-amber-200",
      half_day: "bg-orange-100 text-orange-700 border-orange-200",
      wfh: "bg-indigo-100 text-indigo-700 border-indigo-200",
      leave: "bg-blue-100 text-blue-700 border-blue-200",
      on_leave: "bg-blue-100 text-blue-700 border-blue-200",
    };

    const icons = {
      present: <CheckCircle className="w-3 h-3" />,
      absent: <XCircle className="w-3 h-3" />,
      late: <Clock className="w-3 h-3" />,
      half_day: <Clock className="w-3 h-3" />,
      wfh: <CheckCircle className="w-3 h-3" />,
      leave: <Coffee className="w-3 h-3" />,
      on_leave: <Coffee className="w-3 h-3" />,
    };

    const labels = {
      present: "Present",
      absent: "Absent",
      late: "Late",
      half_day: "Half Day",
      wfh: "WFH",
      leave: "On Leave",
      on_leave: "On Leave",
    };

    // fallback for any unknown status - never render an empty badge
    const style =
      styles[key] || "bg-gray-100 text-gray-700 border-gray-200";
    const label =
      labels[key] ||
      (key
        ? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Unknown");

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}
      >
        {icons[key] || <Clock className="w-3 h-3" />}
        {label}
      </span>
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Attendance Records</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-auto max-h-[60vh] scrollbar-hide">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Expected Login
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actual Login
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Expected Logout
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actual Logout
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading attendance data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No attendance records found for the selected filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const loginStatus = getTimeStatus(row.actualLogin, row.actualLogin, true);
                const logoutStatus = getTimeStatus(row.actualLogout, row.actualLogout, false);

                return (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                          {(row.employee || "").split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{row.employee}</p>
                          <p className="text-xs text-gray-500">{row.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.department}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      {row.expectedLogin}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div>
                        <span className={`text-sm font-medium ${row.actualLogin && row.actualLogin !== "-" ? loginStatus?.color : "text-gray-400"}`}>
                          {formatTime(row.actualLogin)}
                        </span>
                        {loginStatus && row.actualLogin && row.actualLogin !== "-" && (
                          <div className={`text-xs ${loginStatus.color}`}>{loginStatus.label}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      {row.expectedLogout}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div>
                        <span className={`text-sm font-medium ${row.actualLogout && row.actualLogout !== "-" ? logoutStatus?.color : "text-gray-400"}`}>
                          {formatTime(row.actualLogout)}
                        </span>
                        {logoutStatus && row.actualLogout && row.actualLogout !== "-" && (
                          <div className={`text-xs ${logoutStatus.color}`}>{logoutStatus.label}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                      {row.hours >= 0 ? `${row.hours}h` : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(row.status)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing {rows.length} record{rows.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> On Time
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Late/Early
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Very Late/Early
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
