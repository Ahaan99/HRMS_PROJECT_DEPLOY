import { db } from "../../../config/db.js";

export const getMyPerformance = async (employeeCode) => {
  const [rows] = await db.query(
    `
      SELECT *
      FROM performance_records
      WHERE employee_id = ?
      ORDER BY id DESC
      `,
    [employeeCode],
  );

  return rows.map((r) => ({
    id: r.id,

    employeeId: r.employee_id,

    employeeName: r.employee_name,

    department: r.department,

    departmentId: r.department_id,

    period: r.period,

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
