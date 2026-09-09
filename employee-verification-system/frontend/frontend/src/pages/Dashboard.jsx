import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";

function Dashboard() {
  const [docs, setDocs] = useState(null);
  const [status, setStatus] = useState(null);
  const [hrms, setHrms] = useState(null);
  const [logs, setLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const fetchAll = async () => {
    try {
      const [d, v, h, l] = await Promise.all([
        API.get("/dashboard"),
        API.get("/verification-status"),
        API.get("/hrms-status"),
        API.get("/audit-logs"),
      ]);
      setDocs(d.data);
      setStatus(v.data);
      setHrms(h.data);
      setLogs([...l.data].reverse());
    } catch (error) {
      toast.error("Failed to load dashboard data");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const syncNow = async () => {
    try {
      setSyncing(true);
      const res = await API.post("/hrms-sync");
      if (res.data.error) {
        toast.error(res.data.error);
      } else {
        toast.success(res.data.message);
        fetchAll();
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const s = status?.summary;

  const pipeline = s
    ? [
        {
          label: "Fully Verified",
          value: s.fully_verified,
          color: "#16a34a",
        },
        { label: "In Progress", value: s.in_progress, color: "#d97706" },
        {
          label: "Action Required",
          value: s.action_required,
          color: "#dc2626",
        },
        { label: "Not Started", value: s.not_started, color: "#6b7280" },
      ]
    : [];

  const total = s?.total || 0;

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>Verification Dashboard</h1>
        <p className="page-desc">
          Central command for employee verification across the HRMS.
        </p>

        {/* ---- HRMS connection banner ---- */}
        {hrms && (
          <div
            className="table-wrap"
            style={{
              padding: "14px 18px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "12px",
              borderLeft: hrms.connected
                ? "4px solid #16a34a"
                : "4px solid #dc2626",
            }}
          >
            <div style={{ flex: "1 1 300px" }}>
              <strong>
                {hrms.connected
                  ? "Connected to HRMS"
                  : "HRMS connection failed"}
              </strong>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {hrms.connected
                  ? `Database: ${hrms.hrms_database} - ${hrms.hrms_employees} HRMS employees, ${hrms.synced} synced, ${hrms.not_synced} pending sync`
                  : hrms.error}
              </div>
            </div>
            {hrms.connected && (
              <button onClick={syncNow} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync Employees from HRMS"}
              </button>
            )}
          </div>
        )}

        {/* ---- headline stats ---- */}
        {s && docs && (
          <div className="cards">
            <div className="card">
              Employees
              <span className="card-value">{s.total}</span>
            </div>
            <div className="card">
              Fully Verified
              <span className="card-value" style={{ color: "#16a34a" }}>
                {s.fully_verified}
              </span>
            </div>
            <div className="card">
              In Progress
              <span className="card-value" style={{ color: "#d97706" }}>
                {s.in_progress}
              </span>
            </div>
            <div className="card">
              Action Required
              <span className="card-value" style={{ color: "#dc2626" }}>
                {s.action_required}
              </span>
            </div>
            <div className="card">
              Documents Pending
              <span className="card-value">{docs.pending_documents}</span>
            </div>
          </div>
        )}

        {/* ---- verification pipeline ---- */}
        {s && total > 0 && (
          <>
            <h3>Verification Pipeline</h3>
            <div className="table-wrap" style={{ padding: "18px" }}>
              <div
                style={{
                  display: "flex",
                  height: 14,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "#f3f4f6",
                }}
              >
                {pipeline.map(
                  (p) =>
                    p.value > 0 && (
                      <div
                        key={p.label}
                        style={{
                          width: `${(p.value / total) * 100}%`,
                          background: p.color,
                        }}
                        title={`${p.label}: ${p.value}`}
                      />
                    )
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginTop: 12,
                  fontSize: 12,
                  color: "#374151",
                }}
              >
                {pipeline.map((p) => (
                  <span
                    key={p.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: p.color,
                        display: "inline-block",
                      }}
                    />
                    {p.label}: <strong>{p.value}</strong>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ---- quick actions ---- */}
        <h3>Quick Actions</h3>
        <div className="cards">
          <Link to="/identity-verification" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer" }}>
              Verify Aadhaar / PAN
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 6,
                  fontWeight: 400,
                }}
              >
                Submit and approve identity documents
              </span>
            </div>
          </Link>
          <Link to="/documents" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer" }}>
              Review Documents
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 6,
                  fontWeight: 400,
                }}
              >
                {docs ? `${docs.pending_documents} pending review` : "..."}
              </span>
            </div>
          </Link>
          <Link
            to="/background-verification"
            style={{ textDecoration: "none" }}
          >
            <div className="card" style={{ cursor: "pointer" }}>
              Background Checks
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 6,
                  fontWeight: 400,
                }}
              >
                Track ongoing background verification
              </span>
            </div>
          </Link>
          <Link to="/verification-status" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer" }}>
              Status Overview
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 6,
                  fontWeight: 400,
                }}
              >
                Per-employee verification matrix
              </span>
            </div>
          </Link>
        </div>

        {/* ---- recent activity ---- */}
        <h3>Recent Activity</h3>
        <div className="table-wrap" style={{ padding: "6px 16px" }}>
          {logs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #f3f4f6",
                fontSize: 13,
                color: "#374151",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span>{log.action}</span>
              <span style={{ color: "#9ca3af", whiteSpace: "nowrap" }}>
                {log.created_at
                  ? new Date(log.created_at).toLocaleString()
                  : ""}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div style={{ padding: "12px 0", color: "#6b7280" }}>
              No recent activity.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
