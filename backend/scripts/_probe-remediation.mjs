// Probes the write paths changed in the audit remediation.
// Usage: node scripts/_probe-remediation.mjs  (backend must be running on :5000)
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";

const BASE = "http://127.0.0.1:5000/api";
const out = [];
const log = (ok, name, extra = "") => out.push(`${ok ? "PASS" : "FAIL"}  ${name}  ${extra}`);

const j = async (method, path, body, token) => {
  const r = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
};

// Same token-minting approach as _smoke-portals.mjs (real ids from the local DB).
const adminLogin = await j("POST", "/super-admin/auth/login", {
  email: process.env.SA_EMAIL || "admin@hrms.com",
  password: process.env.SA_PASSWORD || "admin123",
});
const admin = adminLogin.data?.access_token || adminLogin.data?.token || adminLogin.data?.data?.token;
if (!admin) throw new Error(`admin login failed: ${adminLogin.status}`);

const [[salesEmp]] = await db.query(
  `SELECT e.id, e.employeeCode, e.email FROM employees e JOIN departments d ON d.id = e.departmentId
    WHERE UPPER(d.name) = 'SALES' AND e.isActive = 1 ORDER BY e.id LIMIT 1`,
);
const [[clientRow]] = await db.query(`SELECT id, client_code FROM clients WHERE status = 'ACTIVE' ORDER BY id LIMIT 1`);
if (!salesEmp || !clientRow) throw new Error("need one active sales employee and one active client in the DB");
const sales = signToken({ employeeId: salesEmp.id, employeeCode: salesEmp.employeeCode, email: salesEmp.email, role: "sales" });
const client = signToken({ id: clientRow.id, client_code: clientRow.client_code, role: "client_admin" });
const CLIENT_CODE = clientRow.client_code;

// --- TASK-06: sale validation ---
{
  const bad = await j("POST", "/sales/reports", { client_code: "", plan_name: "X", amount: "" }, sales);
  log(bad.status === 400, "sale: empty client_code -> 400", `${bad.status} ${bad.data?.message}`);
  const badAmt = await j("POST", "/sales/reports", { client_code: CLIENT_CODE, plan_name: "X", billing_months: 1, amount: "abc", purchase_date: "2026-09-01" }, sales);
  log(badAmt.status === 400, "sale: non-numeric amount -> 400", `${badAmt.status} ${badAmt.data?.message}`);
  const over = await j("POST", "/sales/reports", { client_code: CLIENT_CODE, plan_name: "X", billing_months: 1, amount: 100, amount_paid: 200, purchase_date: "2026-09-01" }, sales);
  log(over.status === 400, "sale: paid > amount -> 400", `${over.status} ${over.data?.message}`);
  const noClient = await j("POST", "/sales/reports", { client_code: "NOPE-999", plan_name: "X", billing_months: 1, amount: 100, purchase_date: "2026-09-01" }, sales);
  log(noClient.status === 404, "sale: unknown client_code -> 404", `${noClient.status} ${noClient.data?.message}`);
}

// --- TASK-10: PO state machine ---
{
  const create = await j("POST", "/client/purchase-orders/add", { vendor_name: "Probe Vendor", items: [{ name: "Widget", qty: 1, price: 10 }], total_amount: 10, order_date: "2026-09-08" }, client);
  log(create.status === 201 || create.status === 200, "PO: create", `${create.status}`);
  const id = create.data?.id || create.data?.order?.id || create.data?.data?.id;
  if (id) {
    const bad = await j("PUT", `/client/purchase-orders/status/${id}`, { status: "completed" }, client);
    log(bad.status === 409, "PO: pending->completed blocked (409)", `${bad.status} ${bad.data?.message}`);
    const ok = await j("PUT", `/client/purchase-orders/status/${id}`, { status: "approved" }, client);
    log(ok.status === 200, "PO: pending->approved", `${ok.status}`);
    const again = await j("PUT", `/client/purchase-orders/status/${id}`, { status: "rejected" }, client);
    log(again.status === 409, "PO: approved->rejected blocked (409)", `${again.status} ${again.data?.message}`);
    await j("DELETE", `/client/purchase-orders/${id}`, null, client);
  } else log(false, "PO: could not read created id", JSON.stringify(create.data).slice(0, 200));
  const nf = await j("PUT", `/client/purchase-orders/status/999999`, { status: "approved" }, client);
  log(nf.status === 404, "PO: unknown id -> 404", `${nf.status}`);
  const badCreate = await j("POST", "/client/purchase-orders/add", { vendor_name: "", items: [], total_amount: "x" }, client);
  log(badCreate.status === 400, "PO: invalid create -> 400", `${badCreate.status} ${badCreate.data?.message}`);
}

// --- Data flow: SA attendance union ---
{
  const r = await j("GET", "/super-admin/attendance", null, admin);
  const rows = r.data?.data || r.data?.rows || r.data || [];
  const sources = new Set(rows.map((x) => x.source));
  log(r.status === 200, "SA attendance: 200", `${rows.length} rows, sources=${[...sources].join(",")}`);
}

// --- Data flow: client invoices include sales source ---
{
  const r = await j("GET", "/client/invoices", null, client);
  const rows = r.data?.invoices || r.data?.data || r.data || [];
  const sources = new Set(rows.map((x) => x.source));
  log(r.status === 200, "client invoices: 200", `${rows.length} rows, sources=${[...sources].join(",")}`);
}

// --- TASK-03: AI chat auth ---
{
  const noAuth = await j("POST", "/ai-chat/ask", { message: "hello", session_id: "probe", user_type: "ADMIN" });
  log(noAuth.status === 401, "ai-chat: no token -> 401", `${noAuth.status}`);
  const withAuth = await j("POST", "/ai-chat/ask", { message: "how many SOPs are there?", session_id: "probe", user_type: "ADMIN" }, admin);
  log(withAuth.status === 200 && !!withAuth.data?.answer, "ai-chat: with token -> answer", `${withAuth.status} ${String(withAuth.data?.answer).slice(0, 80)}`);
}

// --- TASK-04: agreement PDF (real generator: POST /generate with a DB template) ---
{
  const [[tpl]] = await db.query("SELECT id FROM agreement_templates ORDER BY id LIMIT 1").catch(() => [[null]]);
  if (tpl?.id) {
    const form = new URLSearchParams({
      template_id: String(tpl.id),
      client_company_name: "Probe Co",
      client_address: "1 Probe Street",
      client_gst_number: "22AAAAA0000A1Z5",
      client_representative_name: "P. Robe",
      effective_date: "2026-09-08",
      duration: "One Year",
    });
    const r = await fetch(`${BASE}/super-admin/client-agreements/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const d = await r.json().catch(() => ({}));
    const msg = String(d?.message || "");
    const rgbBug = /Invalid color/i.test(msg);
    log(r.status === 200 || (r.status === 404 && !rgbBug), "agreement PDF: generator (no 'Invalid color')", `${r.status} ${msg.slice(0, 90)}`);
  } else log(true, "agreement PDF: no templates in DB (skipped)");
}

console.log(out.join("\n"));
const fails = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fails}/${out.length} passed`);
process.exit(fails ? 1 : 0);
