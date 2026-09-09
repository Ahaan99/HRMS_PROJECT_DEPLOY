import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS sops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      department VARCHAR(100) NOT NULL,
      category ENUM('Internal','Client') DEFAULT 'Internal',
      description TEXT NULL,
      current_version INT DEFAULT 1,
      requires_ack TINYINT(1) DEFAULT 1,
      is_active TINYINT(1) DEFAULT 1,
      created_by VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS sop_versions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sop_id INT NOT NULL,
      version INT NOT NULL,
      file_path VARCHAR(255) NULL,
      change_note VARCHAR(255) NULL,
      uploaded_by VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS sop_acknowledgements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sop_id INT NOT NULL,
      version INT NOT NULL,
      employee_id INT NOT NULL,
      ack_type ENUM('Read','Training Completed') DEFAULT 'Read',
      acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_sop_emp_ver (sop_id, employee_id, version, ack_type)
    )
  `);
};
ensureTables().catch((e) => console.error("sop schema error:", e.message));

/* ------------------------------------------------------------------ */
/* Admin: CRUD + versions                                              */
/* ------------------------------------------------------------------ */
export const createSop = async (req, res) => {
  try {
    const { title, department, category, description, requires_ack } = req.body;
    if (!title || !department)
      return res.status(400).json({ success: false, message: "title and department required" });

    const [r] = await db.query(
      `INSERT INTO sops (title, department, category, description, requires_ack, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        department,
        category === "Client" ? "Client" : "Internal",
        description || null,
        requires_ack === false || requires_ack === "false" ? 0 : 1,
        req.user.name || "Admin",
      ]
    );

    const filePath = req.file ? `others/${req.file.filename}` : null;
    await db.query(
      `INSERT INTO sop_versions (sop_id, version, file_path, change_note, uploaded_by)
       VALUES (?, 1, ?, 'Initial version', ?)`,
      [r.insertId, filePath, req.user.name || "Admin"]
    );

    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// HR SOP library (/api/sops) stores multi-file attachments in sop_version_files.
// Attach them so Super Admin sees HR-uploaded files, not only sops.file_path.
const attachLibraryFiles = async (rows) => {
  if (!rows.length) return rows;
  const [files] = await db.query(
    `SELECT id, sop_id, version, file_kind, file_name, file_size
     FROM sop_version_files WHERE sop_id IN (?)`,
    [rows.map((r) => r.id)],
  );
  const byKey = {};
  for (const f of files) {
    (byKey[`${f.sop_id}:${f.version}`] ||= []).push({
      id: f.id,
      file_kind: f.file_kind,
      file_name: f.file_name,
      file_size: f.file_size,
      download_url: `/api/sops/files/${f.id}/download`,
    });
  }
  return rows.map((r) => ({ ...r, files: byKey[`${r.id}:${r.version ?? r.current_version}`] || [] }));
};

