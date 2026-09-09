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
      if (diff <= 0) return { label: "On Time", color: "text-emerald-600 dark:text-emerald-300" };
      if (diff <= 15) return { label: "Late", color: "text-amber-600 dark:text-amber-300" };
      return { label: "Very Late", color: "text-rose-600 dark:text-rose-300" };
    } else {
      if (diff >= 0) return { label: "On Time", color: "text-emerald-600 dark:text-emerald-300" };
      if (diff >= -30) return { label: "Early", color: "text-amber-600 dark:text-amber-300" };
      return { label: "Very Early", color: "text-rose-600 dark:text-rose-300" };
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
      present:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/30",
      absent:
        "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/30",
      late:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30",
      half_day:
        "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:border-orange-400/30",
      wfh:
        "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300 dark:border-indigo-400/30",
      leave:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/30",
      on_leave:
        "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/30",
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
      styles[key] ||
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/15";
    const label =
      labels[key] ||
      (key
        ? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Unknown");

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}
      >
        {icons[key] || <Clock className="w-3 h-3" />}
        {label}
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(109,40,217,0.28)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.7)] dark:backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <span className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-500" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Records</h3>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3.5 py-2 text-sm font-semibold text-fuchsia-700 transition-all duration-300 hover:bg-fuchsia-100 disabled:opacity-50 dark:border-fuchsia-400/25 dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:hover:bg-fuchsia-500/20"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xl dark:bg-[#0d0918]/95">
            <tr>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Employee
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Department
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Expected Login
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Actual Login
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Expected Logout
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Actual Logout
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Hours
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-white/40">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-slate-400 dark:text-white/40">
                  <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-fuchsia-500 dark:text-fuchsia-400" />
                  Loading attendance data...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-slate-400 dark:text-white/40">
                  No attendance records found for the selected filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const loginStatus = getTimeStatus(row.actualLogin, row.actualLogin, true);
                const logoutStatus = getTimeStatus(row.actualLogout, row.actualLogout, false);

                return (
                  <tr key={row.id} className="transition-colors duration-200 hover:bg-violet-50/60 dark:hover:bg-fuchsia-500/[0.06]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-indigo-500 text-xs font-bold text-white shadow-[0_4px_14px_-4px_rgba(217,70,239,0.6)]">
                          {(row.employee || "").split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white/90">{row.employee}</p>
                          <p className="text-xs text-slate-400 dark:text-white/35">{row.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 dark:text-white/60">
                      {row.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center text-sm text-slate-400 dark:text-white/40">
                      {row.expectedLogin}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <div>
                        <span className={`text-sm font-medium ${row.actualLogin && row.actualLogin !== "-" ? loginStatus?.color : "text-slate-300 dark:text-white/25"}`}>
                          {formatTime(row.actualLogin)}
                        </span>
                        {loginStatus && row.actualLogin && row.actualLogin !== "-" && (
                          <div className={`text-xs ${loginStatus.color}`}>{loginStatus.label}</div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center text-sm text-slate-400 dark:text-white/40">
                      {row.expectedLogout}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <div>
                        <span className={`text-sm font-medium ${row.actualLogout && row.actualLogout !== "-" ? logoutStatus?.color : "text-slate-300 dark:text-white/25"}`}>
                          {formatTime(row.actualLogout)}
                        </span>
                        {logoutStatus && row.actualLogout && row.actualLogout !== "-" && (
                          <div className={`text-xs ${logoutStatus.color}`}>{logoutStatus.label}</div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium text-slate-600 dark:text-white/60">
                      {row.hours >= 0 ? `${row.hours}h` : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">{getStatusBadge(row.status)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3 text-sm text-slate-400 dark:border-white/[0.06] dark:bg-black/20 dark:text-white/40">
          <span>Showing {rows.length} record{rows.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span> On Time
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span> Late/Early
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400"></span> Very Late/Early
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
