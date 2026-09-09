import { db } from "../../../config/db.js";

// ================= CREATE =================
export const createFieldSalesService = async (employeeId, payload) => {
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
    `INSERT INTO field_sales_leads
     (created_by, company_name, owner_name, phone, alternate_phone,
      email, address, city, state, pincode, business_type,
      requirement, status, next_followup_date, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employeeId,
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
  employeeId,
  filters = {}
) => {
  let where = `WHERE created_by = ?`;
  const params = [employeeId];

  // 🔍 search
  if (filters.search) {
    where += ` AND (
      company_name LIKE ?
      OR phone LIKE ?
      OR owner_name LIKE ?
    )`;
    params.push(
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`
    );
  }

  // 🎯 status
  if (filters.status && filters.status !== "all") {
    where += ` AND status = ?`;
    params.push(filters.status);
  }

  const [rows] = await db.query(
    `SELECT f.*, e.name AS employee_name
     FROM field_sales_leads f
     LEFT JOIN employees e ON e.id = f.created_by
     ${where}
     ORDER BY f.id DESC`,
    params
  );

  return rows;
};

// ================= UPDATE =================
export const updateFieldSalesService = async (
  employeeId,
  id,
  payload
) => {
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
     WHERE id = ? AND created_by = ?`,
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
      employeeId,
    ]
  );

  if (!result.affectedRows) {
    throw new Error("Lead not found or unauthorized");
  }

  return result;
};

// ================= UPDATE LOCATION =================
export const updateFieldSalesLocationService = async (
  employeeId,
  id,
  payload
) => {
  const { latitude, longitude, address } = payload;

  const [result] = await db.query(
    `UPDATE field_sales_leads
     SET latitude = ?, longitude = ?, geo_address = ?
     WHERE id = ? AND created_by = ?`,
    [latitude, longitude, address, id, employeeId]
  );

  if (!result.affectedRows) {
    throw new Error("Lead not found or unauthorized");
  }

  return result;
};