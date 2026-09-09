import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import API from "../services/api";

function Profile() {
  const email = localStorage.getItem("email") || "admin@test.com";
  const role = localStorage.getItem("role") || "Admin";

  const [hrms, setHrms] = useState(null);

  useEffect(() => {
    API.get("/hrms-status")
      .then((res) => setHrms(res.data))
      .catch(() => {});
  }, []);

  const initials = email.slice(0, 2).toUpperCase();

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">
        <h1>My Profile</h1>
        <p className="page-desc">Your account and portal connection details.</p>

        <div
          className="table-wrap"
          style={{
            padding: 24,
            maxWidth: 560,
            display: "flex",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#0b1220",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Super Admin</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>
              {email}
            </div>
            <span
              className="status verified"
              style={{ marginTop: 8, display: "inline-block" }}
            >
              {role}
            </span>
          </div>
        </div>

        <h3>Account Details</h3>
        <div className="table-wrap" style={{ maxWidth: 560 }}>
          <table>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: 180 }}>Email</td>
                <td>{email}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Role</td>
                <td>{role}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Portal</td>
                <td>Employee Verification System</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>HRMS Connection</td>
                <td>
                  {hrms === null ? (
                    "Checking..."
                  ) : hrms.connected ? (
                    <span className="status verified">
                      Connected ({hrms.hrms_database})
                    </span>
                  ) : (
                    <span className="status rejected">Disconnected</span>
                  )}
                </td>
              </tr>
              {hrms?.connected && (
                <tr>
                  <td style={{ fontWeight: 600 }}>HRMS Employees</td>
                  <td>
                    {hrms.hrms_employees} total, {hrms.synced} synced to this
                    portal
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3>Session</h3>
        <div
          className="table-wrap"
          style={{
            padding: 18,
            maxWidth: 560,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            You are signed in with a secure JWT session token.
          </div>
          <button className="btn-danger" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

export default Profile;
