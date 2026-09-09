import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";
import ExportBar from "../components/ExportBar";

function InternationalVerification() {
  const [countries, setCountries] = useState([]);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [form, setForm] = useState({
    employee_id: "",
    country_code: "",
    doc_type: "",
    doc_number: "",
  });
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [cRes, rRes, eRes] = await Promise.all([
        API.get("/international-verification/countries"),
        API.get("/international-verification"),
        API.get("/employees"),
      ]);
      setCountries(cRes.data);
      setRecords(rRes.data);
      setEmployees(eRes.data);
    } catch (error) {
      console.log("International API Error", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === form.country_code) || null,
    [countries, form.country_code],
  );

  const selectedDoc = useMemo(
    () =>
      selectedCountry?.documents.find((d) => d.type === form.doc_type) ||
      null,
    [selectedCountry, form.doc_type],
  );

  const pickCountry = (code) => {
    const country = countries.find((c) => c.code === code);
    setForm({
      ...form,
      country_code: code,
      doc_type: country?.documents.length === 1 ? country.documents[0].type : "",
      doc_number: "",
    });
    setMessage("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const res = await API.post("/international-verification", {
        employee_id: Number(form.employee_id),
        country_code: form.country_code,
        doc_type: form.doc_type,
        doc_number: form.doc_number,
      });
      setMessageOk(true);
      setMessage(res.data.message);
      setForm({
        employee_id: "",
        country_code: "",
        doc_type: "",
        doc_number: "",
      });
      fetchData();
    } catch (error) {
      setMessageOk(false);
      setMessage(error.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (id, action) => {
    try {
      await API.put(`/international-verification/${id}`, { action });
      fetchData();
    } catch (error) {
      setMessageOk(false);
      setMessage(error.response?.data?.detail || "Update failed");
    }
  };

  const badge = (status) => {
    const colors = {
      Verified: "#16a34a",
      Rejected: "#dc2626",
      "Pending Approval": "#d97706",
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
        {status || "Not Submitted"}
      </span>
    );
  };

  const countryChip = (code, name) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          background: "#eef2ff",
          color: "#4338ca",
          fontWeight: 700,
          fontSize: "11px",
          padding: "2px 6px",
          borderRadius: "6px",
          letterSpacing: "0.5px",
        }}
      >
        {code}
      </span>
      {name}
    </span>
  );

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>International Verification</h1>
        <p style={{ color: "#6b7280", marginTop: "-6px", fontSize: "14px" }}>
          Citizenship &amp; identity document verification for foreign
          nationals &mdash; Nepal, Bhutan, Bangladesh, Sri Lanka and more.
        </p>

        <form onSubmit={submit} className="form-box" style={{ display: "block" }}>
          {/* Step 1: employee */}
          <div style={{ marginBottom: "14px" }}>
            <div style={stepTitle}>1. Select Employee</div>
            <select
              value={form.employee_id}
              onChange={(e) =>
                setForm({ ...form, employee_id: e.target.value })
              }
              required
              style={{ width: "100%", maxWidth: "420px" }}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (ID {emp.id})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: country cards */}
          <div style={{ marginBottom: "14px" }}>
            <div style={stepTitle}>2. Select Country of Citizenship</div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {countries.map((c) => {
                const active = form.country_code === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => pickCountry(c.code)}
                    style={{
                      border: active
                        ? "2px solid #4f46e5"
                        : "1px solid #d1d5db",
                      background: active ? "#eef2ff" : "#ffffff",
                      color: active ? "#3730a3" : "#374151",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: active ? 700 : 500,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: document type */}
          {selectedCountry && (
            <div style={{ marginBottom: "14px" }}>
              <div style={stepTitle}>
                3. Select Document ({selectedCountry.name})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedCountry.documents.map((d) => {
                  const active = form.doc_type === d.type;
                  return (
                    <button
                      key={d.type}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, doc_type: d.type, doc_number: "" })
                      }
                      style={{
                        border: active
                          ? "2px solid #059669"
                          : "1px solid #d1d5db",
                        background: active ? "#ecfdf5" : "#ffffff",
                        color: active ? "#065f46" : "#374151",
                        borderRadius: "10px",
                        padding: "8px 14px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: active ? 700 : 500,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: number */}
          {selectedDoc && (
            <div style={{ marginBottom: "14px" }}>
              <div style={stepTitle}>4. Enter Document Number</div>
              <input
                type="text"
                placeholder={selectedDoc.hint}
                value={form.doc_number}
                maxLength={selectedDoc.max_len + 4}
                onChange={(e) =>
                  setForm({
                    ...form,
                    doc_number: e.target.value.toUpperCase(),
                  })
                }
                required
                style={{ width: "100%", maxWidth: "420px" }}
              />
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginTop: "4px",
                }}
              >
                Format: {selectedDoc.hint}. Only a masked value is stored.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              !form.employee_id ||
              !form.country_code ||
              !form.doc_type ||
              !form.doc_number
            }
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        </form>

        {message && (
          <p
            className="info-message"
            style={{ color: messageOk ? undefined : "#dc2626" }}
          >
            {message}
          </p>
        )}

        <h3>International Verification Records</h3>

        <ExportBar
          filename="international-verification"
          rows={records}
          columns={[
            { key: "employee_name", label: "Employee" },
            { key: "country_name", label: "Country" },
            { key: "doc_label", label: "Document" },
            { key: "doc_masked", label: "Number (Masked)" },
            { key: "status", label: "Status" },
            { key: "updated_at", label: "Updated" },
          ]}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Country</th>
                <th>Document</th>
                <th>Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td>{rec.employee_name}</td>
                  <td>{countryChip(rec.country_code, rec.country_name)}</td>
                  <td>{rec.doc_label}</td>
                  <td style={{ fontFamily: "monospace" }}>
                    {rec.doc_masked || "-"}
                  </td>
                  <td>{badge(rec.status)}</td>
                  <td>
                    {rec.status === "Pending Approval" && (
                      <>
                        <button
                          className="btn-success"
                          onClick={() => decide(rec.id, "approve")}
                        >
                          Approve
                        </button>{" "}
                        <button
                          className="btn-danger"
                          onClick={() => decide(rec.id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="6">
                    No international verifications submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

const stepTitle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#374151",
  marginBottom: "6px",
};

export default InternationalVerification;
