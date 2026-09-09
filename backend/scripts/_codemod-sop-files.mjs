// Codemod: surface HR-library SOP attachments (sop_version_files) in the Super Admin SOP page.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

function patch(file, edits) {
  const p = path.join(ROOT, file);
  let src = fs.readFileSync(p, "utf8");
  const crlf = /\r\n/.test(src);
  src = src.replace(/\r\n/g, "\n");
  for (const [from, to, expect = 1] of edits) {
    const n = src.split(from).length - 1;
    if (n !== expect) throw new Error(`${file}: expected ${expect} match(es) for ${JSON.stringify(from.slice(0, 60))}, found ${n}`);
    src = src.split(from).join(to);
  }
  fs.writeFileSync(p, crlf ? src.replace(/\n/g, "\r\n") : src);
  console.log("patched", file);
}

// ---------- backend: admin SOP controller ----------
patch("backend/modules/sop/sop.controller.js", [
  [
    `export const listSops = async (req, res) => {`,
    `// HR SOP library (/api/sops) stores multi-file attachments in sop_version_files.
// Attach them so Super Admin sees HR-uploaded files, not only sops.file_path.
const attachLibraryFiles = async (rows) => {
  if (!rows.length) return rows;
  const [files] = await db.query(
    \`SELECT id, sop_id, version, file_kind, file_name, file_size
     FROM sop_version_files WHERE sop_id IN (?)\`,
    [rows.map((r) => r.id)],
  );
  const byKey = {};
  for (const f of files) {
    (byKey[\`\${f.sop_id}:\${f.version}\`] ||= []).push({
      id: f.id,
      file_kind: f.file_kind,
      file_name: f.file_name,
      file_size: f.file_size,
      download_url: \`/api/sops/files/\${f.id}/download\`,
    });
  }
  return rows.map((r) => ({ ...r, files: byKey[\`\${r.id}:\${r.version ?? r.current_version}\`] || [] }));
};

export const listSops = async (req, res) => {`,
  ],
  [
    `    res.json({ sops: rows, activeEmployees: Number(total) });`,
    `    res.json({ sops: await attachLibraryFiles(rows), activeEmployees: Number(total) });`,
  ],
  [
    `      "SELECT * FROM sop_versions WHERE sop_id = ? ORDER BY version DESC",
      [req.params.id]
    );
    res.json(rows);`,
    `      "SELECT * FROM sop_versions WHERE sop_id = ? ORDER BY version DESC",
      [req.params.id]
    );
    // versions created via the HR library have no sop_versions row; synthesise them from files
    const [libFiles] = await db.query(
      "SELECT DISTINCT version FROM sop_version_files WHERE sop_id = ? ORDER BY version DESC",
      [req.params.id]
    );
    const known = new Set(rows.map((r) => r.version));
    for (const { version } of libFiles)
      if (!known.has(version)) rows.push({ sop_id: Number(req.params.id), version, file_path: null, change_note: "HR library upload", uploaded_by: "HR" });
    rows.sort((a, b) => b.version - a.version);
    res.json(await attachLibraryFiles(rows.map((r) => ({ ...r, id: r.sop_id }))));`,
  ],
]);

// ---------- admin UI ----------
patch("admin/src/pages/sop/SopManagement.jsx", [
  [
    `                        {s.file_path && (
                          <a
                            href={fileUrl(s.file_path)}`,
    `                        {(s.files || []).map((f) => (
                          <a
                            key={f.id}
                            href={\`\${BASE_URL}/sops/files/\${f.id}/download\`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                            title={\`\${f.file_kind}: \${f.file_name}\`}
                          >
                            <Download size={14} />
                          </a>
                        ))}
                        {s.file_path && (
                          <a
                            href={fileUrl(s.file_path)}`,
  ],
]);
console.log("done");
