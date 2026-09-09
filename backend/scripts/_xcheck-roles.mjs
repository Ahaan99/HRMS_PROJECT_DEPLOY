// _xcheck-roles.mjs — post-process _xcheck-out.json: flag reachable frontend calls whose
// matched backend routes are guarded by protect([...]) lists that exclude the portal's JWT role.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "_xcheck-out.json"), "utf8"));

const PORTAL_ROLES = {
  admin: ["SUPER_ADMIN", "MANAGER", "TL"],
  HR: ["hr"],
  IT: ["it"],
  Sales: ["sales"],
  employee: ["EMPLOYEE"],
  client: ["client_admin", "CLIENT_EMPLOYEE"],
  EVS: ["SUPER_ADMIN", "hr", "client_admin"],
};

function rolesFromGuard(text) {
  const lists = [...text.matchAll(/protect\(\s*\[([^\]]*)\]/g)].map(m =>
    [...m[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map(x => x[1]));
  if (!lists.length) return null; // no explicit role list on this route
  if (lists.some(l => l.length === 0)) return null; // protect([]) = any authenticated role
  // every protect([...]) in the chain must pass → intersection
  return lists.reduce((acc, l) => acc.filter(r => l.includes(r)));
}

const problems = [];
const byRoute = new Map();
for (const c of data.matchedReachable) {
  const mine = PORTAL_ROLES[c.portal] || [];
  const verdicts = c.hits.map(h => {
    const allowed = rolesFromGuard(h);
    if (allowed === null) return { h, ok: true, allowed: null };
    return { h, ok: mine.some(r => allowed.includes(r)), allowed };
  });
  if (verdicts.length && verdicts.every(v => !v.ok)) {
    const key = `${c.portal} ${c.method} ${c.path}`;
    if (!byRoute.has(key)) byRoute.set(key, { key, callers: [], allowed: verdicts[0].allowed, hit: verdicts[0].h });
    byRoute.get(key).callers.push(`${c.file}:${c.line}`);
  }
}
for (const v of byRoute.values()) problems.push(v);

const txt = problems.map(p => `${p.key}\n   allowed=[${p.allowed.join(",")}]  route=${p.hit.split(" guards=")[0]}\n   callers: ${p.callers.join(", ")}`).join("\n\n") || "(no role mismatches)";
fs.writeFileSync(path.join(__dirname, "_xcheck-roles-out.txt"), txt);
console.log(`ROLE MISMATCHES: ${problems.length}\n\n` + txt);
