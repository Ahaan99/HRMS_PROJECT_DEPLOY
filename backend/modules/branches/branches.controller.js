import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      code VARCHAR(20) NOT NULL,
      city VARCHAR(100) NULL,
      address VARCHAR(255) NULL,
      manager_employee_id INT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_code (code)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS employee_branches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      branch_id INT NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_emp (employee_id),
      INDEX idx_branch (branch_id)
    )
  `);
};
ensureTables().catch((e) => console.error("branches init:", e.message));

/* GET / — branches with headcount */
export const listBranches = async (_req, res) => {
  const [rows] = await db.query(`
    SELECT b.*,
      e.name AS manager_name,
      (SELECT COUNT(*) FROM employee_branches eb WHERE eb.branch_id = b.id) AS headcount
    FROM branches b
    LEFT JOIN employees e ON e.id = b.manager_employee_id
    ORDER BY b.id
  `);
  res.json({ success: true, data: rows });
};

/* POST /  { name, code, city, address, manager_employee_id } */
export const createBranch = async (req, res) => {
  try {
    const { name, code, city, address, manager_employee_id } = req.body;
    if (!name?.trim() || !code?.trim())
      return res
        .status(400)
        .json({ success: false, message: "name and code are required" });
    const [r] = await db.query(
      `INSERT INTO branches (name, code, city, address, manager_employee_id)
       VALUES (?,?,?,?,?)`,
      [name.trim(), code.trim().toUpperCase(), city || null, address || null,
       manager_employee_id || null],
    );
    res.status(201).json({ success: true, id: r.insertId, message: "Branch created" });
  } catch (e) {
    const msg = /Duplicate/.test(e.message) ? "Branch code already exists" : e.message;
    res.status(400).json({ success: false, message: msg });
  }
};

/* PUT /:id */
export const updateBranch = async (req, res) => {
  const { name, city, address, manager_employee_id, is_active } = req.body;
  await db.query(
    `UPDATE branches SET
       name = COALESCE(?, name),
       city = COALESCE(?, city),
       address = COALESCE(?, address),
       manager_employee_id = COALESCE(?, manager_employee_id),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [name ?? null, city ?? null, address ?? null,
     manager_employee_id ?? null, is_active ?? null, req.params.id],
  );
  res.json({ success: true, message: "Branch updated" });
};

/* POST /assign  { employee_id, branch_id } */
export const assignEmployee = async (req, res) => {
  const { employee_id, branch_id } = req.body;
  if (!employee_id || !branch_id)
    return res
      .status(400)
      .json({ success: false, message: "employee_id and branch_id required" });
  await db.query(
    `INSERT INTO employee_branches (employee_id, branch_id)
     VALUES (?,?) ON DUPLICATE KEY UPDATE branch_id = VALUES(branch_id), assigned_at = NOW()`,
    [employee_id, branch_id],
  );
  res.json({ success: true, message: "Employee assigned to branch" });
};

/* GET /:id/employees */
export const branchEmployees = async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.id, e.name, e.email, e.employeeCode, d.name AS department, eb.assigned_at
     FROM employee_branches eb
     JOIN employees e ON e.id = eb.employee_id
     LEFT JOIN departments d ON d.id = e.departmentId
     WHERE eb.branch_id = ?
     ORDER BY e.name`,
    [req.params.id],
  );
  res.json({ success: true, data: rows });
};

/* GET /unassigned — employees without a branch */
export const unassignedEmployees = async (_req, res) => {
  const [rows] = await db.query(`
    SELECT e.id, e.name, e.employeeCode
    FROM employees e
    LEFT JOIN employee_branches eb ON eb.employee_id = e.id
    WHERE eb.id IS NULL AND e.isActive = 1
    ORDER BY e.name LIMIT 200
  `);
  res.json({ success: true, data: rows });
};
