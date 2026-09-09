// _verify-fixes.mjs — targeted checks for the 7 Sep 2026 audit fixes against the running backend.
// Read-only except: creates + deletes one throw-away client (needed to exercise the client-lead scope).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "http://127.0.0.1:5000";
const out = [];
const log = (s) => { out.push(s); console.log(s); };
let pass = 0, failN = 0;
const check = (name, ok, extra = "") => { ok ? pass++ : failN++; log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? "  " + extra : ""}`); };
const j = async (r) => { const t = await r.text(); try { return JSON.parse(t); } catch { return { raw: t.slice(0, 200) }; } };
const H = (tok, extra = {}) => ({ authorization: `Bearer ${tok}`, "content-type": "application/json", ...extra });

async function main() {
  // admin login
  const lr = await fetch(`${BASE}/api/super-admin/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "admin@hrms.com", password: "admin123" }) });
  const lj = await j(lr); const admin = lj.access_token || lj.token;
  check("admin login", lr.status === 200 && !!admin);

  // 1. offer-letter routes now require auth
  const OL = `${BASE}/api/super-admin/offer-letter`;
  let r = await fetch(`${OL}/templates`);
  check("offer-letter unauthenticated -> 401", r.status === 401, `got ${r.status}`);
  r = await fetch(`${OL}/templates`, { headers: H(admin) });
  check("offer-letter templates with admin -> 200", r.status === 200, `got ${r.status}`);
  r = await fetch(`${OL}/templates/999999`, { method: "DELETE", headers: H(admin) });
  const dj = await j(r);
  check("DELETE offer-letter/templates/:id wired (404 'Template not found')", r.status === 404 && /Template not found/.test(dj.message || ""), `got ${r.status} ${JSON.stringify(dj).slice(0, 80)}`);

  // 2. assign-hr route wired
  r = await fetch(`${BASE}/api/super-admin/clients/assign-hr`, { method: "PATCH", headers: H(admin), body: JSON.stringify({}) });
  const aj = await j(r);
  check("PATCH clients/assign-hr wired (400 on empty body, not 404)", r.status === 400, `got ${r.status} ${JSON.stringify(aj).slice(0, 80)}`);

  // 3. client leads: tenant scope + no hangs
  const cr = await fetch(`${BASE}/api/super-admin/clients`, { method: "POST", headers: H(admin), body: JSON.stringify({ company_name: "_verify_tmp_client", client_name: "Verify", email: "_verify_tmp@example.invalid", password: "Verify@12345" }) });
  const cj = await j(cr); const clientId = cj?.data?.clientId, clientCode = cj?.data?.client_code;
  check("temp client created", cr.status === 200 && !!clientId, JSON.stringify(cj).slice(0, 100));
  try {
    const cTok = signToken({ id: clientId, client_code: clientCode, role: "client_admin" });
    const eTok = signToken({ employee_id: 999999, client_code: clientCode, role: "CLIENT_EMPLOYEE" }); // non-existent employee -> 403 from middleware, proves no hang

    r = await fetch(`${BASE}/api/client/leads/my`, { headers: H(cTok) });
    check("GET client/leads/my with client_admin -> 200 (was 500)", r.status === 200, `got ${r.status}`);

    // pick a lead belonging to ANOTHER tenant and try to update it as this client
    const [[foreign]] = await db.query(`SELECT id, client_id, status, remarks FROM client_leads WHERE client_id <> ? ORDER BY id LIMIT 1`, [clientId]);
    if (foreign) {
      r = await fetch(`${BASE}/api/client/leads/update/${foreign.id}`, { method: "PUT", headers: H(cTok), body: JSON.stringify({ status: foreign.status || "pending", remarks: foreign.remarks ?? null }) });
      const [[after]] = await db.query(`SELECT status, remarks, client_id FROM client_leads WHERE id = ?`, [foreign.id]);
      check("cross-tenant lead update rejected (404) and row untouched", r.status === 404 && after.client_id === foreign.client_id, `got ${r.status}`);
    } else log("SKIP cross-tenant check: no leads in DB");

    r = await fetch(`${BASE}/api/client/leads/batch/1`, { headers: H(cTok) });
    check("GET client/leads/batch/:id responds (no hang)", r.status === 200, `got ${r.status}`);

    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 8000);
    r = await fetch(`${BASE}/api/client/leads/batch/1`, { headers: H(eTok), signal: ctrl.signal }).catch(e => ({ status: -1, statusText: e.message }));
    clearTimeout(tm);
    check("employee-token path responds quickly (no hang)", r.status > 0, `got ${r.status}`);
  } finally {
    if (clientId) { const dr = await fetch(`${BASE}/api/super-admin/clients/${clientId}`, { method: "DELETE", headers: H(admin) }); check("temp client deleted", dr.status === 200, `got ${dr.status}`); }
  }

  log(`\nRESULT pass=${pass} fail=${failN}`);
  fs.writeFileSync(path.join(__dirname, "_verify-fixes-out.txt"), out.join("\n"));
  await db.end();
  process.exitCode = failN ? 1 : 0;
}
main().catch(async (e) => { log("FATAL " + e.stack); fs.writeFileSync(path.join(__dirname, "_verify-fixes-out.txt"), out.join("\n")); try { await db.end(); } catch {} process.exitCode = 1; });
