import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = [];
const g = (f, re) => {
  try {
    fs.readFileSync(path.join(ROOT, f), "utf8").split(/\r?\n/).forEach((l, i) => { if (re.test(l)) out.push(`${f}:${i + 1}: ${l.trim().slice(0, 160)}`); });
  } catch { out.push(`${f} MISSING`); }
};
g("backend/config/schemaBootstrap.js", /emergency_logs|ensureColumn|addColumn|ADD COLUMN|export const bootstrapSchemas|const ensure|hasColumn/i);
g("backend/config/initDb.js", /emergency_logs|ensureColumn|addColumn|hasColumn/i);
out.push("---JWT---", fs.readFileSync(path.join(ROOT, "backend/utils/jwt.js"), "utf8"));
const walk = (d, acc = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist") continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc); else if (/\.(jsx?|tsx?)$/.test(e.name)) acc.push(p);
  }
  return acc;
};
out.push("---EMERGENCY-CALLERS---");
for (const portal of ["HR", "IT", "employee", "sales", "client", "admin"]) {
  try { for (const f of walk(path.join(ROOT, portal, "src"))) { const s = fs.readFileSync(f, "utf8"); if (/\/emergency/.test(s)) out.push(path.relative(ROOT, f)); } } catch { out.push(portal + " no src"); }
}
out.push("---HR-ROUTING---");
for (const f of walk(path.join(ROOT, "HR", "src"))) if (/App\.jsx$|Routes?\.jsx$|Sidebar\.jsx$|Layout\.jsx$/.test(f)) out.push(path.relative(ROOT, f));
out.push("---PORTAL-DIRS---", fs.readdirSync(ROOT).join(", "));
fs.writeFileSync(new URL("./_probe-out.txt", import.meta.url), out.join("\n"));
