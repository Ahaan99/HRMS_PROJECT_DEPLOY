import { db } from "../../../config/db.js";

// ================= HELPER =================
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );
  if (!rows.length) throw new Error("Client not found");
  return rows[0].id;
};

// ================= CREATE =================
export const createFieldSalesService = async (client_code, payload) => {
  const client_id = await getClientId(client_code);

  const {
    employee_id,
    company_name,
    owner_name,
    phone,
    alternate_phone,
    email,
    address,
    city,
    state,
    pincode,
    business_type,
    requirement,
    status,
    next_followup_date,
    remarks,
  } = payload;

  const [result] = await db.query(
    `INSERT INTO field_sales_leads
     (client_id, created_by, company_name, owner_name, phone, alternate_phone,
      email, address, city, state, pincode, business_type, requirement,
      status, next_followup_date, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      employee_id,
      company_name,
      owner_name || null,
      phone,
      alternate_phone || null,
      email || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      business_type || null,
      requirement || null,
      status || "new",
      next_followup_date || null,
      remarks || null,
    ]
  );

  return result.insertId;
};

// ================= LIST =================
export const getFieldSalesListService = async (
  client_code,
  employee_id = null,
  filters = {}
) => {
  const client_id = await getClientId(client_code);

  let where = `WHERE e.client_id = ?`;
  const params = [client_id];

  // 🔐 employee restriction
  if (employee_id) {
    where += ` AND f.created_by = ?`;
    params.push(employee_id);
  }

  // 🔍 search
  if (filters.search) {
    where += ` AND (
      f.company_name LIKE ?
      OR f.phone LIKE ?
      OR f.owner_name LIKE ?
    )`;
    params.push(
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`
    );
  }

  // 🎯 status
  if (filters.status && filters.status !== "all") {
    where += ` AND f.status = ?`;
    params.push(filters.status);
  }

  const [rows] = await db.query(
    `SELECT f.*, e.name AS employee_name
     FROM field_sales_leads f
     LEFT JOIN client_employees e ON e.id = f.created_by
     ${where}
     ORDER BY f.id DESC`,
    params
  );

  return rows;
};

// ================= UPDATE =================
export const updateFieldSalesService = async (
  client_code,
  id,
  payload
) => {
  const client_id = await getClientId(client_code);

  const {
    company_name,
    owner_name,
    phone,
    alternate_phone,
    email,
    address,
    city,
    state,
    pincode,
    business_type,
    requirement,
    status,
    next_followup_date,
    remarks,
  } = payload;

  const [result] = await db.query(
    `UPDATE field_sales_leads
     SET
       company_name = ?,
       owner_name = ?,
       phone = ?,
       alternate_phone = ?,
       email = ?,
       address = ?,
       city = ?,
       state = ?,
       pincode = ?,
       business_type = ?,
       requirement = ?,
       status = ?,
       next_followup_date = ?,
       remarks = ?
     WHERE id = ? AND created_by IN (SELECT id FROM client_employees WHERE client_id = ?)`,
    [
      company_name,
      owner_name || null,
      phone,
      alternate_phone || null,
      email || null,
      address || null,
      city || null,
      state || null,
      pincode || null,
      business_type || null,
      requirement || null,
      status || "new",
      next_followup_date || null,
      remarks || null,
      id,
      client_id,
    ]
  );

  if (!result.affectedRows) {
    throw new Error("Lead not found or unauthorized");
  }

  return result;
};