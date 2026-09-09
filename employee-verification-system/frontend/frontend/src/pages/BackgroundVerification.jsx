import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";
import ExportBar from "../components/ExportBar";

function BackgroundVerification() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    employee_id: "",
    previous_company: "",
    hr_email: "",
    feedback: "",
    rehire_eligible: "Yes",
    criminal_record: "No",
  });

  const fetchData = async () => {
    try {
      const [recRes, empRes] = await Promise.all([
        API.get("/background-verification"),
        API.get("/employees"),
      ]);
      setData(recRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await API.post("/background-verification", {
        ...form,
        employee_id: Number(form.employee_id),
      });
      setMessage(res.data.message);
      setForm({
        employee_id: "",
        previous_company: "",
        hr_email: "",
        feedback: "",
        rehire_eligible: "Yes",
        criminal_record: "No",
      });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Submission failed");
    }
  };

  const track = async (id, action) => {
    try {
      await API.put(`/background-verification/${id}`, { action });
      fetchData();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Update failed");
    }
  };

  const badge = (status) => {
    const colors = {
      Verified: "#16a34a",
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
        <h2>Background Verification Tracking</h2>

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
            placeholder="Previous Company"
            value={form.previous_company}
            onChange={(e) =>
              setForm({ ...form, previous_company: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder="Previous HR Email"
            value={form.hr_email}
            onChange={(e) => setForm({ ...form, hr_email: e.target.value })}
          />

          <input
            type="text"
            placeholder="Feedback / Notes"
            value={form.feedback}
            onChange={(e) => setForm({ ...form, feedback: e.target.value })}
          />

          <select
            value={form.rehire_eligible}
            onChange={(e) =>
              setForm({ ...form, rehire_eligible: e.target.value })
            }
          >
            <option value="Yes">Rehire Eligible: Yes</option>
            <option value="No">Rehire Eligible: No</option>
            <option value="Unknown">Rehire Eligible: Unknown</option>
          </select>

          <select
            value={form.criminal_record}
            onChange={(e) =>
              setForm({ ...form, criminal_record: e.target.value })
            }
          >
            <option value="No">Criminal Record: No</option>
            <option value="Yes">Criminal Record: Yes</option>
            <option value="Unknown">Criminal Record: Unknown</option>
          </select>

          <button type="submit">Open Verification Case</button>
        </form>

        {message && <p className="info-message">{message}</p>}

        <ExportBar
          filename="background-verification"
          rows={data}
          columns={[
            { key: "employee_name", label: "Employee" },
            { key: "previous_company", label: "Previous Company" },
            { key: "hr_email", label: "HR Email" },
            { key: "feedback", label: "Feedback" },
            { key: "rehire_eligible", label: "Rehire Eligible" },
            { key: "criminal_record", label: "Criminal Record" },
            { key: "status", label: "Status" },
          ]}
        />

        <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Previous Company</th>
              <th>HR Email</th>
              <th>Feedback</th>
              <th>Rehire</th>
              <th>Criminal Record</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.employee_name || item.employee_id}</td>
                <td>{item.previous_company}</td>
                <td>{item.hr_email}</td>
                <td>{item.feedback}</td>
                <td>{item.rehire_eligible}</td>
                <td>{item.criminal_record}</td>
                <td>{badge(item.status)}</td>
                <td>
                  {item.status === "Pending" && (
                    <>
                      <button onClick={() => track(item.id, "start")}>
                        Start Check
                      </button>{" "}
                    </>
                  )}
                  {(item.status === "Pending" ||
                    item.status === "In Progress") && (
                    <>
                      <button className="btn-success" onClick={() => track(item.id, "verify")}>
                        Verify
                      </button>{" "}
                      <button className="btn-danger" onClick={() => track(item.id, "reject")}>
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="9">No background verification cases yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}

export default BackgroundVerification;
