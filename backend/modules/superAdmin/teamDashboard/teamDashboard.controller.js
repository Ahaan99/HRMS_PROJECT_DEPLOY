import { db } from "../../../config/db.js";
import { syncUsed } from "../../leave/leave.controller.js";

/* Helper: run a query, return fallback on any error (missing table etc.) */
const safeQuery = async (sql, params = [], fallback = []) => {
  try {
    const [rows] = await db.query(sql, params);
    return rows;
  } catch {
    return fallback;
  }
};

/* =====================================================
   GET /api/super-admin/team-dashboard/summary
   Roles: SUPER_ADMIN, MANAGER, TL
   Returns team-wide stats for Manager / TL dashboards
===================================================== */
export const getTeamSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [
      empCount,
      deptCount,
      todayAttendance,
      pendingLeaves,
      pendingCompOffs,
      upcomingHolidays,
      recentLeaves,
      attendanceToday,
      deptBreakdown,
    ] = await Promise.all([
      safeQuery("SELECT COUNT(*) AS total FROM employees", [], [{ total: 0 }]),
      safeQuery("SELECT COUNT(*) AS total FROM departments", [], [{ total: 0 }]),
      safeQuery(
        `SELECT
           SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
           SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) AS late,
           COUNT(*) AS total
         FROM super_admin_attendance WHERE date = ?`,
        [today],
        [{ present: 0, late: 0, total: 0 }],
      ),
      safeQuery(
        "SELECT COUNT(*) AS total FROM leave_applications WHERE status = 'Pending'",
        [],
        [{ total: 0 }],
      ),
      safeQuery(
        "SELECT COUNT(*) AS total FROM comp_offs WHERE status = 'Pending'",
        [],
        [{ total: 0 }],
      ),
      safeQuery(
        `SELECT id, name, DATE_FORMAT(holiday_date,'%Y-%m-%d') AS holiday_date, description
         FROM holidays WHERE holiday_date >= ? ORDER BY holiday_date ASC LIMIT 5`,
        [today],
      ),
      safeQuery(
        `SELECT la.id, la.employee_id, la.days, la.status, la.reason,
                DATE_FORMAT(la.from_date,'%Y-%m-%d') AS from_date,
                DATE_FORMAT(la.to_date,'%Y-%m-%d') AS to_date,
                lt.name AS leave_type,
                e.name AS employee_name
         FROM leave_applications la
         LEFT JOIN leave_types lt ON lt.id = la.leave_type_id
         LEFT JOIN employees e ON e.id = la.employee_id
         ORDER BY la.created_at DESC LIMIT 8`,
      ),
      safeQuery(
        `SELECT id, employee_id, employee_name, status, method,
                TIME_FORMAT(check_in, '%H:%i') AS check_in,
                TIME_FORMAT(check_out, '%H:%i') AS check_out
         FROM super_admin_attendance WHERE date = ?
         ORDER BY check_in ASC LIMIT 12`,
        [today],
      ),
      safeQuery(
        `SELECT d.name AS department, COUNT(e.id) AS count
         FROM departments d
         LEFT JOIN employees e ON e.departmentId = d.id
         GROUP BY d.id, d.name
         ORDER BY count DESC LIMIT 8`,
      ),
    ]);

    const att = todayAttendance[0] || { present: 0, late: 0, total: 0 };
    const totalEmp = Number(empCount[0]?.total || 0);
    const checkedIn = Number(att.total || 0);

    res.json({
      success: true,
      data: {
        totals: {
          employees: totalEmp,
          departments: Number(deptCount[0]?.total || 0),
          presentToday: Number(att.present || 0),
          lateToday: Number(att.late || 0),
          checkedInToday: checkedIn,
          absentToday: Math.max(totalEmp - checkedIn, 0),
          pendingLeaves: Number(pendingLeaves[0]?.total || 0),
          pendingCompOffs: Number(pendingCompOffs[0]?.total || 0),
        },
        upcomingHolidays,
        recentLeaves,
        attendanceToday,
        deptBreakdown,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* =====================================================
   PATCH /api/super-admin/team-dashboard/leaves/:id
   Roles: SUPER_ADMIN, MANAGER, TL
   Approve / Reject a leave application from the dashboard
===================================================== */
export const decideLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "status must be Approved or Rejected" });
    }

    const approver = req.user?.name || req.user?.email || req.user?.role || "Manager";

    const [result] = await db.query(
      `UPDATE leave_applications
       SET status = ?, approver_note = ?, approved_by = ?
       WHERE id = ? AND status = 'Pending'`,
      [status, note || null, approver, id],
    );

    if (!result.affectedRows) {
      return res
        .status(404)
        .json({ success: false, message: "Leave not found or already decided" });
    }

    /* If approved, re-derive the employee's balance (creates the balance row if missing) */
    if (status === "Approved") {
      const [[la]] = await db.query(
        "SELECT employee_id, leave_type_id, YEAR(from_date) AS yr FROM leave_applications WHERE id = ?",
        [id],
      );
      if (la) await syncUsed(la.employee_id, la.leave_type_id, la.yr);
    }

    res.json({ success: true, message: `Leave ${status.toLowerCase()}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
