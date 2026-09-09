import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getTargets = asyncHandler(async (req, res) => {
  const { employee_id, target_type, target_date, status } = req.query;
  
  let query = `
    SELECT wt.*, ce.name as employee_name, ce.employeeCode
    FROM work_targets wt
    JOIN client_employees ce ON wt.employee_id = ce.id
    WHERE ce.client_id = ?
  `;
  const params = [req.user.clientId];

  if (employee_id) {
    query += " AND wt.employee_id = ?";
    params.push(employee_id);
  }
  if (target_type) {
    query += " AND wt.target_type = ?";
    params.push(target_type);
  }
  if (target_date) {
    query += " AND wt.target_date = ?";
    params.push(target_date);
  }
  if (status) {
    query += " AND wt.status = ?";
    params.push(status);
  }

  query += " ORDER BY wt.target_date DESC, ce.name";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const createTarget = asyncHandler(async (req, res) => {
  const { employee_id, target_type, target_name, target_value, target_date } = req.body;
  
  const [result] = await db.query(
    `INSERT INTO work_targets (employee_id, target_type, target_name, target_value, target_date)
     VALUES (?, ?, ?, ?, ?)`,
    [employee_id, target_type, target_name, target_value, target_date]
  );

  res.json({ success: true, message: "Target created", data: { id: result.insertId } });
});

const updateTarget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { target_value, achieved_value, status } = req.body;

  let query = "UPDATE work_targets SET";
  const params = [];
  const updates = [];

  if (target_value !== undefined) {
    updates.push(" target_value = ?");
    params.push(target_value);
  }
  if (achieved_value !== undefined) {
    updates.push(" achieved_value = ?");
    params.push(achieved_value);
    
    if (target_value) {
      const newAchieved = achieved_value;
      const newStatus = newAchieved >= target_value ? 
        (newAchieved > target_value ? "EXCEEDED" : "ACHIEVED") : "PENDING";
      updates.push(" status = ?");
      params.push(newStatus);
    }
  }
  if (status) {
    updates.push(" status = ?");
    params.push(status);
  }

  query += updates.join(",") + " WHERE id = ?";
  params.push(id);

  await db.query(query, params);
  res.json({ success: true, message: "Target updated" });
});

