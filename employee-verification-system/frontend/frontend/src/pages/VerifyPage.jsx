import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";

/**
 * Public page opened from the verification e-mail link:
 *   /verify/:token?action=verify | reject
 * Calls the public backend endpoint GET /verify-token/:token?action=...
 */
function VerifyPage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const hinted = params.get("action") === "reject" ? "reject" : "verify";
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAction = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await API.get(`/verify-token/${token}?action=${action}`);
      setResult(data?.message || `Document ${action === "reject" ? "Rejected" : "Verified"}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.detail || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "100px auto", textAlign: "center", fontFamily: "system-ui" }}>
      <h2 style={{ marginBottom: 8 }}>Document Verification</h2>

      {result ? (
        <>
          <p style={{ color: "#059669", fontWeight: 600 }}>{result}</p>
          <button onClick={() => navigate("/")} style={{ marginTop: 16, padding: "10px 18px" }}>
            Go to portal
          </button>
        </>
      ) : (
        <>
          <p style={{ color: "#555" }}>
            Confirm the action for this document. This link expires 30 minutes after it was sent.
          </p>
          {error && <p style={{ color: "#dc2626", fontWeight: 600 }}>{error}</p>}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16 }}>
            <button
              disabled={busy}
              onClick={() => handleAction("verify")}
              style={{
                padding: "10px 18px",
                fontWeight: hinted === "verify" ? 700 : 400,
                background: "#059669",
                color: "#fff",
                border: 0,
                borderRadius: 6,
              }}
            >
              Verify
            </button>
            <button
              disabled={busy}
              onClick={() => handleAction("reject")}
              style={{
                padding: "10px 18px",
                fontWeight: hinted === "reject" ? 700 : 400,
                background: "#dc2626",
                color: "#fff",
                border: 0,
                borderRadius: 6,
              }}
            >
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default VerifyPage;
