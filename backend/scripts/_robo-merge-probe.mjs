// Simulates the two-laptop bug: A (admin) caches candidates, B registers a new
// candidate, then A pushes its STALE list. With merge, B's candidate survives.
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:5000/api/hr-robo";
const out = { steps: [] };
const log = (s, ok, extra) => out.steps.push({ s, ok, ...extra });
const get = async () => (await fetch(BASE + "/api/store")).json();
const put = (key, body) =>
  fetch(BASE + "/api/store/" + key, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

try {
  const snap = await get();
  const A = (snap.data.candidates || []).slice(); // laptop A's stale cache
  const tag = Date.now();
  const bCand = { id: 900000 + (tag % 99999), name: "Probe B " + tag, email: `probe${tag}@x.test`, status: "pending", registered_at: new Date().toISOString() };

  // B registers (pushes its own list + new candidate)
  const rB = await put("candidates", { value: [...A, bCand] });
  log("B pushes new candidate", rB.ok && rB.value.some((c) => c.id === bCand.id), { merged: rB.merged, count: rB.count });

  // A pushes STALE list (no bCand) after approving someone -> must NOT drop bCand
  const stale = A.map((c) => ({ ...c }));
  const rA = await put("candidates", { value: stale });
  const survived = rA.value.some((c) => c.id === bCand.id);
  log("A stale push keeps B candidate", survived, { merged: rA.merged, count: rA.count });

  // A explicitly deletes bCand -> removed tombstone must drop it
  const rDel = await put("candidates", { value: stale, removed: ["i:" + bCand.id] });
  log("explicit removal drops it", !rDel.value.some((c) => c.id === bCand.id), { count: rDel.count });

  // shape guard still works
  const bad = await fetch(BASE + "/api/store/candidates", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: {} }) });
  log("non-array rejected", bad.status === 400, { status: bad.status });

  const after = await get();
  log("store unchanged in size", (after.data.candidates || []).length === A.length, { before: A.length, after: (after.data.candidates || []).length });
  out.pass = out.steps.every((x) => x.ok);
} catch (e) {
  out.error = String(e && e.stack || e);
  out.pass = false;
}
fs.writeFileSync(new URL("./_robo_merge_probe.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
