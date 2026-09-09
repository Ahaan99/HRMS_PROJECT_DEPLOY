import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

import API from "../services/api";
import "../styles/login-premium.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get("sig") && params.get("ts") && params.get("email"));
  });

  // ===== SSO handoff from HRMS Admin Panel =====
  // The admin panel sends a short-lived HMAC signature (ts + sig)
  // instead of the raw shared SSO key, so nothing secret is in the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoEmail = params.get("email");
    const ssoTs = params.get("ts");
    const ssoSig = params.get("sig");

    if (!ssoSig || !ssoTs || !ssoEmail) return;
    if (localStorage.getItem("token")) return; // already signed in

    // Strip SSO params from the URL immediately so they never linger
    // in the address bar or get copied/bookmarked.
    window.history.replaceState({}, "", "/");

    API.post("/sso-login", {
      email: ssoEmail,
      ts: ssoTs,
      sig: ssoSig,
      name: params.get("name") || "Super Admin",
    })
      .then((res) => {
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("role", res.data.role || "User");
        localStorage.setItem("email", ssoEmail);
        if (res.data.name) localStorage.setItem("name", res.data.name);

        toast.success("Signed in from HRMS Admin Panel");
        window.history.replaceState({}, "", "/");

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      })
      .catch((error) => {
        setSsoLoading(false);
        window.history.replaceState({}, "", "/");
        if (error.response) {
          toast.error(
            error.response.data.detail ||
              "HRMS SSO failed - please sign in manually"
          );
        } else {
          toast.error("HRMS backend not reachable (port 5000)");
        }
      });
  }, []);

  if (localStorage.getItem("token")) {
    return <Navigate to="/dashboard" replace />;
  }

  const login = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const res = await API.post("/login", formData);

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role || "User");
      localStorage.setItem("email", email);
      if (res.data.name) localStorage.setItem("name", res.data.name);

      toast.success("Login Successful");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.detail || "Login Failed");
      } else {
        toast.error("Backend not running on port 8000");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      login();
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--mx",
      `${((e.clientX - rect.left) / rect.width) * 100}%`
    );
    e.currentTarget.style.setProperty(
      "--my",
      `${((e.clientY - rect.top) / rect.height) * 100}%`
    );
  };

  return (
    <div className="login-container" onMouseMove={handleMouseMove}>
      <div className="login-aurora a1" aria-hidden="true" />
      <div className="login-aurora a2" aria-hidden="true" />
      <div className="login-aurora a3" aria-hidden="true" />
      <div className="login-cursor-glow" aria-hidden="true" />

      {ssoLoading && (
        <div
          role="status"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            background: "rgba(10, 6, 30, 0.82)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "3px solid rgba(139, 92, 246, 0.25)",
              borderTopColor: "#8b5cf6",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "#e9e4ff", fontWeight: 600, fontSize: "15px" }}>
            Signing you in from HRMS Admin Panel...
          </p>
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        </div>
      )}

      <div className="login-frame">
        <div className="login-shell">
        {/* ===== BRAND PANEL ===== */}
        <div className="login-brand">
          <div className="login-brand-top">
            <img
              src="/logo.png"
              alt="Ardhnarishwar logo"
              className="login-logo"
            />
            <div>
              <p className="login-brand-name">ARDHNARISHWAR</p>
              <p className="login-brand-sub">Employee Verification System</p>
            </div>
          </div>

          <div className="login-brand-body">
            <h1>
              Verify with <span>confidence.</span>
            </h1>
            <p>
              Manage verifications, documents and background checks from one
              secure portal.
            </p>

            <ul className="login-points">
              <li>Document &amp; identity verification</li>
              <li>Background check tracking</li>
              <li>Exportable audit reports</li>
            </ul>
          </div>

          <p className="login-brand-foot">
            Trusted internal tool &middot; Authorized staff only
          </p>
        </div>

        {/* ===== FORM PANEL ===== */}
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="login-sub">Sign in to your verification workspace</p>

          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
          />

          <button onClick={login} disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div className="login-demo">
            Sign in with your existing HRMS account
            <br />
            <strong>Super Admin</strong>, <strong>HR</strong> or{" "}
            <strong>Client</strong> credentials work here
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
