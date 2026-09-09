import { db } from "../../config/db.js";
import { logAudit } from "../compliance/compliance.controller.js";

const err = (res, e) => res.status(500).json({ success: false, message: e.message });

export const listDocs = async (req, res) => {
  try {
    const { status, employee_id } = req.query;
    const where = [], vals = [];
    if (status) { where.push("status = ?"); vals.push(status); }
    if (employee_id) { where.push("employee_id = ?"); vals.push(employee_id); }
    const [rows] = await db.query(
      `SELECT * FROM verification_documents ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`,
      vals
    );
    const [[counts]] = await db.query(
      `SELECT SUM(status='Pending') pending, SUM(status='Verified') verified, SUM(status='Rejected') rejected
       FROM verification_documents`
    );
    res.json({ documents: rows, counts });
  } catch (e) { err(res, e); }
};

export const uploadDoc = async (req, res) => {
  try {
    const { employee_id, employee_name, doc_type } = req.body;
    if (!employee_id || !doc_type)
      return res.status(400).json({ success: false, message: "employee and document type are required" });
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    const [r] = await db.query(
      "INSERT INTO verification_documents (employee_id, employee_name, doc_type, file_path) VALUES (?,?,?,?)",
      [employee_id, employee_name || "", doc_type, file_path]
    );
    await logAudit(req.user?.name, "UPLOAD", "Verification", `${doc_type} for ${employee_name}`);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const reviewDoc = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!["Verified", "Rejected", "Pending"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });
    await db.query(
      `UPDATE verification_documents SET status = ?, remarks = ?,
        verified_by = CASE WHEN ? IN ('Verified','Rejected') THEN ? ELSE NULL END,
        verified_at = CASE WHEN ? IN ('Verified','Rejected') THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [status, remarks || null, status, req.user?.name || "Admin", status, req.params.id]
    );
    await logAudit(req.user?.name, status.toUpperCase(), "Verification", `Document #${req.params.id}`);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

export const deleteDoc = async (req, res) => {
  try {
    await db.query("DELETE FROM verification_documents WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};
