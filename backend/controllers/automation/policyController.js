import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getPolicies = asyncHandler(async (req, res) => {
  const { policy_type, is_active } = req.query;
  
  let query = "SELECT * FROM policy_templates WHERE 1=1";
  const params = [];

  if (policy_type) {
    query += " AND policy_type = ?";
    params.push(policy_type);
  }
  if (is_active !== undefined) {
    query += " AND is_active = ?";
    params.push(is_active);
  }

  query += " ORDER BY created_at DESC";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const createPolicy = asyncHandler(async (req, res) => {
  const { policy_type, title, content, is_active } = req.body;
  
  const [result] = await db.query(
    "INSERT INTO policy_templates (policy_type, title, content, is_active) VALUES (?, ?, ?, ?)",
    [policy_type, title, content, is_active ?? 1]
  );

  res.json({ success: true, message: "Policy created", data: { id: result.insertId } });
});

const updatePolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { policy_type, title, content, is_active } = req.body;

  await db.query(
    "UPDATE policy_templates SET policy_type = ?, title = ?, content = ?, is_active = ? WHERE id = ?",
    [policy_type, title, content, is_active, id]
  );

  res.json({ success: true, message: "Policy updated" });
});

const deletePolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await db.query("DELETE FROM policy_templates WHERE id = ?", [id]);
  res.json({ success: true, message: "Policy deleted" });
});

const sendPolicyEmail = asyncHandler(async (req, res) => {
  const { policy_id, employee_ids } = req.body;

  const [policy] = await db.query("SELECT * FROM policy_templates WHERE id = ?", [policy_id]);
  if (policy.length === 0) {
    return res.status(404).json({ success: false, message: "Policy not found" });
  }

  let targetEmployeeIds = employee_ids;
  if (!employee_ids || employee_ids.length === 0) {
    const [employees] = await db.query(
      "SELECT id FROM client_employees WHERE client_id = ? AND isActive = 1",
      [req.user.clientId]
    );
    targetEmployeeIds = employees.map(e => e.id);
  }

  const logs = [];
  for (const empId of targetEmployeeIds) {
    try {
      const [emp] = await db.query("SELECT email FROM client_employees WHERE id = ?", [empId]);
      
      await db.query(
        "INSERT INTO policy_logs (employee_id, policy_id, status) VALUES (?, ?, 'SENT')",
        [empId, policy_id]
      );
      
      logs.push({ employee_id: empId, status: "SENT" });
      
    } catch (error) {
      logs.push({ employee_id: empId, status: "FAILED" });
    }
  }

  res.json({ 
    success: true, 
    message: `Policy sent to ${logs.filter(l => l.status === "SENT").length} employees`,
    data: { logs } 
  });
});

const getPolicyLogs = asyncHandler(async (req, res) => {
  const { policy_id, employee_id, status, start_date, end_date } = req.query;
  
  let query = `
    SELECT pl.*, pt.title as policy_title, pt.policy_type, ce.name as employee_name
    FROM policy_logs pl
    JOIN policy_templates pt ON pl.policy_id = pt.id
    JOIN client_employees ce ON pl.employee_id = ce.id
    WHERE ce.client_id = ?
  `;
  const params = [req.user.clientId];

  if (policy_id) {
    query += " AND pl.policy_id = ?";
    params.push(policy_id);
  }
  if (employee_id) {
    query += " AND pl.employee_id = ?";
    params.push(employee_id);
  }
  if (status) {
    query += " AND pl.status = ?";
    params.push(status);
  }
  if (start_date) {
    query += " AND pl.sent_at >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND pl.sent_at <= ?";
    params.push(end_date);
  }

  query += " ORDER BY pl.sent_at DESC LIMIT 100";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

export { getPolicies, createPolicy, updatePolicy, deletePolicy, sendPolicyEmail, getPolicyLogs };
