import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from "react-hot-toast";
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

// Top-level error boundary: a runtime crash should never show a blank white page.
class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "system-ui, sans-serif", padding: "1rem" }}>
          <div style={{ maxWidth: "28rem", width: "100%", background: "#fff", borderRadius: "1rem", boxShadow: "0 10px 30px rgba(2,6,23,0.08)", border: "1px solid #e2e8f0", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Something went wrong
            </div>
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem", wordBreak: "break-word" }}>
              {String(this.state.error?.message || this.state.error)}
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("hrms_client_Token");
                  localStorage.removeItem("hrms_client_user");
                  localStorage.removeItem("hrms_client_features");
                } catch { /* ignore */ }
                window.location.href = "/login";
              }}
              style={{ cursor: "pointer", border: "none", borderRadius: "0.75rem", padding: "0.625rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#fff", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 6px 16px rgba(79,70,229,0.35)" }}
            >
              Reset &amp; go to login
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// PWA: register the service worker in production builds only.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootErrorBoundary>
      <ThemeProvider>
        <App />
        <Toaster position="top-right" reverseOrder={false} />
      </ThemeProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