export const listSops = async (req, res) => {
  try {
    const { department, category } = req.query;
    let sql = `
      SELECT s.*, v.file_path, v.change_note,
        (SELECT COUNT(*) FROM sop_acknowledgements a
         WHERE a.sop_id = s.id AND a.version = s.current_version AND a.ack_type = 'Read') AS ack_count,
        (SELECT COUNT(*) FROM sop_acknowledgements a
         WHERE a.sop_id = s.id AND a.version = s.current_version AND a.ack_type = 'Training Completed') AS training_count
      FROM sops s
      LEFT JOIN sop_versions v ON v.sop_id = s.id AND v.version = s.current_version
      WHERE s.is_active = 1`;
    const params = [];
    if (department) {
      sql += " AND s.department = ?";
      params.push(department);
    }
    if (category) {
      sql += " AND s.category = ?";
      params.push(category);
    }
    sql += " ORDER BY s.department, s.title";
    const [rows] = await db.query(sql, params);

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM employees WHERE isActive = 1"
    );
    res.json({ sops: await attachLibraryFiles(rows), activeEmployees: Number(total) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const uploadNewVersion = async (req, res) => {
  try {
    const [[sop]] = await db.query("SELECT * FROM sops WHERE id = ?", [req.params.id]);
    if (!sop) return res.status(404).json({ success: false, message: "SOP not found" });

    const newVersion = sop.current_version + 1;
    const filePath = req.file ? `others/${req.file.filename}` : null;

    await db.query(
      `INSERT INTO sop_versions (sop_id, version, file_path, change_note, uploaded_by)
       VALUES (?, ?, ?, ?, ?)`,
      [sop.id, newVersion, filePath, req.body.change_note || null, req.user.name || "Admin"]
    );
    await db.query("UPDATE sops SET current_version = ? WHERE id = ?", [newVersion, sop.id]);

    res.json({ success: true, version: newVersion });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const sopVersions = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sop_versions WHERE sop_id = ? ORDER BY version DESC",
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
    res.json(await attachLibraryFiles(rows.map((r) => ({ ...r, id: r.sop_id }))));
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateSop = async (req, res) => {
  try {
    const { title, department, category, description, requires_ack } = req.body;
    await db.query(
      `UPDATE sops SET title = COALESCE(?, title), department = COALESCE(?, department),
        category = COALESCE(?, category), description = COALESCE(?, description),
        requires_ack = COALESCE(?, requires_ack)
       WHERE id = ?`,
      [
        title || null,
        department || null,
        category || null,
        description || null,
        requires_ack === undefined ? null : requires_ack ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteSop = async (req, res) => {
  try {
    await db.query("UPDATE sops SET is_active = 0 WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* Acknowledgement report for one SOP */
export const ackReport = async (req, res) => {
  try {
    const [[sop]] = await db.query("SELECT * FROM sops WHERE id = ?", [req.params.id]);
    if (!sop) return res.status(404).json({ success: false, message: "SOP not found" });

    const [acks] = await db.query(
      `SELECT a.*, e.name AS employee_name, e.email
       FROM sop_acknowledgements a
       LEFT JOIN employees e ON e.id = a.employee_id
       WHERE a.sop_id = ? AND a.version = ?
       ORDER BY a.acknowledged_at DESC`,
      [sop.id, sop.current_version]
    );

    const [pendingEmployees] = await db.query(
      `SELECT e.id, e.name, e.email FROM employees e
       WHERE e.isActive = 1
         AND e.id NOT IN (
           SELECT employee_id FROM sop_acknowledgements
           WHERE sop_id = ? AND version = ? AND ack_type = 'Read'
         )
       ORDER BY e.name`,
      [sop.id, sop.current_version]
    );

    res.json({ sop, acks, pending: pendingEmployees });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Employee: view + acknowledge                                        */
/* ------------------------------------------------------------------ */
export const mySops = async (req, res) => {
  try {
    const empId = req.user.id;
    const [rows] = await db.query(
      `SELECT s.id, s.title, s.department, s.category, s.description, s.current_version,
              s.requires_ack, v.file_path,
        (SELECT COUNT(*) FROM sop_acknowledgements a
         WHERE a.sop_id = s.id AND a.version = s.current_version
           AND a.employee_id = ? AND a.ack_type = 'Read') AS acknowledged,
        (SELECT COUNT(*) FROM sop_acknowledgements a
         WHERE a.sop_id = s.id AND a.version = s.current_version
           AND a.employee_id = ? AND a.ack_type = 'Training Completed') AS training_done
      FROM sops s
      LEFT JOIN sop_versions v ON v.sop_id = s.id AND v.version = s.current_version
      WHERE s.is_active = 1 AND s.category = 'Internal'
      ORDER BY s.department, s.title`,
      [empId, empId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const acknowledgeSop = async (req, res) => {
  try {
    const { ack_type } = req.body;
    const type = ack_type === "Training Completed" ? "Training Completed" : "Read";
    const [[sop]] = await db.query("SELECT * FROM sops WHERE id = ?", [req.params.id]);
    if (!sop) return res.status(404).json({ success: false, message: "SOP not found" });

    await db.query(
      `INSERT IGNORE INTO sop_acknowledgements (sop_id, version, employee_id, ack_type)
       VALUES (?, ?, ?, ?)`,
      [sop.id, sop.current_version, req.user.id, type]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
