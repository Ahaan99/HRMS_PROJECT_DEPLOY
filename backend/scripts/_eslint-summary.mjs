// _eslint-summary.mjs - condense an ESLint JSON report (crash-class audit) into
// scripts/_eslint-summary.txt: error count per rule + every error with file:line.
// Usage (from repo root):
//   node HR/node_modules/eslint/bin/eslint.js --no-config-lookup -c HR/_eslint.audit.config.mjs \
//        admin/src HR/src client/src employee/src IT/src Sales/src -f json -o backend/scripts/_eslint-out.json
//   node backend/scripts/_eslint-summary.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const input = process.argv[2] || path.join(here, "_eslint-out.json");
const output = path.join(here, "_eslint-summary.txt");

const report = JSON.parse(fs.readFileSync(input, "utf8"));
const errors = [];
const warnings = [];
for (const file of report) {
  for (const m of file.messages) {
    const rel = path.relative(path.resolve(here, "..", ".."), file.filePath).replace(/\\/g, "/");
    const entry = `${rel}:${m.line}  [${m.ruleId || "parse"}] ${m.message}`;
    // "Definition for rule ... was not found" = plugin not installed in the audit config, not a code problem
    if (/Definition for rule .* was not found/.test(m.message)) continue;
    (m.severity === 2 ? errors : warnings).push(entry);
  }
}

const byRule = {};
for (const e of errors) {
  const rule = e.match(/\[([^\]]+)\]/)?.[1] || "?";
  byRule[rule] = (byRule[rule] || 0) + 1;
}

const lines = [
  `FILES SCANNED: ${report.length}`,
  `ERRORS: ${errors.length}`,
  `WARNINGS: ${warnings.length}`,
  "",
  "ERRORS BY RULE:",
  ...Object.entries(byRule).sort((a, b) => b[1] - a[1]).map(([r, n]) => `  ${n}  ${r}`),
  "",
  "ERROR LIST:",
  ...errors,
];
fs.writeFileSync(output, lines.join("\n"));
console.log(lines.slice(0, 3).join("\n"));
