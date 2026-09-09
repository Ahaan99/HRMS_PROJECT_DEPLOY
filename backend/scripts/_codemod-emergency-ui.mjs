import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function edit(rel, ops) {
  const p = path.join(ROOT, rel);
  const raw = fs.readFileSync(p, "utf8");
  const crlf = raw.includes("\r\n");
  let s = raw.replace(/\r\n/g, "\n");
  for (const [find, repl, count = 1] of ops) {
    const n = s.split(find).length - 1;
    if (n !== count) throw new Error(`${rel}: expected ${count} match(es) of ${JSON.stringify(find.slice(0, 70))}, found ${n}`);
    s = s.split(find).join(repl);
  }
  fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s);
  console.log("ok", rel);
}

edit("admin/src/routes/AppRoutes.jsx", [
  ['import Security from "../pages/dashboard/Security";', 'import Security from "../pages/dashboard/Security";\nimport EmergencyAlerts from "../pages/dashboard/EmergencyAlerts";'],
  ['<Route path="/dashboard/security" element={<Security />} />', '<Route path="/dashboard/security" element={<Security />} />\n        <Route path="/dashboard/emergency" element={<EmergencyAlerts />} />'],
]);

edit("admin/src/components/layout/Sidebar.jsx", [
  [
    `          // {
          //   to: "/dashboard/security",
          //   label: "Secure & Reliable",
          //   icon: <ShieldCheck size={18} />,
          // },`,
    `          {
            key: "security",
            to: "/dashboard/security",
            label: "Security & Sessions",
            icon: <ShieldCheck size={18} />,
          },
          {
            key: "emergency",
            to: "/dashboard/emergency",
            label: "Emergency Alerts",
            icon: <AlertCircle size={18} />,
          },`,
  ],
]);

edit("HR/src/pages/dashboard/HRDashboard.jsx", [
  ['import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\nimport EmergencyAlertsPanel from "../../components/common/EmergencyAlertsPanel";'],
  ['      {/* ── MAIN CARDS ────────────────────────────────────────── */}\n      <main', '      <EmergencyAlertsPanel />\n\n      {/* ── MAIN CARDS ────────────────────────────────────────── */}\n      <main'],
]);
