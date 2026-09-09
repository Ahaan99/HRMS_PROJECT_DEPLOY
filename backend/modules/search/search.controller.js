import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Advanced Search: employees + candidates (Admin / HR portals)        */
/* All filters are parameterized to prevent SQL injection.             */
/* ------------------------------------------------------------------ */
export const advancedSearch = async (req, res) => {
  try {
    const {
      type = "employees", // employees | candidates
      q = "",
      departmentId,
      designationId,
      statusId,
      salaryMin,
      salaryMax,
      joinedFrom,
      joinedTo,
      skill,
      page = 1,
      pageSize = 25,
    } = req.query;

    const limit = Math.min(Math.max(parseInt(pageSize) || 25, 1), 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

    if (type === "candidates") {
      const where = ["1=1"];
      const params = [];
      if (q) {
        where.push("(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.jobTitle LIKE ? OR c.candidateId LIKE ?)");
        const like = `%${q}%`;
        params.push(like, like, like, like, like);
      }
      if (statusId) { where.push("c.statusId = ?"); params.push(Number(statusId)); }
      if (joinedFrom) { where.push("DATE(c.createdAt) >= ?"); params.push(joinedFrom); }
      if (joinedTo) { where.push("DATE(c.createdAt) <= ?"); params.push(joinedTo); }

      const [[{ total }]] = await db.query(
        `SELECT COUNT(*) AS total FROM candidates c WHERE ${where.join(" AND ")}`, params);
      const [rows] = await db.query(
        `SELECT c.id, c.candidateId, c.name, c.email, c.phone, c.jobTitle,
                s.name AS status, c.createdAt
         FROM candidates c
         LEFT JOIN candidate_statuses s ON s.id = c.statusId
         WHERE ${where.join(" AND ")}
         ORDER BY c.createdAt DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]);
      return res.json({ success: true, total, page: Number(page), pageSize: limit, data: rows });
    }

    /* employees */
    const where = ["1=1"];
    const params = [];
    if (q) {
      where.push("(e.name LIKE ? OR e.email LIKE ? OR e.phone LIKE ? OR e.employeeCode LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (departmentId) { where.push("e.departmentId = ?"); params.push(Number(departmentId)); }
    if (designationId) { where.push("e.designationId = ?"); params.push(Number(designationId)); }
    if (statusId) { where.push("e.statusId = ?"); params.push(Number(statusId)); }
    if (salaryMin) { where.push("e.salary >= ?"); params.push(Number(salaryMin)); }
    if (salaryMax) { where.push("e.salary <= ?"); params.push(Number(salaryMax)); }
    if (joinedFrom) { where.push("e.joiningDate >= ?"); params.push(joinedFrom); }
    if (joinedTo) { where.push("e.joiningDate <= ?"); params.push(joinedTo); }
    if (skill) {
      where.push("EXISTS (SELECT 1 FROM employee_skills es WHERE es.employee_id = e.id AND es.skill LIKE ?)");
      params.push(`%${skill}%`);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM employees e WHERE ${where.join(" AND ")}`, params);
    const [rows] = await db.query(
      `SELECT e.id, e.employeeCode, e.name, e.email, e.phone, e.salary, e.joiningDate,
              d.name AS department, g.name AS designation, s.name AS status
       FROM employees e
       LEFT JOIN departments d ON d.id = e.departmentId
       LEFT JOIN designations g ON g.id = e.designationId
       LEFT JOIN employee_statuses s ON s.id = e.statusId
       WHERE ${where.join(" AND ")}
       ORDER BY e.name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]);
    res.json({ success: true, total, page: Number(page), pageSize: limit, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* Filter options for the search UI dropdowns */
export const searchFilters = async (req, res) => {
  try {
    const [departments] = await db.query("SELECT id, name FROM departments ORDER BY name");
    const [designations] = await db.query("SELECT id, name FROM designations ORDER BY name");
    const [empStatuses] = await db.query("SELECT id, name FROM employee_statuses ORDER BY id");
    const [candStatuses] = await db.query("SELECT id, name FROM candidate_statuses ORDER BY id");
    res.json({ success: true, departments, designations, empStatuses, candStatuses });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Client-scoped search: only that client's employees                  */
/* ------------------------------------------------------------------ */
export const clientEmployeeSearch = async (req, res) => {
  try {
    const clientId = req.client?.id;
    if (!clientId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { q = "", departmentId, statusId, salaryMin, salaryMax, joinedFrom, joinedTo, page = 1, pageSize = 25 } = req.query;
    const limit = Math.min(Math.max(parseInt(pageSize) || 25, 1), 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

    const where = ["e.client_id = ?"];
    const params = [clientId];
    if (q) {
      where.push("(e.name LIKE ? OR e.email LIKE ? OR e.phone LIKE ? OR e.employeeCode LIKE ?)");
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    if (departmentId) { where.push("e.departmentId = ?"); params.push(Number(departmentId)); }
    if (statusId) { where.push("e.statusId = ?"); params.push(Number(statusId)); }
    if (salaryMin) { where.push("e.salary >= ?"); params.push(Number(salaryMin)); }
    if (salaryMax) { where.push("e.salary <= ?"); params.push(Number(salaryMax)); }
    if (joinedFrom) { where.push("e.joiningDate >= ?"); params.push(joinedFrom); }
    if (joinedTo) { where.push("e.joiningDate <= ?"); params.push(joinedTo); }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM client_employees e WHERE ${where.join(" AND ")}`, params);
    const [rows] = await db.query(
      `SELECT e.id, e.employeeCode, e.name, e.email, e.phone, e.salary, e.joiningDate,
              d.name AS department, g.name AS designation, s.name AS status
       FROM client_employees e
       LEFT JOIN departments d ON d.id = e.departmentId
       LEFT JOIN designations g ON g.id = e.designationId
       LEFT JOIN employee_statuses s ON s.id = e.statusId
       WHERE ${where.join(" AND ")}
       ORDER BY e.name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]);
    res.json({ success: true, total, page: Number(page), pageSize: limit, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
