const BASE = "http://localhost:5000";
const r = await fetch(BASE + "/api/super-admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "admin@hrms.com", password: "admin123" }) });
const { token } = await r.json();
const h = { authorization: `Bearer ${token}` };
const list = await (await fetch(BASE + "/api/sop", { headers: h })).json();
const sops = list.sops || [];
const withFiles = sops.filter((s) => (s.files || []).length);
console.log(`sops=${sops.length} allHaveFilesArray=${sops.every((s) => Array.isArray(s.files))} withLibraryFiles=${withFiles.length}`);
if (sops[0]) {
  const v = await fetch(BASE + `/api/sop/${(withFiles[0] || sops[0]).id}/versions`, { headers: h });
  const rows = await v.json();
  console.log(`versions status=${v.status} rows=${Array.isArray(rows) ? rows.length : "?"} filesArrays=${Array.isArray(rows) && rows.every((x) => Array.isArray(x.files))}`);
  if (withFiles[0]) { const f = withFiles[0].files[0]; const d = await fetch(BASE + f.download_url, { headers: h, redirect: "manual" }); console.log(`download ${f.download_url} -> ${d.status}`); }
}
