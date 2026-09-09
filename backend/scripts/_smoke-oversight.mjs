// _smoke-oversight.mjs — live smoke test of the new Super Admin oversight + emergency endpoints.
// Usage: node scripts/_smoke-oversight.mjs   (backend must be running on :5000, local demo DB)
const BASE = process.env.BASE || "http://localhost:5000";
const results = [];
const rec = (name, ok, info = "") => { results.push({ name, ok, info }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  -> " + info : ""}`); };
const tok = (j) => j.token || j.accessToken || j.access_token || j.data?.token || j.data?.accessToken;

async function login(path, body) {
  const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, token: tok(j), headers: r.headers, body: j };
}
async function get(path, token) {
  const r = await fetch(BASE + path, { headers: { authorization: `Bearer ${token}` } });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j, headers: r.headers };
}
const count = (b) => { const d = b.data ?? b; if (Array.isArray(d)) return d.length; for (const k of ["rows", "items", "logs", "calls", "leads", "invoices", "inventory"]) if (Array.isArray(d?.[k])) return d[k].length; return "?"; };

const admin = await login("/api/super-admin/auth/login", { email: "admin@hrms.com", password: "admin123" });
rec("superadmin login", admin.status === 200 && !!admin.token, `status=${admin.status}`);
rec("helmet headers on response", !!admin.headers.get("x-content-type-options"), `x-content-type-options=${admin.headers.get("x-content-type-options")} referrer-policy=${admin.headers.get("referrer-policy")}`);
rec("login rate-limit headers", !!(admin.headers.get("ratelimit-limit") || admin.headers.get("x-ratelimit-limit") || admin.headers.get("ratelimit-policy")), `ratelimit=${admin.headers.get("ratelimit-limit") || admin.headers.get("ratelimit-policy")}`);

const hr = await login("/api/hr/auth/login", { email: "walkthrough.hr@hrms.local", password: "Test@1234" });
rec("hr login", hr.status === 200 && !!hr.token, `status=${hr.status}`);
const emp = await login("/api/employee/auth/login", { email: "rohan@demo.hrms", password: "Test@1234" });
rec("employee login", emp.status === 200 && !!emp.token, `status=${emp.status}`);

if (admin.token) {
  const t = admin.token;
  for (const e of ["/api/emergency", "/api/emergency?status=open", "/api/emergency/summary",
    "/api/super-admin/oversight/sales/summary", "/api/super-admin/oversight/sales/calls",
    "/api/super-admin/oversight/sales/inventory", "/api/super-admin/oversight/sales/field-leads",
    "/api/super-admin/oversight/client-invoices"]) {
    const r = await get(e, t); rec(`GET ${e}`, r.status === 200 && r.body.success !== false, `status=${r.status} rows=${count(r.body)}`);
  }
  const inv = await get("/api/super-admin/oversight/client-invoices", t);
  const first = (inv.body.data?.rows || inv.body.data || [])[0];
  if (first?.id) { const r = await get(`/api/super-admin/oversight/client-invoices/${first.id}`, t); rec(`GET client-invoices/${first.id} (items)`, r.status === 200, `status=${r.status} rows=${count(r.body)}`); }

  for (const cid of [16, 19]) {
    const r = await get(`/api/super-admin/oversight/clients/${cid}/operations`, t);
    const d = r.body.data || {};
    rec(`GET oversight/clients/${cid}/operations`, r.status === 200 && r.body.success !== false, `status=${r.status} sections=${Object.keys(d).join(",")}`);
  }
  if (hr.token) { const r = await get("/api/super-admin/oversight/sales/calls", hr.token); rec("HR forbidden on super-admin oversight", r.status === 401 || r.status === 403, `status=${r.status}`); }
  if (emp.token) { const r = await get("/api/emergency", emp.token); rec("Employee forbidden on emergency list", r.status === 401 || r.status === 403, `status=${r.status}`); }
}
if (hr.token) { const r = await get("/api/emergency?status=open", hr.token); rec("HR can read emergency list", r.status === 200, `status=${r.status} rows=${count(r.body)}`); }

// trigger -> appears in list -> resolve -> click_count reset lets a re-trigger through
if (emp.token && admin.token) {
  const tr = await fetch(BASE + "/api/emergency", { method: "POST", headers: { authorization: `Bearer ${emp.token}`, "content-type": "application/json" }, body: JSON.stringify({ message: "SMOKE-TEST emergency (auto)" }) });
  const tj = await tr.json().catch(() => ({}));
  rec("employee triggers emergency", tr.status === 200 || tr.status === 201, `status=${tr.status} ${JSON.stringify(tj).slice(0, 120)}`);
  const open = await get("/api/emergency?status=open", admin.token);
  const rows = open.body.data?.rows || open.body.data || [];
  const mine = rows.find((x) => /SMOKE-TEST/.test(x.message || x.description || "")) || rows[0];
  rec("triggered alert visible to super admin", !!mine, `open=${rows.length}`);
  if (mine?.id) {
    const rs = await fetch(BASE + `/api/emergency/${mine.id}/resolve`, { method: "PATCH", headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/json" }, body: JSON.stringify({ note: "smoke resolved" }) });
    rec("super admin resolves alert", rs.status === 200, `status=${rs.status}`);
    const again = await fetch(BASE + "/api/emergency", { method: "POST", headers: { authorization: `Bearer ${emp.token}`, "content-type": "application/json" }, body: JSON.stringify({ message: "SMOKE-TEST re-trigger after resolve" }) });
    const aj = await again.json().catch(() => ({}));
    rec("re-trigger allowed after resolve (click_count reset)", again.status === 200 || again.status === 201, `status=${again.status} ${JSON.stringify(aj).slice(0, 100)}`);
    const open2 = await get("/api/emergency?status=open", admin.token);
    const r2 = (open2.body.data?.rows || open2.body.data || []).find((x) => /re-trigger/.test(x.message || x.description || ""));
    if (r2?.id) await fetch(BASE + `/api/emergency/${r2.id}/resolve`, { method: "PATCH", headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/json" }, body: JSON.stringify({ note: "smoke cleanup" }) });
  }
}

let tripped = false;
for (let i = 0; i < 25; i++) { const r = await fetch(BASE + "/api/super-admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "nobody@x.com", password: "wrong" }) }); if (r.status === 429) { tripped = true; break; } }
rec("login limiter trips on brute force (429)", tripped);

const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} passed`);
process.exit(fails.length ? 1 : 0);
