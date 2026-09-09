// Repairs UTF-8 text that was mis-read as Windows-1252 and re-saved (₹ -> â‚¹, — -> â€”, … -> â€¦).
// Reverses the round-trip line by line and only keeps a line when the result is valid UTF-8.
//   node scripts/fix-mojibake.mjs            (from backend/; dry run)
//   node scripts/fix-mojibake.mjs --write    (apply)
import fs from "node:fs";
import path from "node:path";
import iconv from "iconv-lite"; // transitive dep of mysql2, already installed

const WRITE = process.argv.includes("--write");
const root = path.resolve(process.cwd(), "..");
const portals = ["admin", "client", "employee", "HR", "IT", "Sales", "employee-verification-system/frontend/frontend"];
const SUSPECT = /[\u00c2\u00c3\u00e2][\u0080-\u00bf\u20ac\u201a\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178\u0192\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d]/;
const strictUtf8 = new TextDecoder("utf-8", { fatal: true });

const files = [];
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    if (f === "node_modules" || f === "dist") continue;
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?|css|html|json)$/.test(f)) files.push(p);
  }
};
for (const p of portals) {
  const src = path.join(root, p, "src");
  if (fs.existsSync(src)) walk(src);
  const ih = path.join(root, p, "index.html");
  if (fs.existsSync(ih)) files.push(ih);
}

// One reverse pass: text -> cp1252 bytes -> utf8. Repeat while it still looks mangled (handles double/triple encoding).
const repairLine = (line) => {
  let cur = line;
  for (let i = 0; i < 4 && SUSPECT.test(cur); i++) {
    try {
      const next = strictUtf8.decode(iconv.encode(cur, "win1252"));
      if (next === cur) break;
      cur = next;
    } catch {
      break; // not a clean round-trip: leave the line alone
    }
  }
  return cur;
};

let totalLines = 0, totalFiles = 0;
for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  if (!SUSPECT.test(raw)) continue;
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);
  let changed = 0;
  const fixed = lines.map((l) => { const r = repairLine(l); if (r !== l) changed++; return r; });
  if (!changed) continue;
  totalFiles++; totalLines += changed;
  console.log(`${WRITE ? "fixed" : "would fix"} ${changed.toString().padStart(3)} line(s)  ${path.relative(root, f).replace(/\\/g, "/")}`);
  if (WRITE) fs.writeFileSync(f, fixed.join(eol), "utf8");
}
console.log(`\n${totalFiles} file(s), ${totalLines} line(s)${WRITE ? " written" : " (dry run - add --write to apply)"}`);
