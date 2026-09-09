/**
 * Smoke test for the native HR Robo module.
 *   node scripts/hrrobo-smoke.mjs [baseUrl] [email] [password]
 */
const BASE = process.argv[2] || "http://localhost:5000/api/hr-robo";
const EMAIL = process.argv[3] || "admin@hrms.com";
const PASS = process.argv[4] || "admin123";
const out = [];
const log = (...a) => out.push(a.join(" "));

async function hit(label, url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    const ct = r.headers.get("content-type") || "";
    let body = "";
    if (ct.includes("json")) body = JSON.stringify(await r.json()).slice(0, 160);
    else body = `${ct} len=${r.headers.get("content-length") || "?"} range=${r.headers.get("content-range") || "-"}`;
    log(`${r.status}  ${label}  ${body}`);
    return r;
  } catch (e) {
    log(`ERR  ${label}  ${e.message}`);
  }
}

await hit("GET /health", `${BASE}/health`);
await hit("GET / (UI)", `${BASE}/`);
await hit("GET /api/integration/summary (no token)", `${BASE}/api/integration/summary`);

const login = await fetch(`${BASE}/api/v1/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASS }),
});
const lj = await login.json().catch(() => ({}));
log(`${login.status}  POST /api/v1/auth/login  role=${lj?.user?.role} token=${lj.access_token ? "yes" : "no"}`);
const auth = { Authorization: `Bearer ${lj.access_token}` };

await hit("GET /api/v1/auth/me", `${BASE}/api/v1/auth/me`, { headers: auth });
await hit("GET /api/integration/summary", `${BASE}/api/integration/summary`, { headers: auth });
await hit("GET /api/integration/reports", `${BASE}/api/integration/reports`, { headers: auth });
await hit("GET /api/integration/proctor-logs", `${BASE}/api/integration/proctor-logs`, { headers: auth });
const vids = await hit("GET /api/videos", `${BASE}/api/videos`, { headers: auth });
const vj = vids ? await fetch(`${BASE}/api/videos`, { headers: auth }).then((r) => r.json()) : { videos: {} };
const firstCid = Object.keys(vj.videos || {})[0];
if (firstCid) {
  await hit(`GET /api/videos/${firstCid} (Range 0-99)`, `${BASE}/api/videos/${firstCid}`, { headers: { Range: "bytes=0-99" } });
} else log("--   no recordings to stream");
await hit("GET /api/v1/test-groq", `${BASE}/api/v1/test-groq`);
await hit("POST /api/v1/tts", `${BASE}/api/v1/tts`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Hello, welcome to your interview.", lang: "en" }),
});

const fs = await import("fs");
fs.writeFileSync("_robo_refs.txt", out.join("\n") + "\n");
