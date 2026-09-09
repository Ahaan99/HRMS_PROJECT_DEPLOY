// _xcheck-routes.mjs — static cross-check: every frontend API call vs backend mounted routes.
// Usage: cd backend && node scripts/_xcheck-routes.mjs   → writes scripts/_xcheck-out.{json,txt}
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(__dirname, "..");
const ROOT = path.resolve(BACKEND, "..");

const PORTALS = [
  { name: "admin", dir: "admin/src" },
  { name: "HR", dir: "HR/src" },
  { name: "client", dir: "client/src" },
  { name: "employee", dir: "employee/src" },
  { name: "IT", dir: "IT/src" },
  { name: "Sales", dir: "Sales/src" },
  { name: "EVS", dir: "employee-verification-system/frontend/frontend/src", apiPrefix: "/api/evs" },
];

const read = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");
const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs|ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

function resolveImport(fromFile, spec, srcRoot) {
  let base;
  if (spec.startsWith("@/") && srcRoot) base = path.join(srcRoot, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  const cands = [base, base + ".js", base + ".jsx", base + ".mjs", base + ".ts", base + ".tsx",
    path.join(base, "index.js"), path.join(base, "index.jsx")];
  for (const c of cands) if (exists(c)) return c;
  return null;
}

function parseImports(src) {
  const map = {};
  const specs = [];
  // drop line comments and block comments so commented-out imports are ignored
  src = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const re = /import\s+(?:([\w$]+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = m[3]; specs.push(spec);
    if (m[1]) map[m[1]] = spec;
    if (m[2]) for (const part of m[2].split(",")) {
      const nm = part.trim().split(/\s+as\s+/).pop().trim();
      if (nm) map[nm] = spec;
    }
  }
  const re2 = /import\s*["']([^"']+)["']/g;
  while ((m = re2.exec(src))) specs.push(m[1]);
  return { map, specs };
}

function joinPath(a, b) {
  let s = (a + "/" + b).replace(/\/{2,}/g, "/");
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

// ---------------- BACKEND ----------------
const backendRoutes = [];
const visited = new Set();

function scanRouteFile(file, mountPrefix, depth = 0) {
  const key = file + "@" + mountPrefix;
  if (visited.has(key) || depth > 6) return;
  visited.add(key);
  if (!exists(file)) { backendRoutes.push({ method: "MISSING_FILE", full: mountPrefix, file: rel(file), line: 0, guards: [] }); return; }
  const src = read(file);
  const { map } = parseImports(src);

  const fileGuards = [];
  for (const m of src.matchAll(/\b[\w$]+\.use\(\s*([A-Za-z_$][\w$]*(?:\([^)]*\))?)\s*\)/g))
    if (!/^(express|cors|json|urlencoded)/.test(m[1])) fileGuards.push(m[1]);

  for (const m of src.matchAll(/\b([\w$]+)\.(get|post|put|patch|delete|all)\(\s*(["'`])([^"'`]*)\3\s*(,([^\n]*))?/g)) {
    const [, obj, method, , p, , rest] = m;
    if (!p.startsWith("/")) continue;
    if (/^(req|res|axios|fetch|db|pool|headers|map|cache|conn|connection)$/i.test(obj)) continue;
    backendRoutes.push({ method: method.toUpperCase(), full: joinPath(mountPrefix, p), file: rel(file), line: lineOf(src, m.index), guards: [...fileGuards, (rest || "").trim().slice(0, 140)] });
  }
  for (const m of src.matchAll(/\b([\w$]+)\.route\(\s*(["'`])([^"'`]*)\2\s*\)((?:\s*\.(?:get|post|put|patch|delete|all)\([\s\S]*?\))+)/g)) {
    for (const mm of m[4].matchAll(/\.(get|post|put|patch|delete|all)\(/g))
      backendRoutes.push({ method: mm[1].toUpperCase(), full: joinPath(mountPrefix, m[3]), file: rel(file), line: lineOf(src, m.index), guards: fileGuards });
  }
  for (const m of src.matchAll(/\b([\w$]+)\.use\(\s*(["'`])([^"'`]*)\2\s*,\s*([^)]*)\)/g)) {
    const p = m[3];
    const idents = [...m[4].matchAll(/[A-Za-z_$][\w$]*/g)].map(x => x[0]);
    const subs = idents.filter(v => map[v]);
    if (subs.length) {
      for (const v of subs) {
        const sub = resolveImport(file, map[v]);
        if (sub) scanRouteFile(sub, joinPath(mountPrefix, p), depth + 1);
        else backendRoutes.push({ method: "MISSING_SUBROUTER", full: joinPath(mountPrefix, p), file: rel(file), line: lineOf(src, m.index), guards: [] });
      }
    } else {
      backendRoutes.push({ method: "USE", full: joinPath(mountPrefix, p), file: rel(file), line: lineOf(src, m.index), guards: [m[4].trim().slice(0, 100)] });
    }
  }
}

const appFile = path.join(BACKEND, "app.js");
const appSrc = read(appFile);
const appImports = parseImports(appSrc).map;
const mounts = [];
for (const m of appSrc.matchAll(/app\.use\(\s*(["'`])([^"'`]*)\1\s*,\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
  const p = m[2], v = m[3];
  const spec = appImports[v];
  if (!spec) { mounts.push({ p, v, spec: null }); continue; }
  const f = resolveImport(appFile, spec);
  mounts.push({ p, v, spec, file: f && rel(f) });
  if (f) scanRouteFile(f, p);
  else backendRoutes.push({ method: "MISSING_FILE", full: p, file: spec, line: 0, guards: [] });
}
for (const dm of appSrc.matchAll(/import\(\s*["']([^"']+)["']\s*\)\.then\(\s*\w+\s*=>\s*app\.use\(\s*["']([^"']+)["']/g)) {
  const f = resolveImport(appFile, dm[1]);
  if (f) scanRouteFile(f, dm[2]);
}
for (const am of appSrc.matchAll(/app\.(get|post)\(\s*["']([^"']+)["']/g))
  backendRoutes.push({ method: am[1].toUpperCase(), full: am[2], file: "backend/app.js", line: lineOf(appSrc, am.index), guards: [] });
for (const sm of appSrc.matchAll(/app\.use\(\s*["']([^"']+)["']\s*,\s*express\.static/g))
  backendRoutes.push({ method: "USE", full: sm[1], file: "backend/app.js", line: lineOf(appSrc, sm.index), guards: ["static"] });

const esc = (s) => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
function routeRegex(full) {
  let s = esc(full);
  s = s.replace(/\/:[\w]+\\\?/g, "(?:/[^/]+)?").replace(/:[\w]+\\\?/g, "(?:[^/]+)?").replace(/:[\w]+/g, "[^/]+").replace(/\\\*|\*/g, ".*");
  return new RegExp("^" + s + "/?$");
}
const compiled = backendRoutes.filter(r => !r.method.startsWith("MISSING")).map(r => ({
  ...r,
  re: routeRegex(r.full),
  prefixRe: r.method === "USE" ? new RegExp("^" + esc(r.full).replace(/:[\w]+/g, "[^/]+") + "(/|$)") : null,
}));
// segment-wise match where frontend ":p" placeholders and backend ":param" are wildcards
function segMatch(routeFull, p) {
  const a = routeFull.split("/").filter(Boolean);
  const b = p.split("/").filter(Boolean);
  if (a.length !== b.length) {
    // allow backend optional trailing param  (/x/:id?)
    if (a.length === b.length + 1 && /^:[\w]+\?$/.test(a[a.length - 1])) a.pop(); else return false;
  }
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x === y) continue;
    if (x.startsWith(":") || x === "*" || y === ":p" || y.includes(":p")) continue;
    return false;
  }
  return true;
}
function matchBackend(method, p) {
  const dyn = p.includes(":p");
  return compiled.filter(r => {
    if (r.method === "USE") return r.prefixRe.test(p) || (dyn && p.startsWith(r.full + "/"));
    if (!(r.method === method || r.method === "ALL")) return false;
    return dyn ? segMatch(r.full, p) : r.re.test(p);
  });
}

// ---------------- FRONTEND ----------------
function readStringAt(src, i) {
  const q = src[i];
  if (q === '"' || q === "'") {
    let j = i + 1, out = "";
    while (j < src.length && src[j] !== q && src[j] !== "\n") { if (src[j] === "\\") j++; out += src[j]; j++; }
    return { str: out, end: j + 1, template: false };
  }
  if (q === "`") {
    let j = i + 1, out = "", depth = 0;
    while (j < src.length) {
      if (depth === 0 && src[j] === "`") break;
      if (depth === 0 && src[j] === "$" && src[j + 1] === "{") { depth = 1; j += 2; out += ":p"; continue; }
      if (depth > 0) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; continue; }
      if (src[j] === "\\") j++;
      out += src[j]; j++;
    }
    return { str: out, end: j + 1, template: true };
  }
  return null;
}

const CALLER_SKIP = /^(res|req|router|Router|app|localStorage|sessionStorage|searchParams|params|map|Map|headers|form|formData|url|URL|cache|store|db|window|document|console|e|err|error|response|data|result|set|list|arr|obj|Object|Array|String|Number|Math|JSON|Promise|Reflect|Symbol|Set|WeakMap|Date|Intl|element|el|ref|node|target|history|navigate|location|useSearchParams|sp|qs|query|q|u|s|t|i|j|k|x|y|socket|io|storage|cookies|Cookies)$/;

const frontendCalls = [];
const brokenImports = [];
const reachInfo = {};

for (const P of PORTALS) {
  const dir = path.join(ROOT, P.dir);
  if (!fs.existsSync(dir)) { reachInfo[P.name] = { missing: true }; continue; }
  const files = walk(dir);
  const entries = ["main.jsx", "main.js", "index.jsx", "index.js", "App.jsx"].map(e => path.join(dir, e)).filter(exists);
  const reach = new Set(); const stack = [...entries];
  while (stack.length) {
    const f = stack.pop(); if (reach.has(f)) continue; reach.add(f);
    const src = read(f);
    const { specs } = parseImports(src);
    const dyn = [...src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map(x => x[1]);
    for (const spec of [...specs, ...dyn]) {
      if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;
      const target = resolveImport(f, spec, dir);
      if (!target) {
        if (!/\.(css|scss|png|jpe?g|svg|gif|json|webp|ico|woff2?|mp3|mp4|pdf)$/i.test(spec)) {
          // asset without extension resolution? treat any missing non-asset as broken
          const assetGuess = [".css", ".scss", ".png", ".jpg", ".jpeg", ".svg", ".gif", ".json", ".webp"].some(ext => exists(path.resolve(path.dirname(f), spec) + ext));
          if (!assetGuess && !exists(path.resolve(path.dirname(f), spec))) brokenImports.push({ portal: P.name, file: rel(f), spec });
        }
        continue;
      }
      if (/\.(css|scss|json)$/i.test(target)) continue;
      stack.push(target);
    }
  }
  reachInfo[P.name] = { total: files.length, reachable: reach.size, unreachable: files.filter(f => !reach.has(f)).map(rel) };

  for (const f of files) {
    const src = read(f);
    let m;
    const re = /\b([\w$]+)\.(get|post|put|patch|delete)\(\s*(?=["'`])/g;
    while ((m = re.exec(src))) {
      if (CALLER_SKIP.test(m[1])) continue;
      const s = readStringAt(src, m.index + m[0].length);
      if (!s) continue;
      const raw = s.str;
      if (!(raw.startsWith("/") || raw.startsWith("http") || raw.startsWith(":p"))) continue;
      frontendCalls.push({ portal: P.name, file: rel(f), line: lineOf(src, m.index), method: m[2].toUpperCase(), caller: m[1], raw, template: s.template, reachable: reach.has(f) });
    }
    const rf = /\bfetch\(\s*(?=["'`])/g;
    while ((m = rf.exec(src))) {
      const s = readStringAt(src, m.index + m[0].length);
      if (!s) continue;
      const raw = s.str;
      if (!(raw.startsWith("/") || raw.startsWith("http") || raw.startsWith(":p"))) continue;
      const after = src.slice(s.end, s.end + 400);
      const mth = (after.match(/method\s*:\s*["'`](\w+)["'`]/) || [])[1] || "GET";
      frontendCalls.push({ portal: P.name, file: rel(f), line: lineOf(src, m.index), method: mth.toUpperCase(), caller: "fetch", raw, template: s.template, reachable: reach.has(f) });
    }
  }
}

function normalize(call, P) {
  let p = call.raw;
  const flags = [];
  // `${base}${path}` — fully dynamic, cannot be checked statically
  if (/^:p:p/.test(p) || p === ":p") return { p, flags: ["FULLY_DYNAMIC", "EXTERNAL"] };
  // trailing `${qs}` glued without a slash is a query-string suffix, not a path segment
  p = p.replace(/([^/]):p$/, "$1");
  if (/^https?:\/\//.test(p)) {
    flags.push("ABSOLUTE_URL");
    const host = p.match(/^https?:\/\/([^/]+)/)[1];
    flags.push("host=" + host);
    p = p.replace(/^https?:\/\/[^/]+/, "") || "/";
    if (!p.startsWith("/api")) return { p, flags: [...flags, "EXTERNAL"] };
    return { p: p.split("?")[0].replace(/\/$/, "") || "/", flags };
  }
  if (p.startsWith(":p")) {
    flags.push("DYNAMIC_BASE");
    p = p.replace(/^:p/, "");
    if (!p.startsWith("/")) p = "/" + p;
    p = p.split("?")[0].split("#")[0];
    if (p.startsWith("/api/") || p === "/api") return { p, flags };
    // `${BASE}/x` where BASE presumably ends with /api
    return { p: (P.apiPrefix || "/api") + p, flags };
  }
  p = p.split("?")[0].split("#")[0];
  const prefix = P.apiPrefix || "/api";
  if (call.caller === "fetch") {
    if (!p.startsWith("/api")) return { p, flags: ["FETCH_NON_API"] };
    return { p, flags: ["RAW_FETCH"] };
  }
  if (p.startsWith("/api/") || p === "/api") { flags.push("DOUBLE_API_PREFIX"); p = prefix + p; }
  else p = prefix + p;
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return { p, flags };
}

const portalByName = Object.fromEntries(PORTALS.map(P => [P.name, P]));
const results = frontendCalls.map(c => {
  const { p, flags } = normalize(c, portalByName[c.portal]);
  const hits = flags.includes("EXTERNAL") || flags.includes("FETCH_NON_API") ? [] : matchBackend(c.method, p);
  return { ...c, path: p, flags, matched: hits.length > 0, hits: hits.slice(0, 3).map(h => `${h.method} ${h.full} [${h.file}:${h.line}] guards=${(h.guards || []).filter(Boolean).join(" | ")}`) };
});

const skip = (r) => r.flags.includes("EXTERNAL") || r.flags.includes("FETCH_NON_API");
const unmatched = results.filter(r => !r.matched && !skip(r));
const dbl = results.filter(r => r.flags.includes("DOUBLE_API_PREFIX"));
const abs = results.filter(r => r.flags.includes("ABSOLUTE_URL"));

const fmt = (r) => `${r.portal} ${r.file}:${r.line} ${r.method} ${r.path}  raw=${r.raw}${r.flags.length ? " [" + r.flags.join(",") + "]" : ""}`;
const out = {
  summary: {
    backendRoutes: backendRoutes.length, mounts: mounts.length, frontendCalls: frontendCalls.length,
    unmatched: unmatched.length, unmatchedReachable: unmatched.filter(r => r.reachable).length,
    doubleApiPrefix: dbl.length, absoluteUrls: abs.length, brokenImports: brokenImports.length,
    missingRouteFiles: backendRoutes.filter(r => r.method.startsWith("MISSING")),
    mountsWithoutImport: mounts.filter(m => !m.spec).map(m => m.p + " <- " + m.v),
  },
  reachable: Object.fromEntries(Object.entries(reachInfo).map(([k, v]) => [k, v.missing ? "MISSING DIR" : { total: v.total, reachable: v.reachable, unreachable: v.unreachable.length }])),
  brokenImports,
  doubleApiPrefix: dbl.map(fmt),
  absoluteUrls: abs.map(r => fmt(r) + ` reach=${r.reachable}`),
  unmatchedReachable: unmatched.filter(r => r.reachable).map(fmt),
  unmatchedUnreachable: unmatched.filter(r => !r.reachable).map(fmt),
  unreachableFiles: Object.fromEntries(Object.entries(reachInfo).map(([k, v]) => [k, v.unreachable || []])),
  matchedReachable: results.filter(r => r.matched && r.reachable).map(r => ({ portal: r.portal, file: r.file, line: r.line, method: r.method, path: r.path, hits: r.hits })),
  backendRoutes: backendRoutes.map(r => `${r.method} ${r.full}  [${r.file}:${r.line}]`),
};
fs.writeFileSync(path.join(__dirname, "_xcheck-out.json"), JSON.stringify(out, null, 2));
const txt = [
  "SUMMARY " + JSON.stringify(out.summary, null, 1),
  "\n== REACHABILITY ==\n" + JSON.stringify(out.reachable, null, 1),
  "\n== BROKEN IMPORTS ==\n" + brokenImports.map(b => `${b.portal} ${b.file} -> ${b.spec}`).join("\n"),
  "\n== DOUBLE /api PREFIX ==\n" + out.doubleApiPrefix.join("\n"),
  "\n== ABSOLUTE URLS ==\n" + out.absoluteUrls.join("\n"),
  "\n== UNMATCHED (reachable) ==\n" + out.unmatchedReachable.join("\n"),
  "\n== UNMATCHED (unreachable / dead files) ==\n" + out.unmatchedUnreachable.join("\n"),
];
fs.writeFileSync(path.join(__dirname, "_xcheck-out.txt"), txt.join("\n"));
console.log(txt[0]);
