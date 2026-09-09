/**
 * Boot check: imports app.js (all modules, all routes) without listening,
 * then prints every mounted route prefix. Writes the report to _boot_report.txt
 * so it can be read even when the shell swallows stdout.
 *
 *   node scripts/boot-check.mjs
 *
 * Works with Express 4 (app._router) and Express 5 (app.router).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "_boot_report.txt");
const lines = [];
const log = (s) => { lines.push(s); console.log(s); };

process.env.BOOT_CHECK = "1";
let ok = false;
try {
  const mod = await import("../app.js");
  const app = mod.default || mod.app;
  log("APP IMPORT: OK");
  /* 1. static truth: every app.use("/prefix", ...) declared in app.js */
  const src = fs.readFileSync(path.join(here, "..", "app.js"), "utf8");
  const declared = [...src.matchAll(/app\.use\(\s*["'`](\/[^"'`]*)["'`]/g)].map((m) => m[1]);
  const prefixes = [...new Set(declared)].sort();

  /* 2. runtime truth: does the loaded router stack match each declared prefix?
        express 4 -> layer.regexp / layer.match ; express 5 -> layer.matchers[] */
  const layerMatches = (layer, url) => {
    if (typeof layer.match === "function") { try { if (layer.match(url)) return true; } catch {} }
    if (layer.regexp?.test?.(url)) return true;
    if (Array.isArray(layer.matchers)) for (const fn of layer.matchers) { try { if (fn(url)) return true; } catch {} }
    return false;
  };
  const stack = (app?.router || app?._router || {}).stack || [];
  // any layer (router OR express.static / plain middleware) that matches the prefix counts
  const matched = prefixes.filter((p) => stack.some((l) => layerMatches(l, p + "/")));
  const unmatched = prefixes.filter((p) => !matched.includes(p));

  log(`DECLARED MOUNTS (app.js): ${prefixes.length}`);
  for (const p of prefixes) log(`  ${matched.includes(p) ? "ok " : "?? "} ${p}`);
  if (unmatched.length) log("NOT MATCHED AT RUNTIME: " + unmatched.join(", "));

  const must = ["/api/evs", "/api/hr-robo", "/api/smart-attendance"];
  const missing = must.filter((m) => !matched.includes(m));
  log("MERGED MODULES: " + (missing.length ? "MISSING " + missing.join(", ") : "evs + hr-robo + smart-attendance all mounted"));
  ok = missing.length === 0 && unmatched.length === 0 && prefixes.length > 0;
} catch (e) {
  log("APP IMPORT: FAILED");
  log(String(e.stack || e));
}

/* env audit - keys the merged single-process backend actually reads */
const envPath = path.join(here, "..", ".env");
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const keys = new Set(
  env.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")).map((l) => l.split("=")[0])
);
const required = [
  "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET",
  "EMAIL_USER", "EMAIL_PASS",
  "EVS_SSO_KEY", "EVS_FRONTEND_URL",
  "GROQ_API_KEY",
];
const optional = ["PORT", "CORS_ORIGINS", "EVS_APP_URL", "GROQ_CHAT_MODEL", "OFFICE_LAT", "OFFICE_LNG", "OFFICE_RADIUS", "OFFICE_SUBNET", "OTP_DEBUG"];
const missingReq = required.filter((k) => !keys.has(k));
log("ENV KEYS PRESENT: " + [...keys].sort().join(", "));
log("ENV MISSING (required): " + (missingReq.join(", ") || "none"));
log("ENV MISSING (optional, defaults apply): " + (optional.filter((k) => !keys.has(k)).join(", ") || "none"));
log("RESULT: " + (ok && missingReq.length === 0 ? "PASS" : "CHECK ABOVE"));

fs.writeFileSync(out, lines.join("\n"));
process.exit(ok ? 0 : 1);
