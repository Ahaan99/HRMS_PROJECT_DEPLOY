// Seeds the remaining IT features using the REAL field names / paths.
const BASE = "http://localhost:5000";
const results = [];
async function call(label, method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text.slice(0, 120); }
  results.push({ label, status: res.status, sample: JSON.stringify(json).slice(0, 200) });
  return json;
}
const login = await call("IT login", "POST", "/api/it/auth/login", { email: "dummy.itdev@test.local", password: "Test@1234" });
const t = login.token; const me = login.employee;

// Task assigned to self (first run left assigned_to null)
const task = await call("POST task (assigned)", "POST", "/api/it/tasks",
  { title: "DUMMY task - assigned to me", description: "dummy", assigned_to: me.id, priority: "High", due_date: "2026-09-12" }, t);
await call("PATCH task -> In Progress", "PATCH", `/api/it/tasks/${task.id}/status`, { status: "In Progress" }, t);

// Daily work
await call("POST daily-work", "POST", "/api/it/daily-work",
  { work_date: "2026-09-03", summary: "DUMMY daily work summary", hours_spent: 7, blockers: "none" }, t);
await call("GET daily-work", "GET", "/api/it/daily-work", null, t);

// Timesheet
await call("POST timesheet", "POST", "/api/it/timesheet",
  { entry_date: "2026-09-03", project: "HRMS", task: "DUMMY timesheet task", hours: 6.5, notes: "dummy" }, t);
await call("GET timesheet", "GET", "/api/it/timesheet", null, t);

// Milestone
const ms = await call("POST milestone", "POST", "/api/it/milestones",
  { project: "HRMS", milestone: "DUMMY milestone - Q3 release", description: "dummy", target_date: "2026-09-30", owner_id: me.id }, t);
if (ms?.id) await call("PATCH milestone 60%", "PATCH", `/api/it/milestones/${ms.id}`, { progress: 60, status: "In Progress" }, t);
await call("GET milestones", "GET", "/api/it/milestones", null, t);

// Code review -> Approved -> Merged
const cr = await call("POST code-review", "POST", "/api/it/code-reviews",
  { pr_title: "DUMMY PR - refactor login", pr_link: "https://github.com/example/hrms/pull/999", reviewer_id: me.id }, t);
if (cr?.id) {
  await call("PATCH code-review -> Approved", "PATCH", `/api/it/code-reviews/${cr.id}`, { status: "Approved", comments: "LGTM" }, t);
  await call("PATCH code-review -> Merged", "PATCH", `/api/it/code-reviews/${cr.id}`, { status: "Merged" }, t);
}
await call("GET code-reviews", "GET", "/api/it/code-reviews", null, t);

// Bug -> Resolved
const bugs = await call("GET bugs", "GET", "/api/it/bugs", null, t);
const myBug = (bugs || []).find(b => String(b.title).startsWith("DUMMY"));
if (myBug) await call("PATCH bug -> Resolved", "PATCH", `/api/it/bugs/${myBug.id}/status`, { status: "Resolved" }, t);

// Deployment with full fields
await call("POST deployment (full)", "POST", "/api/it/deployments",
  { project: "HRMS", version_tag: "v9.9.9-dummy", environment: "Staging", features: "DUMMY feature list", status: "Success" }, t);

await call("GET performance", "GET", "/api/it/performance", null, t);

for (const r of results) console.log(`${r.label} [${r.status}]: ${r.sample}`);
