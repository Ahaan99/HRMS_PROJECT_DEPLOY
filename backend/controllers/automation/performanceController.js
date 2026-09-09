import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getPerformance = asyncHandler(async (req, res) => {
  const { employee_id, period_type, period_date, status } = req.query;
  
  let query = `
    SELECT ps.*, ce.name as employee_name, ce.employeeCode, pm.metric_name, pm.weight
    FROM performance_scores ps
    JOIN client_employees ce ON ps.employee_id = ce.id
    LEFT JOIN performance_metrics pm ON ps.metric_id = pm.id
    WHERE ce.client_id = ?
  `;
  const params = [req.user.clientId];

  if (employee_id) {
    query += " AND ps.employee_id = ?";
    params.push(employee_id);
  }
  if (period_type) {
    query += " AND ps.period_type = ?";
    params.push(period_type);
  }
  if (period_date) {
    query += " AND ps.period_date = ?";
    params.push(period_date);
  }
  if (status) {
    query += " AND ps.status = ?";
    params.push(status);
  }

  query += " ORDER BY ps.period_date DESC, ce.name";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const calculatePerformance = asyncHandler(async (req, res) => {
  const { employee_id, period_type, period_date } = req.body;
  
  const [targets] = await db.query(
    "SELECT * FROM work_targets WHERE employee_id = ? AND target_date = ? AND target_type = ?",
    [employee_id, period_date, period_type]
  );

  const [assignments] = await db.query(
    "SELECT * FROM work_assignments WHERE employee_id = ? AND status = 'COMPLETED'",
    [employee_id]
  );

  const [eodReports] = await db.query(
    "SELECT * FROM eod_reports WHERE employee_id = ? AND report_date = ?",
    [employee_id, period_date]
  );

  const [attendance] = await db.query(
    "SELECT * FROM client_attendance WHERE employee_id = ? AND attendance_date = ?",
    [employee_id, period_date]
  );

  let score = 100;
  let deductions = [];

  if (targets.length > 0) {
    for (const target of targets) {
      if (target.target_value > 0) {
        const percentage = (target.achieved_value / target.target_value) * 100;
        if (percentage < 80) {
          score -= (80 - percentage);
          deductions.push({ type: "TARGET", detail: `Target ${percentage.toFixed(1)}% achieved` });
        }
      }
    }
  }

  if (assignments.length > 0) {
    const totalAssignments = assignments.length;
    const completedOnTime = assignments.filter(a => {
      if (!a.due_date) return true;
      return new Date(a.updated_at) <= new Date(a.due_date);
    }).length;
    
    if (completedOnTime / totalAssignments < 0.8) {
      score -= 10;
      deductions.push({ type: "ASSIGNMENTS", detail: "Below 80% assignment completion" });
    }
  }

  if (eodReports.length === 0) {
    score -= 5;
    deductions.push({ type: "NO_EOD", detail: "EOD report not submitted" });
  }

  if (attendance.length > 0) {
    if (attendance[0].status === "ABSENT") {
      score -= 20;
      deductions.push({ type: "ABSENT", detail: "Absent for the day" });
    } else if (attendance[0].status === "HALF_DAY") {
      score -= 10;
      deductions.push({ type: "HALFDAY", detail: "Half day attendance" });
    }
  }

  score = Math.max(0, Math.min(100, score));

  let status = "GREEN";
  if (score < 70) status = "RED";
  else if (score < 90) status = "YELLOW";

  const [existing] = await db.query(
    "SELECT id FROM performance_scores WHERE employee_id = ? AND period_date = ? AND period_type = ?",
    [employee_id, period_date, period_type]
  );

  let result;
  if (existing.length > 0) {
    await db.query(
      "UPDATE performance_scores SET score = ?, total_score = 100, status = ?, deductions = ? WHERE id = ?",
      [score, status, JSON.stringify(deductions), existing[0].id]
    );
    result = existing[0].id;
  } else {
    const [insertResult] = await db.query(
      `INSERT INTO performance_scores (employee_id, score, total_score, status, period_type, period_date)
       VALUES (?, ?, 100, ?, ?, ?)`,
      [employee_id, score, status, period_type, period_date]
    );
    result = insertResult.insertId;
  }

  res.json({ 
    success: true, 
    data: { 
      id: result,
      score, 
      status,
      deductions,
      message: status === "GREEN" ? "Excellent performance!" : status === "YELLOW" ? "Room for improvement" : "Needs immediate attention"
    } 
  });
});

const getPerformanceReports = asyncHandler(async (req, res) => {
  const { period_type, start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      ps.period_date,
      ps.period_type,
      ps.status,
      COUNT(*) as total_employees,
      SUM(CASE WHEN ps.status = 'GREEN' THEN 1 ELSE 0 END) as green_count,
      SUM(CASE WHEN ps.status = 'YELLOW' THEN 1 ELSE 0 END) as yellow_count,
      SUM(CASE WHEN ps.status = 'RED' THEN 1 ELSE 0 END) as red_count,
      AVG(ps.score) as avg_score
    FROM performance_scores ps
    JOIN client_employees ce ON ps.employee_id = ce.id
    WHERE ce.client_id = ?
  `;
  const params = [req.user.clientId];

  if (period_type) {
    query += " AND ps.period_type = ?";
    params.push(period_type);
  }
  if (start_date) {
    query += " AND ps.period_date >= ?";
    params.push(start_date);
  }
  if (end_date) {
    query += " AND ps.period_date <= ?";
    params.push(end_date);
  }

  query += " GROUP BY ps.period_date, ps.period_type ORDER BY ps.period_date DESC";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const getEmployeePerformance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period_type } = req.query;

  const [employee] = await db.query(
    "SELECT * FROM client_employees WHERE id = ? AND client_id = ?",
    [id, req.user.clientId]
  );

  if (employee.length === 0) {
    return res.status(404).json({ success: false, message: "Employee not found" });
  }

  const [scores] = await db.query(
    `SELECT * FROM performance_scores 
     WHERE employee_id = ? ${period_type ? "AND period_type = ?" : ""}
     ORDER BY period_date DESC LIMIT 30`,
    period_type ? [id, period_type] : [id]
  );

  const [targets] = await db.query(
    "SELECT * FROM work_targets WHERE employee_id = ? ORDER BY target_date DESC LIMIT 10",
    [id]
  );

  const [assignments] = await db.query(
    "SELECT * FROM work_assignments WHERE employee_id = ? ORDER BY created_at DESC LIMIT 10",
    [id]
  );

  const [eodReports] = await db.query(
    "SELECT * FROM eod_reports WHERE employee_id = ? ORDER BY report_date DESC LIMIT 10",
    [id]
  );

  res.json({ 
    success: true, 
    data: { 
      employee: employee[0],
      performance_scores: scores,
      targets,
      assignments,
      eod_reports: eodReports
    } 
  });
});

const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const [rows] = await db.query("SELECT * FROM performance_metrics WHERE isActive = 1 ORDER BY weight DESC");
  res.json({ success: true, data: rows });
});

const createPerformanceMetric = asyncHandler(async (req, res) => {
  const { metric_name, weight, description } = req.body;
  
  const [result] = await db.query(
    "INSERT INTO performance_metrics (metric_name, weight, description) VALUES (?, ?, ?)",
    [metric_name, weight || 1, description]
  );

  res.json({ success: true, message: "Metric created", data: { id: result.insertId } });
});

const updatePerformanceMetric = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { metric_name, weight, description, isActive } = req.body;

  await db.query(
    "UPDATE performance_metrics SET metric_name = ?, weight = ?, description = ?, isActive = ? WHERE id = ?",
    [metric_name, weight, description, isActive ?? 1, id]
  );

  res.json({ success: true, message: "Metric updated" });
});

export { 
  getPerformance, 
  calculatePerformance, 
  getPerformanceReports, 
  getEmployeePerformance,
  getPerformanceMetrics,
  createPerformanceMetric,
  updatePerformanceMetric
};
