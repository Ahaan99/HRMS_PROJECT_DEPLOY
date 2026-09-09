import { db } from "../../../config/db.js";

// CREATE BATCH
export const createBatch = async (fileName, total, clientId, assignedTo) => {
  const [res] = await db.query(
    `INSERT INTO client_lead_batches 
     (file_name, total_records, client_id, assigned_to)
     VALUES (?, ?, ?, ?)`,
    [fileName, total, clientId, assignedTo],
  );

  return res.insertId;
};

// INSERT LEADS
export const insertLeads = async (leads, batchId, clientId, assignedTo) => {
  const values = leads.map((l) => [
    l.name,
    l.phone,
    batchId,
    assignedTo,
    clientId,
    new Date(),
  ]);

  await db.query(
    `INSERT INTO client_leads 
     (name, phone, batch_id, assigned_to, client_id, assigned_date)
     VALUES ?`,
    [values],
  );
};

// GET BATCHES
export const getBatches = async (clientId, employeeId = null) => {
  let query = `
    SELECT 
      b.id,
      b.file_name,
      b.created_at,

      COUNT(l.id) as total,
      SUM(CASE WHEN l.status != 'pending' THEN 1 ELSE 0 END) as completed,

      MAX(e.name) as employee_name

    FROM client_lead_batches b

    LEFT JOIN client_leads l 
      ON l.batch_id = b.id

    LEFT JOIN client_employees e 
      ON b.assigned_to = e.id

    WHERE b.client_id = ?
  `;

  let values = [clientId];

  // 🔥 EMPLOYEE FILTER
  if (employeeId) {
    query += ` AND l.assigned_to = ?`;
    values.push(employeeId);
  }

  query += `
    GROUP BY b.id
    ORDER BY b.id DESC
  `;

  const [rows] = await db.query(query, values);
  return rows;
};


// GET BY BATCH (employeeId narrows to that employee's rows)
export const getLeadsByBatch = async (batchId, clientId, employeeId = null) => {
  let sql = `SELECT * FROM client_leads WHERE batch_id = ? AND client_id = ?`;
  const values = [batchId, clientId];
  if (employeeId) {
    sql += ` AND assigned_to = ?`;
    values.push(employeeId);
  }
  sql += ` ORDER BY id DESC`;
  const [rows] = await db.query(sql, values);
  return rows;
};

// ALL LEADS OF A TENANT (client admin)
export const getClientLeads = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM client_leads WHERE client_id = ? ORDER BY id DESC`,
    [clientId],
  );
  return rows;
};

// EMPLOYEE
export const getEmployeeLeads = async (employeeId, clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM client_leads 
     WHERE assigned_to = ? AND client_id = ?
     ORDER BY id DESC`,
    [employeeId, clientId],
  );

  return rows;
};

// UPDATE — always scoped to the tenant; employees only touch their own leads.
// Returns affectedRows so the controller can 404 on foreign / unknown ids.
export const updateLead = async (id, data, clientId, employeeId = null) => {
  const { status, remarks } = data;

  let sql = `UPDATE client_leads 
     SET status=?, remarks=?, 
     response_date = CASE 
       WHEN ? != 'pending' THEN NOW() 
       ELSE response_date 
     END
     WHERE id=? AND client_id=?`;
  const values = [status, remarks ?? null, status, id, clientId];
  if (employeeId) {
    sql += ` AND assigned_to=?`;
    values.push(employeeId);
  }

  const [result] = await db.query(sql, values);
  return result.affectedRows;
};
