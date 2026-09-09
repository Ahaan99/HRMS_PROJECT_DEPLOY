import {db} from "../../../config/db.js";

// ASSIGNMENTS
export const getAssignments = async () => {
  const [rows] = await db.query("SELECT * FROM work_assignments ORDER BY id DESC");
  return rows;
};

export const createAssignment = (data) =>{
  return db.query("INSERT INTO work_assignments SET ?", [data]);
}

export const updateAssignment = (id, data) =>
  db.query(
    `UPDATE work_assignments 
     SET title=?, description=?, assigned_to=?, assigned_to_name=?, 
         department=?, department_id=?, priority=?, status=?, 
         due_date=?, progress=? 
     WHERE id=?`,
    [
      data.title,
      data.description,
      data.assigned_to,
      data.assigned_to_name,
      data.department,
      data.department_id,
      data.priority,
      data.status,
      data.due_date,
      data.progress,
      id,
    ]
  );
  
export const deleteAssignment = (id) =>
  db.query("DELETE FROM work_assignments WHERE id = ?", [id]);

export const getAssignmentStats = async () => {
  const [rows] = await db.query(`
    SELECT 
      COUNT(*) total,
      SUM(status='pending') pending,
      SUM(status='in_progress') inProgress,
      SUM(status='completed') completed,
      SUM(status='overdue') overdue
    FROM work_assignments
  `);
  return rows[0];
};

// EOD
export const getEODReports = async () => {
  const [rows] = await db.query(`
    SELECT 
      id,
      employee_id AS employeeId,
      employee_name AS employeeName,
      department,
      department_id AS departmentId,
      report_date AS date,
      tasks_completed AS tasksCompleted,
      tasks_in_progress AS tasksInProgress,
      blockers,
      tomorrow_plan AS tomorrowPlan,
      notes,
      status,
      submitted_at AS submittedAt,
      approved_by AS approvedBy
    FROM eod_reports
    ORDER BY id DESC
  `);
  return rows;
};
export const createEOD = (data) =>
  db.query("INSERT INTO eod_reports SET ?", [data]);

export const updateEOD = (id, data) =>
  db.query("UPDATE eod_reports SET ? WHERE id = ?", [data, id]);

export const getEODStats = async () => {
  const [rows] = await db.query(`
    SELECT 
      COUNT(*) total,
      SUM(status='pending') pending,
      SUM(status='submitted') submitted,
      SUM(status='approved') approved,
      SUM(status='rejected') rejected
    FROM eod_reports
  `);
  return rows[0];
};

export const getPendingEOD = async () => {
  const [rows] = await db.query(
    "SELECT * FROM eod_reports WHERE status='submitted'"
  );
  return rows;
};

export const approveEOD = (id, data) =>
  db.query(
    "UPDATE eod_reports SET status='approved', approved_by=? WHERE id=?",
    [data.approved_by, id]
  );

  export const getDepartments = async () => {
  const [rows] = await db.query(`
    SELECT id, name 
    FROM departments 
    ORDER BY name ASC
  `);

  return rows;
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

export const getAssignmentById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM work_assignments WHERE id = ?",
    [id]
  );
  return rows;
};

export const rejectEOD = (id, data) =>
  db.query(
    "UPDATE eod_reports SET status='rejected', approved_by=? WHERE id=?",
    [data.rejected_by, id]
  );

export const deleteEOD = (id) =>
  db.query("DELETE FROM eod_reports WHERE id = ?", [id]);