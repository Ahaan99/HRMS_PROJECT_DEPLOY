// workTarget.controller.js
import { db } from "../../../config/db.js";
import { getClientId } from "../utils/getClientId.js";

const SELECT_FIELDS = `
  id,
  client_id AS clientId,
  employee_id AS employeeId,
  department_id AS departmentId,
  target_title AS targetTitle,
  target_description AS targetDescription,
  target_type AS targetType,
  target_value AS targetValue,
  start_date AS startDate,
  end_date AS endDate,
  is_active AS isActive
`;

export const getWorkTargets = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const [rows] = await db.query(
      `SELECT ${SELECT_FIELDS} FROM client_work_targets
       WHERE client_id = ?
       ORDER BY id DESC`,
      [client_id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.log("WORK TARGET LIST ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createWorkTarget = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);

    const {
      employeeId,
      departmentId,
      targetTitle,
      targetDescription,
      targetType,
      targetValue,
      startDate,
      endDate,
      isActive,
    } = req.body;

    if (!targetTitle || !String(targetTitle).trim())
      return res
        .status(400)
        .json({ success: false, message: "Target title is required" });

    const [result] = await db.query(
      `INSERT INTO client_work_targets
        (client_id, employee_id, department_id, target_title, target_description,
         target_type, target_value, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client_id,
        Number(employeeId) || null,
        Number(departmentId) || null,
        String(targetTitle).trim(),
        targetDescription || null,
        targetType || "daily",
        targetValue || null,
        startDate || null,
        endDate || null,
        isActive === false || isActive === 0 ? 0 : 1,
      ]
    );

    const [rows] = await db.query(
      `SELECT ${SELECT_FIELDS} FROM client_work_targets WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.log("WORK TARGET CREATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateWorkTarget = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);
    const { id } = req.params;

    const [existing] = await db.query(
      `SELECT id FROM client_work_targets WHERE id = ? AND client_id = ?`,
      [id, client_id]
    );
    if (!existing.length)
      return res
        .status(404)
        .json({ success: false, message: "Work target not found" });

    const {
      employeeId,
      departmentId,
      targetTitle,
      targetDescription,
      targetType,
      targetValue,
      startDate,
      endDate,
      isActive,
    } = req.body;

    await db.query(
      `UPDATE client_work_targets SET
         employee_id = ?, department_id = ?, target_title = ?,
         target_description = ?, target_type = ?, target_value = ?,
         start_date = ?, end_date = ?, is_active = ?
       WHERE id = ? AND client_id = ?`,
      [
        Number(employeeId) || null,
        Number(departmentId) || null,
        String(targetTitle || "").trim(),
        targetDescription || null,
        targetType || "daily",
        targetValue || null,
        startDate || null,
        endDate || null,
        isActive === false || isActive === 0 ? 0 : 1,
        id,
        client_id,
      ]
    );

    const [rows] = await db.query(
      `SELECT ${SELECT_FIELDS} FROM client_work_targets WHERE id = ?`,
      [id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.log("WORK TARGET UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteWorkTarget = async (req, res) => {
  try {
    const { client_code } = req.client;
    const client_id = await getClientId(client_code);
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM client_work_targets WHERE id = ? AND client_id = ?`,
      [id, client_id]
    );

    if (!result.affectedRows)
      return res
        .status(404)
        .json({ success: false, message: "Work target not found" });

    res.json({ success: true, message: "Work target deleted" });
  } catch (err) {
    console.log("WORK TARGET DELETE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
