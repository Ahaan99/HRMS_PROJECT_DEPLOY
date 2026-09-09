import { db } from "../../../config/db.js";
import fs from "fs";
import path from "path";

/**
 * Works against the EXISTING SOP schema shared with modules/sop:
 *   sops(title, department, category ENUM('Internal','Client'), description,
 *        current_version, requires_ack, requires_training, is_active,
 *        created_by, created_at, updated_at)
 *   sop_versions(sop_id, version, file_path, file_name, change_note,
 *                uploaded_by, created_at)
 *   sop_acknowledgements(sop_id, version, employee_id,
 *                        ack_type ENUM('Read','Training Completed'),
 *                        acknowledged_at)
 */

const DEPARTMENTS = [
  "HR",
  "Sales",
  "IT",
  "Finance",
  "Operations",
  "Recruitment",
  "Compliance",
];

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const SOP_FOLDERS = ["sops", "others"];

/**
 * sop file_path has been stored three ways over time: an absolute path from
 * multer (sometimes from a since-renamed folder), a cwd-relative "uploads\\sops\\x",
 * and "others/x" from the Super Admin publisher. Find the file wherever it is.
 */
const resolveSopFile = (filePath) => {
  if (!filePath) return null;
  const base = filePath.split(/[\\/]/).pop();
  const candidates = [
    path.isAbsolute(filePath) ? filePath : null,
    path.resolve(process.cwd(), filePath.replace(/\\+/g, "/")),
    ...SOP_FOLDERS.map((f) => path.join(UPLOADS_ROOT, f, base)),
  ].filter(Boolean);
  for (const c of candidates) {
    if (c.startsWith(UPLOADS_ROOT) && fs.existsSync(c)) return c;
  }
  return null;
};

const toFileUrl = (filePath) => {
  const resolved = resolveSopFile(filePath);
  if (!resolved) return filePath ? "/uploads/sops/" + filePath.split(/[\\/]/).pop() : null;
  return "/" + path.relative(process.cwd(), resolved).split(path.sep).join("/");
};

const sendSopFile = (res, filePath, fileName) => {
  const resolved = resolveSopFile(filePath);
  if (!resolved) return res.status(404).json({ message: "File missing on server" });
  res.download(resolved, fileName || path.basename(resolved), (err) => {
    if (err && !res.headersSent) res.status(404).json({ message: "File missing on server" });
  });
};

const FIELD_KINDS = {
  reportFile: "report",
  sheetFile: "sheet",
  sourceCodeFile: "source_code",
  videoFile: "video",
  projectReportFile: "project_report",
};

// Collect files from sopMultiUpload (req.files) or legacy single upload (req.file)
const collectUploadedFiles = (req) => {
  const out = [];
  if (req.files && typeof req.files === "object") {
    for (const [field, arr] of Object.entries(req.files)) {
      for (const f of arr) {
        out.push({
          kind: FIELD_KINDS[field] || "other",
          path: f.path,
          name: f.originalname,
          size: f.size,
        });
      }
    }
  }
  if (req.file) {
    out.push({
      kind: "other",
      path: req.file.path,
      name: req.file.originalname,
      size: req.file.size,
    });
  }
  return out;
};

const insertVersionFiles = async (sopId, version, files) => {
  for (const f of files) {
    await db.query(
      `INSERT INTO sop_version_files (sop_id, version, file_kind, file_path, file_name, file_size)
       VALUES (?,?,?,?,?,?)`,
      [sopId, version, f.kind, f.path, f.name, f.size || null],
    );
  }
};

// Fetch current-version files for a list of SOP rows and attach as .files
const attachFiles = async (rows, versionKey = "current_version") => {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const [files] = await db.query(
    `SELECT id, sop_id, version, file_kind, file_path, file_name, file_size
     FROM sop_version_files WHERE sop_id IN (?)`,
    [ids],
  );
  const byKey = {};
  for (const f of files) {
    const k = `${f.sop_id}:${f.version}`;
    (byKey[k] = byKey[k] || []).push({
      id: f.id,
      file_kind: f.file_kind,
      file_name: f.file_name,
      file_size: f.file_size,
      file_url: toFileUrl(f.file_path),
      download_url: `/api/sops/files/${f.id}/download`,
    });
  }
  return rows.map((r) => ({
    ...r,
    files: byKey[`${r.id}:${r[versionKey]}`] || [],
  }));
};

