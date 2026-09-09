/* End-to-end probe for the Sales proposal approval workflow.
   Usage: node scripts/_sales-proposals-probe.mjs  (backend must be running on :5000)
   Uses local seed data: rep employee #10, client #16, super admin admin@hrms.com. */
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";

const BASE = process.env.BASE || "http://127.0.0.1:5000/api";
const REP_ID = Number(process.env.REP_ID || 10);
const OTHER_REP_ID = Number(process.env.OTHER_REP_ID || 11);
const CLIENT_ID = Number(process.env.CLIENT_ID || 16);

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  -> ${extra}` : ""}`);
};

const call = async (method, path, token, body) => {
  const r = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await r.json(); } catch { /* non-json */ }
  return { status: r.status, json };
};

const main = async () => {
  /* make sure the test client belongs to the rep */
  await db.query("UPDATE clients SET employee_id = ? WHERE id = ?", [REP_ID, CLIENT_ID]);
  const [[rep]] = await db.query("SELECT id, email, employeeCode FROM employees WHERE id = ?", [REP_ID]);
  const [[client]] = await db.query("SELECT id, client_code, company_name, email FROM clients WHERE id = ?", [CLIENT_ID]);

  const repTok = signToken({ employeeId: rep.id, employeeCode: rep.employeeCode, email: rep.email, role: "sales" });
  const otherTok = signToken({ employeeId: OTHER_REP_ID, employeeCode: "X", email: "other@test", role: "sales" });
  const adminLogin = await call("POST", "/super-admin/auth/login", null, { email: "admin@hrms.com", password: "admin123" });
  const adminTok = adminLogin.json?.token || adminLogin.json?.access_token;
  check("super admin login", !!adminTok, `HTTP ${adminLogin.status}`);

  /* reference data */
  const mine = await call("GET", "/sales/proposals/my-clients", repTok);
  check("GET my-clients lists the rep's client", mine.status === 200 && mine.json.data.some((c) => c.id === CLIENT_ID), `n=${mine.json?.data?.length}`);
  const cat = await call("GET", "/sales/proposals/catalog", repTok);
  check("GET catalog", cat.status === 200 && Array.isArray(cat.json.data.plans) && cat.json.data.plans.length > 0, `plans=${cat.json?.data?.plans?.length}`);

  const payload = {
    client_id: CLIENT_ID,
    client_name: client.company_name,
    client_company: client.company_name,
    client_email: client.email,
    title: "Probe - Recruitment Services",
    intro: "Automated probe proposal",
    items: [{ service: "Recruitment - Standard", description: "probe", qty: 2, rate: 1000, mrp: 1500, unit: "per hire" }],
    discount_pct: 10,
    tax_pct: 18,
    currency: "INR",
    valid_until: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    terms: "probe terms",
    token_amount: 5000,
    agreement_months: 11,
  };

  /* ownership: another rep's client is refused */
  const foreign = await call("POST", "/sales/proposals", otherTok, payload);
  check("POST for a client you don't own -> 403", foreign.status === 403, `HTTP ${foreign.status}`);

  /* create draft */
  const created = await call("POST", "/sales/proposals", repTok, payload);
  const id = created.json?.data?.id;
  check("POST create draft", created.status === 200 && !!id, `id=${id} ${created.json?.data?.proposal_number || created.json?.message || ""}`);

  const detail = await call("GET", `/sales/proposals/${id}`, repTok);
  check("GET own draft, totals computed server-side", detail.status === 200 && Number(detail.json.data.total) === 2124, `total=${detail.json?.data?.total} status=${detail.json?.data?.status}`);

  const otherView = await call("GET", `/sales/proposals/${id}`, otherTok);
  check("other rep cannot read it -> 404", otherView.status === 404, `HTTP ${otherView.status}`);

  /* client must NOT see a draft */
  const [[clientRow]] = await db.query("SELECT id, client_code FROM clients WHERE id = ?", [CLIENT_ID]);
  const clientTok = signToken({ id: clientRow.id, client_code: clientRow.client_code, role: "client_admin" });
  let cl = await call("GET", "/client/proposals", clientTok);
  const visibleIds = (cl.json?.data || []).map((p) => p.id);
  check("client list hides DRAFT", cl.status === 200 && !visibleIds.includes(id), `HTTP ${cl.status} visible=${visibleIds.length}`);

  /* submit */
  const sub = await call("PATCH", `/sales/proposals/${id}/submit`, repTok);
  check("PATCH submit -> PENDING_APPROVAL", sub.status === 200, sub.json?.message || "");
  const afterSubmit = await call("GET", `/sales/proposals/${id}`, repTok);
  check("status is PENDING_APPROVAL", afterSubmit.json?.data?.status === "PENDING_APPROVAL", afterSubmit.json?.data?.status);

  const editLocked = await call("PUT", `/sales/proposals/${id}`, repTok, payload);
  check("edit while pending -> 400", editLocked.status === 400, editLocked.json?.message || "");

  cl = await call("GET", "/client/proposals", clientTok);
  check("client list hides PENDING_APPROVAL", !(cl.json?.data || []).some((p) => p.id === id));

  /* admin sees it with the rep's name */
  const adminList = await call("GET", "/super-admin/proposals?status=PENDING_APPROVAL", adminTok);
  const adminRow = (adminList.json?.data || []).find((p) => p.id === id);
  check("admin list shows it with sales_employee_name", !!adminRow && !!adminRow.sales_employee_name, adminRow?.sales_employee_name || "");
  check("admin stats.pending_approval >= 1", Number(adminList.json?.stats?.pending_approval) >= 1, String(adminList.json?.stats?.pending_approval));

  /* return with note */
  const noNote = await call("PATCH", `/super-admin/proposals/${id}/return`, adminTok, { note: "" });
  check("return without note -> 400", noNote.status === 400);
  const ret = await call("PATCH", `/super-admin/proposals/${id}/return`, adminTok, { note: "Discount too high, cap at 5%" });
  check("PATCH return -> REVISION", ret.status === 200, ret.json?.message || "");
  const rev = await call("GET", `/sales/proposals/${id}`, repTok);
  check("rep sees REVISION + approval_note", rev.json?.data?.status === "REVISION" && /cap at 5/.test(rev.json?.data?.approval_note || ""), rev.json?.data?.approval_note);

  /* rep edits + resubmits */
  const edited = await call("PUT", `/sales/proposals/${id}`, repTok, { ...payload, discount_pct: 5 });
  check("rep edits in REVISION", edited.status === 200, edited.json?.message || "");
  const resub = await call("PATCH", `/sales/proposals/${id}/submit`, repTok);
  check("resubmit -> PENDING_APPROVAL", resub.status === 200);

  /* withdraw + resubmit round trip */
  const wd = await call("PATCH", `/sales/proposals/${id}/withdraw`, repTok);
  check("withdraw -> DRAFT", wd.status === 200);
  const resub2 = await call("PATCH", `/sales/proposals/${id}/submit`, repTok);
  check("submit again", resub2.status === 200);

  /* approve */
  const approveWrong = await call("PATCH", `/super-admin/proposals/${id}/return`, otherTok, { note: "x" });
  check("sales token cannot use admin review route", approveWrong.status === 401 || approveWrong.status === 403, `HTTP ${approveWrong.status}`);
  const appr = await call("PATCH", `/super-admin/proposals/${id}/approve`, adminTok);
  check("PATCH approve -> SENT", appr.status === 200, appr.json?.message || "");
  const sent = await call("GET", `/sales/proposals/${id}`, repTok);
  check("rep sees SENT with approved_by", sent.json?.data?.status === "SENT" && !!sent.json?.data?.approved_by, `${sent.json?.data?.status} by ${sent.json?.data?.approved_by}`);

  const delLocked = await call("DELETE", `/sales/proposals/${id}`, repTok);
  check("rep cannot delete a SENT proposal", delLocked.status === 400);

  /* client now sees it and can accept */
  cl = await call("GET", "/client/proposals", clientTok);
  check("client list shows SENT", (cl.json?.data || []).some((p) => p.id === id));
  const acc = await call("POST", `/client/proposals/${id}/respond`, clientTok, { action: "ACCEPT", note: "probe accept" });
  check("client ACCEPT", acc.status === 200, acc.json?.message || "");
  const fin = await call("GET", `/sales/proposals/${id}`, repTok);
  check("rep sees ACCEPTED", fin.json?.data?.status === "ACCEPTED", fin.json?.data?.status);

  const stats = await call("GET", "/sales/proposals", repTok);
  check("rep stats.accepted >= 1", Number(stats.json?.stats?.accepted) >= 1, JSON.stringify(stats.json?.stats));

  /* admin's own legacy flow still works */
  const adminCreate = await call("POST", "/super-admin/proposals", adminTok, { ...payload, title: "Probe - admin direct" });
  const aid = adminCreate.json?.data?.id;
  const adminSend = await call("PUT", `/super-admin/proposals/${aid}/status`, adminTok, { status: "SENT" });
  check("admin direct create + send still works", adminCreate.status === 200 && adminSend.status === 200, `id=${aid}`);

  /* cleanup */
  await db.query("DELETE FROM proposals WHERE id IN (?, ?)", [id || 0, aid || 0]);

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  await db.end();
  process.exitCode = failed ? 1 : 0;
};

main().catch(async (e) => {
  console.error("PROBE ERROR", e);
  await db.end();
  process.exitCode = 1;
});
