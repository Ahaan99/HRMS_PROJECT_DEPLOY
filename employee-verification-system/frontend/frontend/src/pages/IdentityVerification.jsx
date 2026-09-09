import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";
import ExportBar from "../components/ExportBar";

function IdentityVerification() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employee_id: "",
    aadhaar_number: "",
    pan_number: "",
  });
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const [recRes, empRes] = await Promise.all([
        API.get("/identity-verification"),
        API.get("/employees"),
      ]);
      setRecords(recRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      console.log("Identity API Error", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await API.post("/identity-verification", {
        employee_id: Number(form.employee_id),
        aadhaar_number: form.aadhaar_number,
        pan_number: form.pan_number,
      });
      setMessage(res.data.message);
      setForm({ employee_id: "", aadhaar_number: "", pan_number: "" });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Submission failed");
    }
  };

  const decide = async (id, field, action) => {
    try {
      await API.put(`/identity-verification/${id}`, { field, action });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Update failed");
    }
  };

  const badge = (status) => {
    const colors = {
      Verified: "#16a34a",
      Rejected: "#dc2626",
      "Pending Approval": "#d97706",
      "Not Submitted": "#6b7280",
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
        {status || "Not Submitted"}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>Aadhaar / PAN Verification</h1>

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
            placeholder="Aadhaar Number (12 digits)"
            value={form.aadhaar_number}
            maxLength={14}
            onChange={(e) =>
              setForm({ ...form, aadhaar_number: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="PAN Number (AAAAA9999A)"
            value={form.pan_number}
            maxLength={10}
            onChange={(e) =>
              setForm({ ...form, pan_number: e.target.value.toUpperCase() })
            }
          />

          <button type="submit">Submit for Verification</button>
        </form>

        {message && <p className="info-message">{message}</p>}

        <h3>Verification Records</h3>

        <ExportBar
          filename="identity-verification"
          rows={records}
          columns={[
            { key: "employee_name", label: "Employee" },
            { key: "aadhaar_masked", label: "Aadhaar" },
            { key: "aadhaar_status", label: "Aadhaar Status" },
            { key: "pan_masked", label: "PAN" },
            { key: "pan_status", label: "PAN Status" },
            { key: "updated_at", label: "Updated" },
          ]}
        />

        <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Aadhaar</th>
              <th>Aadhaar Status</th>
              <th>PAN</th>
              <th>PAN Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id}>
                <td>{rec.employee_name}</td>
                <td>{rec.aadhaar_masked || "-"}</td>
                <td>{badge(rec.aadhaar_status)}</td>
                <td>{rec.pan_masked || "-"}</td>
                <td>{badge(rec.pan_status)}</td>
                <td>
                  {rec.aadhaar_status === "Pending Approval" && (
                    <>
                      <button className="btn-success" onClick={() => decide(rec.id, "aadhaar", "approve")}>
                        Approve Aadhaar
                      </button>{" "}
                      <button className="btn-danger" onClick={() => decide(rec.id, "aadhaar", "reject")}>
                        Reject Aadhaar
                      </button>{" "}
                    </>
                  )}
                  {rec.pan_status === "Pending Approval" && (
                    <>
                      <button className="btn-success" onClick={() => decide(rec.id, "pan", "approve")}>
                        Approve PAN
                      </button>{" "}
                      <button className="btn-danger" onClick={() => decide(rec.id, "pan", "reject")}>
                        Reject PAN
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan="6">No identity verifications submitted yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

export default IdentityVerification;
