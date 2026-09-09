// _client-attendance-probe.mjs - exercises the Client portal Attendance Tracker API
// exactly the way the React modals call it. Cleans up the rows it creates.
// Writes scripts/_client-attendance-probe-out.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "_client-attendance-probe-out.json");
const BASE = process.env.BASE || "http://localhost:5000/api";
const results = [];
const check = (name, ok, info) => results.push({ name, ok: !!ok, info });

async function api(method, url, body, token) {
  const res = await fetch(BASE + url, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

const DATE = "2026-01-15"; // far from today so we never collide with real rows
const created = [];

try {
  const login = await api("POST", "/client/auth/login-admin", { email: "arav@gmail.com", password: "Test@1234" });
  const token = login.json?.token;
  check("client login", login.status === 200 && token, login.status);

  const emp = await api("GET", "/client/employees", null, token);
  const employees = emp.json?.data || [];
  check("GET /client/employees", emp.status === 200 && Array.isArray(employees), { status: emp.status, n: employees.length, sample: employees[0] && { id: employees[0].id, name: employees[0].name, code: employees[0].employeeCode, isActive: employees[0].isActive } });

  const list0 = await api("GET", "/client/attendance", null, token);
  check("GET /client/attendance", list0.status === 200 && Array.isArray(list0.json?.data), { status: list0.status, n: list0.json?.data?.length, sample: list0.json?.data?.[0] });

  const e1 = employees[0];
  if (!e1) throw new Error("client 16 has no employees - cannot continue");

  // 1) Add with both times (as the Add modal sends: HH:MM strings)
  const c1 = await api("POST", "/client/attendance", { employee_id: e1.id, attendance_date: DATE, check_in: "09:30", check_out: "18:15", status: "PRESENT", remarks: "" }, token);
  if (c1.json?.id) created.push(c1.json.id);
  check("POST add (times)", c1.status === 200 && c1.json?.id, { status: c1.status, msg: c1.json?.message });

  // 2) Duplicate same employee + day -> what does the user see?
  const dup = await api("POST", "/client/attendance", { employee_id: e1.id, attendance_date: DATE, check_in: "", check_out: "", status: "ABSENT", remarks: "" }, token);
  if (dup.json?.id) created.push(dup.json.id);
  check("POST duplicate day -> friendly 4xx", dup.status >= 400 && dup.status < 500 && !/Duplicate entry/.test(dup.json?.message || ""), { status: dup.status, msg: dup.json?.message });

  // 3) Add with NO times (ABSENT) - the Add modal sends "" for blank inputs
  const DATE2 = "2026-01-16";
  const c2 = await api("POST", "/client/attendance", { employee_id: e1.id, attendance_date: DATE2, check_in: "", check_out: "", status: "ABSENT", remarks: "sick" }, token);
  if (c2.json?.id) created.push(c2.json.id);
  check("POST add (no times, ABSENT)", c2.status === 200 && c2.json?.id, { status: c2.status, msg: c2.json?.message });

  // 4) Edit modal flow on row 1: keep check_in, CLEAR check_out (sends "")
  const u1 = await api("PUT", `/client/attendance/${c1.json?.id}`, { employee_id: e1.id, attendance_date: DATE, check_in: "09:30", check_out: "", status: "HALF_DAY", remarks: "left early" }, token);
  check("PUT edit with blank check_out", u1.status === 200, { status: u1.status, msg: u1.json?.message });

  // 5) Edit modal flow: change only the status of the ABSENT row (both times blank)
  const u2 = await api("PUT", `/client/attendance/${c2.json?.id}`, { employee_id: e1.id, attendance_date: DATE2, check_in: "", check_out: "", status: "LEAVE", remarks: "sick" }, token);
  check("PUT edit blank times -> LEAVE", u2.status === 200, { status: u2.status, msg: u2.json?.message });

  // 6) Edit: set times on the previously blank row
  const u3 = await api("PUT", `/client/attendance/${c2.json?.id}`, { employee_id: e1.id, attendance_date: DATE2, check_in: "10:00", check_out: "19:00", status: "PRESENT", remarks: "" }, token);
  check("PUT edit set times", u3.status === 200, { status: u3.status, msg: u3.json?.message });

  // Verify what the list now returns for our rows (shape the table + edit modal read)
  const list1 = await api("GET", "/client/attendance", null, token);
  const mine = (list1.json?.data || []).filter((r) => created.includes(r.id));
  check("rows round-trip (dateStrings)", mine.length >= 1, mine.map((r) => ({ id: r.id, date: r.attendance_date, in: r.check_in, out: r.check_out, status: r.status, emp: r.employeeName })));

  // 7) Security: attendance for an employee id that is NOT this client's
  const foreign = await api("POST", "/client/attendance", { employee_id: 999999, attendance_date: "2026-01-17", check_in: "", check_out: "", status: "PRESENT" }, token);
  if (foreign.json?.id) created.push(foreign.json.id);
  check("POST foreign employee_id rejected", foreign.status >= 400, { status: foreign.status, msg: foreign.json?.message });

  // 8) Security: column-name injection through PUT payload keys
  const inj = await api("PUT", `/client/attendance/${c1.json?.id}`, { "status": "PRESENT", "remarks = 'x', client_id": 1 }, token);
  const injOk = inj.status === 200 && inj.json?.data?.client_id === 16 && inj.json?.data?.remarks === "left early";
  check("PUT unknown/injected keys ignored (row stays in tenant)", injOk, { status: inj.status, client_id: inj.json?.data?.client_id, remarks: inj.json?.data?.remarks });

  // 9) PUT unknown id -> should not be 200
  const nf = await api("PUT", `/client/attendance/999999999`, { status: "PRESENT" }, token);
  check("PUT unknown id -> 404", nf.status === 404, { status: nf.status, msg: nf.json?.message });
} catch (e) {
  check("probe crashed", false, String(e?.stack || e));
} finally {
  // cleanup
  try {
    const login = await api("POST", "/client/auth/login-admin", { email: "arav@gmail.com", password: "Test@1234" });
    for (const id of created) await api("DELETE", `/client/attendance/${id}`, null, login.json?.token);
    check("cleanup", true, created);
  } catch (e) { check("cleanup", false, String(e)); }
}

const summary = { pass: results.filter((r) => r.ok).length, total: results.length, results };
fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
