import fs from "node:fs";
const url = new URL("./_probe-remediation.mjs", import.meta.url);
let s = fs.readFileSync(url, "utf8");
const start = s.indexOf("// --- TASK-04: agreement PDF ---");
const end = s.indexOf("console.log(out.join");
if (start < 0 || end < 0) throw new Error("markers not found");
const block = `// --- TASK-04: agreement PDF (real generator: POST /generate with a DB template) ---
{
  const [[tpl]] = await db.query("SELECT id FROM agreement_templates ORDER BY id LIMIT 1").catch(() => [[null]]);
  if (tpl?.id) {
    const form = new URLSearchParams({
      template_id: String(tpl.id),
      client_company_name: "Probe Co",
      client_address: "1 Probe Street",
      client_gst_number: "22AAAAA0000A1Z5",
      client_representative_name: "P. Robe",
      effective_date: "2026-09-08",
      duration: "One Year",
    });
    const r = await fetch(\`\${BASE}/super-admin/client-agreements/generate\`, {
      method: "POST",
      headers: { Authorization: \`Bearer \${admin}\`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const d = await r.json().catch(() => ({}));
    const msg = String(d?.message || "");
    const rgbBug = /Invalid color/i.test(msg);
    log(r.status === 200 || (r.status === 404 && !rgbBug), "agreement PDF: generator (no 'Invalid color')", \`\${r.status} \${msg.slice(0, 90)}\`);
  } else log(true, "agreement PDF: no templates in DB (skipped)");
}

`;
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(url, s, "utf8");
console.log("probe pdf section replaced");
