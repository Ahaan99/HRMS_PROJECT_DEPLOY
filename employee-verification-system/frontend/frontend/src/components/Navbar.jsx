function Navbar() {
  const email = localStorage.getItem("email") || "admin@test.com";

  const onMenu = () => {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/";
  };

  return (
    <div className="navbar">
      <button
        className="menu-btn"
        onClick={onMenu}
        aria-label="Toggle navigation menu"
      >
        &#9776;
      </button>

      <div className="brand">
        <img src="/logo.png" alt="Ardhnarishwar logo" className="brand-badge" />
        <div>
          <h2>Employee Verification</h2>
          <div className="brand-sub">HRMS Verification Portal</div>
        </div>
      </div>

      <div className="nav-right">
        <div className="nav-user">
          Super Admin
          <div style={{ color: "#9ca3af", fontWeight: 400 }}>{email}</div>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;
