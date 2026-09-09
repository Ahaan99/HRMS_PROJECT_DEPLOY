import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";
import ExportBar from "../components/ExportBar";

function VerificationStatus() {
  const [data, setData] = useState({ summary: {}, employees: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await API.get("/verification-status");
      setData(res.data);
    } catch (error) {
      console.log("Verification Status API Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const badge = (status) => {
    const colors = {
      Verified: "#16a34a",
      Validated: "#16a34a",
      "Fully Verified": "#16a34a",
      Rejected: "#dc2626",
      "Action Required": "#dc2626",
      "In Progress": "#2563eb",
      Pending: "#d97706",
      "Pending Approval": "#d97706",
      "Not Submitted": "#6b7280",
      "Not Started": "#6b7280",
    };
    return (
      <span
        style={{
          background: colors[status] || "#6b7280",
          color: "#fff",
          padding: "2px 8px",
          borderRadius: "10px",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        {status}
      </span>
    );
  };

  const s = data.summary;

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>Verification Status Dashboard</h1>
        <p className="page-desc">
          Live verification progress across documents, identity, background
          and employment history.
        </p>

        {loading ? (
          <h3>Loading verification data...</h3>
        ) : (
          <>
            <div className="cards">
              <div className="card">
                Total Employees
                <span className="card-value">{s.total}</span>
              </div>
              <div className="card">
                Fully Verified
                <span className="card-value">{s.fully_verified}</span>
              </div>
              <div className="card">
                In Progress
                <span className="card-value">{s.in_progress}</span>
              </div>
              <div className="card">
                Action Required
                <span className="card-value">{s.action_required}</span>
              </div>
              <div className="card">
                Not Started
                <span className="card-value">{s.not_started}</span>
              </div>
            </div>

            <ExportBar
              filename="verification-status"
              rows={data.employees}
              columns={[
                { key: "employee_name", label: "Employee" },
                { key: "department", label: "Department" },
                { key: "documents", label: "Documents" },
                { key: "aadhaar", label: "Aadhaar" },
                { key: "pan", label: "PAN" },
                { key: "background", label: "Background" },
                { key: "employment_history", label: "Employment History" },
                { key: "overall", label: "Overall" },
              ]}
            />

            <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Documents</th>
                  <th>Aadhaar</th>
                  <th>PAN</th>
                  <th>Background</th>
                  <th>Employment History</th>
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td>{emp.employee_name}</td>
                    <td>{emp.department || "-"}</td>
                    <td>{badge(emp.documents)}</td>
                    <td>{badge(emp.aadhaar)}</td>
                    <td>{badge(emp.pan)}</td>
                    <td>{badge(emp.background)}</td>
                    <td>{badge(emp.employment_history)}</td>
                    <td>{badge(emp.overall)}</td>
                  </tr>
                ))}
                {data.employees.length === 0 && (
                  <tr>
                    <td colSpan="8">No employees found.</td>
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

export default VerificationStatus;
