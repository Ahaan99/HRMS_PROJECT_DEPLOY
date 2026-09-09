import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  console.log(rows)
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

  const handleDownload = () => {
    if (!filteredRows.length) return;

    const data = filteredRows.map((item) => ({
      Name: item.candidate_name,
      Phone: item.candidate_phone,
      Location: item.location || "-",
      Address: item.address || "-",
      Language: item.language_name || "-",
      Job: item.job_profile || "-",
      Experience: item.experience || "-",
      Current_CTC: item.current_ctc || "-",
      Expected_CTC: item.expected_ctc || "-",
      Notice: item.notice_period || "-",
      Client_Code: item.client_code,
      Call_Status: callStatusMap[item.call_status_id] || "-",
      Interview_Date: item.interview_date
        ? new Date(item.interview_date).toLocaleDateString("en-IN")
        : "-",
      Call_Date: new Date(item.created_at).toLocaleDateString("en-IN"),
      Call_Time: new Date(item.created_at).toLocaleTimeString("en-IN"),
      Status: item.client_status || "-",
      Client_Remarks: item.client_remarks || "-",
      HR_Remarks: item.hr_remarks || "-",
      Joined: item.joined || "No",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Interviews");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, `Interviews_${Date.now()}.xlsx`);
  };
  
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-auto max-h-[60vh]">
      <div className="overflow-auto max-h-[60vh]">
        <h2 className="text-lg font-semibold text-black">
          Interview Management

        </h2>
      </div>

      <div className="p-4 flex flex-col sm:flex-row gap-2 sm:p-3">
        {/* 🔍 Search */}
        <input
          type="text"
          placeholder="Search name / email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm w-full sm:w-64"
        />

        {/* 📞 Call Status */}
        <select
          value={filters.call_status}
          onChange={(e) =>
            setFilters({ ...filters, call_status: e.target.value })
          }
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="">All Call Status</option>
          {Object.entries(callStatusMap).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>

        {/* 📍 Location */}
        <select
          value={filters.location || ""}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="">All Locations</option>

          {locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>

        {/* 🌐 Language */}
        <select
          value={filters.language_id}
          onChange={(e) =>
            setFilters({ ...filters, language_id: e.target.value })
          }
          className="border px-3 py-2 rounded-lg text-sm"
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

        {/* 💼 Job Profile */}
        <select
          value={filters.job_profile}
          onChange={(e) =>
            setFilters({ ...filters, job_profile: e.target.value })
          }
          className="border px-3 py-2 rounded-lg text-sm"
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

        {/* 🏢 Client Status */}
        <select
          value={filters.client_status}
          onChange={(e) =>
            setFilters({ ...filters, client_status: e.target.value })
          }
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="">All Client Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Joined Status */}
        <select
          value={filters.joined}
          onChange={(e) => setFilters({ ...filters, joined: e.target.value })}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="">Joined Status</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>

        {/* 📅 Call Date */}
        <input
          type="date"
          value={filters.created_at}
          onChange={(e) =>
            setFilters({ ...filters, created_at: e.target.value })
          }
          className="border px-3 py-2 rounded-lg text-sm"
        />

        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
        >
          Download Excel
        </button>
      </div>

      <table className="w-full text-xs sm:text-sm whitespace-nowrap overflow-auto max-h-[60vh]">
        <thead className="sticky top-0 z-10 bg-gray-50/10">
          <tr>
            <th className="p-2 sm:p-3 text-left">Candidate</th>
            <th className="p-2 sm:p-3 text-left">Phone</th>
            <th className="p-2 sm:p-3 text-left">Location</th>
            <th className="p-2 sm:p-3 text-left">Address</th>
            <th className="p-2 sm:p-3 text-left">Language</th>
            <th className="p-2 sm:p-3 text-left">Job Profile</th>
            <th className="p-2 sm:p-3 text-left">Experience</th>
            <th className="p-2 sm:p-3 text-left">Salary</th>
            <th className="p-2 sm:p-3 text-left">Notice</th>
            <th className="p-2 sm:p-3 text-left">Client Code</th>
            <th className="p-2 sm:p-3 text-left">Call Status</th>
            <th className="p-2 sm:p-3 text-left">Interview Date</th>
            <th className="p-2 sm:p-3 text-left">Interview Time</th>
            <th className="p-2 sm:p-3 text-left">Call Date</th>
            <th className="p-2 sm:p-3 text-left">Call Time</th>
            <th className="p-2 sm:p-3 text-left">CV</th>
            <th className="p-2 sm:p-3 text-left">Status</th>
            <th className="p-2 sm:p-3 text-left">Joined</th>
            <th className="p-2 sm:p-3 text-left">Client Remarks</th>
            <th className="p-2 sm:p-3 text-left">HR Remarks</th>
            <th className="p-2 sm:p-3 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((item) => (
            <tr key={item.id} className="border-t border-white/10">
              <td className="p-2 sm:p-3 font-medium text-black">
                {item.candidate_name}
              </td>

              <td className="p-2 sm:p-3 text-black">{item.candidate_phone}</td>
              <td className="p-2 sm:p-3 text-black">{item.location || "-"}</td>
              <td className="p-2 sm:p-3 text-black">{item.address || "-"}</td>
              <td className="p-2 sm:p-3 text-black">
                {item.language_name || "-"}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.job_profile || "-"}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.experience || "-"}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.current_ctc ? `₹${item.current_ctc}L` : "-"} →
                {item.expected_ctc ? `₹${item.expected_ctc}L` : "-"}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.notice_period || "-"}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.client_code}
                {/* 🔧 TODO later: join client name */}
              </td>
              <td className="p-2 sm:p-3">
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-semibold
                    ${
                      Number(item.call_status_id) === 7
                        ? "bg-green-100 text-green-700"
                        : Number(item.call_status_id) === 8
                        ? "bg-red-100 text-red-700"
                        : Number(item.call_status_id) === 6
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {callStatusMap[item.call_status_id] || "-"}
                </span>
              </td>
              <td className="p-2 sm:p-3 text-black">
                {item.interview_date
                  ? new Date(item.interview_date).toLocaleDateString("en-IN")
                  : "-"}{" "}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.interview_time || "-"}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {new Date(item.created_at).toLocaleDateString("en-IN")}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {new Date(item.created_at).toLocaleTimeString("en-IN")}
              </td>

              <td className="p-2 sm:p-3">
                {item.cv_file ? (
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL}${item.cv_file}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline"
                  >
                    View CV
                  </a>
                ) : (
                  "-"
                )}
              </td>

              <td className="p-2 sm:p-3">
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-semibold
                  ${
                    item.client_status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : item.client_status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {Number(item.call_status_id) === 6
                    ? (item.client_status || "pending").toUpperCase()
                    : "irrelevant to client"}
                </span>
              </td>

              <td className="p-2 sm:p-3">
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-semibold
                  ${
                    item.joined === "Yes"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.joined || "No"}
                </span>
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.client_remarks || "-"}
              </td>

              <td className="p-2 sm:p-3 text-black">
                {item.hr_remarks || "-"}
              </td>

              <td className="p-2 sm:p-3">
                {/* 🔧 TODO later: open edit modal */}
                <button
                  onClick={() => onEdit?.(item)}
                  className="px-2 sm:px-3 py-1 sm:text-sm rounded-lg bg-indigo-500 text-white text-xs hover:bg-indigo-600 transition"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}

          {rows.length === 0 && !loading && (
            <tr>
              <td colSpan="16" className="text-center p-6 text-gray-500">
                No interviews found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
