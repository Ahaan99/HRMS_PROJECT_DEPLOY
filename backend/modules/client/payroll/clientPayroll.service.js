import { db } from "../../../config/db.js";

// Custom error so controller can return 400 instead of 500
export class PayrollValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PayrollValidationError";
    this.statusCode = 400;
  }
}

const toNumber = (value, label) => {
  if (value === undefined || value === null || value === "") return 0;
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new PayrollValidationError(`${label} must be a valid number`);
  }
  if (n < 0) {
    throw new PayrollValidationError(`${label} cannot be negative`);
  }
  return n;
};

// ==============================
// CREATE / UPDATE payroll
// ==============================
export const upsertPayrollService = async (client_id, payload) => {
  const employeeCode = payload.employee_id;

  if (!employeeCode) {
    throw new PayrollValidationError("Employee is required");
  }

  // STEP 1 — verify employee belongs to this client
  const [[emp]] = await db.query(
    `
    SELECT id
    FROM client_employees
    WHERE client_id = ?
      AND id = ?
    LIMIT 1
    `,
    [client_id, employeeCode],
  );

  if (!emp) {
    throw new PayrollValidationError("Employee not found for this client");
  }
  const employee_id = emp.id;
  const payroll_month = String(payload.payroll_month || "").trim();

  if (!/^\d{4}-\d{2}$/.test(payroll_month)) {
    throw new PayrollValidationError(
      "Invalid payroll month format. Use YYYY-MM",
    );
  }

  // STEP 2 — validate all numeric fields (junk text like "fd" is rejected)
  const basic_salary = toNumber(payload.basic_salary, "Basic salary");
  const hra = toNumber(payload.hra, "HRA");
  const ta = toNumber(payload.ta, "TA");
  const da = toNumber(payload.da, "DA");
  const attendance_days = Math.round(
    toNumber(payload.attendance_days, "Attendance days"),
  );
  const overtime_amount = toNumber(payload.overtime_amount, "Overtime amount");
  const pf = toNumber(payload.pf, "PF");
  const esic = toNumber(payload.esic, "ESIC");

  if (attendance_days > 31) {
    throw new PayrollValidationError("Attendance days cannot exceed 31");
  }

  // ==============================
  // CALCULATIONS
  // ==============================
  const gross_salary = basic_salary + hra + ta + da + overtime_amount;

  // PF and ESIC are deductions
  const net_salary = gross_salary - pf - esic;

  if (net_salary < 0) {
    throw new PayrollValidationError(
      "Deductions (PF + ESIC) cannot exceed gross salary",
    );
  }

  const query = `
    INSERT INTO client_payroll
    (client_id, employee_id, payroll_month,
     basic_salary, hra, ta, da,
     attendance_days, overtime_amount,
     gross_salary, pf, esic, net_salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      basic_salary = VALUES(basic_salary),
      hra = VALUES(hra),
      ta = VALUES(ta),
      da = VALUES(da),
      attendance_days = VALUES(attendance_days),
      overtime_amount = VALUES(overtime_amount),
      gross_salary = VALUES(gross_salary),
      pf = VALUES(pf),
      esic = VALUES(esic),
      net_salary = VALUES(net_salary)
  `;

  const values = [
    client_id,
    employee_id,
    payroll_month,
    basic_salary,
    hra,
    ta,
    da,
    attendance_days,
    overtime_amount,
    gross_salary,
    pf,
    esic,
    net_salary,
  ];

  const [result] = await db.query(query, values);
  return result;
};

// ==============================
// GET payroll list
// ==============================
export const getPayrollListService = async (client_id) => {
  const query = `
  SELECT 
    p.*,
    e.name AS employee_name,
    e.designationId AS designation
  FROM client_payroll p
  LEFT JOIN client_employees e
    ON e.id = p.employee_id
  WHERE p.client_id = ?
  ORDER BY p.id DESC
`;
  const [rows] = await db.query(query, [client_id]);
  return rows;
};

// ==============================
// DELETE payroll
// ==============================
export const deletePayrollService = async (client_id, id) => {
  const [result] = await db.query(
    `DELETE FROM client_payroll WHERE id = ? AND client_id = ?`,
    [id, client_id],
  );
  return result;
};
