import { db } from "../../../config/db.js";

// 🔥 CREATE BATCH
export const createBatch = async (fileName, total, userId, assignedTo) => {
  const [res] = await db.query(
    `INSERT INTO lead_batches 
    (file_name, total_records, uploaded_by, assigned_to)
    VALUES (?, ?, ?, ?)`,
    [fileName, total, userId, assignedTo]
  );

  return res.insertId;
};


// 🔥 INSERT LEADS
export const insertLeads = async (leads) => {
  const values = leads.map((l) => [
    l.name,
    l.phone,
    l.batch_id,
    l.assigned_to,
    l.assigned_by,
    new Date(), // assigned_date
  ]);

  await db.query(
    `INSERT INTO leads 
    (name, phone, batch_id, assigned_to, assigned_by, assigned_date)
    VALUES ?`,
    [values]
  );
};
// 🔥 ASSIGN
export const assignLead = async (id, hrId, adminId) => {
  await db.query(
    `UPDATE leads 
     SET assigned_to=?, assigned_by=?, assigned_date=NOW()
     WHERE id=?`,
    [hrId, adminId, id]
  );
};

// 🔥 UPDATE LEAD (HR)
export const updateLead = async (id, data) => {
  const { status, remarks } = data;

  await db.query(
    `UPDATE leads 
     SET status=?, remarks=?, 
     response_date = CASE 
       WHEN ? != 'pending' THEN NOW() 
       ELSE response_date 
     END
     WHERE id=?`,
    [status, remarks, status, id]
  );
};

// 🔥 ALL LEADS (ADMIN)
export const getAllLeads = async () => {
  const [rows] = await db.query(`
    SELECT l.*, e.name as hr_name
    FROM leads l
    LEFT JOIN employees e ON l.assigned_to = e.id
    ORDER BY l.id DESC
  `);

  return rows;
};

// 🔥 HR LEADS
export const getMyLeads = async (hrId) => {
  const [rows] = await db.query(
    `SELECT * FROM leads 
     WHERE assigned_to = ? 
     ORDER BY id DESC`,
    [hrId]
  );

  return rows;
};

export const getAllBatches = async () => {
  try {
const [rows] = await db.query(`
  SELECT 
    b.id,
    b.file_name,
    b.created_at,

    COUNT(l.id) as total,
    SUM(CASE WHEN l.status != 'pending' THEN 1 ELSE 0 END) as completed,

    MAX(e.name) as hr_name

  FROM lead_batches b
  LEFT JOIN leads l ON l.batch_id = b.id
  LEFT JOIN employees e ON l.assigned_to = e.id

  GROUP BY b.id, b.file_name, b.created_at
  ORDER BY b.id DESC
`);

    return rows;
  } catch (err) {
    console.error("BATCH ERROR:", err); // 🔥 VERY IMPORTANT
    throw err;
  }
};

