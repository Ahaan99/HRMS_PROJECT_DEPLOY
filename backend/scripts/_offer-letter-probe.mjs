// Probe TASK-15: template CRUD, preview compile, PDF from template. Writes _offer-letter-probe-out.txt
import fs from "node:fs";
const B = "http://localhost:5000/api";
const out = [];
const log = (ok, msg) => out.push(`${ok ? "PASS" : "FAIL"} ${msg}`);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 30; i++) {
  try { await fetch(`${B}/super-admin/offer-letter/test`); break; } catch { await wait(1000); }
}

const login = await fetch(`${B}/super-admin/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "admin@hrms.com", password: "admin123" }) }).then((r) => r.json());
const token = login.token || login.data?.token || login.accessToken;
log(Boolean(token), "admin login");
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };

const tpls = await fetch(`${B}/super-admin/offer-letter/templates`, { headers: H }).then((r) => r.json());
log(tpls.success && Array.isArray(tpls.meta?.placeholders) && tpls.meta.placeholders.length >= 15, `templates list + meta (${tpls.meta?.placeholders?.length} placeholders)`);
log(typeof tpls.meta?.defaultBody === "string" && tpls.meta.defaultBody.includes("{{ctc_table}}"), "default body exposed");

const body = `Dear {{candidate_name}},

## Welcome aboard
We are pleased to offer you the role of {{position}} ({{grade}}) at {{company}}, {{location}}, starting {{joining_date}}.

- Reporting to: Head of {{department}}
- Probation: {{probation_months}} months
- Offer valid for {{offer_validity_days}} days

{{terms}}

Regards, {{hr_name}}`;

const create = await fetch(`${B}/super-admin/offer-letter/templates`, { method: "POST", headers: H, body: JSON.stringify({ templateName: "QA-0908 Probe", companyName: "Probe Corp", hrName: "Probe HR", location: "Pune, India", terms: "Laptop provided.", body, includeCtc: false }) }).then((r) => r.json());
const id = create.data?.id;
log(create.success && id, `create template id=${id}`);

const sample = { candidateName: "Test Candidate", candidateEmail: "t@x.io", position: "Senior Engineer", department: "Platform", salary: 100000, joiningDate: "2026-10-01" };

let pv = await fetch(`${B}/super-admin/offer-letter/preview`, { method: "POST", headers: H, body: JSON.stringify({ ...sample, templateId: id }) }).then((r) => r.json());
let blocks = pv.data?.blocks || [];
const types = blocks.map((b) => b.type);
log(pv.success, "preview ok");
log(types.includes("heading") && types.includes("bullets") && types.includes("terms"), `block types ${JSON.stringify(types)}`);
log(!types.includes("ctc_table"), "ctc_table omitted when include_ctc=0");
const text = JSON.stringify(blocks);
log(text.includes("Test Candidate") && text.includes("Senior grade") === false && text.includes("(Senior)"), "placeholders substituted (name, grade)");
log(text.includes("1 October 2026"), "joining_date formatted");
log(text.includes("Laptop provided."), "template extra terms appended");
log(pv.data.letterhead.company === "Probe Corp" && pv.data.letterhead.hrName === "Probe HR", "template letterhead used");
log(!text.includes("{{"), "no unresolved placeholders");

// ctc toggle on + unknown placeholder detection
pv = await fetch(`${B}/super-admin/offer-letter/preview`, { method: "POST", headers: H, body: JSON.stringify({ ...sample, body: "Hi {{candidate_name}} {{nope}}", includeCtc: true }) }).then((r) => r.json());
log(pv.data.blocks.some((b) => b.type === "ctc_table") && pv.data.blocks.some((b) => b.type === "terms"), "ctc_table + terms auto-appended when body omits them");
log(pv.data.unknownPlaceholders?.includes("nope"), "unknown placeholder reported");
log(pv.data.blocks.find((b) => b.type === "ctc_table").rows.at(-1)[1] === "12,00,000", "annual CTC = 12 x monthly (en-IN)");

// update
const upd = await fetch(`${B}/super-admin/offer-letter/templates/${id}`, { method: "PUT", headers: H, body: JSON.stringify({ templateName: "QA-0908 Probe v2", companyName: "Probe Corp", body: "Hello {{candidate_name}}", includeCtc: true }) }).then((r) => r.json());
log(upd.success, "update template");
const after = await fetch(`${B}/super-admin/offer-letter/templates`, { headers: H }).then((r) => r.json());
const row = after.data.find((t) => t.id === id);
log(row?.template_name === "QA-0908 Probe v2" && row?.include_ctc === 1 && row?.body === "Hello {{candidate_name}}", "update persisted");

// PDF from template
const pdf = await fetch(`${B}/super-admin/offer-letter/generate`, { method: "POST", headers: H, body: JSON.stringify({ ...sample, templateId: id }) });
const buf = Buffer.from(await pdf.arrayBuffer());
log(pdf.status === 200 && pdf.headers.get("content-type") === "application/pdf" && buf.subarray(0, 4).toString() === "%PDF" && buf.length > 3000, `pdf ${pdf.status} ${buf.length} bytes`);
fs.writeFileSync(new URL("./_offer-letter-probe.pdf", import.meta.url), buf);

// long body -> multi-page
const long = Array.from({ length: 40 }, (_, i) => `Paragraph ${i + 1}: {{company}} values {{candidate_name}} and this line is intentionally long enough to wrap across the content width of the A4 page several times over.`).join("\n\n");
const pdf2 = await fetch(`${B}/super-admin/offer-letter/generate`, { method: "POST", headers: H, body: JSON.stringify({ ...sample, body: long }) });
const buf2 = Buffer.from(await pdf2.arrayBuffer());
const pages = (buf2.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
log(pdf2.status === 200 && pages >= 2, `long body paginates (${pages} pages)`);

// validation
const bad = await fetch(`${B}/super-admin/offer-letter/preview`, { method: "POST", headers: H, body: JSON.stringify({ position: "x" }) });
log(bad.status === 400, "preview 400 on missing fields");
const badT = await fetch(`${B}/super-admin/offer-letter/templates`, { method: "POST", headers: H, body: JSON.stringify({ templateName: "" }) });
log(badT.status === 400, "template 400 on missing name");

// cleanup
const letters = await fetch(`${B}/super-admin/offer-letter`, { headers: H }).then((r) => r.json());
for (const l of letters.data.filter((l) => l.candidate_name === "Test Candidate")) await fetch(`${B}/super-admin/offer-letter/${l.id}`, { method: "DELETE", headers: H });
const del = await fetch(`${B}/super-admin/offer-letter/templates/${id}`, { method: "DELETE", headers: H }).then((r) => r.json());
log(del.success, "cleanup");

const fails = out.filter((l) => l.startsWith("FAIL")).length;
out.push(`\n${out.length - fails}/${out.length} passed`);
fs.writeFileSync(new URL("./_offer-letter-probe-out.txt", import.meta.url), out.join("\n"));
console.log(out.join("\n"));
