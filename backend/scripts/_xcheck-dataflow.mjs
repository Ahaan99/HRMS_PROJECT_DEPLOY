// _xcheck-dataflow.mjs — cross-portal data-flow audit.
// For every WRITE call (POST/PUT/PATCH/DELETE) made by a non-admin portal, resolve the
// backend route -> module files -> SQL tables written, then check which Super Admin
// (admin portal) GET routes read those tables. Tables written by a portal that the admin
// never reads are reported as DATA-FLOW GAPS.
// Usage: cd backend && node scripts/_xcheck-routes.mjs && node scripts/_xcheck-dataflow.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(__dirname, "..");
const ROOT = path.resolve(BACKEND, "..");
const X = JSON.parse(fs.readFileSync(path.join(__dirname, "_xcheck-out.json"), "utf8"));

const read = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

// ---- resolve backend file closure (route file -> controllers -> services -> models) ----
function localImports(file) {
  const src = read(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const out = [];
  for (const m of src.matchAll(/(?:import[\s\S]*?from\s*|import\(\s*|require\(\s*)["'](\.[^"']+)["']/g)) {
    const base = path.resolve(path.dirname(file), m[1]);
    for (const c of [base, base + ".js", base + ".mjs", path.join(base, "index.js")]) if (exists(c)) { out.push(c); break; }
  }
  return out;
}
const closureCache = new Map();
function closure(file, depth = 6) {
  if (closureCache.has(file)) return closureCache.get(file);
  const seen = new Set(); const stack = [[file, 0]];
  while (stack.length) {
    const [f, d] = stack.pop(); if (seen.has(f) || d > depth) continue; seen.add(f);
    // do not descend into shared infra (db config, middleware, utils) - they hold no business SQL
    if (/[\\/](config|middleware|middlewares|utils|helpers)[\\/]/.test(f) && f !== file) continue;
    for (const n of localImports(f)) stack.push([n, d + 1]);
  }
  closureCache.set(file, seen);
  return seen;
}

// ---- SQL table extraction ----
const KW = new Set(["select", "dual", "information_schema", "set", "values", "where", "into", "and", "or", "not", "null", "on", "as", "if", "exists", "table", "database", "schema", "temporary", "left", "right", "inner", "outer", "cross", "using", "lateral"]);
function tablesOf(file) {
  const src = read(file);
  const w = new Set(), r = new Set();
  const grab = (re, set) => { for (const m of src.matchAll(re)) { const t = m[1].toLowerCase(); if (!KW.has(t) && !/^\$\{/.test(t)) set.add(t); } };
  grab(/\b(?:INSERT\s+(?:IGNORE\s+)?INTO|REPLACE\s+INTO)\s+`?([a-zA-Z_]\w*)`?/gi, w);
  grab(/\bUPDATE\s+`?([a-zA-Z_]\w*)`?\s+(?:\w+\s+)?SET\b/gi, w);
  grab(/\bDELETE\s+FROM\s+`?([a-zA-Z_]\w*)`?/gi, w);
  grab(/\b(?:FROM|JOIN)\s+`?([a-zA-Z_]\w*)`?/gi, r);
  // dynamic table names via template literal e.g. `INSERT INTO ${table}` are flagged
  const dyn = /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|FROM|JOIN)\s+\$\{/i.test(src);
  return { w, r, dyn };
}
const tblCache = new Map();
function tablesOfClosure(file) {
  if (tblCache.has(file)) return tblCache.get(file);
  const w = new Set(), r = new Set(); let dyn = false;
  for (const f of closure(file)) { const t = tablesOf(f); t.w.forEach(x => w.add(x)); t.r.forEach(x => r.add(x)); dyn = dyn || t.dyn; }
  const v = { w, r, dyn }; tblCache.set(file, v); return v;
}

// ---- parse hits "METHOD /full [backend/x.js:12] guards=..." ----
function hitFile(hit) { const m = hit.match(/\[([^\]:]+):(\d+)\]/); return m ? path.join(ROOT, m[1]) : null; }

const calls = X.matchedReachable;
const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// admin reads: table -> Set of "page <- GET path"
const adminReads = new Map();
for (const c of calls.filter(c => c.portal === "admin" && c.method === "GET")) {
  for (const h of c.hits) {
    const f = hitFile(h); if (!f || !exists(f)) continue;
    const { r } = tablesOfClosure(f);
    for (const t of r) { if (!adminReads.has(t)) adminReads.set(t, new Set()); adminReads.get(t).add(`${c.file.replace(/^admin\/src\//, "")} <- GET ${c.path}`); }
  }
}
// HR reads (secondary reviewer) - useful to say "visible to HR but not Super Admin"
const hrReads = new Map();
for (const c of calls.filter(c => c.portal === "HR" && c.method === "GET")) {
  for (const h of c.hits) { const f = hitFile(h); if (!f || !exists(f)) continue; for (const t of tablesOfClosure(f).r) { if (!hrReads.has(t)) hrReads.set(t, new Set()); hrReads.get(t).add(c.file.replace(/^HR\/src\//, "")); } }
}

// writes by non-admin portals: table -> {portal -> Set(page METHOD path)}
const writes = new Map();
const dynamicSql = new Set();
for (const c of calls.filter(c => c.portal !== "admin" && WRITE.has(c.method))) {
  for (const h of c.hits) {
    const f = hitFile(h); if (!f || !exists(f)) continue;
    const { w, dyn } = tablesOfClosure(f);
    if (dyn) dynamicSql.add(path.relative(ROOT, f).replace(/\\/g, "/"));
    for (const t of w) {
      if (!writes.has(t)) writes.set(t, new Map());
      const per = writes.get(t);
      if (!per.has(c.portal)) per.set(c.portal, new Set());
      per.get(c.portal).add(`${c.file.replace(/^[^/]+\/src\//, "")}:${c.line} ${c.method} ${c.path}`);
    }
  }
}

// tables that are pure infra / auth / self-service and legitimately invisible to Super Admin
// Verified 2026-09-09:
//  - attendance_logs: secondary LOGIN/LOGOUT audit written by the chatbot; the same handler writes
//    client_attendance and syncs it into super_admin_attendance, which admin reads.
//  - client_employee_deleted: soft-delete archive (tombstones), not a live business table.
//  - main: regex false positive (SQL alias / word "main" after FROM in a template string).
const IGNORE = /^(user_sessions|login_otps|password_resets?|refresh_tokens?|otp_attempts?|sessions?|audit_logs?|notifications?|migrations?|schema_migrations|robo_snapshots|internal_messages|messages|conversations|chat_messages|ai_chat_.*|employee_otp.*|attendance_otp.*|attendance_logs|client_employee_deleted|main)$/i;

const rows = [];
for (const [t, per] of [...writes.entries()].sort()) {
  const readers = adminReads.get(t);
  rows.push({
    table: t,
    writtenBy: Object.fromEntries([...per.entries()].map(([p, s]) => [p, [...s].sort()])),
    adminReads: readers ? [...readers].sort() : [],
    hrReads: hrReads.has(t) ? [...hrReads.get(t)].sort() : [],
    status: readers ? "OK" : IGNORE.test(t) ? "IGNORED(infra/self-service)" : "GAP",
  });
}
const gaps = rows.filter(r => r.status === "GAP");

const out = {
  summary: { writeTables: rows.length, ok: rows.filter(r => r.status === "OK").length, ignored: rows.filter(r => r.status.startsWith("IGNORED")).length, gaps: gaps.length, filesWithDynamicTableNames: [...dynamicSql].sort() },
  gaps, rows,
};
fs.writeFileSync(path.join(__dirname, "_xcheck-dataflow-out.json"), JSON.stringify(out, null, 2));
const lines = ["SUMMARY " + JSON.stringify(out.summary, null, 1), "\n== DATA-FLOW GAPS (portal writes table, Super Admin never reads it) =="];
for (const g of gaps) {
  lines.push(`\n[GAP] ${g.table}`);
  for (const [p, arr] of Object.entries(g.writtenBy)) for (const a of arr) lines.push(`   written by ${p}: ${a}`);
  if (g.hrReads.length) lines.push(`   (HR reads it: ${g.hrReads.join(", ")})`);
}
lines.push("\n== OK (table written by portal -> read by Super Admin page) ==");
for (const r of rows.filter(r => r.status === "OK")) {
  lines.push(`\n[OK] ${r.table}  <- ${Object.keys(r.writtenBy).join(", ")}`);
  for (const a of r.adminReads.slice(0, 4)) lines.push(`   admin: ${a}`);
}
lines.push("\n== IGNORED ==\n" + rows.filter(r => r.status.startsWith("IGNORED")).map(r => `${r.table} <- ${Object.keys(r.writtenBy).join(", ")}`).join("\n"));
fs.writeFileSync(path.join(__dirname, "_xcheck-dataflow-out.txt"), lines.join("\n"));
console.log(lines[0]);
