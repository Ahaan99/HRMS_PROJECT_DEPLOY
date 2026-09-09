// _smoke-portals.mjs — hit every live GET endpoint each portal calls (from _xcheck-out.json)
// with a token minted for that portal's role; report non-2xx with the server message.
// Requires backend running on :5000 (uses ../config/db.js to pick real ids). Read-only against DB.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_BASE || "http://127.0.0.1:5000";
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "_xcheck-out.json"), "utf8"));
const out = [];
const log = (s) => { out.push(s); console.log(s); };
let tempClientId = null;
let adminToken = null;
async function cleanup() {
  if (tempClientId && adminToken) {
    const r = await fetch(`${BASE}/api/super-admin/clients/${tempClientId}`, { method: "DELETE", headers: { authorization: `Bearer ${adminToken}` } });
    log(`temp client delete -> ${r.status}`);
  }
}

async function deptEmployee(dept) {
  const [[row]] = await db.query(
    `SELECT e.id, e.employeeCode, e.name, e.email, e.joiningId, d.name AS department
       FROM employees e JOIN departments d ON d.id = e.departmentId
      WHERE UPPER(d.name) = ? AND e.isActive = 1 ORDER BY e.id LIMIT 1`, [dept]);
  return row || null;
}

async function tokens() {
  const t = {};
  // admin: real login (validates the login path too)
  try {
    const r = await fetch(`${BASE}/api/super-admin/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.SA_EMAIL || "admin@hrms.com", password: process.env.SA_PASSWORD || "admin123" }) });
    const j = await r.json().catch(() => ({}));
    t.admin = j.access_token || j.token || j.data?.token || null;
    adminToken = t.admin;
    log(`login admin -> ${r.status} token=${!!t.admin}`);
  } catch (e) { log("login admin failed: " + e.message); }
  const hr = await deptEmployee("HR"), it = await deptEmployee("IT"), sales = await deptEmployee("SALES");
  const [[anyEmp]] = await db.query(`SELECT id, employeeCode, name, email, joiningId FROM employees WHERE isActive = 1 ORDER BY id LIMIT 1`);
  let [[client]] = await db.query(`SELECT id, client_code FROM clients WHERE status = 'ACTIVE' ORDER BY id LIMIT 1`);
  if (!client && process.env.SMOKE_TEMP_CLIENT === "1" && t.admin) {
    // create a throw-away client through the real API; removed again in cleanup()
    const r = await fetch(`${BASE}/api/super-admin/clients`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${t.admin}` }, body: JSON.stringify({ company_name: "_smoke_tmp_client", client_name: "Smoke Test", email: "_smoke_tmp@example.invalid", password: "Smoke@12345" }) });
    const j = await r.json().catch(() => ({}));
    log(`temp client create -> ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
    if (j?.data?.clientId) { client = { id: j.data.clientId, client_code: j.data.client_code }; tempClientId = client.id; }
  }
  if (hr) t.HR = signToken({ id: hr.id, employee_id: hr.id, employee_code: hr.employeeCode, role: "hr" });
  if (it) t.IT = signToken({ id: it.id, employee_id: it.id, employee_code: it.employeeCode, role: "it" });
  if (sales) t.Sales = signToken({ employeeId: sales.id, employeeCode: sales.employeeCode, email: sales.email, role: "sales" });
  if (anyEmp) t.employee = signToken({ id: anyEmp.id, role: "EMPLOYEE", name: anyEmp.name, email: anyEmp.email, employeeCode: anyEmp.employeeCode, joiningId: anyEmp.joiningId });
  if (client) t.client = signToken({ id: client.id, client_code: client.client_code, role: "client_admin" });
  log(`subjects: hr=${hr?.id} it=${it?.id} sales=${sales?.id} emp=${anyEmp?.id} client=${client?.client_code}`);
  return t;
}

const SKIP = /^\/api\/(uploads|hr-robo|smart-attendance|evs)(\/|$)|\/logout$|\/download|\/export|\/pdf|\/stream/;

async function main() {
  const t = await tokens();
  const portals = ["admin", "HR", "client", "employee", "IT", "Sales"];
  const summary = {};
  for (const P of portals) {
    if (!t[P]) { log(`\n### ${P}: no token, skipped`); continue; }
    const paths = [...new Set(data.matchedReachable.filter(c => c.portal === P && c.method === "GET" && !c.path.includes(":p") && !SKIP.test(c.path)).map(c => c.path))].sort();
    log(`\n### ${P}: ${paths.length} GET endpoints`);
    const bad = [];
    for (const p of paths) {
      let status = 0, msg = "";
      try {
        const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 20000);
        const r = await fetch(BASE + p, { headers: { authorization: `Bearer ${t[P]}` }, signal: ctrl.signal });
        clearTimeout(tm);
        status = r.status;
        if (status >= 400) { const txt = await r.text(); msg = txt.replace(/\s+/g, " ").slice(0, 220); }
      } catch (e) { status = -1; msg = e.message; }
      if (status < 200 || status >= 300) bad.push(`  ${status} ${p}  ${msg}`);
    }
    summary[P] = { total: paths.length, bad: bad.length };
    if (bad.length) log(bad.join("\n")); else log("  all 2xx");
  }
  log("\nSUMMARY " + JSON.stringify(summary));
  await cleanup();
  fs.writeFileSync(path.join(__dirname, "_smoke-out.txt"), out.join("\n"));
  await db.end();
}
main().catch(async (e) => { log("FATAL " + e.stack); try { await cleanup(); } catch {} fs.writeFileSync(path.join(__dirname, "_smoke-out.txt"), out.join("\n")); try { await db.end(); } catch {} process.exitCode = 1; });
