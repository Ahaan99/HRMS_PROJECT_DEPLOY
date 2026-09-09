// _sec-sweep.mjs — static security sweep of backend/. Read-only; writes scripts/_sec-sweep-out.txt
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(__dirname, "..");
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", "uploads", "scripts", ".git", "dist"].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (/\.(js|mjs|cjs)$/.test(e.name)) files.push(p);
  }
})(BACKEND);
const rel = (p) => path.relative(BACKEND, p).replace(/\\/g, "/");
const out = {};
const add = (k, v) => (out[k] = out[k] || []).push(v);
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const lines = src.split(/\r?\n/);
  lines.forEach((l, i) => {
    const loc = `${rel(f)}:${i + 1}`;
    if (/JWT_SECRET\s*\|\|\s*["'`]/.test(l) || /SECRET\s*(\|\||\?\?)\s*["'`][^"'`]{3,}/.test(l)) add("SECRET_FALLBACK", `${loc}: ${l.trim().slice(0, 140)}`);
    if (/jwt\.sign\(/.test(l) && !/expiresIn/.test(src.slice(src.indexOf(l), src.indexOf(l) + 300))) add("JWT_NO_EXPIRY", loc);
    if (/db\.(query|execute)\([\s\S]{0,40}`/.test(l) || /`\s*(SELECT|INSERT|UPDATE|DELETE)/i.test(l)) {
      // look ahead a few lines for ${req. or ${body or user-controlled interpolation
      const chunk = lines.slice(i, i + 12).join("\n");
      const m = chunk.match(/\$\{\s*(req\.(body|query|params)[\w.\[\]"']*|[a-zA-Z_]\w*)\s*\}/g);
      if (m) {
        const risky = m.filter((x) => /req\.|body|query|params|search|sort|order|filter|status|type|id\b/i.test(x));
        if (risky.length) add("SQL_INTERPOLATION", `${loc}: ${[...new Set(risky)].join(" ")}`);
      }
    }
    if (/origin\s*:\s*["']\*["']|cors\(\)\s*\)/.test(l)) add("CORS_WILDCARD", `${loc}: ${l.trim().slice(0, 120)}`);
    if (/console\.log\([^)]*(password|token|secret|otp)/i.test(l)) add("LOGS_SENSITIVE", `${loc}: ${l.trim().slice(0, 120)}`);
    if (/multer\(/.test(l)) {
      const chunk = lines.slice(i, i + 25).join("\n");
      if (!/fileFilter/.test(chunk)) add("UPLOAD_NO_FILEFILTER", loc);
      if (!/limits/.test(chunk)) add("UPLOAD_NO_LIMITS", loc);
    }
    if (/Math\.random\(\)/.test(l) && /otp|token|code|password/i.test(lines.slice(Math.max(0, i - 3), i + 3).join(" "))) add("WEAK_RANDOM", `${loc}: ${l.trim().slice(0, 120)}`);
    if (/res\.(json|send)\([^)]*err(or)?\.stack/.test(l)) add("STACK_LEAK", loc);
    if (/eval\(|new Function\(/.test(l)) add("EVAL", loc);
    if (/exec\(|execSync\(|spawn\(/.test(l) && !/\.exec\(/.test(l)) add("SHELL_EXEC", `${loc}: ${l.trim().slice(0, 120)}`);
  });
  // login routes without rate limit
  if (/login/i.test(rel(f)) && /router\.post\(\s*["'][^"']*login/i.test(src) && !/rateLimit|limiter|slowDown/i.test(src)) add("LOGIN_NO_RATELIMIT", rel(f));
}
const app = fs.readFileSync(path.join(BACKEND, "app.js"), "utf8");
out.APP = [
  `helmet: ${/helmet/.test(app)}`,
  `rate-limit import: ${/rate-limit|rateLimit/.test(app)}`,
  `cors config: ${(app.match(/cors\([\s\S]{0,300}?\)/) || ["none"])[0].replace(/\s+/g, " ").slice(0, 300)}`,
  `body limit: ${(app.match(/express\.json\([^)]*\)/) || ["express.json()"])[0]}`,
  `trust proxy: ${/trust proxy/.test(app)}`,
];
const txt = Object.entries(out).map(([k, v]) => `== ${k} (${v.length}) ==\n` + v.slice(0, 60).join("\n")).join("\n\n");
fs.writeFileSync(path.join(__dirname, "_sec-sweep-out.txt"), txt);
console.log(Object.entries(out).map(([k, v]) => `${k}=${v.length}`).join("  "));
