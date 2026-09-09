import { db } from "../../../config/db.js";

const num = (v) => Number(v || 0);
const round2 = (v) => Math.round(v * 100) / 100;

/**
 * Auto-generates payroll for every eligible employee for a given month.
 * Rules:
 *  - Only active employees with salary > 0 who joined on/before month end.
 *  - First month is prorated from the date of joining.
 *  - Attendance: PRESENT/LATE/WFH = 1 day, HALF_DAY = 0.5, ABSENT = unpaid.
 *  - If no attendance was recorded at all, the full prorated period is paid.
 *  - Deductions: unpaid absent days + PF 12% + ESIC 0.75% of earned basic.
 *  - Employees who already have payroll for the month are skipped.
 */
export const runAutoPayroll = async (payroll_month) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payroll_month || "")) {
    throw new Error("payroll_month must be in YYYY-MM format");
  }

  const [year, month] = payroll_month.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStart = `${payroll_month}-01`;
  const monthEnd = `${payroll_month}-${String(daysInMonth).padStart(2, "0")}`;

  const [employees] = await db.query(
    `SELECT id, name, employeeCode, salary, joiningDate
     FROM employees
     WHERE isActive = 1 AND salary > 0 AND joiningDate <= ?`,
    [monthEnd],
  );

  const [attendance] = await db.query(
    `SELECT employee_id, status, COUNT(*) AS cnt
     FROM super_admin_attendance
     WHERE date BETWEEN ? AND ? AND is_active = 1
     GROUP BY employee_id, status`,
    [monthStart, monthEnd],
  );

  const attMap = {};
  for (const row of attendance) {
    if (!attMap[row.employee_id]) attMap[row.employee_id] = {};
    attMap[row.employee_id][row.status] = Number(row.cnt);
  }

  const [existing] = await db.query(
    `SELECT employee_id FROM admin_payroll WHERE payroll_month = ?`,
    [payroll_month],
  );
  const existingSet = new Set(existing.map((r) => r.employee_id));

  const results = [];
  let generated = 0;
  let skipped = 0;

  for (const emp of employees) {
    if (existingSet.has(emp.id)) {
      skipped++;
      results.push({
        employeeCode: emp.employeeCode,
        name: emp.name,
        skipped: true,
        reason: "Payroll already exists for this month",
      });
      continue;
    }

    const joining = new Date(emp.joiningDate);
    const joinDay =
      joining.getFullYear() === year && joining.getMonth() + 1 === month
        ? joining.getDate()
        : 1;
    const payableDaysInMonth = daysInMonth - joinDay + 1;

    const att = attMap[emp.id] || {};
    const fullDays = (att.PRESENT || 0) + (att.LATE || 0) + (att.WFH || 0);
    const halfDays = att.HALF_DAY || 0;
    const absentDays = att.ABSENT || 0;
    const hasAttendance =
      fullDays + halfDays + absentDays + (att.LEAVE || 0) > 0;

    const perDay = num(emp.salary) / daysInMonth;
    const paidDays = hasAttendance
      ? Math.min(fullDays + halfDays * 0.5, payableDaysInMonth)
      : payableDaysInMonth;

    const earnedBasic = round2(perDay * paidDays);
    const absentDeduction = round2(perDay * absentDays);
    const gross = earnedBasic;
    const pf = round2(gross * 0.12);
    const esic = round2(gross * 0.0075);
    const net = round2(gross - pf - esic);

    await db.query(
      `INSERT INTO admin_payroll
         (employee_id, payroll_month, basic_salary, hra, ta, da,
          overtime_amount, gross_salary, pf, esic, net_salary)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [emp.id, payroll_month, earnedBasic, 0, 0, 0, 0, gross, pf, esic, net],
    );

    generated++;
    results.push({
      employeeCode: emp.employeeCode,
      name: emp.name,
      joiningDate: emp.joiningDate,
      payableDaysInMonth,
      paidDays,
      absentDays,
      absentDeduction,
      gross,
      pf,
      esic,
      net,
    });
  }

  return { payroll_month, generated, skipped, results };
};

/**
 * Dependency-free monthly scheduler: checks hourly; on the 1st of the month
 * it auto-generates payroll for the previous month. runAutoPayroll skips
 * employees whose payroll already exists, so repeat runs are harmless.
 */
export const startPayrollScheduler = () => {
  const tick = async () => {
    const now = new Date();
    if (now.getDate() !== 1) return;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    try {
      const res = await runAutoPayroll(month);
      if (res.generated > 0) {
        console.log(
          `[payroll-scheduler] Auto-generated payroll for ${month}: ${res.generated} employee(s)`,
        );
      }
    } catch (err) {
      console.error("[payroll-scheduler] failed:", err.message);
    }
  };

  tick(); // run once on boot (covers restarts on the 1st)
  setInterval(tick, 60 * 60 * 1000); // check hourly
};
