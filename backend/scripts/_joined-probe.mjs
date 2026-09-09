// _joined-probe.mjs - verifies the Candidate Management "Joined" fix end-to-end
// against the running local backend (:5000). Writes scripts/_joined-probe-out.json.
// Restores the original joined/joining_date/selection_date of the row it touches.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "_joined-probe-out.json");
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

try {
  const login = await api("POST", "/super-admin/auth/login", { email: "admin@hrms.com", password: "admin123" });
  const token = login.json?.token || login.json?.access_token;
  check("super admin login", login.status === 200 && token, login.status);

  const hrList = await api("GET", "/super-admin/interviews/hr-list", null, token);
  check("GET /hr-list 200", hrList.status === 200, hrList.json?.data?.length);

  const list = await api("GET", "/super-admin/interviews?page=1&limit=5", null, token);
  const rows = list.json?.data?.rows || [];
  check("GET /interviews 200 (joined query)", list.status === 200, { status: list.status, msg: list.json?.message, rows: rows.length });
  check("rows expose hr_name via join", rows.length === 0 || rows.every((r) => "hr_name" in r), rows[0] && { id: rows[0].id, hr_name: rows[0].hr_name, company: rows[0].company_name });

  const hrName = hrList.json?.data?.[0]?.hr_name;
  if (hrName) {
    const byHr = await api("GET", `/super-admin/interviews?hr=${encodeURIComponent(hrName)}`, null, token);
    const ok = byHr.status === 200 && (byHr.json.data.rows || []).every((r) => r.hr_name === hrName);
    check("HR name filter works (was ci.hr_name 500)", ok, { status: byHr.status, hr: hrName, n: byHr.json?.data?.rows?.length });
  } else {
    check("HR name filter works (skipped: no HR names)", true, "no rows with hr_employee_id");
  }

  const target = rows[0];
  if (target) {
    const orig = { joined: target.joined, joining_date: target.joining_date, selection_date: target.selection_date };
    const flip = target.joined === "Yes" ? "No" : "Yes";

    // exactly what the admin <select> sends: joined + current dates ("" when empty)
    const p1 = await api("PATCH", `/super-admin/interviews/joined/${target.id}`, {
      joined: flip,
      joining_date: orig.joining_date || "",
      selection_date: orig.selection_date || "",
    }, token);
    check("PATCH /joined/:id select flow 200", p1.status === 200 && p1.json?.data?.joined === flip, { status: p1.status, msg: p1.json?.message, joined: p1.json?.data?.joined });

    // exactly what the joining-date <input type=date> sends
    const p2 = await api("PATCH", `/super-admin/interviews/joined/${target.id}`, {
      joined: "Yes", joining_date: "2026-09-10", selection_date: "2026-09-10",
    }, token);
    check("PATCH /joined/:id date flow 200", p2.status === 200 && String(p2.json?.data?.joining_date).startsWith("2026-09-10"), { status: p2.status, msg: p2.json?.message, jd: p2.json?.data?.joining_date });

    const bad = await api("PATCH", `/super-admin/interviews/joined/${target.id}`, { joined: "Maybe" }, token);
    check("PATCH invalid joined -> 400", bad.status === 400, bad.json?.message);

    // restore
    const r = await api("PATCH", `/super-admin/interviews/joined/${target.id}`, {
      joined: orig.joined || "No",
      joining_date: orig.joining_date || "",
      selection_date: orig.selection_date || "",
    }, token);
    check("restore original row", r.status === 200 && r.json?.data?.joined === (orig.joined || "No"), { status: r.status });
  } else {
    check("PATCH flows (skipped: no interview rows)", true, "no rows in client_interviews");
  }

  const nf = await api("PATCH", `/super-admin/interviews/joined/999999999`, { joined: "Yes" }, token);
  check("PATCH unknown id -> 404", nf.status === 404, { status: nf.status, msg: nf.json?.message });

  const formId = await api("PATCH", `/super-admin/interviews/joined/form_1`, { joined: "Yes" }, token);
  check("PATCH form_* id -> 404 (frontend now disables these)", formId.status === 404, { status: formId.status, msg: formId.json?.message });
} catch (e) {
  check("probe crashed", false, String(e?.stack || e));
}

const summary = { pass: results.filter((r) => r.ok).length, total: results.length, results };
fs.writeFileSync(OUT, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
