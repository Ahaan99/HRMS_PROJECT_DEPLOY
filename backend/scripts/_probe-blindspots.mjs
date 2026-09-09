import fs from "fs";
import path from "path";
const ROOT = path.resolve(process.cwd(), "..");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name === "node_modules" || e.name === "dist" ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : /\.(jsx?|tsx?)$/.test(e.name) ? [path.join(d, e.name)] : []);
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

console.log("== 1. write calls outside the shared api client (raw fetch/axios/socket) ==");
for (const portal of ["HR", "client", "employee", "IT", "Sales", "employee-verification-system/frontend/frontend"]) {
  for (const f of walk(path.join(ROOT, portal, "src"))) {
    if (/\/(services|lib|utils|api)\/(api|http|client|axios)[^/]*\.js$/.test(rel(f))) continue;
    const src = fs.readFileSync(f, "utf8");
    const lines = src.split(/\r?\n/);
    lines.forEach((l, i) => {
      if (/\bfetch\(/.test(l) || /axios\.(post|put|patch|delete)\(/.test(l) || /socket\.emit\(|\bio\(/.test(l) || /new WebSocket\(/.test(l) || /navigator\.sendBeacon/.test(l)) {
        const ctx = lines.slice(i, i + 6).join(" ");
        if (/method\s*:\s*["'`](POST|PUT|PATCH|DELETE)/i.test(ctx) || /axios\.(post|put|patch|delete)/.test(l) || /emit\(|WebSocket|sendBeacon/.test(l))
          console.log(`  ${rel(f)}:${i + 1}  ${l.trim().slice(0, 120)}`);
      }
    });
  }
}

console.log("\n== 2. employee OtpAttendance dynamic base ==");
const otp = fs.readFileSync(path.join(ROOT, "employee/src/pages/attendance/OtpAttendance.jsx"), "utf8");
for (const m of otp.matchAll(/^.*(API_BASE|BASE_URL|baseURL|const\s+\w*base\w*\s*=).*$/gim)) console.log("  ", m[0].trim().slice(0, 160));
console.log("  backend routes mentioning otp/send, otp/verify, check-out, my-status:");
for (const f of walk(path.join(ROOT, "backend/modules")).concat(walk(path.join(ROOT, "backend/routes")).filter(() => true)))
  if (/routes\.js$/.test(f)) { const s = fs.readFileSync(f, "utf8"); for (const m of s.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']*(otp\/send|otp\/verify|check-out|my-status|my-history)[^"']*)["']/g)) console.log(`    ${rel(f)}  ${m[1].toUpperCase()} ${m[2]}`); }
console.log("  app.js mounts containing 'attendance' or 'otp':");
for (const m of fs.readFileSync(path.join(ROOT, "backend/app.js"), "utf8").matchAll(/app\.use\(\s*["']([^"']*(attendance|otp)[^"']*)["']\s*,\s*(\w+)/gi)) console.log(`    ${m[1]} -> ${m[3]}`);

console.log("\n== 3. tables written by the OTP attendance controller(s) ==");
for (const f of walk(path.join(ROOT, "backend/modules"))) {
  if (!/(otp|attendance)/i.test(rel(f)) || !/controller|service/i.test(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  const w = new Set(); for (const m of s.matchAll(/\b(?:INSERT\s+(?:IGNORE\s+)?INTO|UPDATE|DELETE\s+FROM)\s+`?([a-zA-Z_]\w*)`?/gi)) if (!/^(set|values)$/i.test(m[1])) w.add(m[1]);
  if (w.size) console.log(`  ${rel(f)}: ${[...w].join(", ")}`);
}

console.log("\n== 4. client field-sales DELETE route ==");
for (const f of walk(path.join(ROOT, "backend/modules"))) if (/field/i.test(rel(f)) && /routes\.js$/.test(f)) { const s = fs.readFileSync(f, "utf8"); for (const m of s.matchAll(/router\.(get|post|put|patch|delete)\(\s*["']([^"']+)["']/g)) console.log(`  ${rel(f)}  ${m[1].toUpperCase()} ${m[2]}`); }
console.log("  client fieldSalesService usage of remove:");
for (const f of walk(path.join(ROOT, "client/src"))) { const s = fs.readFileSync(f, "utf8"); if (/fieldSalesService|deleteFieldSale|removeLead|deleteLead/.test(s) && !/fieldSalesService\.js$/.test(f)) for (const m of s.matchAll(/fieldSalesService\.(\w+)\(/g)) console.log(`    ${rel(f)} -> ${m[1]}`); }
