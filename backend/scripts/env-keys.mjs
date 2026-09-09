/* Lists every process.env.KEY referenced in backend source (excludes node_modules). */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", "uploads", "dist", ".git", "scripts"]);
const keys = new Map();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|mjs|cjs)$/.test(entry.name)) {
      const src = fs.readFileSync(full, "utf8");
      for (const m of src.matchAll(/process\.env\.([A-Z_0-9]+)/g)) {
        if (!keys.has(m[1])) keys.set(m[1], path.relative(ROOT, full));
      }
    }
  }
}
walk(ROOT);

const out = [...keys.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, f]) => `${k}  <- ${f}`)
  .join("\n");
fs.writeFileSync(path.join(ROOT, "_boot_report.txt"), out);
