// End-to-end probe of the OTP attendance flow using an HRMS employee token.
// Uses a throwaway attendance_records row for today and removes it afterwards.
import { db } from "../config/db.js";
import { signToken } from "../utils/jwt.js";
const BASE = "http://127.0.0.1:5000/api/smart-attendance/api";
const out = [];
const log = (ok, name, extra = "") => out.push(`${ok ? "PASS" : "FAIL"}  ${name}  ${extra}`);

const [[emp]] = await db.query("SELECT id, employeeCode, name, email FROM employees WHERE isActive = 1 AND employeeCode IS NOT NULL ORDER BY id LIMIT 1");
const tok = signToken({ id: emp.id, role: "EMPLOYEE", name: emp.name, email: emp.email, employeeCode: emp.employeeCode });
const H = { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" };
const j = async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) });
const post = (p, b) => fetch(BASE + p, { method: "POST", headers: H, body: JSON.stringify(b || {}) }).then(j);
const get = (p) => fetch(BASE + p, { headers: H }).then(j);
const today = new Date().toISOString().slice(0, 10);

// clean slate
await db.query("DELETE FROM attendance_records WHERE emp_id = ? AND date = ?", [emp.employeeCode, today]);
await db.query("DELETE FROM attendance_settings WHERE skey = ?", [`otp_${emp.employeeCode}`]);

{
  const r = await get("/my-status");
  log(r.status === 200 && r.body.ok && r.body.emp_id === emp.employeeCode && !r.body.marked, "HRMS employee token accepted by my-status", `${r.status} emp=${r.body.emp_id}`);
}
{
  const r = await fetch(BASE + "/my-status").then(j);
  log(r.status === 401, "no token -> 401", `${r.status}`);
}
let otp;
{
  const r = await post("/otp/send");
  const [[row]] = await db.query("SELECT data FROM attendance_settings WHERE skey = ?", [`otp_${emp.employeeCode}`]);
  otp = JSON.parse(row?.data || "{}").otp;
  log(r.body.ok && /^\d{6}$/.test(otp || "") && r.body.channel === "email", "otp/send stores 6-digit code, channel=email", `${r.body.message} delivered=${r.body.delivered}`);
}
{
  const r = await post("/otp/send");
  log(r.body.ok === false && r.body.retry_in > 0, "otp/send again -> cooldown", `${r.body.error}`);
}
{
  const r = await post("/otp/verify", { otp: "000000" });
  log(r.body.ok === false && /attempts left/.test(r.body.error || ""), "wrong OTP -> attempts counter", `${r.body.error}`);
}
{
  for (let i = 0; i < 3; i++) await post("/otp/verify", { otp: "000000" });
  const r = await post("/otp/verify", { otp: "000000" });
  log(r.body.ok === false && /Too many/.test(r.body.error || ""), "5th wrong OTP -> locked out", `${r.body.error}`);
  const r2 = await post("/otp/verify", { otp });
  log(r2.body.ok === false, "correct OTP after lockout is rejected", `${r2.body.error}`);
}
{
  await db.query("DELETE FROM attendance_settings WHERE skey = ?", [`otp_${emp.employeeCode}`]); // reset cooldown for the probe
  const r = await post("/otp/send");
  const [[row]] = await db.query("SELECT data FROM attendance_settings WHERE skey = ?", [`otp_${emp.employeeCode}`]);
  otp = JSON.parse(row.data).otp;
  const office = await get("/office-location");
  const v = await post("/otp/verify", { otp, lat: office.body.lat, lng: office.body.lng });
  log(v.body.ok && v.body.status === "marked", "correct OTP inside office -> marked", `${v.body.message}`);
}
{
  const r = await post("/otp/send");
  log(r.body.ok === false && /already marked/i.test(r.body.error || ""), "otp/send after marked -> rejected", `${r.body.error}`);
}
{
  const r = await post("/check-out");
  log(r.body.ok && r.body.check_out, "check-out works", `${r.body.message}`);
  const s = await get("/my-status");
  log(s.body.marked && s.body.record?.check_out, "my-status shows check_out", "");
}

// cleanup
await db.query("DELETE FROM attendance_records WHERE emp_id = ? AND date = ? AND method = 'OTP'", [emp.employeeCode, today]);
await db.query("DELETE FROM super_admin_attendance WHERE employee_id = ? AND date = ?", [emp.id, today]);
await db.query("DELETE FROM attendance_settings WHERE skey = ?", [`otp_${emp.employeeCode}`]);

console.log(out.join("\n"));
const fails = out.filter((l) => l.startsWith("FAIL")).length;
console.log(`\n${out.length - fails}/${out.length} passed`);
await db.end();
process.exit(fails ? 1 : 0);
