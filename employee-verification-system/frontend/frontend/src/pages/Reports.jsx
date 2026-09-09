import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

const TYPE_LABELS = {
  documents: "Documents",
  aadhaar: "Aadhaar",
  pan: "PAN",
  background: "Background Check",
  employment_history: "Employment History",
};

function Reports() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    API.get("/reports-summary")
      .then((res) => setSummary(res.data))
      .catch(() => toast.error("Failed to load report data"));
  }, []);

  const typeRows = summary
    ? Object.entries(summary.by_type).map(([key, val]) => ({
        type: TYPE_LABELS[key] || key,
        ...val,
        total: val.Verified + val.Pending + val.Rejected,
      }))
    : [];

  const deptRows = summary?.by_department || [];

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(typeRows),
      "By Type"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(deptRows),
      "By Department"
    );
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `verification-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Employee Verification Report", 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Total Employees: ${summary?.total_employees ?? 0}`, 14, 34);

    let y = 46;
    doc.setFontSize(12);
    doc.text("Verification Breakdown", 14, y);
    y += 8;
    doc.setFontSize(10);
    typeRows.forEach((r) => {
      doc.text(
        `${r.type}: Verified ${r.Verified} | Pending ${r.Pending} | Rejected ${r.Rejected}`,
        14,
        y
      );
      y += 7;
    });

    y += 6;
    doc.setFontSize(12);
    doc.text("Department Coverage", 14, y);
    y += 8;
    doc.setFontSize(10);
    deptRows.forEach((d) => {
      doc.text(
        `${d.department}: ${d.employees} employees | Identity done ${d.identity_done} | Background done ${d.background_done}`,
        14,
        y
      );
      y += 7;
    });

    doc.save(`verification-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>Reports</h1>
        <p className="page-desc">
          Verification analytics across the organization, exportable as PDF or
          Excel.
        </p>

        <div className="export-bar">
          <span className="spacer" />
          <button
            className="btn-outline"
            onClick={downloadPDF}
            disabled={!summary}
          >
            &#8681; Download PDF
          </button>
          <button
            className="btn-outline"
            onClick={downloadExcel}
            disabled={!summary}
          >
            &#8681; Download Excel
          </button>
          <button className="btn-outline" onClick={() => window.print()}>
            &#128424; Print
          </button>
        </div>

        {summary && (
          <>
            <div className="cards">
              <div className="card">
                Total Employees
                <span className="card-value">{summary.total_employees}</span>
              </div>
              {typeRows.slice(0, 4).map((r) => (
                <div className="card" key={r.type}>
                  {r.type} Verified
                  <span className="card-value" style={{ color: "#16a34a" }}>
                    {r.Verified}
                    <span
                      style={{
                        fontSize: 13,
                        color: "#9ca3af",
                        fontWeight: 600,
                      }}
                    >
                      {" "}
                      / {r.total}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <h3>Verification Breakdown by Type</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Verification Type</th>
                    <th>Verified</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                    <th>Total</th>
                    <th>Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {typeRows.map((r) => (
                    <tr key={r.type}>
                      <td style={{ fontWeight: 600 }}>{r.type}</td>
                      <td>
                        <span className="status verified">{r.Verified}</span>
                      </td>
                      <td>
                        <span className="status pending">{r.Pending}</span>
                      </td>
                      <td>
                        <span className="status rejected">{r.Rejected}</span>
                      </td>
                      <td>{r.total}</td>
                      <td>
                        {r.total > 0
                          ? `${Math.round((r.Verified / r.total) * 100)}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Department Coverage</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Employees</th>
                    <th>Identity Verified</th>
                    <th>Background Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {deptRows.map((d) => (
                    <tr key={d.department}>
                      <td style={{ fontWeight: 600 }}>{d.department}</td>
                      <td>{d.employees}</td>
                      <td>
                        {d.identity_done} / {d.employees}
                      </td>
                      <td>
                        {d.background_done} / {d.employees}
                      </td>
                    </tr>
                  ))}
                  {deptRows.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ color: "#6b7280" }}>
                        No employees yet. Sync from HRMS on the Dashboard.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Reports;
