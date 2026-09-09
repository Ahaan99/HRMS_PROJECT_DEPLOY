// Crawl the served HR Robo UI and verify every referenced local asset returns 200.
// Usage: node scripts/_robo-ui-check.mjs   (backend must be running on :5000)
const BASE = process.env.ROBO_BASE || "http://localhost:5000/api/hr-robo";

const get = async (u) => {
  const r = await fetch(u, { redirect: "manual" });
  const b = await r.text();
  return { status: r.status, body: b, loc: r.headers.get("location") };
};

const out = [];
const log = (s) => { out.push(s); console.log(s); };

const health = await get(BASE + "/health");
log(`health            ${health.status} ${health.body.slice(0, 100)}`);

const noSlash = await get(BASE);
log(`redirect no-slash ${noSlash.status} -> ${noSlash.loc}`);

const idx = await get(BASE + "/");
log(`index.html        ${idx.status} ${idx.body.length} bytes`);
log(`  hard-coded /api/hr-robo refs: ${(idx.body.match(/\/api\/hr-robo/g) || []).length}`);
log(`  loads config.js: ${idx.body.includes("config.js")}`);

const refs = [...idx.body.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((u) => !/^(https?:|data:|#|mailto:|javascript:)/i.test(u));

// also pick up scripts referenced from JS (config.js + static/*.js) that load other local files
const uniq = [...new Set(refs)];
let bad = 0;
for (const ref of uniq) {
  const url = ref.startsWith("/") ? new URL(ref, BASE).href : BASE + "/" + ref;
  const r = await get(url);
  const ok = r.status === 200;
  if (!ok) bad++;
  log(`  ${ok ? "OK " : "BAD"} ${r.status} ${ref}`);
}

// api calls inside the JS files: check they use HR_ROBO_BASE, not absolute paths
for (const f of uniq.filter((u) => u.endsWith(".js"))) {
  const url = f.startsWith("/") ? new URL(f, BASE).href : BASE + "/" + f;
  const r = await get(url);
  const abs = (r.body.match(/["'`]\/api\/(?!hr-robo)/g) || []).length;
  if (abs) log(`  WARN ${f} has ${abs} absolute /api/ references not routed via HR_ROBO_BASE`);
}

log(`RESULT: ${bad === 0 && idx.status === 200 && health.status === 200 ? "PASS" : "FAIL"} (${uniq.length} assets, ${bad} broken)`);
