// Verifies proposal PDF download endpoints (read-only against the DB).
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";
const BASE = "http://127.0.0.1:5000/api";
const out = [];
const log = (ok, name, extra = "") => out.push(`${ok ? "PASS" : "FAIL"}  ${name}  ${extra}`);

const [[prop]] = await db.query(
  `SELECT id, client_id, client_code, status, sales_employee_id FROM proposals
    WHERE status IN ('SENT','ACCEPTED','REJECTED','EXPIRED') AND client_id IS NOT NULL ORDER BY id DESC LIMIT 1`,
);
if (!prop) {
  console.log("no client-visible proposals in DB - skipping");
  await db.end?.().catch(() => {});
  process.exit(0);
}
const [[owner]] = await db.query("SELECT id, client_code FROM clients WHERE id = ?", [prop.client_id]);
const [[other]] = await db.query("SELECT id, client_code FROM clients WHERE id <> ? ORDER BY id LIMIT 1", [prop.client_id]);
const ownerTok = signToken({ id: owner.id, client_code: owner.client_code, role: "client_admin" });
const otherTok = other ? signToken({ id: other.id, client_code: other.client_code, role: "client_admin" }) : null;

const hit = (path, tok) => fetch(BASE + path, { headers: tok ? { Authorization: `Bearer ${tok}` } : {} });

{
  const r = await hit(`/client/proposals/${prop.id}/pdf`, ownerTok);
  const ct = r.headers.get("content-type") || "";
  const buf = Buffer.from(await r.arrayBuffer());
  log(r.status === 200 && ct.includes("pdf") && buf.subarray(0, 4).toString() === "%PDF", "client pdf: owner -> 200 %PDF", `${r.status} ${ct} ${buf.length}b`);
}
{
  const r = await hit(`/client/proposals/${prop.id}/pdf`, null);
  log(r.status === 401 || r.status === 403, "client pdf: no token -> 401/403", `${r.status}`);
}
if (otherTok) {
  const r = await hit(`/client/proposals/${prop.id}/pdf`, otherTok);
  log(r.status === 404, "client pdf: other client -> 404", `${r.status}`);
}
{
  const r = await hit(`/client/proposals/999999/pdf`, ownerTok);
  log(r.status === 404, "client pdf: unknown id -> 404", `${r.status}`);
}
{
  const login = await fetch(`${BASE}/super-admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SA_EMAIL || "admin@hrms.com", password: process.env.SA_PASSWORD || "admin123" }),
  }).then((r) => r.json());
  const admin = login.access_token || login.token || login.data?.token;
  const r = await hit(`/super-admin/proposals/${prop.id}/pdf`, admin);
  log(r.status === 200 && (r.headers.get("content-type") || "").includes("pdf"), "admin pdf: 200", `${r.status}`);
}
if (prop.sales_employee_id) {
  const [[emp]] = await db.query("SELECT id, employeeCode, email FROM employees WHERE id = ?", [prop.sales_employee_id]);
  const salesTok = signToken({ employeeId: emp.id, employeeCode: emp.employeeCode, email: emp.email, role: "sales" });
  const r = await hit(`/sales/proposals/${prop.id}/pdf`, salesTok);
  log(r.status === 200, "sales pdf: author -> 200", `${r.status}`);
}

console.log(out.join("\n"));
const fails = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fails}/${out.length} passed`);
await db.end?.().catch(() => {});
process.exit(fails ? 1 : 0);
