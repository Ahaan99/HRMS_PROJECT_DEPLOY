import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";
import ExportBar from "../components/ExportBar";

function EmploymentHistory() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    employee_id: "",
    company_name: "",
    designation: "",
    start_date: "",
    end_date: "",
    hr_contact_email: "",
  });

  const fetchData = async () => {
    try {
      const [recRes, empRes] = await Promise.all([
        API.get("/employment-history"),
        API.get("/employees"),
      ]);
      setRecords(recRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      console.log("Employment History API Error", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await API.post("/employment-history", {
        ...form,
        employee_id: Number(form.employee_id),
      });
      setMessage(res.data.message);
      setForm({
        employee_id: "",
        company_name: "",
        designation: "",
        start_date: "",
        end_date: "",
        hr_contact_email: "",
      });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Submission failed");
    }
  };

  const decide = async (id, action) => {
    try {
      await API.put(`/employment-history/${id}`, { action });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Update failed");
    }
  };

  const badge = (status) => {
    const colors = {
      Validated: "#16a34a",
      Rejected: "#dc2626",
      "In Progress": "#2563eb",
      Pending: "#d97706",
    };
    return (
      <span
        style={{
          background: colors[status] || "#6b7280",
          color: "#fff",
          padding: "2px 8px",
          borderRadius: "10px",
          fontSize: "12px",
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>Employment History Validation</h1>

        <form onSubmit={submit} className="form-box">
          <select
            value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
            required
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} (ID {emp.id})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Previous Company Name"
            value={form.company_name}
            onChange={(e) =>
              setForm({ ...form, company_name: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Designation"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
            required
          />

          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />

          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />

          <input
            type="email"
            placeholder="Previous HR Contact Email"
            value={form.hr_contact_email}
            onChange={(e) =>
              setForm({ ...form, hr_contact_email: e.target.value })
            }
          />

          <button type="submit">Add History Entry</button>
        </form>

        {message && <p className="info-message">{message}</p>}

        <h3>History Records</h3>

        <ExportBar
          filename="employment-history"
          rows={records}
          columns={[
            { key: "employee_name", label: "Employee" },
            { key: "company_name", label: "Company" },
            { key: "designation", label: "Designation" },
            { key: "start_date", label: "Start Date" },
            { key: "end_date", label: "End Date" },
            { key: "hr_contact_email", label: "HR Contact" },
            { key: "status", label: "Status" },
          ]}
        />

        <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Designation</th>
              <th>Period</th>
              <th>HR Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.employee_name}</td>
                <td>{rec.company_name}</td>
                <td>{rec.designation}</td>
                <td>
                  {rec.start_date} to {rec.end_date}
                </td>
                <td>{rec.hr_contact_email || "-"}</td>
                <td>{badge(rec.status)}</td>
                <td>
                  {(rec.status === "Pending" ||
                    rec.status === "In Progress") && (
                    <>
                      {rec.status === "Pending" && (
                        <>
                          <button
                            onClick={() => decide(rec.id, "in_progress")}
                          >
                            Start Check
                          </button>{" "}
                        </>
                      )}
                      <button className="btn-success" onClick={() => decide(rec.id, "validate")}>
                        Validate
                      </button>{" "}
                      <button className="btn-danger" onClick={() => decide(rec.id, "reject")}>
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan="7">No employment history records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

export default EmploymentHistory;
