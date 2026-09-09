import { db } from "../../../config/db.js";

export const getExitRequestsService = async (status, search) => {
  let query = `SELECT er.*, e.name as employee_name, e.employeeCode, e.email, e.phone, e.departmentId, e.designationId
    FROM exit_requests er
    LEFT JOIN employees e ON e.id = er.employee_id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += " AND er.status = ?";
    params.push(status);
  }

  if (search) {
    query += " AND (e.name LIKE ? OR e.employeeCode LIKE ? OR e.email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += " ORDER BY er.id DESC";

  const [rows] = await db.query(query, params);
  return rows;
};

export const createExitRequestService = async (payload) => {
  const {
    employee_id,
    employee_name,
    resignation_date,
    notice_period_days,
    reason,
    exit_date,
    exit_type,
  } = payload;

  const query = `     INSERT INTO exit_requests 
    (employee_id, employee_name, resignation_date, notice_period_days, reason, exit_date, exit_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  const [result] = await db.query(query, [
    employee_id,
    employee_name,
    resignation_date,
    notice_period_days,
    reason,
    exit_date,
    exit_type || "voluntary",
  ]);

  return result.insertId;
};

export const updateExitStatusService = async (id, payload) => {
  const { status, hr_remarks, exit_interview_date, final_settlement_date } =
    payload;

  const allowedStatus = [
    "pending",
    "approved",
    "rejected",
    "processing",
    "completed",
  ];

  if (!allowedStatus.includes(status)) {
    throw new Error("Invalid status");
  }

  await db.query(
    `UPDATE exit_requests 
     SET status = ?, hr_remarks = ?, exit_interview_date = ?, final_settlement_date = ?
     WHERE id = ?`,
    [
      status,
      hr_remarks || null,
      exit_interview_date || null,
      final_settlement_date || null,
      id,
    ],
  );

  return true;
};

export const deleteExitRequestService = async (id) => {
  await db.query(`DELETE FROM exit_requests WHERE id = ?`, [id]);
  return true;
};

export const getExitStatsService = async () => {
  const [[total]] = await db.query(
    `SELECT COUNT(*) as count FROM exit_requests`,
  );
  const [[pending]] = await db.query(
    `SELECT COUNT(*) as count FROM exit_requests WHERE status = 'pending'`,
  );
  const [[processing]] = await db.query(
    `SELECT COUNT(*) as count FROM exit_requests WHERE status = 'processing'`,
  );
  const [[completed]] = await db.query(
    `SELECT COUNT(*) as count FROM exit_requests WHERE status = 'completed'`,
  );
  const [[rejected]] = await db.query(
    `SELECT COUNT(*) as count FROM exit_requests WHERE status = 'rejected'`,
  );

  const [recent] = await db.query(`     SELECT er.*, e.name as employee_name
    FROM exit_requests er
    LEFT JOIN employees e ON e.id = er.employee_id
    ORDER BY er.id DESC LIMIT 5
  `);

  return {
    total: total.count,
    pending: pending.count,
    processing: processing.count,
    completed: completed.count,
    rejected: rejected.count,
    recent,
  };
};
