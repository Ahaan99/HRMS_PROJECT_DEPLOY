// End-to-end: Super Admin assigns task -> IT dev sees it -> IT links PR + merges -> Super Admin sees Merged/Done
const B = "http://localhost:5000/api";
const out = [];
const log = (k, v) => out.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
const j = async (url, opt = {}) => {
  const r = await fetch(url, opt);
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = t; }
  return { status: r.status, data: d };
};
const hdr = (tok) => ({ "Content-Type": "application/json", Authorization: `Bearer ${tok}` });

try {
  const sa = await j(`${B}/super-admin/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "admin@hrms.com", password: "admin123" }) });
  const saTok = sa.data.token;
  const it = await j(`${B}/it/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "dummy.itdev@test.local", password: "Test@1234" }) });
  const itTok = it.data.token;
  log("logins", { sa: sa.status, it: it.status });

  // 1. Super Admin creates task for dummy dev (id 26)
  const c = await j(`${B}/itdev/tasks`, { method: "POST", headers: hdr(saTok), body: JSON.stringify({ title: "FLOW task from Super Admin", project: "HRMS", assignee_id: 26, priority: "High", due_date: "2026-09-30" }) });
  log("1 admin createTask", c);
  const taskId = c.data.id;

  // 2. IT dev sees it on kanban
  const itTasks = await j(`${B}/it/tasks`, { headers: hdr(itTok) });
  const mine = (itTasks.data || []).find((t) => t.id === taskId);
  log("2 IT sees task", mine ? { id: mine.id, status: mine.status, assigned_to_name: mine.assigned_to_name, created_by_name: mine.created_by_name } : "NOT FOUND");

  // 3. IT dev moves to In Progress
  const p = await j(`${B}/it/tasks/${taskId}`, { method: "PATCH", headers: hdr(itTok), body: JSON.stringify({ status: "In Progress" }) });
  log("3 IT -> In Progress", p.status);
  let adm = await j(`${B}/itdev/tasks`, { headers: hdr(saTok) });
  let row = adm.data.find((t) => t.id === taskId);
  log("3 admin sees", { status: row?.status, review: row?.review_status });

  // 4. IT requests PR review linked to the task
  const cr = await j(`${B}/it/code-reviews`, { method: "POST", headers: hdr(itTok), body: JSON.stringify({ pr_title: "FLOW PR", pr_link: "https://github.com/x/y/pull/1", reviewer_id: 26, task_id: taskId }) });
  log("4 IT createCodeReview", cr);
  adm = await j(`${B}/itdev/tasks`, { headers: hdr(saTok) });
  row = adm.data.find((t) => t.id === taskId);
  log("4 admin sees", { status: row?.status, review: row?.review_status, pr: row?.pr_link, reviewer: row?.reviewer });

  // 5. Reviewer merges
  const m = await j(`${B}/it/code-reviews/${cr.data.id}`, { method: "PATCH", headers: hdr(itTok), body: JSON.stringify({ status: "Merged" }) });
  log("5 IT merge", m.status);
  adm = await j(`${B}/itdev/tasks`, { headers: hdr(saTok) });
  row = adm.data.find((t) => t.id === taskId);
  log("5 admin sees", { status: row?.status, review: row?.review_status });

  // 6. Admin other tabs + counters
  for (const ep of ["bugs", "timesheets", "milestones", "code-reviews", "daily-work", "deployments"]) {
    const r = await j(`${B}/itdev/${ep}`, { headers: hdr(saTok) });
    log(`6 admin ${ep}`, { status: r.status, rows: Array.isArray(r.data) ? r.data.length : r.data, sample: Array.isArray(r.data) ? r.data[0] : null });
  }
  const perf = await j(`${B}/itdev/performance`, { headers: hdr(saTok) });
  log("6 admin performance", perf.data);

  // cleanup flow records
  await j(`${B}/itdev/tasks/${taskId}`, { method: "DELETE", headers: hdr(saTok) });
  log("cleanup", "flow task deleted (code review row kept for admin tab)");
} catch (e) {
  log("ERROR", e.stack || e.message);
}
await import("node:fs").then((fs) => fs.writeFileSync(process.argv[2] || "_flow.log", out.join("\n")));
