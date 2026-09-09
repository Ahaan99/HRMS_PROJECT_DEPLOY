// _xcheck-nav.mjs — per portal: collect <Route path> (composing nested routes) and every
// internal link target (to=, navigate(), <Navigate to>, path:/to: in menu configs, href="/...").
// Reports link targets with no matching route.  Output: scripts/_xcheck-nav-out.txt
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const PORTALS = ["admin", "HR", "client", "employee", "IT", "Sales"];

const read = (p) => fs.readFileSync(p, "utf8");
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist"].includes(e.name) || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

function join(a, b) {
  if (!b) return a || "/";
  if (b.startsWith("/")) return b.replace(/\/+$/, "") || "/";
  const s = ((a === "/" ? "" : a) + "/" + b).replace(/\/{2,}/g, "/");
  return s.replace(/\/+$/, "") || "/";
}

// Parse <Route ...> tags sequentially, tracking nesting.
// Find the end of a <Route ...> opening tag, honouring {…} (which may contain JSX) and quotes.
function scanTag(s, start) {
  let i = start, depth = 0, q = null;
  while (i < s.length) {
    const c = s[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; }
    else if (c === '"' || c === "'" || c === "`") q = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
    i++;
  }
  return -1;
}
function collectRoutes(src, file, routes) {
  const s = strip(src);
  const tagRe = /<Route\b|<\/Route>/g;
  const stack = [];
  let m;
  while ((m = tagRe.exec(s))) {
    if (m[0] === "</Route>") { stack.pop(); continue; }
    const end = scanTag(s, m.index + m[0].length);
    if (end < 0) break;
    const attrs = s.slice(m.index + m[0].length, end);
    const selfClosing = /\/\s*$/.test(attrs);
    tagRe.lastIndex = end + 1;
    const pm = attrs.match(/\bpath\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/);
    const index = /\bindex\b/.test(attrs);
    const parent = stack.length ? stack[stack.length - 1] : "/";
    let full = parent;
    if (pm) full = join(parent, pm[1] ?? pm[2] ?? pm[3]);
    if (pm || index) routes.push({ full, file: rel(file), line: s.slice(0, m.index).split("\n").length });
    if (!selfClosing) stack.push(full);
  }
}

function collectLinks(src, file, links) {
  const s = strip(src);
  const push = (raw, idx, kind) => {
    let t = raw.trim();
    if (!t.startsWith("/")) return;               // relative / external / dynamic-only
    if (/^\/\//.test(t)) return;
    t = t.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    if (t.startsWith("/api") || t.startsWith("/uploads")) return; // API/static, not routes
    if (/\.(png|jpe?g|svg|pdf|webp|ico|json|css|js)$/i.test(t)) return;
    links.push({ target: t, file: rel(file), line: s.slice(0, idx).split("\n").length, kind });
  };
  const tpl = (str) => str.replace(/\$\{[^}]*\}/g, ":p");
  for (const m of s.matchAll(/\bto\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*\}|\{\s*`([^`]*)`\s*\})/g))
    push(tpl(m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? ""), m.index, "to=");
  for (const m of s.matchAll(/\bnavigate\(\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g))
    push(tpl(m[1] ?? m[2] ?? m[3] ?? ""), m.index, "navigate()");
  for (const m of s.matchAll(/\b(?:path|to|route|link|href)\s*:\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g))
    push(tpl(m[1] ?? m[2] ?? m[3] ?? ""), m.index, "menu");
  for (const m of s.matchAll(/\bhref\s*=\s*(?:"(\/[^"]*)"|'(\/[^']*)')/g))
    push(m[1] ?? m[2] ?? "", m.index, "href");
  for (const m of s.matchAll(/window\.location\.(?:href|assign|replace)\s*[=(]\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g))
    push(tpl(m[1] ?? m[2] ?? m[3] ?? ""), m.index, "location");
}

function routeMatches(routeFull, target) {
  if (routeFull === "*" || routeFull.endsWith("/*")) {
    const base = routeFull.replace(/\/?\*$/, "");
    return target === base || target.startsWith(base + "/") || base === "";
  }
  const a = routeFull.split("/").filter(Boolean), b = target.split("/").filter(Boolean);
  if (a.length !== b.length) {
    if (a.length === b.length + 1 && /\?$/.test(a[a.length - 1])) a.pop(); else return false;
  }
  return a.every((seg, i) => seg === b[i] || seg.startsWith(":") || b[i] === ":p");
}

const report = [];
for (const P of PORTALS) {
  const dir = path.join(ROOT, P, "src");
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir);
  const routes = [], links = [];
  for (const f of files) { const src = read(f); collectRoutes(src, f, routes); collectLinks(src, f, links); }
  const routeSet = [...new Set(routes.map(r => r.full))];
  const bad = [];
  for (const l of links) if (!routeSet.some(r => routeMatches(r, l.target))) bad.push(l);
  // de-dupe by target
  const byTarget = new Map();
  for (const b of bad) { if (!byTarget.has(b.target)) byTarget.set(b.target, []); byTarget.get(b.target).push(`${b.file}:${b.line} (${b.kind})`); }
  report.push(`\n=== ${P}: ${routeSet.length} routes, ${links.length} links, ${byTarget.size} unmatched targets ===`);
  for (const [t, where] of byTarget) report.push(`  ${t}\n      ${where.slice(0, 4).join("\n      ")}${where.length > 4 ? `\n      ... +${where.length - 4} more` : ""}`);
  report.push(`  routes: ${routeSet.sort().join("  ")}`);
}
const txt = report.join("\n");
fs.writeFileSync(path.join(__dirname, "_xcheck-nav-out.txt"), txt);
console.log(txt);
