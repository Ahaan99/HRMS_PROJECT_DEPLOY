import { db } from "../../../config/db.js";

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


export const getAllBatches = async (hrId) => {
  const [rows] = await db.query(`
    SELECT 
      b.id,
      b.file_name,
      b.created_at,

      COUNT(l.id) as total,
      SUM(CASE WHEN l.status != 'pending' THEN 1 ELSE 0 END) as completed,

      MAX(e.name) as hr_name

    FROM lead_batches b

    INNER JOIN leads l 
      ON l.batch_id = b.id AND l.assigned_to = ?   -- 🔥 FIX HERE

    LEFT JOIN employees e 
      ON l.assigned_to = e.id

    GROUP BY b.id, b.file_name, b.created_at
    ORDER BY b.id DESC
  `, [hrId]);

  return rows;
};


export const getLeadsByBatch = async (batchId, hrId) => {
  try{
  const [rows] = await db.query(
    `
    SELECT *
    FROM leads
    WHERE batch_id = ?
    AND assigned_to = ?
    ORDER BY id DESC
    `,
    [batchId, hrId]
  );
      return rows;

  } catch (err) {
    console.error("MY BATCH ERROR:", err); // 🔥 VERY IMPORTANT
    throw err;
  }
}
