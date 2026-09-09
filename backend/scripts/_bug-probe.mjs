import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backend, ".env") });

const out = {};
const IT_SRC = path.resolve(backend, "..", "IT", "src");

// 1. scan IT/src for emergency + dark-mode header
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(jsx?|css)$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const files = walk(IT_SRC);
out.emergencyHits = [];
out.headerFiles = [];
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const lines = src.split("\n");
  lines.forEach((l, i) => {
    if (/emergency/i.test(l) && /(api|axios|post|fetch|failed)/i.test(l))
      out.emergencyHits.push(`${path.relative(IT_SRC, f)}:${i + 1}: ${l.trim().slice(0, 160)}`);
  });
  if (/IT Dashboard/.test(src) && /Logout/.test(src)) out.headerFiles.push(path.relative(IT_SRC, f));
}

// 2. DB describes
const db = await mysql.createConnection({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306),
});
for (const t of ["work_policies", "complaints", "targets", "employees"]) {
  try {
    const [cols] = await db.query(`SHOW COLUMNS FROM \`${t}\``);
    out[`cols_${t}`] = cols.map((c) => `${c.Field} ${c.Type} ${c.Null} ${c.Default === null ? "NULL" : c.Default}`);
  } catch (e) { out[`cols_${t}`] = e.message; }
}
const [[itUser]] = await db.query("SELECT id, name, email, role, client_id, employeeCode, departmentId FROM employees WHERE email='dummy.itdev@test.local' LIMIT 1").catch(() => [[null]]);
out.itUser = itUser;
await db.end();

// 3. API probe as IT dev
const BASE = "http://localhost:5000/api";
const login = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "dummy.itdev@test.local", password: "Test@1234" }) }).then((r) => r.json()).catch((e) => ({ err: e.message }));
const token = login.token || login.data?.token || login.accessToken;
out.loginKeys = Object.keys(login);
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };
async function hit(method, url, body) {
  try {
    const r = await fetch(`${BASE}${url}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
    const txt = await r.text();
    return `${r.status} ${txt.slice(0, 300)}`;
  } catch (e) { return `ERR ${e.message}`; }
}
out.postComplaint = await hit("POST", "/complaints", { title: "PROBE", description: "probe", priority: "low", category: "IT" });
out.postPolicy = await hit("POST", "/hr/work-policies", { title: "PROBE", category: "Leave Management", department: "All", status: "draft", effectiveDate: "2026-09-03", description: "probe" });
for (const u of ["/emergency", "/emergency/trigger", "/emergency/alert", "/it/emergency", "/notifications/emergency"]) {
  out[`emergency ${u}`] = await hit("POST", u, { message: "probe", type: "test" });
}

fs.writeFileSync(path.join(__dirname, "_bug_probe.json"), JSON.stringify(out, null, 2));
console.log("done");
