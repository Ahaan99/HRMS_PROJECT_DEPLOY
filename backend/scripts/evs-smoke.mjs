// Quick local smoke test: admin login -> SSO URL -> EVS sso-login -> EVS status
// Run: node scripts/evs-smoke.mjs   (backend must be running on :5000)
const B = "http://localhost:5000/api";
const j = async (u, o) => {
  const r = await fetch(u, o);
  let d;
  try { d = await r.json(); } catch { d = await r.text(); }
  return { s: r.status, d };
};

const email = process.env.SMOKE_EMAIL || "admin@hrms.com";
const passwords = (process.env.SMOKE_PASS || "123,admin123,Admin@123").split(",");

let tok = null;
let workingPassword = passwords[0];
for (const p of passwords) {
  const r = await j(`${B}/super-admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: p }),
  });
  if (r.s === 200) {
    tok = r.d.token || r.d.accessToken || r.d.data?.token || r.d.access_token;
    workingPassword = p;
    console.log("admin login OK:", email, "/", p);
    break;
  }
  console.log("admin login", p, "->", r.s, JSON.stringify(r.d).slice(0, 120));
}
if (!tok) { console.log("ADMIN LOGIN FAILED"); process.exit(1); }

const sso = await j(`${B}/super-admin/evs/sso-url`, { headers: { authorization: `Bearer ${tok}` } });
console.log("sso-url:", sso.s, sso.d.url);

const q = new URL(sso.d.url).searchParams;
const s2 = await j(`${B}/evs/sso-login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: q.get("email"), ts: q.get("ts"), sig: q.get("sig"), name: q.get("name") }),
});
console.log("evs sso-login:", s2.s, s2.d.role, s2.d.name, s2.d.detail || "");

const fd = new FormData();
fd.append("username", email);
fd.append("password", workingPassword);
const l = await j(`${B}/evs/login`, { method: "POST", body: fd });
console.log("evs /login (form):", l.s, l.d.role || l.d.detail);

const st = await j(`${B}/evs/verification-status`, { headers: { authorization: `Bearer ${tok}` } });
console.log("verification-status:", st.s, JSON.stringify(st.d.summary));
const hs = await j(`${B}/evs/hrms-status`, { headers: { authorization: `Bearer ${tok}` } });
console.log("hrms-status:", hs.s, JSON.stringify(hs.d));
