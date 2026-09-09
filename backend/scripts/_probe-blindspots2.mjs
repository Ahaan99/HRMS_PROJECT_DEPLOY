import fs from "fs";
import path from "path";
const ROOT = path.resolve(process.cwd(), "..");
const X = JSON.parse(fs.readFileSync("scripts/_xcheck-out.json", "utf8"));
const D = JSON.parse(fs.readFileSync("scripts/_xcheck-dataflow-out.json", "utf8"));
const M = X.matchedReachable;

console.log("== 1. are raw-axios writes captured by the matcher? ==");
for (const [portal, file, method, frag] of [
  ["client", "AddExpenseModal", "POST", "/client/expenses"], ["client", "AddEditSaleModal", "POST", "/client/sales-report"],
  ["client", "CreateInvoice", "POST", "/client/invoices"], ["client", "Payroll", "DELETE", "/client/payroll"],
  ["Sales", "AddEditCallModal", "POST", "/sales/calls"], ["Sales", "CreateInvoice", "POST", "/sales/invoices"],
  ["HR", "AddInterviewModal", "POST", "/hr/interviews"], ["HR", "NewJoining", "POST", "/hr/joining/create"],
  ["HR", "AutomatedAttendance", "POST", "/hr/attendance/shift-timings"], ["IT", "NewJoining", "POST", "/hr/joining/create"],
  ["HR", "WebFormsInbox", "PATCH", "/webforms"], ["employee", "EmergencyButton", "POST", "/emergency"],
]) {
  const hit = M.find((c) => c.portal === portal && c.file.includes(file) && c.method === method && c.path.includes(frag));
  console.log(`  ${hit ? "OK  " : "MISS"} ${portal}/${file} ${method} ${frag}${hit ? "  -> " + hit.hits[0].split(" [")[0] : ""}`);
}

console.log("\n== 2. OTP/smart attendance tables -> admin reads ==");
for (const t of ["attendance_records", "attendance_corrections", "attendance_users", "attendance_employees", "attendance_settings", "super_admin_attendance", "office_locations", "shift_timings"]) {
  const r = D.rows.find((r) => r.table === t);
  console.log(`  ${t.padEnd(24)} ${r ? r.status + " | writers=" + Object.keys(r.writtenBy).join(",") + " | admin=" + r.adminReads.slice(0, 2).map((a) => a.split(" <- ")[0]).join(";") : "NOT IN ROWS (writer unmatched)"}`);
}
console.log("  admin GET calls hitting /api/smart-attendance or attendance controller:");
for (const c of M.filter((c) => c.portal === "admin" && c.method === "GET" && /attendance/i.test(c.path))) console.log(`    ${c.file.replace("admin/src/", "")}  GET ${c.path}`);
console.log("  which portals use /api/smart-attendance (OtpAttendance) at all?");
for (const portal of ["employee", "HR", "IT", "Sales", "client"]) {
  const dir = path.join(ROOT, portal, "src");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(d, e.name)] : []);
  for (const f of walk(dir)) { const s = fs.readFileSync(f, "utf8"); if (/smart-attendance|OtpAttendance/.test(s)) console.log(`    ${path.relative(ROOT, f).replace(/\\/g, "/")}`); }
}
const otp = fs.readFileSync(path.join(ROOT, "employee/src/pages/attendance/OtpAttendance.jsx"), "utf8");
console.log("  OtpAttendance base lines:", otp.split(/\r?\n/).filter((l) => /smart-attendance|VITE_|const\s+\w*(BASE|API)\w*\s*=/.test(l)).map((l) => l.trim().slice(0, 140)).join("\n    "));
console.log("  is OtpAttendance routed?", fs.readFileSync(path.join(ROOT, "employee/src/routes/AppRoutes.jsx"), "utf8").includes("OtpAttendance"));

console.log("\n== 3. client field-sales DELETE ==");
const svc = fs.readFileSync(path.join(ROOT, "client/src/services/fieldSalesService.js"), "utf8");
console.log(svc.split(/\r?\n/).map((l, i) => `${i + 1}: ${l}`).join("\n"));
const fnNames = [...svc.matchAll(/export\s+(?:const|function)\s+(\w+)|^\s*(\w+)\s*[:(]/gm)].map((m) => m[1] || m[2]).filter(Boolean);
console.log("  callers:");
const walk2 = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk2(path.join(d, e.name)) : /\.jsx?$/.test(e.name) ? [path.join(d, e.name)] : []);
for (const f of walk2(path.join(ROOT, "client/src"))) { if (f.endsWith("fieldSalesService.js")) continue; const s = fs.readFileSync(f, "utf8"); for (const n of new Set(fnNames)) if (n.length > 3 && new RegExp(`\\b${n}\\s*\\(`).test(s) && /fieldSales/i.test(s)) console.log(`    ${path.relative(ROOT, f).replace(/\\/g, "/")} -> ${n}()`); }
console.log("  backend fieldSales.routes.js:");
console.log(fs.readFileSync(path.join(ROOT, "backend/modules/sales/fieldSales/fieldSales.routes.js"), "utf8"));
