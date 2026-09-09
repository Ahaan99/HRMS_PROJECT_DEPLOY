/**
 * Source-code archive of "HRMS Merging" (no node_modules / dist / .git / secrets / uploads / logs).
 * Output: D:\HRMS_new\HRMS-SOURCE-<date>.zip
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const SRC = path.resolve(process.cwd(), "..");            // ...\HRMS Merging
const OUT_ROOT = "D:\\HRMS_new";
const DATE = new Date().toISOString().slice(0, 10);
const NAME = `HRMS-SOURCE-${DATE}`;
const STAGING = path.join(OUT_ROOT, "_source_staging");
const STAGE = path.join(STAGING, "HRMS Merging");
const ZIP = path.join(OUT_ROOT, `${NAME}.zip`);

const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".git", ".mcp_logs", ".vite", ".cache", ".turbo", "coverage", "_mcp_screens", "uploads",
  "venv", ".venv", "__pycache__", ".pytest_cache", "_src-staging", "_source_staging"]);
const SKIP_FILE = (name) =>
  /^\.env(\..*)?$/.test(name) && !/\.example$/.test(name) ||          // secrets (keep *.example)
  /\.(log|zip|7z|rar|mp4|webm)$/i.test(name) ||
  name === "Thumbs.db" || name === ".DS_Store";
const SKIP_TOP = new Set(["HR_robo"]);                                 // excluded from the deployed system too

let files = 0, bytes = 0, skippedEnv = 0;
const copy = (from, to, depth = 0) => {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || (depth === 0 && SKIP_TOP.has(entry.name))) continue;
      fs.mkdirSync(d, { recursive: true });
      copy(s, d, depth + 1);
    } else if (entry.isFile()) {
      if (SKIP_FILE(entry.name)) { if (/^\.env/.test(entry.name)) skippedEnv++; continue; }
      fs.copyFileSync(s, d);
      files++; bytes += entry.size ?? fs.statSync(s).size;
    }
  }
};

fs.rmSync(STAGING, { recursive: true, force: true });
fs.mkdirSync(STAGE, { recursive: true });
copy(SRC, STAGE);

// Keep an .env template per app so whoever gets the source knows what to configure.
const envTemplates = [];
const walkEnv = (dir, depth = 0) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !(depth === 0 && SKIP_TOP.has(e.name)) && depth < 4) walkEnv(p, depth + 1); }
    else if (/^\.env(\.local|\.production)?$/.test(e.name)) {
      const rel = path.relative(SRC, p);
      const keys = fs.readFileSync(p, "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => l.split("=")[0] + "=");
      const target = path.join(STAGE, rel + ".example");
      if (!fs.existsSync(target)) { fs.writeFileSync(target, keys.join("\n") + "\n"); envTemplates.push(rel + ".example"); }
    }
  }
};
walkEnv(SRC);

fs.rmSync(ZIP, { force: true });
execSync(`tar.exe -a -c -f "${ZIP}" -C "${STAGING}" "HRMS Merging"`, { stdio: "pipe" });
fs.rmSync(STAGING, { recursive: true, force: true });

// Safety scan of the produced archive
const listing = execSync(`tar.exe -tf "${ZIP}"`, { encoding: "utf8", maxBuffer: 256e6 }).split(/\r?\n/).filter(Boolean);
const leaks = listing.filter((l) => /(^|\/)(node_modules|dist|\.git|uploads)\//.test(l) || /\/\.env(\.local|\.production)?$/.test(l));
const top = [...new Set(listing.map((l) => l.split("/")[1]).filter(Boolean))].sort();

console.log(`ZIP: ${ZIP}  (${(fs.statSync(ZIP).size / 1048576).toFixed(1)} MB, ${files} files / ${(bytes / 1048576).toFixed(1)} MB unpacked)`);
console.log(`top-level: ${top.join(", ")}`);
console.log(`secrets excluded: ${skippedEnv} .env file(s); templates added: ${envTemplates.join(", ") || "none"}`);
console.log(`leak check: ${leaks.length ? "FAIL " + leaks.slice(0, 5).join(" ") : "clean"}`);
