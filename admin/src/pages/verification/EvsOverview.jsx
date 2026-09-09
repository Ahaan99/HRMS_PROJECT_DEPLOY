import { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";
import API from "../../services/api";

// EVS frontend (pinned to port 5180 in its vite.config.js)
const EVS_APP = import.meta.env.VITE_EVS_APP_URL || "http://localhost:5180";

// SSO handoff: the backend mints a short-lived HMAC-signed URL so the
// shared SSO secret never reaches the browser or appears in raw form
// inside links (browser history / server logs / Referer headers).
async function openEvsPortal() {
  try {
    const res = await API.get("/super-admin/evs/sso-url");
    const url = res?.data?.url;
    window.open(url || EVS_APP, "_blank", "noopener,noreferrer");
  } catch {
    // Fall back to the portal's normal login page.
    window.open(EVS_APP, "_blank", "noopener,noreferrer");
  }
}

const TONE = {
  "Fully Verified": "bg-emerald-50 text-emerald-700",
  "In Progress": "bg-amber-50 text-amber-700",
  "Action Required": "bg-red-50 text-red-700",
  "Not Started": "bg-gray-100 text-gray-600",
};

const CELL_TONE = {
  Verified: "bg-emerald-50 text-emerald-700",
  Validated: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  "Pending Approval": "bg-amber-50 text-amber-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
  "Not Submitted": "bg-gray-100 text-gray-500",
  "Not Started": "bg-gray-100 text-gray-500",
};

function Pill({ value }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
        CELL_TONE[value] || "bg-gray-100 text-gray-600"
      }`}
    >
      {value || "-"}
    </span>
  );
}

export default function EvsOverview() {
  const [status, setStatus] = useState(null);
  const [hrms, setHrms] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // allSettled: agar ek endpoint fail ho to dusre ka data phir bhi dikhe
    const [v, h] = await Promise.allSettled([
      API.get("/evs/verification-status", { timeout: 8000 }),
      API.get("/evs/hrms-status", { timeout: 8000 }),
    ]);
    if (v.status === "fulfilled") setStatus(v.value.data);
    if (h.status === "fulfilled") setHrms(h.value.data);
    // Sirf tab offline dikhao jab dono endpoints fail ho jayen
    setError(v.status === "rejected" && h.status === "rejected");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const s = status?.summary;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#e6e9f0] p-5 mb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-md shadow-indigo-200">
          <ShieldCheck size={20} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-base font-bold text-gray-900">
            Employee Verification Portal
          </h2>
          <p className="text-xs text-gray-500">
            Live status from the verification system
            {hrms?.connected &&
              ` - ${hrms.synced}/${hrms.hrms_employees} HRMS employees synced`}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
        <button
          type="button"
          onClick={openEvsPortal}
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Open Verification Portal <ExternalLink size={14} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
          Verification system is offline. Make sure the HRMS backend (port 5000) is running and the evs_ tables exist to
          see live status.
        </div>
      )}

      {!error && s && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {[
              ["Employees", s.total, "text-gray-900"],
              ["Fully Verified", s.fully_verified, "text-emerald-600"],
              ["In Progress", s.in_progress, "text-amber-600"],
              ["Action Required", s.action_required, "text-red-600"],
              ["Not Started", s.not_started, "text-gray-500"],
            ].map(([label, value, tone]) => (
              <div
                key={label}
                className="border border-gray-100 rounded-xl px-3 py-2.5"
              >
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {label}
                </div>
                <div className={`text-xl font-extrabold ${tone}`}>{value}</div>
              </div>
            ))}
          </div>

          <div className="max-h-[340px] overflow-y-auto overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#f3f4f6]">
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-2 px-3 font-semibold">Employee</th>
                  <th className="py-2 pr-3 font-semibold">Aadhaar</th>
                  <th className="py-2 pr-3 font-semibold">PAN</th>
                  <th className="py-2 pr-3 font-semibold">Documents</th>
                  <th className="py-2 pr-3 font-semibold">Background</th>
                  <th className="py-2 pr-3 font-semibold">History</th>
                  <th className="py-2 pr-3 font-semibold">Overall</th>
                </tr>
              </thead>
              <tbody>
                {(status.employees || []).map((emp) => (
                  <tr
                    key={emp.employee_id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2 px-3 font-semibold text-gray-800 whitespace-nowrap">
                      {emp.employee_name}
                      <div className="text-[11px] font-normal text-gray-400">
                        {emp.department}
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.aadhaar} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.pan} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.documents} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.background} />
                    </td>
                    <td className="py-2 pr-3">
                      <Pill value={emp.employment_history} />
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                          TONE[emp.overall] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {emp.overall}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-400 pt-2">
            {(status.employees || []).length} employees - scroll inside the
            table to see all rows and columns.
          </div>
        </>
      )}
    </div>
  );
}