const typeToCategory = (t) =>
  t === "client_template" ? "Client" : "Internal";

/* ============ HR: list all SOPs ============ */
export const getAllSops = async (req, res) => {
  try {
    const { department, sop_type, status } = req.query;

    let sql = `
      SELECT s.id, s.title, s.department, s.description,
        s.category, s.current_version, s.requires_training,
        s.is_active, s.created_at AS createdAt, s.updated_at AS updatedAt,
        (SELECT COUNT(*) FROM sop_acknowledgements a
          WHERE a.sop_id = s.id AND a.version = s.current_version
            AND a.ack_type = 'Read') AS ack_count,
        (SELECT COUNT(*) FROM sop_acknowledgements a
          WHERE a.sop_id = s.id AND a.version = s.current_version
            AND a.ack_type = 'Training Completed') AS trained_count,
        (SELECT COUNT(*) FROM sop_versions v WHERE v.sop_id = s.id) AS version_count,
        (SELECT v.file_path FROM sop_versions v
          WHERE v.sop_id = s.id AND v.version = s.current_version LIMIT 1) AS file_path,
        (SELECT v.file_name FROM sop_versions v
          WHERE v.sop_id = s.id AND v.version = s.current_version LIMIT 1) AS file_name,
        (SELECT v.id FROM sop_versions v
          WHERE v.sop_id = s.id AND v.version = s.current_version LIMIT 1) AS version_id
      FROM sops s WHERE 1=1`;
    const params = [];

    if (department) {
      sql += " AND s.department = ?";
      params.push(department);
    }
    if (sop_type) {
      sql += " AND s.category = ?";
      params.push(typeToCategory(sop_type));
    }
    if (status === "active") sql += " AND s.is_active = 1";
    if (status === "archived") sql += " AND s.is_active = 0";

    sql += " ORDER BY s.updated_at DESC";

    const [rows] = await db.query(sql, params);

    const [[{ total_employees }]] = await db.query(
      "SELECT COUNT(*) AS total_employees FROM employees WHERE isActive = 1",
    );

    const withFiles = await attachFiles(rows);

    res.json({
      departments: DEPARTMENTS,
      total_employees,
      data: withFiles.map((r) => ({
        ...r,
        sop_type: r.category === "Client" ? "client_template" : "internal",
        status: r.is_active ? "active" : "archived",
        file_url: toFileUrl(r.file_path),
        download_url: r.version_id && r.file_path ? `/api/sops/versions/${r.version_id}/download` : null,
      })),
    });
  } catch (err) {
    console.error("getAllSops error:", err);
    res.status(500).json({ message: "Failed to fetch SOPs" });
  }
};

/* ============ HR: create SOP (v1 upload) ============ */
export const createSop = async (req, res) => {
  try {
    const { title, department, description, sop_type, requires_training } =
      req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!department || !DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: "Valid department is required" });
    }
    const uploaded = collectUploadedFiles(req);
    if (!uploaded.length) {
      return res.status(400).json({
        message:
          "At least one file is required (report, sheet, source code, or video)",
      });
    }

    const [result] = await db.query(
      `INSERT INTO sops (title, department, category, description, requires_training, created_by)
       VALUES (?,?,?,?,?,?)`,
      [
        String(title).trim(),
        department,
        typeToCategory(sop_type),
        description || null,
        requires_training === "1" || requires_training === "true" ? 1 : 0,
        req.employee?.name || String(req.employee?.id || "HR"),
      ],
    );

    // legacy pointer row (first file) keeps old consumers working
    await db.query(
      `INSERT INTO sop_versions (sop_id, version, file_path, file_name, change_note, uploaded_by)
       VALUES (?,?,?,?,?,?)`,
      [
        result.insertId,
        1,
        uploaded[0].path,
        uploaded[0].name,
        req.body.notes || "Initial version",
        req.employee?.name || String(req.employee?.id || "HR"),
      ],
    );

    await insertVersionFiles(result.insertId, 1, uploaded);

    res.status(201).json({ id: result.insertId, message: "SOP created" });
  } catch (err) {
    console.error("createSop error:", err);
    res.status(500).json({ message: "Failed to create SOP" });
  }
};

