// Seeds dummy data through every IT-portal API feature and prints results.
// Usage: node scripts/it-dummy-seed.mjs   (backend must be running on :5000)
const BASE = "http://localhost:5000";
const IT_EMAIL = "dummy.itdev@test.local";
const IT_PASS = "Test@1234";

const results = [];
async function call(label, method, path, body, token) {
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text.slice(0, 200); }
    results.push({ label, status: res.status, ok: res.ok, sample: JSON.stringify(json).slice(0, 220) });
    return json;
  } catch (e) {
    results.push({ label, status: "ERR", ok: false, sample: e.message });
    return null;
  }
}

const login = await call("IT login", "POST", "/api/it/auth/login", { email: IT_EMAIL, password: IT_PASS });
const token = login?.token;
if (!token) { console.log(results); process.exit(1); }
const me = login.employee;

// Discover route list dynamically so nothing is missed
const routes = await call("IT route list (GET /api/it)", "GET", "/api/it", null, token);

// Employees / reviewers
await call("GET employees", "GET", "/api/it/employees", null, token);

// Tasks
const task = await call("POST task", "POST", "/api/it/tasks",
  { title: "DUMMY task - login page refactor", description: "dummy", priority: "High", project: "HRMS", assignee_id: me.id, due_date: "2026-09-10" }, token);
await call("GET tasks", "GET", "/api/it/tasks", null, token);

// Bugs
await call("POST bug", "POST", "/api/it/bugs",
  { title: "DUMMY bug - payroll rounding", description: "dummy", severity: "High", project: "HRMS", assignee_id: me.id }, token);
await call("GET bugs", "GET", "/api/it/bugs", null, token);

// Timesheets
await call("POST timesheet", "POST", "/api/it/timesheets",
  { date: "2026-09-03", hours: 7.5, project: "HRMS", description: "DUMMY timesheet entry", employee_id: me.id }, token);
await call("GET timesheets", "GET", "/api/it/timesheets", null, token);

// Deployments
await call("POST deployment", "POST", "/api/it/deployments",
  { project: "HRMS", environment: "staging", version: "v9.9.9-dummy", status: "success", notes: "DUMMY deploy", deployed_by: me.id }, token);
await call("GET deployments", "GET", "/api/it/deployments", null, token);

// Milestones
await call("POST milestone", "POST", "/api/it/milestones",
  { title: "DUMMY milestone - Q3 release", project: "HRMS", due_date: "2026-09-30", progress: 40, status: "in_progress" }, token);
await call("GET milestones", "GET", "/api/it/milestones", null, token);

// Code reviews
const cr = await call("POST code-review", "POST", "/api/it/code-reviews",
  { title: "DUMMY PR - refactor login", pr_link: "https://github.com/example/hrms/pull/999", reviewer_id: me.id, task_id: task?.task?.id || task?.id || null }, token);
const crId = cr?.review?.id || cr?.id || cr?.data?.id;
if (crId) await call("PATCH code-review -> merged", "PATCH", `/api/it/code-reviews/${crId}`, { status: "merged" }, token);
await call("GET code-reviews", "GET", "/api/it/code-reviews", null, token);

// Emergency / incidents
await call("POST emergency", "POST", "/api/it/emergency",
  { title: "DUMMY incident - server down", severity: "critical", description: "dummy", reported_by: me.id }, token);
await call("GET emergency", "GET", "/api/it/emergency", null, token);

// Chat / messages (if present)
await call("POST chat message", "POST", "/api/it/chat", { message: "DUMMY chat message", sender_id: me.id }, token);
await call("GET chat", "GET", "/api/it/chat", null, token);

// Dashboard summary / performance
await call("GET dashboard", "GET", "/api/it/dashboard", null, token);
await call("GET performance", "GET", "/api/it/performance", null, token);

console.table(results.map(r => ({ label: r.label, status: r.status, ok: r.ok })));
console.log("\n--- samples ---");
for (const r of results) console.log(`${r.label} [${r.status}]: ${r.sample}`);
