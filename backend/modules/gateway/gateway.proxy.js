/**
 * API GATEWAY — Unified backend for all portals.
 *
 * The Node backend (port 5000) is the ONLY backend the frontends talk to.
 * Requests under the prefixes below are transparently proxied (streamed)
 * to the internal Python services, so the browser never needs to reach
 * ports 8000 / 8001 / 5050 directly:
 *
 *   /api/evs/*               -> EVS FastAPI backend        (default http://127.0.0.1:8000)
 *   /api/hr-robo/*           -> HR Robo FastAPI backend    (default http://127.0.0.1:8001)
 *   /api/smart-attendance/*  -> Smart Attendance Flask app (default http://127.0.0.1:5050)
 *
 * Targets are overridable via .env:
 *   EVS_SERVICE_URL, HR_ROBO_SERVICE_URL, SMART_ATTENDANCE_SERVICE_URL
 *
 * Implementation notes (IMPORTANT — do not "simplify"):
 *  - Zero external dependencies: uses Node's built-in http/https modules,
 *    so nothing new needs installing on the server.
 *  - MUST be mounted BEFORE express.json()/urlencoded() in app.js.
 *    Bodies are piped as raw streams, so multipart uploads (CVs, face
 *    images) and large payloads pass through uncorrupted.
 *  - Response is also streamed, and ALL response headers are forwarded,
 *    so HTTP Range requests (interview video streaming) work correctly.
 *  - If a Python service is down, the gateway answers 502 with a clear
 *    JSON message instead of hanging or crashing the Node process.
 */

import http from "http";
import https from "https";

/* NOTE: ALL former Python services now run natively inside this Node backend:
     /api/evs              -> modules/evs
     /api/hr-robo          -> modules/hrRobo
     /api/smart-attendance -> modules/attendance
   TARGETS is therefore empty and mountGateway() is a no-op. It is kept so an
   external service can be re-attached later by adding a prefix -> URL here. */
const TARGETS = {};

const SERVICE_NAMES = {};

function makeProxyHandler(prefix, target) {
  const targetUrl = new URL(target);
  const isHttps = targetUrl.protocol === "https:";
  const lib = isHttps ? https : http;
  const defaultPort = isHttps ? 443 : 80;

  return (req, res) => {
    // Strip the gateway prefix; keep the rest of the path + query string.
    let downstreamPath = req.originalUrl.slice(prefix.length);
    if (!downstreamPath.startsWith("/")) downstreamPath = "/" + downstreamPath;

    const headers = { ...req.headers, host: targetUrl.host };
    // The client's connection-specific headers must not be forwarded.
    delete headers["connection"];
    delete headers["keep-alive"];
    delete headers["transfer-encoding"];
    // Tell the downstream service who the real caller is.
    headers["x-forwarded-for"] =
      (req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"] + ", " : "") +
      (req.socket.remoteAddress || "");
    headers["x-forwarded-proto"] = req.protocol;
    headers["x-forwarded-host"] = req.headers.host || "";

    const proxyReq = lib.request(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port || defaultPort,
        path: downstreamPath,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    // 60s safety timeout so a wedged service can't hold sockets forever.
    proxyReq.setTimeout(60_000, () => proxyReq.destroy(new Error("gateway timeout")));

    proxyReq.on("error", (err) => {
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader("Content-Type", "application/json");
      }
      res.end(
        JSON.stringify({
          success: false,
          message: `${SERVICE_NAMES[prefix]} service is not reachable. Make sure it is running.`,
          detail: err.code || err.message,
        })
      );
    });

    // Abort downstream request if the client disconnects mid-stream.
    req.on("aborted", () => proxyReq.destroy());

    // Stream the raw request body through (multipart-safe).
    req.pipe(proxyReq);
  };
}

/** Mount all gateway routes on the Express app. Call BEFORE body parsers. */
export function mountGateway(app) {
  for (const [prefix, target] of Object.entries(TARGETS)) {
    app.use(prefix, makeProxyHandler(prefix, target));
    console.log(`[gateway] ${prefix}/* -> ${target}`);
  }
}
