import {db} from "../../../config/db.js";

// GET ALL
export const getAll = async () => {
  const [rows] = await db.query(
    "SELECT * FROM performance_records ORDER BY id DESC"
  );

  return rows.map((r) => ({
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employee_name,
    department: r.department,
    departmentId: r.department_id,
    period: r.period,

    // 🔥 CONVERT BACK TO OBJECT
    scores: {
      quality: r.quality,
      productivity: r.productivity,
      communication: r.communication,
      teamwork: r.teamwork,
      attendance: r.attendance,
      initiative: r.initiative,
      deadline: r.deadline,
      adaptability: r.adaptability,
    },

    avgScore: r.avg_score,
    status: r.status,
    remarks: r.remarks,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
  }));
};

// CREATE
export const create = async (data) => {
  const sql = `
    INSERT INTO performance_records 
    SET ?
  `;
  return db.query(sql, [data]);
};

// UPDATE
export const update = async (id, data) => {
  return db.query("UPDATE performance_records SET ? WHERE id = ?", [data, id]);
};

// DELETE
export const remove = async (id) => {
  return db.query("DELETE FROM performance_records WHERE id = ?", [id]);
};

// STATS
export const getStats = async () => {
  const [rows] = await db.query(`
    SELECT 
      COUNT(*) as total,
      SUM(status='excellent') as excellent,
      SUM(status='good') as good,
      SUM(status='needs_improvement') as needsImprovement,
      AVG(avg_score) as avgScore
    FROM performance_records
  `);
  return rows[0];
};

// BY EMPLOYEE
export const getByEmployee = async (employeeId) => {
  const [rows] = await db.query(
    "SELECT * FROM performance_records WHERE employeeId = ?",
    [employeeId]
  );
  return rows;
};

// BULK UPDATE
export const bulkUpdate = async (records) => {
  const promises = records.map((r) =>
    db.query("UPDATE performance_records SET ? WHERE id = ?", [r, r.id])
  );
  return Promise.all(promises);
};

// EXPORT CSV
export const exportCSV = async () => {
  const [rows] = await db.query("SELECT * FROM performance_records");

  const csv = [
    Object.keys(rows[0]).join(","),
    ...rows.map((r) => Object.values(r).join(",")),
  ].join("\n");

  return Buffer.from(csv);
};

export const getEmployees = async () => {
  const [rows] = await db.query(`
    SELECT 
      e.id,
      e.employeeCode,
      e.name,
      e.departmentId,
      d.name as departmentName
    FROM employees e
    LEFT JOIN departments d ON d.id = e.departmentId
    WHERE e.isActive = 1
    ORDER BY e.name ASC
  `);

  return rows;
};