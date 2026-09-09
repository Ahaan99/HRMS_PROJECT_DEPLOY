// _leave-probe.mjs - read-only dump + consistency check of the leave module tables.
// Usage: node scripts/_leave-probe.mjs  (writes scripts/_leave-probe-out.json)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../config/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = {};

try {
  [out.applications] = await db.query(`
    SELECT la.id, la.employee_id, e.name AS employee_name, e.employeeCode, e.email,
           lt.name AS leave_type, la.from_date, la.to_date, la.days, la.status,
           la.approved_by, la.approver_note, la.created_at
    FROM leave_applications la
    LEFT JOIN leave_types lt ON lt.id = la.leave_type_id
    LEFT JOIN employees e ON e.id = la.employee_id
    ORDER BY la.id`);

  [out.balances] = await db.query(`
    SELECT lb.id, lb.employee_id, e.name AS employee_name, e.employeeCode,
           lt.name AS leave_type, lb.year, lb.allocated, lb.used
    FROM leave_balances lb
    LEFT JOIN leave_types lt ON lt.id = lb.leave_type_id
    LEFT JOIN employees e ON e.id = lb.employee_id
    ORDER BY lb.employee_id, lb.leave_type_id`);

  // used vs sum of approved days
  [out.usedMismatch] = await db.query(`
    SELECT lb.employee_id, lb.leave_type_id, lb.year, lb.used,
           COALESCE(SUM(la.days), 0) AS approved_days
    FROM leave_balances lb
    LEFT JOIN leave_applications la
      ON la.employee_id = lb.employee_id AND la.leave_type_id = lb.leave_type_id
     AND la.status = 'Approved' AND YEAR(la.from_date) = lb.year
    GROUP BY lb.id
    HAVING lb.used <> approved_days`);

  [out.orphanApplications] = await db.query(`
    SELECT la.id, la.employee_id FROM leave_applications la
    LEFT JOIN employees e ON e.id = la.employee_id WHERE e.id IS NULL`);

  [out.compOffs] = await db.query(`
    SELECT c.*, e.name AS employee_name FROM comp_offs c
    LEFT JOIN employees e ON e.id = c.employee_id ORDER BY c.id`);

  [out.overtime] = await db.query(`
    SELECT o.*, e.name AS employee_name FROM overtime_requests o
    LEFT JOIN employees e ON e.id = o.employee_id ORDER BY o.id`);

  [out.holidays] = await db.query(`SELECT * FROM holidays ORDER BY holiday_date`);
  [out.types] = await db.query(`SELECT * FROM leave_types ORDER BY id`);

  [out.employees] = await db.query(
    `SELECT id, name, employeeCode, email FROM employees ORDER BY id`
  );

  [out.leaveAppsColumns] = await db.query(`SHOW COLUMNS FROM leave_applications`);
} catch (e) {
  out.error = e.message;
} finally {
  await db.end();
}

fs.writeFileSync(path.join(here, "_leave-probe-out.json"), JSON.stringify(out, null, 1));
console.log("apps", out.applications?.length, "balances", out.balances?.length,
  "usedMismatch", out.usedMismatch?.length, "orphans", out.orphanApplications?.length);
