import { useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { Search, Download, FileText, Pencil, Inbox } from "lucide-react";

const controlCls =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:focus:border-fuchsia-500/60 dark:focus:ring-fuchsia-500/20 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-200";

export default function HrInterviewTable({
  rows = [],
  loading,
  onEdit,
  locations = [],
}) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    call_status: "",
    client_status: "",
    location: "",
    job_profile: "",
    created_at: "",
    language_id: "",
    joined: "",
  });

  const callStatusMap = {
    1: "NOT PICKED",
    2: "SWITCHED OFF",
    3: "CALL BACK",
    4: "INTERESTED",
    5: "NOT INTERESTED",
    6: "INTERVIEW SCHEDULED",
    7: "SELECTED",
    8: "REJECTED",
    9: "NOT REACHABLE",
  };

  const filteredRows = rows.filter((item) => {
    const matchesSearch =
      item.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.candidate_email?.toLowerCase().includes(search.toLowerCase());

    const matchesCallStatus =
      !filters.call_status ||
      String(item.call_status_id) === filters.call_status;

    const matchesClientStatus =
      !filters.client_status || item.client_status === filters.client_status;

    const matchesLocation =
      !filters.location ||
      item.location?.toLowerCase() === filters.location.toLowerCase();

    const matchesJobProfile =
      !filters.job_profile || item.job_profile === filters.job_profile;

    const matchesCreatedDate =
      !filters.created_at ||
      (item.created_at &&
        new Date(item.created_at).toISOString().split("T")[0] ===
          filters.created_at);

    const matchesLanguage =
      !filters.language_id || String(item.language_id) === filters.language_id;

    const matchesJoined =
      !filters.joined || String(item.joined) === filters.joined;
    return (
      matchesSearch &&
      matchesCallStatus &&
      matchesClientStatus &&
      matchesLocation &&
      matchesJobProfile &&
      matchesCreatedDate &&
      matchesLanguage &&
      matchesJoined
    );
  });

  const safeDate = (value, type = "date") => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return type === "time"
      ? d.toLocaleTimeString("en-IN")
      : d.toLocaleDateString("en-IN");
  };

  const handleDownload = () => {
    if (!filteredRows.length) {
      toast.error("No candidates to export");
      return;
    }

    try {
      const data = filteredRows.map((item) => ({
        Name: item.candidate_name || "-",
        Phone: item.candidate_phone || "-",
        Location: item.location || "-",
        Address: item.address || "-",
        Language: item.language_name || "-",
        Job: item.job_profile || "-",
        Experience: item.experience || "-",
        Current_CTC: item.current_ctc || "-",
        Expected_CTC: item.expected_ctc || "-",
        Notice: item.notice_period || "-",
        Client_Code: item.client_code || "-",
        Call_Status: callStatusMap[item.call_status_id] || "-",
        Interview_Date: safeDate(item.interview_date),
        Interview_Time: item.interview_time || "-",
        Call_Date: safeDate(item.created_at),
        Call_Time: safeDate(item.created_at, "time"),
        Status: item.client_status || "-",
        Client_Remarks: item.client_remarks || "-",
        HR_Remarks: item.hr_remarks || "-",
        Joined: item.joined || "No",
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, worksheet, "Interviews");

      const now = new Date();
      const stamp = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
      const fileName = `Interviews_${stamp}.xlsx`;

      // XLSX.writeFile handles the download + filename reliably
      XLSX.writeFile(workbook, fileName, { bookType: "xlsx" });

      toast.success(`Exported ${data.length} candidates`);
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Excel export failed. Please try again.");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-14px_rgba(99,102,241,0.2)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.8)] dark:backdrop-blur-xl">
      {/* ── TOOLBAR ─────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-slate-50/60 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <input
              type="text"
              placeholder="Search name / email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${controlCls} w-full pl-9 placeholder:text-slate-400 dark:placeholder:text-slate-500`}
            />
          </div>

          <select
            value={filters.call_status}
            onChange={(e) =>
              setFilters({ ...filters, call_status: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by call status"
          >
            <option value="">All Call Status</option>
            {Object.entries(callStatusMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={filters.location || ""}
            onChange={(e) =>
              setFilters({ ...filters, location: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by location"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>
                {loc.name}
              </option>
            ))}
          </select>

          <select
            value={filters.language_id}
            onChange={(e) =>
              setFilters({ ...filters, language_id: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by language"
          >
            <option value="">All Languages</option>
            {[
              ...new Map(
                rows
                  .filter((r) => r.language_id)
                  .map((r) => [r.language_id, r.language_name]),
              ).entries(),
            ].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={filters.job_profile}
            onChange={(e) =>
              setFilters({ ...filters, job_profile: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by position"
          >
            <option value="">All Positions</option>
            {[...new Set(rows.map((r) => r.job_profile).filter(Boolean))].map(
              (job, i) => (
                <option key={i} value={job}>
                  {job}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.client_status}
            onChange={(e) =>
              setFilters({ ...filters, client_status: e.target.value })
            }
            className={controlCls}
            aria-label="Filter by client status"
          >
            <option value="">All Client Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.joined}
            onChange={(e) => setFilters({ ...filters, joined: e.target.value })}
            className={controlCls}
            aria-label="Filter by joined status"
          >
            <option value="">Joined Status</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          <input
            type="date"
            value={filters.created_at}
            onChange={(e) =>
              setFilters({ ...filters, created_at: e.target.value })
            }
            className={`${controlCls} dark:[color-scheme:dark]`}
            aria-label="Filter by call date"
          />

          <button
            onClick={handleDownload}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:shadow-emerald-900/40"
          >
            <Download size={15} aria-hidden="true" />
            Download Excel
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {filteredRows.length}
          </span>{" "}
          of {rows.length} candidates
        </p>
      </div>

      {/* ── TABLE ───────────────────────────────────────────── */}
      <div className="max-h-[62vh] overflow-auto">
        <table className="w-full whitespace-nowrap text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 text-slate-500 dark:bg-[#100c1d] dark:text-slate-400">
            <tr>
              {[
                "Candidate",
                "Phone",
                "Location",
                "Address",
                "Language",
                "Job Profile",
                "Experience",
                "Salary",
                "Notice",
                "Client Code",
                "Call Status",
                "Interview Date",
                "Interview Time",
                "Call Date",
                "Call Time",
                "CV",
                "Status",
                "Joined",
                "Client Remarks",
                "HR Remarks",
                "Action",
              ].map((h) => (
                <th
                  key={h}
                  className="p-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {filteredRows.map((item) => (
              <tr
                key={item.id}
                className="transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-500/[0.07]"
              >
                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                  {item.candidate_name}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">{item.candidate_phone}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400">{item.location || "-"}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400">{item.address || "-"}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.language_name || "-"}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.job_profile || "-"}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.experience || "-"}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.current_ctc ? `₹${item.current_ctc}L` : "-"} →
                  {item.expected_ctc ? `₹${item.expected_ctc}L` : "-"}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.notice_period || "-"}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">{item.client_code}</td>

                <td className="p-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold
                      ${
                        Number(item.call_status_id) === 7
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                          : Number(item.call_status_id) === 8
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                            : Number(item.call_status_id) === 6
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                              : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-400"
                      }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full
                        ${
                          Number(item.call_status_id) === 7
                            ? "bg-emerald-500"
                            : Number(item.call_status_id) === 8
                              ? "bg-rose-500"
                              : Number(item.call_status_id) === 6
                                ? "bg-violet-500"
                                : "bg-slate-400"
                        }`}
                    />
                    {callStatusMap[item.call_status_id] || "-"}
                  </span>
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.interview_date
                    ? new Date(item.interview_date).toLocaleDateString("en-IN")
                    : "-"}{" "}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.interview_time || "-"}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {new Date(item.created_at).toLocaleDateString("en-IN")}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {new Date(item.created_at).toLocaleTimeString("en-IN")}
                </td>

                <td className="p-3">
                  {item.cv_file ? (
                    <a
                      href={`${import.meta.env.VITE_API_BASE_URL}${item.cv_file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <FileText size={13} aria-hidden="true" />
                      View CV
                    </a>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold
                    ${
                      item.client_status === "accepted"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : item.client_status === "rejected"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                    }`}
                  >
                    {Number(item.call_status_id) === 6
                      ? (item.client_status || "pending").toUpperCase()
                      : "irrelevant to client"}
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold
                    ${
                      item.joined === "Yes"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400"
                    }`}
                  >
                    {item.joined || "No"}
                  </span>
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {item.client_remarks || "-"}
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-400">{item.hr_remarks || "-"}</td>

                <td className="p-3">
                  <button
                    onClick={() => onEdit?.(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-all hover:-translate-y-px hover:bg-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                  >
                    <Pencil size={12} aria-hidden="true" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredRows.length === 0 && !loading && (
              <tr>
                <td colSpan="21" className="p-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500">
                    <Inbox size={22} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                    No interviews found
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Try adjusting the filters or add a new interview.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
