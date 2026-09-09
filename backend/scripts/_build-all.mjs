// _build-all.mjs — production build of every portal; summary in scripts/_build-all-out.txt
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const portals = ["admin", "client", "employee", "HR", "IT", "Sales", path.join("employee-verification-system", "frontend", "frontend")];
const lines = [];
let failed = 0;
for (const p of portals) {
  const dir = path.join(ROOT, p);
  const vite = path.join(dir, "node_modules", "vite", "bin", "vite.js");
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [vite, "build", "--logLevel", "warn"], { cwd: dir, encoding: "utf8", timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  const ok = r.status === 0;
  if (!ok) failed++;
  const tail = ((r.stdout || "") + (r.stderr || "")).trim().split(/\r?\n/).filter((l) => /error|Error|failed|Could not|Rollup|warning/i.test(l)).slice(-12).join("\n      ");
  lines.push(`${ok ? "PASS" : "FAIL"}  ${p.padEnd(48)} ${((Date.now() - t0) / 1000).toFixed(1)}s${tail ? "\n      " + tail : ""}`);
  console.log(lines[lines.length - 1]);
}
lines.push(`\n${portals.length - failed}/${portals.length} portals built`);
fs.writeFileSync(path.join(__dirname, "_build-all-out.txt"), lines.join("\n"));
console.log(lines[lines.length - 1]);
process.exit(failed ? 1 : 0);
