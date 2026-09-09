import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Single source of truth                                              */
/*                                                                     */
/* Super Admin "IT Developer" page and the IT portal (modules/it) now  */
/* share the SAME tables: it_tasks, it_bugs, it_timesheets,            */
/* it_milestones, it_code_reviews, it_daily_work, dev_deployments.     */
/* Anything the IT team enters is visible here, and tasks assigned     */
/* here appear on the developer's kanban board immediately.            */
/* ------------------------------------------------------------------ */

const addColumnIfMissing = async (table, column, ddl) => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (!row.n) await db.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
};

const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      assigned_to INT NULL,
      priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
      status ENUM('To Do','In Progress','Review','Done') DEFAULT 'To Do',
      due_date DATE NULL,
      created_by INT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_bugs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      severity ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
      status ENUM('Open','In Progress','Fixed','Closed','Reopened') DEFAULT 'Open',
      reported_by INT NULL,
      assigned_to INT NULL,
      project VARCHAR(255) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_timesheets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      entry_date DATE NOT NULL,
      project VARCHAR(255) NOT NULL,
      task VARCHAR(255) NULL,
      hours DECIMAL(4,1) NOT NULL,
      notes VARCHAR(500) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project VARCHAR(255) NOT NULL,
      milestone VARCHAR(255) NOT NULL,
      description TEXT NULL,
      target_date DATE NULL,
      progress INT DEFAULT 0,
      status ENUM('Not Started','On Track','At Risk','Delayed','Completed') DEFAULT 'Not Started',
      owner_id INT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_code_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pr_title VARCHAR(255) NOT NULL,
      pr_link VARCHAR(500) NULL,
      author_id INT NULL,
      reviewer_id INT NULL,
      status ENUM('Open','Changes Requested','Approved','Merged') DEFAULT 'Open',
      comments VARCHAR(500) NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS it_daily_work (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      work_date DATE NOT NULL,
      summary TEXT NOT NULL,
      hours_spent DECIMAL(4,1) DEFAULT 0.0,
      blockers TEXT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_emp_date (employee_id, work_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS dev_deployments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project VARCHAR(120) NOT NULL,
      version_tag VARCHAR(60) NULL,
      environment ENUM('Development','Staging','Production') DEFAULT 'Production',
      features TEXT NULL,
      status ENUM('Success','Failed','Rolled Back') DEFAULT 'Success',
      deployed_by_id INT NULL,
      deployed_by VARCHAR(120) NULL,
      deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Columns the admin side needs that the IT tables did not have yet
  await addColumnIfMissing("it_tasks", "project", "project VARCHAR(255) NULL AFTER description");
  await addColumnIfMissing("it_tasks", "created_by_label", "created_by_label VARCHAR(120) NULL AFTER created_by");
  await addColumnIfMissing("it_code_reviews", "task_id", "task_id INT NULL AFTER pr_link");
};
ensureTables().catch((e) => console.error("itdev schema error:", e.message));

const isAdmin = (req) => req.user.role === "SUPER_ADMIN";
const TASK_STATUSES = ["To Do", "In Progress", "Review", "Done"];
const BUG_STATUSES = ["Open", "In Progress", "Fixed", "Closed", "Reopened"];
const MS_STATUSES = ["Not Started", "On Track", "At Risk", "Delayed", "Completed"];
const normalizeMs = (s) => (s === "Planned" ? "Not Started" : s);

/* Latest linked code review for a task drives the admin "Code Review" column */
const TASK_REVIEW_SUBQ = `
  (SELECT cr.status FROM it_code_reviews cr WHERE cr.task_id = t.id ORDER BY cr.updated_at DESC, cr.id DESC LIMIT 1)`;
const TASK_PR_SUBQ = `
  (SELECT cr.pr_link FROM it_code_reviews cr WHERE cr.task_id = t.id ORDER BY cr.updated_at DESC, cr.id DESC LIMIT 1)`;
const TASK_REVIEWER_SUBQ = `
  (SELECT r.name FROM it_code_reviews cr LEFT JOIN employees r ON r.id = cr.reviewer_id
    WHERE cr.task_id = t.id ORDER BY cr.updated_at DESC, cr.id DESC LIMIT 1)`;

/* ------------------------------------------------------------------ */
/* Tasks  (it_tasks)                                                   */
/* ------------------------------------------------------------------ */
export const listTasks = async (req, res) => {
  try {
    let sql = `
      SELECT t.id, t.title, t.description, t.project, t.priority, t.status, t.due_date,
             t.created_at, t.updated_at,
             t.assigned_to AS assignee_id, e.name AS assignee,
             COALESCE(c.name, t.created_by_label) AS created_by,
             COALESCE(${TASK_REVIEW_SUBQ}, 'Not Submitted') AS review_status,
             ${TASK_PR_SUBQ} AS pr_link,
             ${TASK_REVIEWER_SUBQ} AS reviewer
      FROM it_tasks t
      LEFT JOIN employees e ON e.id = t.assigned_to
      LEFT JOIN employees c ON c.id = t.created_by`;
    const params = [];
    if (!isAdmin(req)) {
      sql += " WHERE t.assigned_to = ?";
      params.push(req.user.id);
    }
    sql += " ORDER BY FIELD(t.status,'In Progress','Review','To Do','Done'), t.due_date IS NULL, t.due_date";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignee_id, priority, due_date } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: "title required" });
    const [r] = await db.query(
      `INSERT INTO it_tasks (title, description, project, assigned_to, priority, due_date, created_by, created_by_label)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
      [title.trim(), description || null, project || null, assignee_id || null,
       priority || "Medium", due_date || null, req.user.name || "Super Admin"]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const map = { title: "title", description: "description", project: "project",
                  assignee_id: "assigned_to", priority: "priority", status: "status", due_date: "due_date" };
    const fields = [];
    const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) {
        if (k === "status" && !TASK_STATUSES.includes(req.body[k]))
          return res.status(400).json({ success: false, message: "Invalid status" });
        fields.push(`${col} = ?`);
        params.push(req.body[k] === "" ? null : req.body[k]);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: "Nothing to update" });

    if (!isAdmin(req)) {
      const [[task]] = await db.query("SELECT assigned_to FROM it_tasks WHERE id = ?", [req.params.id]);
      if (!task || task.assigned_to !== req.user.id)
        return res.status(403).json({ success: false, message: "Not your task" });
    }

    params.push(req.params.id);
    await db.query(`UPDATE it_tasks SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await db.query("DELETE FROM it_tasks WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Bugs  (it_bugs)                                                     */
/* ------------------------------------------------------------------ */
export const listBugs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.id, b.title, b.description, b.project, b.severity, b.status, b.created_at, b.updated_at,
              b.assigned_to AS assignee_id, e.name AS assignee,
              b.reported_by AS reported_by_id, r.name AS reported_by
       FROM it_bugs b
       LEFT JOIN employees e ON e.id = b.assigned_to
       LEFT JOIN employees r ON r.id = b.reported_by
       ORDER BY FIELD(b.severity,'Critical','High','Medium','Low'),
                FIELD(b.status,'Open','Reopened','In Progress','Fixed','Closed')`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createBug = async (req, res) => {
  try {
    const { title, description, project, severity, assignee_id } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: "title required" });
    const reporter = isAdmin(req) ? null : req.user.id || null;
    const [r] = await db.query(
      `INSERT INTO it_bugs (title, description, project, severity, assigned_to, reported_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, project || null, severity || "Medium", assignee_id || null, reporter]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateBug = async (req, res) => {
  try {
    const map = { title: "title", description: "description", project: "project",
                  severity: "severity", status: "status", assignee_id: "assigned_to" };
    const fields = [];
    const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) {
        if (k === "status" && !BUG_STATUSES.includes(req.body[k]))
          return res.status(400).json({ success: false, message: "Invalid status" });
        fields.push(`${col} = ?`);
        params.push(req.body[k] === "" ? null : req.body[k]);
      }
    }
    if (!fields.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    params.push(req.params.id);
    await db.query(`UPDATE it_bugs SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteBug = async (req, res) => {
  try {
    await db.query("DELETE FROM it_bugs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Timesheets  (it_timesheets)                                         */
/* ------------------------------------------------------------------ */
export const listTimesheets = async (req, res) => {
  try {
    let sql = `
      SELECT ts.id, ts.employee_id, ts.entry_date AS work_date, ts.project, ts.task,
             ts.hours, ts.notes AS summary, ts.created_at, e.name AS employee
      FROM it_timesheets ts
      LEFT JOIN employees e ON e.id = ts.employee_id`;
    const params = [];
    if (!isAdmin(req)) {
      sql += " WHERE ts.employee_id = ?";
      params.push(req.user.id);
    }
    sql += " ORDER BY ts.entry_date DESC, ts.id DESC LIMIT 300";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const logTime = async (req, res) => {
  try {
    const { work_date, project, task_id, task, hours, summary, employee_id } = req.body;
    const empId = isAdmin(req) && employee_id ? employee_id : req.user.id;
    if (!work_date || !hours)
      return res.status(400).json({ success: false, message: "work_date and hours required" });
    if (Number(hours) <= 0 || Number(hours) > 24)
      return res.status(400).json({ success: false, message: "hours must be between 0 and 24" });
    if (!empId) return res.status(400).json({ success: false, message: "employee_id required" });

    let taskLabel = task || null;
    if (!taskLabel && task_id) {
      const [[t]] = await db.query("SELECT title FROM it_tasks WHERE id = ?", [task_id]);
      taskLabel = t?.title || null;
    }
    const [r] = await db.query(
      `INSERT INTO it_timesheets (employee_id, entry_date, project, task, hours, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [empId, work_date, project?.trim() || "General", taskLabel, Number(hours), summary || null]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteTimesheet = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      const [[row]] = await db.query("SELECT employee_id FROM it_timesheets WHERE id = ?", [req.params.id]);
      if (!row || row.employee_id !== req.user.id)
        return res.status(403).json({ success: false, message: "Not your entry" });
    }
    await db.query("DELETE FROM it_timesheets WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Deployments  (dev_deployments - already shared with the IT portal)  */
/* ------------------------------------------------------------------ */
export const listDeployments = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM dev_deployments ORDER BY deployed_at DESC LIMIT 100");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const logDeployment = async (req, res) => {
  try {
    const { project, version_tag, environment, features, status } = req.body;
    if (!project) return res.status(400).json({ success: false, message: "project required" });
    const [r] = await db.query(
      `INSERT INTO dev_deployments (project, version_tag, environment, features, status, deployed_by_id, deployed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project, version_tag || null, environment || "Production", features || null,
       status || "Success", req.user.id || null, req.user.name || "Admin"]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteDeployment = async (req, res) => {
  try {
    await db.query("DELETE FROM dev_deployments WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Milestones  (it_milestones)                                         */
/* ------------------------------------------------------------------ */
export const listMilestones = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.id, m.project, m.milestone AS title, m.description AS notes, m.target_date,
              m.progress, m.status, m.owner_id, o.name AS owner, m.created_at, m.updated_at
       FROM it_milestones m
       LEFT JOIN employees o ON o.id = m.owner_id
       ORDER BY FIELD(m.status,'At Risk','Delayed','On Track','Not Started','Completed'),
                m.target_date IS NULL, m.target_date`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const createMilestone = async (req, res) => {
  try {
    const { project, title, target_date, progress, status, notes, owner_id } = req.body;
    if (!project?.trim() || !title?.trim())
      return res.status(400).json({ success: false, message: "project and title required" });
    const st = normalizeMs(status) || "Not Started";
    if (!MS_STATUSES.includes(st)) return res.status(400).json({ success: false, message: "Invalid status" });
    const [r] = await db.query(
      `INSERT INTO it_milestones (project, milestone, description, target_date, progress, status, owner_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project.trim(), title.trim(), notes || null, target_date || null,
       Math.min(100, Math.max(0, Number(progress) || 0)), st, owner_id || null]
    );
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateMilestone = async (req, res) => {
  try {
    const map = { project: "project", title: "milestone", target_date: "target_date",
                  progress: "progress", status: "status", notes: "description", owner_id: "owner_id" };
    const fields = [];
    const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] === undefined) continue;
      let v = req.body[k];
      if (k === "progress") v = Math.min(100, Math.max(0, Number(v) || 0));
      else if (k === "status") {
        v = normalizeMs(v);
        if (!MS_STATUSES.includes(v)) return res.status(400).json({ success: false, message: "Invalid status" });
      } else if (v === "") v = null;
      fields.push(`${col} = ?`);
      params.push(v);
    }
    if (!fields.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    params.push(req.params.id);
    await db.query(`UPDATE it_milestones SET ${fields.join(", ")} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteMilestone = async (req, res) => {
  try {
    await db.query("DELETE FROM it_milestones WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Code reviews  (it_code_reviews) - read-only for admin               */
/* Reviewing is owned by the IT team; admin only observes.             */
/* ------------------------------------------------------------------ */
export const listCodeReviews = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.pr_title, c.pr_link, c.task_id, c.status, c.comments, c.created_at, c.updated_at,
              a.name AS author, r.name AS reviewer, t.title AS task_title
       FROM it_code_reviews c
       LEFT JOIN employees a ON a.id = c.author_id
       LEFT JOIN employees r ON r.id = c.reviewer_id
       LEFT JOIN it_tasks t ON t.id = c.task_id
       ORDER BY FIELD(c.status,'Open','Changes Requested','Approved','Merged'), c.updated_at DESC
       LIMIT 300`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Daily work  (it_daily_work) - read-only for admin                   */
/* ------------------------------------------------------------------ */
export const listDailyWork = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT w.id, w.employee_id, e.name AS employee, w.work_date, w.summary, w.hours_spent, w.blockers, w.created_at
       FROM it_daily_work w
       LEFT JOIN employees e ON e.id = w.employee_id
       ORDER BY w.work_date DESC, w.id DESC LIMIT 300`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Performance summary  (all from it_* tables)                         */
/* ------------------------------------------------------------------ */
export const performanceSummary = async (req, res) => {
  try {
    const [taskStats] = await db.query(
      `SELECT e.name AS developer,
              COUNT(t.id) AS total_tasks,
              SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) AS done,
              (SELECT COUNT(*) FROM it_code_reviews cr
                WHERE cr.author_id = e.id AND cr.status IN ('Approved','Merged')) AS approved_reviews,
              (SELECT COUNT(*) FROM it_code_reviews cr
                WHERE cr.author_id = e.id AND cr.status = 'Merged') AS prs_merged
       FROM employees e
       JOIN it_tasks t ON t.assigned_to = e.id
       GROUP BY e.id, e.name ORDER BY done DESC`
    );
    const [bugStats] = await db.query(
      `SELECT e.name AS developer,
              SUM(CASE WHEN b.status IN ('Fixed','Closed') THEN 1 ELSE 0 END) AS fixed,
              COUNT(*) AS assigned
       FROM it_bugs b
       JOIN employees e ON e.id = b.assigned_to
       GROUP BY e.id, e.name`
    );
    const [hoursByDev] = await db.query(
      `SELECT e.name AS developer, SUM(ts.hours) AS hours
       FROM it_timesheets ts
       JOIN employees e ON e.id = ts.employee_id
       WHERE ts.entry_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY e.id, e.name ORDER BY hours DESC`
    );
    const [[counts]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM it_tasks WHERE status <> 'Done') AS open_tasks,
        (SELECT COUNT(*) FROM it_bugs WHERE status IN ('Open','Reopened','In Progress')) AS open_bugs,
        (SELECT COUNT(*) FROM it_tasks WHERE status = 'Review') +
        (SELECT COUNT(*) FROM it_code_reviews WHERE status IN ('Open','Changes Requested')
           AND (task_id IS NULL OR task_id NOT IN (SELECT id FROM it_tasks WHERE status = 'Review'))) AS in_review,
        (SELECT COUNT(*) FROM it_code_reviews WHERE status = 'Merged'
           AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS merged_30d,
        (SELECT COUNT(*) FROM dev_deployments WHERE deployed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS deployments_30d`
    );
    res.json({ taskStats, bugStats, hoursByDev, counts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
