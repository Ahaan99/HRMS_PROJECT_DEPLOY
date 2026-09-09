// Checks what the Super Admin "IT Developer" page receives vs IT-portal data.
const BASE = "http://localhost:5000";
const j = async (url, opt = {}) => {
  const r = await fetch(BASE + url, opt);
  const text = await r.text();
  let body = text;
  try { body = JSON.parse(text); } catch {}
  return { status: r.status, body };
};
const has = (o) => JSON.stringify(o).includes("DUMMY") || JSON.stringify(o).includes("Dummy IT Dev") || JSON.stringify(o).includes("v9.9.9-dummy");

const login = await j("/api/super-admin/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "admin@hrms.com", password: "admin123" }),
});
const token = login.body?.token || login.body?.data?.token;
const H = { authorization: "Bearer " + token };

const endpoints = [
  "/api/itdev/tasks",
  "/api/itdev/bugs",
  "/api/itdev/timesheets",
  "/api/itdev/deployments",
  "/api/itdev/milestones",
  "/api/itdev/performance",
  "/api/itdev/stats",
  "/api/it/code-reviews",
  "/api/it/daily-work",
  "/api/it/performance-report",
];
const rows = [];
for (const ep of endpoints) {
  const r = await j(ep, { headers: H });
  const data = r.body?.data ?? r.body;
  const count = Array.isArray(data) ? data.length : (data && typeof data === "object" ? Object.keys(data).length : 0);
  rows.push({ endpoint: ep, status: r.status, count, hasDummy: has(r.body), sample: JSON.stringify(data).slice(0, 220) });
}
console.log(JSON.stringify(rows, null, 2));