const getAssignments = asyncHandler(async (req, res) => {
  const { employee_id, status, priority } = req.query;
  
  let query = `
    SELECT wa.*, ce.name as employee_name, ce.employeeCode
    FROM work_assignments wa
    JOIN client_employees ce ON wa.employee_id = ce.id
    WHERE wa.client_id = ?
  `;
  const params = [req.user.clientId];

  if (employee_id) {
    query += " AND wa.employee_id = ?";
    params.push(employee_id);
  }
  if (status) {
    query += " AND wa.status = ?";
    params.push(status);
  }
  if (priority) {
    query += " AND wa.priority = ?";
    params.push(priority);
  }

  query += " ORDER BY wa.due_date ASC, FIELD(wa.priority, 'HIGH', 'MEDIUM', 'LOW')";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const createAssignment = asyncHandler(async (req, res) => {
  const { employee_id, assignment_title, description, due_date, priority } = req.body;
  
  const [result] = await db.query(
    `INSERT INTO work_assignments (client_id, employee_id, assignment_title, description, due_date, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.clientId, employee_id, assignment_title, description, due_date, priority || "MEDIUM"]
  );

  res.json({ success: true, message: "Assignment created", data: { id: result.insertId } });
});

const updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, description } = req.body;

  let query = "UPDATE work_assignments SET";
  const params = [];
  const updates = [];

  if (status) {
    updates.push(" status = ?");
    params.push(status);
    
    if (status === "OVERDUE") {
      updates.push(" status = 'OVERDUE'");
    }
  }
  if (description) {
    updates.push(" description = ?");
    params.push(description);
  }

  query += updates.join(",") + " WHERE id = ?";
  params.push(id);

  await db.query(query, params);
  res.json({ success: true, message: "Assignment updated" });
});

const submitEodReport = asyncHandler(async (req, res) => {
  const { employee_id, tasks_completed, challenges, tomorrow_plan, hours_worked } = req.body;
  const report_date = new Date().toISOString().split("T")[0];
  
  const [existing] = await db.query(
    "SELECT id FROM eod_reports WHERE employee_id = ? AND report_date = ?",
    [employee_id, report_date]
  );

  if (existing.length > 0) {
    await db.query(
      `UPDATE eod_reports SET tasks_completed = ?, challenges = ?, tomorrow_plan = ?, hours_worked = ?
       WHERE id = ?`,
      [tasks_completed, challenges, tomorrow_plan, hours_worked, existing[0].id]
    );
    
    return res.json({ 
      success: true, 
      message: "EOD report updated", 
      data: { id: existing[0].id } 
    });
  }

  const [result] = await db.query(
    `INSERT INTO eod_reports (client_id, employee_id, report_date, tasks_completed, challenges, tomorrow_plan, hours_worked)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.user.clientId, employee_id, report_date, tasks_completed, challenges, tomorrow_plan, hours_worked]
  );

  res.json({ success: true, message: "EOD report submitted", data: { id: result.insertId } });
});

const getEodReports = asyncHandler(async (req, res) => {
  const { employee_id, start_date, end_date } = req.query;
  
  let query = `
    SELECT er.*, ce.name as employee_name, ce.employeeCode
    FROM eod_reports er
    JOIN client_employees ce ON er.employee_id = ce.id
    WHERE er.client_id = ?
  `;
  const params = [req.user.clientId];

  if (employee_id) {
    query += " AND er.employee_id = ?";
    params.push(employee_id);
  }
  if (start_date) {
    query += " AND er.report_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND er.report_date <= ?";
    params.push(end_date);
  }

  query += " ORDER BY er.report_date DESC, ce.name";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const [todayAttendance] = await db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_day
     FROM client_attendance 
     WHERE client_id = ? AND attendance_date = ?`,
    [req.user.clientId, today]
  );

  const [todayEod] = await db.query(
    `SELECT COUNT(*) as submitted FROM eod_reports WHERE client_id = ? AND report_date = ?`,
    [req.user.clientId, today]
  );

  const [todayTargets] = await db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'ACHIEVED' OR status = 'EXCEEDED' THEN 1 ELSE 0 END) as achieved
     FROM work_targets wt
     JOIN client_employees ce ON wt.employee_id = ce.id
     WHERE ce.client_id = ? AND wt.target_date = ?`,
    [req.user.clientId, today]
  );

  const [pendingAssignments] = await db.query(
    `SELECT COUNT(*) as count FROM work_assignments 
     WHERE client_id = ? AND status IN ('PENDING', 'IN_PROGRESS')`,
    [req.user.clientId]
  );

  const [performanceSummary] = await db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN ps.status = 'GREEN' THEN 1 ELSE 0 END) as green,
      SUM(CASE WHEN ps.status = 'YELLOW' THEN 1 ELSE 0 END) as yellow,
      SUM(CASE WHEN ps.status = 'RED' THEN 1 ELSE 0 END) as red
     FROM performance_scores ps
     JOIN client_employees ce ON ps.employee_id = ce.id
     WHERE ce.client_id = ? AND ps.period_date = ?`,
    [req.user.clientId, today]
  );

  res.json({ 
    success: true, 
    data: {
      attendance: todayAttendance[0],
      eod_submitted: todayEod[0].submitted,
      targets_achieved: todayTargets[0],
      pending_assignments: pendingAssignments[0].count,
      performance: performanceSummary[0]
    }
  });
});

export { 
  getTargets, 
  createTarget, 
  updateTarget, 
  getAssignments, 
  createAssignment, 
  updateAssignment,
  submitEodReport,
  getEodReports,
  getDashboardStats
};
