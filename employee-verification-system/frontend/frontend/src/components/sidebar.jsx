import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

function Sidebar() {
  const role = localStorage.getItem("role");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    window.addEventListener("toggle-sidebar", toggle);
    return () => window.removeEventListener("toggle-sidebar", toggle);
  }, []);

  const onClose = () => setOpen(false);

  const cls = ({ isActive }) => (isActive ? "active" : "");

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={onClose}
      />

      <div className={`sidebar ${open ? "open" : ""}`}>
        <div className="side-section">Overview</div>

        <NavLink to="/dashboard" className={cls} onClick={onClose}>
          <span className="side-icon">&#9632;</span> Dashboard
        </NavLink>

        <NavLink to="/verification-status" className={cls} onClick={onClose}>
          <span className="side-icon">&#10003;</span> Verification Status
        </NavLink>

        <div className="side-section">Verification</div>

        <NavLink to="/identity-verification" className={cls} onClick={onClose}>
          <span className="side-icon">&#128273;</span> Aadhaar / PAN
        </NavLink>

        <NavLink
          to="/international-verification"
          className={cls}
          onClick={onClose}
        >
          <span className="side-icon">&#127760;</span> International
        </NavLink>

        <NavLink to="/documents" className={cls} onClick={onClose}>
          <span className="side-icon">&#128196;</span> Documents
        </NavLink>

        <NavLink
          to="/background-verification"
          className={cls}
          onClick={onClose}
        >
          <span className="side-icon">&#128737;</span> Background Check
        </NavLink>

        <NavLink to="/employment-history" className={cls} onClick={onClose}>
          <span className="side-icon">&#128188;</span> Employment History
        </NavLink>

        <div className="side-section">Management</div>

        {(role === "Admin" || role === "HR") && (
          <NavLink to="/employees" className={cls} onClick={onClose}>
            <span className="side-icon">&#128101;</span> Employees
          </NavLink>
        )}

        {role === "Admin" && (
          <NavLink to="/reports" className={cls} onClick={onClose}>
            <span className="side-icon">&#128200;</span> Reports
          </NavLink>
        )}

        <NavLink to="/audit-logs" className={cls} onClick={onClose}>
          <span className="side-icon">&#128337;</span> Audit Logs
        </NavLink>

        <NavLink to="/profile" className={cls} onClick={onClose}>
          <span className="side-icon">&#9881;</span> Profile
        </NavLink>
      </div>
    </>
  );
}

export default Sidebar;