/* ============ HR: upload new version ============ */
export const uploadNewVersion = async (req, res) => {
  try {
    const { id } = req.params;

    const uploaded = collectUploadedFiles(req);
    if (!uploaded.length) {
      return res.status(400).json({
        message:
          "At least one file is required (report, sheet, source code, or video)",
      });
    }

    const [[sop]] = await db.query("SELECT * FROM sops WHERE id = ?", [id]);
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const newVersion = sop.current_version + 1;

    await db.query(
      `INSERT INTO sop_versions (sop_id, version, file_path, file_name, change_note, uploaded_by)
       VALUES (?,?,?,?,?,?)`,
      [
        id,
        newVersion,
        uploaded[0].path,
        uploaded[0].name,
        req.body.notes || null,
        req.employee?.name || String(req.employee?.id || "HR"),
      ],
    );

    await insertVersionFiles(id, newVersion, uploaded);

    await db.query("UPDATE sops SET current_version = ? WHERE id = ?", [
      newVersion,
      id,
    ]);

    res.json({ message: "New version uploaded", version: newVersion });
  } catch (err) {
    console.error("uploadNewVersion error:", err);
    res.status(500).json({ message: "Failed to upload version" });
  }
};

/* ============ HR: version history ============ */
export const getVersionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT id, sop_id, version AS version_no, file_path, file_name,
              change_note AS notes, uploaded_by AS uploaded_by_name,
              created_at AS createdAt
       FROM sop_versions
       WHERE sop_id = ?
       ORDER BY version DESC`,
      [id],
    );
    // attach per-version files (rows here are versions, keyed by sop_id + version_no)
    const [allFiles] = rows.length
      ? await db.query(
          `SELECT id, sop_id, version, file_kind, file_path, file_name, file_size
           FROM sop_version_files WHERE sop_id = ?`,
          [id],
        )
      : [[]];
    const byVersion = {};
    for (const f of allFiles) {
      (byVersion[f.version] = byVersion[f.version] || []).push({
        id: f.id,
        file_kind: f.file_kind,
        file_name: f.file_name,
        file_size: f.file_size,
        file_url: toFileUrl(f.file_path),
        download_url: `/api/sops/files/${f.id}/download`,
      });
    }

    res.json(
      rows.map((r) => ({
        ...r,
        file_url: toFileUrl(r.file_path),
        download_url: r.file_path ? `/api/sops/versions/${r.id}/download` : null,
        files: byVersion[r.version_no] || [],
      })),
    );
  } catch (err) {
    console.error("getVersionHistory error:", err);
    res.status(500).json({ message: "Failed to fetch versions" });
  }
};

/* ============ Download a specific SOP file with its original name ============ */
export const downloadSopFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const [[file]] = await db.query(
      "SELECT * FROM sop_version_files WHERE id = ?",
      [fileId],
    );
    if (!file) return res.status(404).json({ message: "File not found" });
    sendSopFile(res, file.file_path, file.file_name);
  } catch (err) {
    console.error("downloadSopFile error:", err);
    res.status(500).json({ message: "Failed to download file" });
  }
};

/* ============ Download a version's single (legacy) file ============ */
export const downloadSopVersionFile = async (req, res) => {
  try {
    const { versionId } = req.params;
    const [[ver]] = await db.query(
      "SELECT file_path, file_name FROM sop_versions WHERE id = ?",
      [versionId],
    );
    if (!ver?.file_path) return res.status(404).json({ message: "File not found" });
    sendSopFile(res, ver.file_path, ver.file_name);
  } catch (err) {
    console.error("downloadSopVersionFile error:", err);
    res.status(500).json({ message: "Failed to download file" });
  }
};

/* ============ HR: acknowledgement report for one SOP ============ */
export const getAcknowledgements = async (req, res) => {
  try {
    const { id } = req.params;

    const [[sop]] = await db.query("SELECT * FROM sops WHERE id = ?", [id]);
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const [acks] = await db.query(
      `SELECT a.id, a.employee_id, a.acknowledged_at,
              (SELECT COUNT(*) FROM sop_acknowledgements t
                WHERE t.sop_id = a.sop_id AND t.version = a.version
                  AND t.employee_id = a.employee_id
                  AND t.ack_type = 'Training Completed') AS training_completed,
              e.name, e.employeeCode, d.name AS department_name
       FROM sop_acknowledgements a
       JOIN employees e ON e.id = a.employee_id
       LEFT JOIN departments d ON d.id = e.departmentId
       WHERE a.sop_id = ? AND a.version = ? AND a.ack_type = 'Read'
       ORDER BY a.acknowledged_at DESC`,
      [id, sop.current_version],
    );

    const [pending] = await db.query(
      `SELECT e.id, e.name, e.employeeCode, d.name AS department_name
       FROM employees e
       LEFT JOIN departments d ON d.id = e.departmentId
       WHERE e.isActive = 1
         AND e.id NOT IN (
           SELECT employee_id FROM sop_acknowledgements
           WHERE sop_id = ? AND version = ? AND ack_type = 'Read'
         )
       ORDER BY e.name`,
      [id, sop.current_version],
    );

    res.json({
      sop: {
        id: sop.id,
        title: sop.title,
        version: sop.current_version,
        requires_training: sop.requires_training,
      },
      acknowledged: acks,
      pending,
    });
  } catch (err) {
    console.error("getAcknowledgements error:", err);
    res.status(500).json({ message: "Failed to fetch acknowledgements" });
  }
};

/* ============ HR: archive / restore ============ */
export const setSopStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const isActive = req.body.status === "archived" ? 0 : 1;
    const [result] = await db.query(
      "UPDATE sops SET is_active = ? WHERE id = ?",
      [isActive, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "SOP not found" });
    res.json({ message: isActive ? "SOP restored" : "SOP archived" });
  } catch (err) {
    console.error("setSopStatus error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

/* ============ EMPLOYEE: list active internal SOPs with my state ============ */
export const getEmployeeSops = async (req, res) => {
  try {
    const empId = req.employee?.id || req.employee?.employee_id;

    // Employees only see SOPs for their own department (plus company-wide
    // ones whose department is Operations/Compliance/HR policy).
    const [[emp]] = await db.query(
      `SELECT d.name AS department
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
        WHERE e.id = ? LIMIT 1`,
      [empId],
    );
    const ownDept = emp?.department || null;
    const visibleDepts = new Set(["HR", "Operations", "Compliance"]);
    if (ownDept) visibleDepts.add(ownDept);
    const deptList = [...visibleDepts];

    const [rows] = await db.query(
      `SELECT s.id, s.title, s.department, s.description, s.requires_training,
              s.current_version, s.updated_at AS updatedAt,
        (SELECT v.file_path FROM sop_versions v
          WHERE v.sop_id = s.id AND v.version = s.current_version LIMIT 1) AS file_path,
        (SELECT v.file_name FROM sop_versions v
          WHERE v.sop_id = s.id AND v.version = s.current_version LIMIT 1) AS file_name,
        r.acknowledged_at,
        (t.id IS NOT NULL) AS training_completed,
        t.acknowledged_at AS training_completed_at
       FROM sops s
       LEFT JOIN sop_acknowledgements r
         ON r.sop_id = s.id AND r.version = s.current_version
        AND r.employee_id = ? AND r.ack_type = 'Read'
       LEFT JOIN sop_acknowledgements t
         ON t.sop_id = s.id AND t.version = s.current_version
        AND t.employee_id = ? AND t.ack_type = 'Training Completed'
       WHERE s.is_active = 1 AND s.category = 'Internal'
         AND s.department IN (${deptList.map(() => "?").join(",")})
       ORDER BY (r.id IS NULL) DESC, s.updated_at DESC`,
      [empId, empId, ...deptList],
    );

    const withFiles = await attachFiles(rows);

    res.json(
      withFiles.map((r) => ({
        ...r,
        training_completed: r.training_completed ? 1 : 0,
        file_url: toFileUrl(r.file_path),
      })),
    );
  } catch (err) {
    console.error("getEmployeeSops error:", err);
    res.status(500).json({ message: "Failed to fetch SOPs" });
  }
};

/* ============ EMPLOYEE: acknowledge current version ============ */
export const acknowledgeSop = async (req, res) => {
  try {
    const empId = req.employee?.id || req.employee?.employee_id;
    const { id } = req.params;

    const [[sop]] = await db.query(
      "SELECT * FROM sops WHERE id = ? AND is_active = 1",
      [id],
    );
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const [existing] = await db.query(
      `SELECT id FROM sop_acknowledgements
       WHERE sop_id = ? AND employee_id = ? AND version = ? AND ack_type = 'Read'`,
      [id, empId, sop.current_version],
    );
    if (existing.length) {
      return res.status(409).json({ message: "Already acknowledged" });
    }

    await db.query(
      `INSERT INTO sop_acknowledgements (sop_id, version, employee_id, ack_type)
       VALUES (?,?,?, 'Read')`,
      [id, sop.current_version, empId],
    );

    res.status(201).json({ message: "SOP acknowledged" });
  } catch (err) {
    console.error("acknowledgeSop error:", err);
    res.status(500).json({ message: "Failed to acknowledge" });
  }
};

/* ============ EMPLOYEE: mark training complete ============ */
export const completeTraining = async (req, res) => {
  try {
    const empId = req.employee?.id || req.employee?.employee_id;
    const { id } = req.params;

    const [[sop]] = await db.query(
      "SELECT * FROM sops WHERE id = ? AND is_active = 1",
      [id],
    );
    if (!sop) return res.status(404).json({ message: "SOP not found" });

    const [readAck] = await db.query(
      `SELECT id FROM sop_acknowledgements
       WHERE sop_id = ? AND employee_id = ? AND version = ? AND ack_type = 'Read'`,
      [id, empId, sop.current_version],
    );
    if (!readAck.length) {
      return res
        .status(400)
        .json({ message: "Acknowledge the SOP before completing training" });
    }

    const [existing] = await db.query(
      `SELECT id FROM sop_acknowledgements
       WHERE sop_id = ? AND employee_id = ? AND version = ? AND ack_type = 'Training Completed'`,
      [id, empId, sop.current_version],
    );
    if (existing.length) {
      return res.status(409).json({ message: "Training already recorded" });
    }

    await db.query(
      `INSERT INTO sop_acknowledgements (sop_id, version, employee_id, ack_type)
       VALUES (?,?,?, 'Training Completed')`,
      [id, sop.current_version, empId],
    );

    res.json({ message: "Training marked complete" });
  } catch (err) {
    console.error("completeTraining error:", err);
    res.status(500).json({ message: "Failed to record training" });
  }
};

/* ============ CLIENT: sample editable SOP formats ============ */
export const getClientSopLibrary = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.id, s.title, s.department, s.description, s.current_version,
              s.updated_at AS updatedAt,
        (SELECT v.file_path FROM sop_versions v
          WHERE v.sop_id = s.id AND v.version = s.current_version LIMIT 1) AS file_path,
        (SELECT v.file_name FROM sop_versions v
          WHERE v.sop_id = s.id AND v.version = s.current_version LIMIT 1) AS file_name
       FROM sops s
       WHERE s.is_active = 1 AND s.category = 'Client'
       ORDER BY s.department, s.title`,
    );

    const withFiles = await attachFiles(rows);

    res.json(
      withFiles.map((r) => ({ ...r, file_url: toFileUrl(r.file_path) })),
    );
  } catch (err) {
    console.error("getClientSopLibrary error:", err);
    res.status(500).json({ message: "Failed to fetch SOP library" });
  }
};
