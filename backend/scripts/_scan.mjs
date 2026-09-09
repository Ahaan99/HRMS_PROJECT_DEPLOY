import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const roots = process.argv.slice(3);
const re = new RegExp(process.argv[2], "i");
const out = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?|css)$/.test(e.name)) {
      const lines = fs.readFileSync(p, "utf8").split("\n");
      lines.forEach((l, i) => { if (re.test(l)) out.push(`${p}:${i + 1}: ${l.trim().slice(0, 200)}`); });
    }
  }
}
roots.forEach(walk);
fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "_scan.txt"), out.join("\n"));
console.log(out.length + " matches");
