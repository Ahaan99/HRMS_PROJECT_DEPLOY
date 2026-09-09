// _leave-flow-probe.mjs - end-to-end check of the Employee portal -> Admin portal leave flow
// against the LOCAL backend. Creates one leave application + one comp-off as the employee,
// approves them as super admin, verifies the employee sees the result, then cancels the
// leave (reverting the balance) so the DB is left as it was found (the comp-off is rejected).
// Usage: node scripts/_leave-flow-probe.mjs  -> scripts/_leave-flow-out.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || "http://localhost:5000/api";
const ADMIN = { email: "admin@hrms.com", password: "admin123" };
const EMP = { email: process.env.EMP_EMAIL || "rohan@demo.hrms", password: process.env.EMP_PW || "Test@1234" };

const results = [];
const check = (name, ok, info) => {
  results.push({ name, ok: !!ok, info });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  " + JSON.stringify(info) : ""}`);
};
const call = async (method, url, token, body) => {
  const r = await fetch(BASE + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch { /* non-json */ }
  return { status: r.status, data };
};

// next Tuesday/Wednesday at least 60 days out so it never collides with existing rows
const d = new Date();
d.setDate(d.getDate() + 60);
while (d.getDay() !== 2) d.setDate(d.getDate() + 1);
const iso = (x) => x.toISOString().slice(0, 10);
const from = iso(d);
const to = iso(new Date(d.getTime() + 86400000));

// 1. logins
const a = await call("POST", "/super-admin/auth/login", null, ADMIN);
const adminToken = a.data?.token || a.data?.access_token;
check("super admin login", !!adminToken, { status: a.status });

const e = await call("POST", "/employee/auth/login", null, EMP);
const empToken = e.data?.token || e.data?.access_token || e.data?.data?.token;
check("employee login", !!empToken, { status: e.status, keys: e.data ? Object.keys(e.data) : null });
if (!adminToken || !empToken) {
  fs.writeFileSync(path.join(here, "_leave-flow-out.json"), JSON.stringify(results, null, 1));
  process.exit(1);
}

// 2. employee: balance before
const bal0 = await call("GET", "/leave/my-balance", empToken);
const cl0 = (bal0.data || []).find((b) => b.leave_type === "Casual Leave");
check("employee my-balance", bal0.status === 200 && !!cl0, { used: cl0?.used, allocated: cl0?.allocated });

// 3. employee applies
const ap = await call("POST", "/leave/apply", empToken, {
  leave_type_id: 1, from_date: from, to_date: to, reason: "_probe cross-portal leave",
});
check("employee apply leave", ap.status === 200 && ap.data?.id, { status: ap.status, id: ap.data?.id, days: ap.data?.days, msg: ap.data?.message });
const appId = ap.data?.id;

// 4. admin sees it as Pending
const list = await call("GET", "/leave/applications?status=Pending", adminToken);
const row = (list.data || []).find((r) => r.id === appId);
check("admin sees pending application with employee name", !!row && !!row.employee_name, { employee_name: row?.employee_name, code: row?.employeeCode, days: row?.days });

// 5. admin approves
const dec = await call("PUT", `/leave/applications/${appId}/decide`, adminToken, { status: "Approved", approver_note: "_probe ok" });
check("admin approve", dec.status === 200, dec.data);

// 6. employee sees Approved + used incremented
const my = await call("GET", "/leave/my-applications", empToken);
const mine = (my.data || []).find((r) => r.id === appId);
check("employee sees Approved status + note", mine?.status === "Approved" && mine?.approver_note === "_probe ok", { status: mine?.status, note: mine?.approver_note, approved_by: mine?.approved_by });

const bal1 = await call("GET", "/leave/my-balance", empToken);
const cl1 = (bal1.data || []).find((b) => b.leave_type === "Casual Leave");
check("employee balance used increased by days", Number(cl1?.used) === Number(cl0?.used) + Number(ap.data?.days), { before: cl0?.used, after: cl1?.used, days: ap.data?.days });

// 7. admin balances tab shows same
const ab = await call("GET", "/leave/balances", adminToken);
const abRow = (ab.data || []).find((b) => b.leave_type === "Casual Leave" && b.employee_name === row?.employee_name);
check("admin balances row matches employee view", abRow && Number(abRow.used) === Number(cl1?.used), { admin_used: abRow?.used, emp_used: cl1?.used });

// 8. comp-off flow
const co = await call("POST", "/leave/comp-off", empToken, { worked_date: from, reason: "_probe comp-off" });
check("employee request comp-off", co.status === 200 && co.data?.id, co.data);
const coList = await call("GET", "/leave/comp-offs", adminToken);
const coRow = (coList.data || []).find((c) => c.id === co.data?.id);
check("admin sees comp-off with employee name", !!coRow?.employee_name, { name: coRow?.employee_name });
const coDec = await call("PUT", `/leave/comp-offs/${co.data?.id}/decide`, adminToken, { status: "Rejected" });
check("admin reject comp-off", coDec.status === 200, coDec.data);
const myCo = await call("GET", "/leave/my-comp-offs", empToken);
check("employee sees comp-off Rejected", (myCo.data || []).find((c) => c.id === co.data?.id)?.status === "Rejected");

// 8b. overlapping request must be refused while one is Pending/Approved
const dup = await call("POST", "/leave/apply", empToken, {
  leave_type_id: 2, from_date: to, to_date: to, reason: "_probe overlap",
});
check("overlapping request rejected with 409", dup.status === 409, { status: dup.status, msg: dup.data?.message });

// 9. cleanup: employee cancels approved leave -> balance reverts
const cx = await call("PUT", `/leave/cancel/${appId}`, empToken);
check("employee cancel approved leave", cx.status === 200, cx.data);
const bal2 = await call("GET", "/leave/my-balance", empToken);
const cl2 = (bal2.data || []).find((b) => b.leave_type === "Casual Leave");
check("balance reverted after cancel", Number(cl2?.used) === Number(cl0?.used), { before: cl0?.used, after: cl2?.used });

// 10. holidays are not charged: declare `from` as a holiday, apply from..to (2 weekdays) -> 1 day
const hol = await call("POST", "/leave/holidays", adminToken, { name: "_probe holiday", holiday_date: from });
check("admin add holiday", hol.status === 200 && hol.data?.id, hol.data);
const ap2 = await call("POST", "/leave/apply", empToken, {
  leave_type_id: 1, from_date: from, to_date: to, reason: "_probe holiday-aware days",
});
check("holiday excluded from charged days", ap2.data?.days === 1, { days: ap2.data?.days, status: ap2.status, msg: ap2.data?.message });
const bal3 = await call("GET", "/leave/my-balance", empToken);
const cl3 = (bal3.data || []).find((b) => b.leave_type === "Casual Leave");
check("pending days visible in balance", Number(cl3?.pending) === 1, { pending: cl3?.pending });
if (ap2.data?.id) await call("PUT", `/leave/cancel/${ap2.data.id}`, empToken);
if (hol.data?.id) await call("DELETE", `/leave/holidays/${hol.data.id}`, adminToken);
const hols = await call("GET", "/leave/holidays", adminToken);
check("probe holiday removed", !(hols.data || []).some((h) => h.id === hol.data?.id));

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
fs.writeFileSync(path.join(here, "_leave-flow-out.json"), JSON.stringify({ appId, compOffId: co.data?.id, results }, null, 1));
process.exitCode = failed ? 1 : 0;
