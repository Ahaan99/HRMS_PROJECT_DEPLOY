import { db } from "../../../config/db.js";

// ===============================
// helper 
// ===============================
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );
  if (!rows.length) throw new Error("Client not found");
  return rows[0].id;
};

// ===============================
// CREATE
// ===============================
export const createClientSalesService = async (client_code, payload) => {
  const client_id = await getClientId(client_code);



  const {
    employee_id,
    customer_name,
    phone,
    email,
    call_time,
    call_date,
    status,
    follow_up_datetime,
    remarks,
    sold_date,
  } = payload;

  // ===============================
  // 🔥 AUTO GENERATE CALL ID
  // ===============================
  const [[last]] = await db.query(
    `SELECT id FROM client_sales_calls
     WHERE client_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [client_id]
  );

  const nextNumber = (last?.id || 0) + 1;
  const call_id = `CALL-${String(nextNumber).padStart(6, "0")}`;
  
  const [result] = await db.query(
    `INSERT INTO client_sales_calls
     (client_id, employee_id, call_id, customer_name, phone, email,
      call_time, call_date, status, follow_up_datetime, remarks, sold_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      employee_id,
      call_id,
      customer_name || null,
      phone || null,
      email || null,
      call_time || null,
      call_date || null,
      status || "hold",
      follow_up_datetime || null,
      remarks || null,
      sold_date || null,
    ]
  );

  return result.insertId;
};

// ===============================
// LIST (admin vs employee)
// ===============================
export const getClientSalesListService = async (
  client_code,
  employee_id = null,
  filters = {}
) => {
  const client_id = await getClientId(client_code);

  let where = `WHERE c.client_id = ?`;
  const params = [client_id];

  // 🔐 employee restriction
  if (employee_id) {
    where += ` AND c.employee_id = ?`;
    params.push(employee_id);
  }

  // 🔍 search
  if (filters.search) {
    where += ` AND (
      c.customer_name LIKE ?
      OR c.phone LIKE ?
      OR c.email LIKE ?
      OR c.call_id LIKE ?
    )`;
    params.push(
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`,
      `%${filters.search}%`
    );
  }

  // 🎯 status filter
  if (filters.status && filters.status !== "all") {
    where += ` AND c.status = ?`;
    params.push(filters.status);
  }

  const [rows] = await db.query(
    `
    SELECT 
      c.*,
      e.name AS employee_name
    FROM client_sales_calls c
    LEFT JOIN client_employees e ON e.id = c.employee_id
    ${where}
    ORDER BY c.id DESC
  `,
    params
  );

  return rows;
};

// ===============================
// STATS (for StatCards)
// ===============================
export const getClientSalesStatsService = async (
  client_code,
  employee_id = null
) => {
  const client_id = await getClientId(client_code);

  let where = `WHERE client_id = ?`;
  const params = [client_id];

  if (employee_id) {
    where += ` AND employee_id = ?`;
    params.push(employee_id);
  }

  const [[stats]] = await db.query(
    `
    SELECT
      COUNT(*) AS total_calls,
      SUM(status = 'accepted') AS leads_generated,
      SUM(sold_date IS NOT NULL) AS total_sales,
      SUM(follow_up_datetime >= NOW() AND status != 'rejected') AS need_followups,
      SUM(follow_up_datetime IS NOT NULL AND status != 'rejected') AS total_followups,
      SUM(follow_up_datetime < NOW() AND status != 'rejected') AS pending_followups
    FROM client_sales_calls
    ${where}
  `,
    params
  );

  return stats;
};



// ===============================
// UPDATE
// ===============================
export const updateClientSalesService = async (
  client_code,
  id,
  payload
) => {
  const client_id = await getClientId(client_code);

  // ===============================
  // helper formatters
  // ===============================
  const toDate = (val) => {
    if (!val) return null;
    return new Date(val).toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const toDateTime = (val) => {
    if (!val) return null;
    return new Date(val)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // YYYY-MM-DD HH:mm:ss
  };

  // ===============================
  // get existing call_id (IMPORTANT)
  // ===============================
  const [existing] = await db.query(
    `SELECT call_id FROM client_sales_calls
     WHERE id = ? AND client_id = ?
     LIMIT 1`,
    [id, client_id]
  );

  if (!existing.length) {
    throw new Error("Record not found");
  }

  const existingCallId = existing[0].call_id;

  // ===============================
  // payload
  // ===============================
  const {
    employee_id,
    call_id,
    customer_name,
    phone,
    email,
    call_time,
    call_date,
    status,
    follow_up_datetime,
    remarks,
    sold_date,
  } = payload;

  // ===============================
  // FINAL VALUES
  // ===============================
  const finalCallId = call_id || existingCallId;

  const finalCallDate = toDate(call_date);
  const finalFollowUp = toDateTime(follow_up_datetime);
  const finalSoldDate = toDate(sold_date);

  const finalCallTime = call_time
    ? call_time.length === 5
      ? `${call_time}:00`
      : call_time
    : null;

  // ===============================
  // UPDATE
  // ===============================
  const [result] = await db.query(
    `UPDATE client_sales_calls
     SET
       employee_id = ?,
       call_id = ?,
       customer_name = ?,
       phone = ?,
       email = ?,
       call_time = ?,
       call_date = ?,
       status = ?,
       follow_up_datetime = ?,
       remarks = ?,
       sold_date = ?
     WHERE id = ?
       AND client_id = ?`,
    [
      Number(employee_id),
      finalCallId,
      customer_name || null,
      phone || null,
      email || null,
      finalCallTime,
      finalCallDate,
      status || "hold",
      finalFollowUp,
      remarks || null,
      finalSoldDate,
      id,
      client_id,
    ]
  );

  return result;
};

