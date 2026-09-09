import { db } from "../../../config/db.js";

export const getPortalUsersService = async (portal) => {
  // =============================
  // ACTIVE COUNTS
  // =============================

  const [[hrCount]] = await db.query(`
    SELECT COUNT(*) as count
    FROM employees
    WHERE departmentId = 1
      AND isActive = 1
  `);

  const [[salesCount]] = await db.query(`
    SELECT COUNT(*) as count
    FROM employees
    WHERE departmentId = 2
      AND isActive = 1
  `);

  const [[clientCount]] = await db.query(`
    SELECT COUNT(*) as count
    FROM clients
    WHERE status = 'ACTIVE'
  `);

  // =============================
  // DATA BASED ON PORTAL
  // =============================

  let data = [];

  if (portal === "HR") {
    const [rows] = await db.query(`
      SELECT 
        id,
        employeeCode,
        name,
        email,
        departmentId,
        isActive,
        createdAt
      FROM employees
      WHERE departmentId = 1
        AND isActive = 1
      ORDER BY id DESC
    `);
    data = rows;
  }

  else if (portal === "SALES") {
    const [rows] = await db.query(`
      SELECT 
        id,
        employeeCode,
        name,
        email,
        departmentId,
        isActive,
        createdAt
      FROM employees
      WHERE departmentId = 2
        AND isActive = 1
      ORDER BY id DESC
    `);
    data = rows;
  }

  else if (portal === "CLIENT") {
    const [rows] = await db.query(`
      SELECT 
        id,
        client_code,
        company_name,
        email,
        status,
        created_at
      FROM clients
      WHERE status = 'ACTIVE'
      ORDER BY id DESC
    `);
    data = rows;
  }

  else {
    // ALL
    const [empRows] = await db.query(`
      SELECT 
        id,
        employeeCode,
        name,
        email,
        departmentId,
        isActive,
        createdAt
      FROM employees
      ORDER BY id DESC
    `);

    const [clientRows] = await db.query(`
      SELECT 
        id,
        client_code,
        company_name,
        email,
        status,
        created_at
      FROM clients
      ORDER BY id DESC
    `);

    data = {
      employees: empRows,
      clients: clientRows,
    };
  }

  return {
    
    counts: {
      hr: hrCount.count,
      sales: salesCount.count,
      client: clientCount.count,
    },
    users: data,
  };
};