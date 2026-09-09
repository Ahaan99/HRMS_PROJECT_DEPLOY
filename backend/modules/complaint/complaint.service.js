import { db } from "../../config/db.js";

export const createComplaint = async (data) => {
  const [res] = await db.query(
    `INSERT INTO complaints 
    (title, description, category, priority, created_by_id, created_by_role, client_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description,
      data.category,
      data.priority,
      data.created_by_id,
      data.created_by_role,
      data.client_id, // ✅ IMPORTANT
    ],
  );

  return res;
};

// GET ALL (ROLE BASED)
// created_by_id is a client id for client complaints and an employee id otherwise,
// so each lookup table is joined only for the roles that own it (ids never collide).
export const getComplaints = async (user) => {
  let query = `
SELECT 
  c.*,

  e.name AS employee_name,
  d.name AS department_name,

  cl.company_name AS client_name

FROM complaints c

LEFT JOIN employees e ON c.created_by_id = e.id AND c.created_by_role NOT IN ('client','admin')
LEFT JOIN departments d ON e.departmentId = d.id

LEFT JOIN clients cl ON c.client_id = cl.id AND c.created_by_role = 'client'

WHERE c.is_active = 1
`;
  let values = [];

  // Admin → no restriction

  if (user.role === "employee") {
    query += ` AND c.created_by_id = ? AND c.created_by_role = 'employee'`;
    values.push(user.id);
  }

  if (user.role === "client") {
    query += ` AND c.client_id = ?`;
    values.push(user.id);
  }

  if (user.role === "hr") {
    query += ` AND c.created_by_id = ? AND c.created_by_role = 'hr'`;
    values.push(user.employee_id || user.id);
  }

  if (user.role === "sales") {
    query += ` AND c.created_by_id = ? AND c.created_by_role = 'sales'`;
    values.push(user.id);
  }

  // IT developers see only the complaints they raised
  if (user.role === "it") {
    query += ` AND c.created_by_id = ? AND c.created_by_role = 'it'`;
    values.push(user.id);
  }

  query += ` ORDER BY c.created_at DESC`;

  const [rows] = await db.query(query, values);
  return rows;
};

// GET SINGLE + REPLIES
export const getSingleComplaint = async (id, user) => {
  let query = `
    SELECT
      c.*,
      e.name AS employee_name,
      d.name AS department_name,
      cl.company_name AS client_name
    FROM complaints c
    LEFT JOIN employees e ON c.created_by_id = e.id AND c.created_by_role NOT IN ('client','admin')
    LEFT JOIN departments d ON e.departmentId = d.id
    LEFT JOIN clients cl ON c.client_id = cl.id AND c.created_by_role = 'client'
    WHERE c.id = ?`;
  let values = [id];

  // 🔒 HR sees only their complaints
  if (user.role === "hr") {
    query += ` AND c.created_by_id = ? AND c.created_by_role = 'hr'`;
    values.push(user.employee_id || user.id);
  }

  // 🔒 client restriction
  if (user.role === "client") {
    query += ` AND c.client_id = ?`;
    values.push(user.id);
  }

  // 🔒 IT developer sees only their own complaint
  if (user.role === "it") {
    query += ` AND c.created_by_id = ? AND c.created_by_role = 'it'`;
    values.push(user.id);
  }

  const [complaint] = await db.query(query, values);

  if (!complaint.length) {
    return { complaint: null, replies: [] };
  }

  // sender_id points at clients for client replies, employees for portal staff,
  // and the admin account for admin/manager replies — resolve by role.
  const [replies] = await db.query(
    `
    SELECT 
      r.*,
      e.name AS employee_name,
      cl.company_name AS client_name,
      CASE
        WHEN r.sender_role = 'client' THEN cl.company_name
        WHEN r.sender_role = 'admin' THEN 'Super Admin'
        ELSE COALESCE(e.name, r.sender_role)
      END AS sender_name
    FROM complaint_replies r
    LEFT JOIN employees e ON r.sender_id = e.id AND r.sender_role NOT IN ('client','admin')
    LEFT JOIN clients cl ON r.sender_id = cl.id AND r.sender_role = 'client'
    WHERE r.complaint_id = ?
    ORDER BY r.created_at ASC
    `,
    [id],
  );

  return {
    complaint: complaint[0],
    replies,
  };
};
// ADD REPLY
export const addReply = async (data) => {
  const [res] = await db.query(
    `INSERT INTO complaint_replies 
    (complaint_id, message, sender_id, sender_role)
    VALUES (?, ?, ?, ?)`,
    [data.complaint_id, data.message, data.sender_id, data.sender_role],
  );

  return res;
};

// UPDATE STATUS
export const updateStatus = async (id, status) => {
  const [res] = await db.query(
    `UPDATE complaints SET status = ? WHERE id = ?`,
    [status, id],
  );

  return res;
};

