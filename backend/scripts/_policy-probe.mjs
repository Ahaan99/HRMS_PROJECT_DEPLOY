import fs from "node:fs";
const base = "http://localhost:5000/api";
const out = {};
try {
  const login = await fetch(`${base}/it/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "dummy.itdev@test.local", password: "Test@1234" }),
  });
  out.loginStatus = login.status;
  const lj = await login.json().catch(() => ({}));
  const token = lj.token || lj.data?.token;
  out.hasToken = !!token;
  const h = { authorization: `Bearer ${token}` };
  const g = await fetch(`${base}/hr/work-policies`, { headers: h });
  out.getStatus = g.status;
  out.getBody = (await g.text()).slice(0, 600);
  const o = await fetch(`${base}/hr/work-policies`, {
    method: "OPTIONS",
    headers: { origin: "http://localhost:5177", "access-control-request-method": "GET", "access-control-request-headers": "authorization" },
  });
  out.optionsStatus = o.status;
  out.acao = o.headers.get("access-control-allow-origin");
} catch (e) {
  out.error = String(e);
}
fs.writeFileSync(new URL("./_policy_probe.json", import.meta.url), JSON.stringify(out, null, 2));
