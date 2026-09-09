import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ExportBar from "../components/ExportBar";

import API from "../services/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    API.get("/audit-logs")
      .then((res) => setLogs([...res.data].reverse()))
      .catch(() => {});
  }, []);

  const filtered = logs.filter((log) =>
    log.action.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>Audit Logs</h1>
        <p className="page-desc">
          Chronological trail of every verification action in the portal.
        </p>

        <div className="export-bar">
          <input
            placeholder="Filter by action..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ flex: "0 1 260px" }}
          />
          <span className="spacer" />
        </div>

        <ExportBar
          filename="audit-logs"
          rows={filtered}
          columns={[
            { key: "id", label: "ID" },
            { key: "action", label: "Action" },
            { key: "document_id", label: "Ref ID" },
            { key: "created_at", label: "Timestamp" },
          ]}
        />

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Reference</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: "#9ca3af" }}>{log.id}</td>
                  <td style={{ fontWeight: 600 }}>{log.action}</td>
                  <td>
                    {log.document_id > 0 ? `Doc #${log.document_id}` : "-"}
                  </td>
                  <td style={{ color: "#6b7280" }}>
                    {log.created_at
                      ? new Date(log.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ color: "#6b7280" }}>
                    No audit entries found.
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

export default AuditLogs;
