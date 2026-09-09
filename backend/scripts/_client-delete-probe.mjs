// Probe: create a throwaway client with a lead batch + lead (the FK chain that
// blocked deletion), delete it through the real Super Admin API, and confirm
// every dependent row is gone. Also checks Smart Attendance admin login.
// Usage: node scripts/_client-delete-probe.mjs   (backend must be on :5000)
import fs from "node:fs";
import { db } from "../config/db.js";

const BASE = "http://localhost:5000";
const out = { steps: [] };
const step = (name, ok, extra) => out.steps.push({ name, ok: !!ok, ...(extra ? { extra } : {}) });

try {
  // --- Smart Attendance admin login with admin123 ---
  const saRes = await fetch(`${BASE}/api/smart-attendance/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: "9999999999", password: "admin123", role: "admin" }),
  });
  const saJson = await saRes.json().catch(() => ({}));
  step("attendance admin login (admin123)", saRes.ok && saJson.success !== false, { status: saRes.status });

  // --- Super admin token ---
  const loginRes = await fetch(`${BASE}/api/super-admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@hrms.com", password: "admin123" }),
  });
  const login = await loginRes.json();
  const token = login.access_token || login.token || login.data?.token || login.accessToken;
  step("super admin login", !!token, { status: loginRes.status });
  if (!token) throw new Error("no super admin token: " + JSON.stringify(login).slice(0, 200));

  // --- create throwaway client ---
  const createRes = await fetch(`${BASE}/api/super-admin/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      company_name: "ZZ Delete Probe",
      client_name: "Probe",
      email: `probe.${Date.now()}@test.local`,
      phone: "9000000000",
      password: "Probe@1234",
    }),
  });
  const created = await createRes.json();
  const clientId = created.data?.clientId;
  step("create client", !!clientId, { status: createRes.status });
  if (!clientId) throw new Error("create failed: " + JSON.stringify(created).slice(0, 200));

  // --- seed batch + lead directly (the FK chain) ---
  const [bcols] = await db.query("SHOW COLUMNS FROM client_lead_batches");
  const [lcols] = await db.query("SHOW COLUMNS FROM client_leads");
  const has = (cols, n) => cols.some((c) => c.Field === n);

  const bFields = ["client_id"]; const bVals = [clientId];
  for (const c of bcols) {
    if (c.Field === "id" || c.Field === "client_id" || c.Null === "YES" || c.Default !== null || c.Extra.includes("auto_increment")) continue;
    bFields.push(c.Field);
    bVals.push(c.Type.startsWith("int") || c.Type.startsWith("bigint") || c.Type.startsWith("tinyint") ? 0 : c.Type.startsWith("date") ? "2026-09-03" : "probe");
  }
  const [b] = await db.query(
    `INSERT INTO client_lead_batches (${bFields.map((f) => `\`${f}\``).join(",")}) VALUES (${bFields.map(() => "?").join(",")})`,
    bVals,
  );
  const batchId = b.insertId;

  const lFields = ["client_id"]; const lVals = [clientId];
  if (has(lcols, "batch_id")) { lFields.push("batch_id"); lVals.push(batchId); }
  for (const c of lcols) {
    if (lFields.includes(c.Field) || c.Field === "id" || c.Null === "YES" || c.Default !== null || c.Extra.includes("auto_increment")) continue;
    lFields.push(c.Field);
    lVals.push(c.Type.startsWith("int") || c.Type.startsWith("bigint") || c.Type.startsWith("tinyint") ? 0 : c.Type.startsWith("date") ? "2026-09-03" : "probe");
  }
  await db.query(
    `INSERT INTO client_leads (${lFields.map((f) => `\`${f}\``).join(",")}) VALUES (${lFields.map(() => "?").join(",")})`,
    lVals,
  );
  step("seed lead batch + lead", true, { batchId });

  // --- delete via API ---
  const delRes = await fetch(`${BASE}/api/super-admin/clients/${clientId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const del = await delRes.json().catch(() => ({}));
  step("DELETE /clients/:id returns 200", delRes.ok && del.success, { status: delRes.status, message: del.message, cleared: del.data?.cleared });

  // --- verify nothing left ---
  const [[c]] = await db.query("SELECT COUNT(*) n FROM clients WHERE id = ?", [clientId]);
  const [[lb]] = await db.query("SELECT COUNT(*) n FROM client_lead_batches WHERE client_id = ?", [clientId]);
  const [[l]] = await db.query("SELECT COUNT(*) n FROM client_leads WHERE client_id = ?", [clientId]);
  step("client + batches + leads all gone", c.n === 0 && lb.n === 0 && l.n === 0, { clients: c.n, batches: lb.n, leads: l.n });

  // cleanup if the delete failed
  if (c.n) {
    await db.query("DELETE FROM client_leads WHERE client_id = ?", [clientId]);
    await db.query("DELETE FROM client_lead_batches WHERE client_id = ?", [clientId]);
    await db.query("DELETE FROM clients WHERE id = ?", [clientId]);
  }
} catch (e) {
  out.error = e.message;
}
out.pass = out.steps.filter((s) => s.ok).length;
out.total = out.steps.length;
fs.writeFileSync("D:/HRMS_new/_client_delete_probe.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
try { await db.end(); } catch {}
process.exitCode = out.error || out.pass !== out.total ? 1 : 0;
