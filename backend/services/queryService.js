import { db } from "../config/db.js";


export const fetchAdminContext = async (message, intent, name, userId) => {
  try {
    const [employees] = await db.query(
      `SELECT e.id, e.name, e.email, e.phone,
              d.name as department, des.name as designation
       FROM employees e
       LEFT JOIN departments d ON d.id = e.departmentId
       LEFT JOIN designations des ON des.id = e.designationId
       WHERE e.isActive = 1 LIMIT 20`
    );

    const [clients] = await db.query(
      `SELECT id, company_name, client_name, email, status
       FROM clients LIMIT 20`
    );

    const [departments] = await db.query(
      `SELECT * FROM departments`
    );

    const [[stats]] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM employees WHERE isActive = 1) as totalEmployees,
        (SELECT COUNT(*) FROM clients WHERE status = "ACTIVE") as totalClients,
        (SELECT COUNT(*) FROM departments) as totalDepartments
    `);

    // ✅ IMPORTANT FIX: convert to STRING
    return `
===== EMPLOYEES =====
${JSON.stringify(employees, null, 2)}

===== CLIENTS =====
${JSON.stringify(clients, null, 2)}

===== DEPARTMENTS =====
${JSON.stringify(departments, null, 2)}

===== STATS =====
${JSON.stringify(stats, null, 2)}
    `;

  } catch (err) {
    console.error("Admin context error:", err.message);
    return "No admin data found";
  }
};

export const fetchAllEmployees = async () => {
  const [rows] = await db.query(
    `SELECT e.id, e.name, e.email, e.phone,
            d.name as department, des.name as designation
     FROM employees e
     LEFT JOIN departments d ON d.id = e.departmentId
     LEFT JOIN designations des ON des.id = e.designationId
     WHERE e.isActive = 1 LIMIT 20`
  );
  return rows;
};




export const fetchAllClients = async () => {
  const [rows] = await db.query(
    `SELECT id, company_name, client_name, email, status
     FROM clients WHERE status = "ACTIVE" LIMIT 20`
  );
  return rows;
};

export const fetchCompanyStats = async () => {
  const [[empCount]] = await db.query(`SELECT COUNT(*) as total FROM employees WHERE isActive = 1`);
  const [[clientCount]] = await db.query(`SELECT COUNT(*) as total FROM clients WHERE status = "ACTIVE"`);
  const [[deptCount]] = await db.query(`SELECT COUNT(*) as total FROM departments`);
  return { totalEmployees: empCount.total, totalClients: clientCount.total, totalDepartments: deptCount.total };
};

export const fetchEmployeeByName = async (name) => {
  const [rows] = await db.query(
    `SELECT e.id, e.name, e.email, e.phone, e.joiningDate, e.salary,
            d.name as department, des.name as designation
     FROM employees e
     LEFT JOIN departments d ON d.id = e.departmentId
     LEFT JOIN designations des ON des.id = e.designationId
     WHERE e.name LIKE ? AND e.isActive = 1 LIMIT 5`,
    [`%${name}%`]
  );
  return rows;
};

export const fetchClientByName = async (name) => {
  const [rows] = await db.query(
    `SELECT id, company_name, client_name, email, status
     FROM clients WHERE company_name LIKE ? OR client_name LIKE ? LIMIT 3`,
    [`%${name}%`, `%${name}%`]
  );
  return rows;
};

export const fetchAttendanceByEmployee = async (name) => {
  const [rows] = await db.query(
    `SELECT e.name, a.date, a.status, a.check_in, a.check_out
     FROM super_admin_attendance a
     JOIN employees e ON e.id = a.employee_id
     WHERE e.name LIKE ? ORDER BY a.date DESC LIMIT 10`,
    [`%${name}%`]
  );
  return rows;
};

export const fetchHRDashboardContext = async (message, intent, name, hrUserId) => {
  try {
    if (intent === "EMPLOYEE_INFO" && name) {
      const [rows] = await db.query(
        `SELECT e.id, e.name, e.email, e.phone, e.joiningDate, e.salary,
                d.name as department, des.name as designation
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         LEFT JOIN designations des ON des.id = e.designationId
         WHERE e.name LIKE ? AND e.isActive = 1 LIMIT 5`,
        [`%${name}%`]
      );
      if (rows.length) return `Employee info:\n${JSON.stringify(rows, null, 2)}`;
      return `No employee found with name: ${name}`;
    }
    if (intent === "EMPLOYEE_INFO") {
      const [rows] = await db.query(
        `SELECT e.id, e.name, e.email, d.name as department, des.name as designation
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         LEFT JOIN designations des ON des.id = e.designationId
         WHERE e.isActive = 1 LIMIT 20`
      );
      if (rows.length) return `All employees:\n${JSON.stringify(rows, null, 2)}`;
    }
    if (intent === "ATTENDANCE" && name) {
      const [rows] = await db.query(
        `SELECT e.name, a.date, a.status, a.check_in, a.check_out
         FROM super_admin_attendance a
         JOIN employees e ON e.id = a.employee_id
         WHERE e.name LIKE ? ORDER BY a.date DESC LIMIT 10`,
        [`%${name}%`]
      );
      
      if (rows.length) return `Attendance:\n${JSON.stringify(rows, null, 2)}`;
      return `No attendance found for: ${name}`;
    }
    if (intent === "ATTENDANCE") {
      const [rows] = await db.query(
        `SELECT e.name, a.date, a.status, a.check_in, a.check_out
         FROM super_admin_attendance a
         JOIN employees e ON e.id = a.employee_id
         ORDER BY a.date DESC LIMIT 20`
      );
      if (rows.length) return `Recent attendance:\n${JSON.stringify(rows, null, 2)}`;
    }
    if (intent === "COMPANY_STATS") {
      const [[emp]] = await db.query(`SELECT COUNT(*) as total FROM employees WHERE isActive = 1`);
      const [[dept]] = await db.query(`SELECT COUNT(*) as total FROM departments`);
      return `HR Stats: ${emp.total} active employees, ${dept.total} departments`;
    }

    if (message.toLowerCase().includes("emp")) {
  const [rows] = await db.query(
    `SELECT e.name, e.email, e.phone, d.name as department
     FROM employees e
     LEFT JOIN departments d ON d.id = e.departmentId
     WHERE e.id = ? OR e.name LIKE ?`,
    [message, `%${message}%`]
  );

  if (rows.length) {
    return `EMPLOYEE DATA:\n${JSON.stringify(rows, null, 2)}`;
  }
}

    if (intent === "CANDIDATE") {
      const [rows] = await db.query(`SELECT name, email, status FROM candidates LIMIT 10`);
      if (rows.length) return `Candidates:\n${JSON.stringify(rows, null, 2)}`;
    }
    if (intent === "SALARY") {
      const [rows] = await db.query(
        `SELECT e.name, e.salary, d.name as department
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         WHERE e.isActive = 1 LIMIT 20`
      );
      if (rows.length) return `Employee salaries:\n${JSON.stringify(rows, null, 2)}`;
    }
  } catch (err) {
    console.error("HR context error:", err.message);
  }
  return null;
};

export const fetchEmployeeDashboardContext = async (message, intent, userId) => {
  try {
    console.log("EMPLOYEE CONTEXT TRIGGERED:", intent, userId);

    if (!userId) return "No user ID provided";

    // normalize intent
    const cleanIntent = (intent || "").toUpperCase().trim();

    if (cleanIntent === "ATTENDANCE") {
      const [rows] = await db.query(
        `SELECT date, status, check_in, check_out
         FROM super_admin_attendance
         WHERE employee_id = ?
         ORDER BY date DESC LIMIT 10`,
        [userId]
      );

      return rows.length
        ? `YOUR ATTENDANCE:\n${JSON.stringify(rows, null, 2)}`
        : "No attendance records found.";
    }

    if (cleanIntent === "SALARY") {
      const [rows] = await db.query(
        `SELECT e.name, e.salary, d.name as department
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         WHERE e.id = ?`,
        [userId]
      );

      return rows.length
        ? `YOUR SALARY:\n${JSON.stringify(rows, null, 2)}`
        : "No salary data found.";
    }

    if (cleanIntent === "LEAVE") {
      const [rows] = await db.query(
        `SELECT leave_type, from_date, to_date, status, reason
         FROM leaves
         WHERE employee_id = ?
         ORDER BY created_at DESC LIMIT 5`,
        [userId]
      );

      return rows.length
        ? `YOUR LEAVES:\n${JSON.stringify(rows, null, 2)}`
        : "No leave records found.";
    }

    if (cleanIntent === "EMPLOYEE_INFO") {
      const [rows] = await db.query(
        `SELECT e.name, e.email, e.phone, e.joiningDate, e.salary,
                d.name as department, des.name as designation
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         LEFT JOIN designations des ON des.id = e.designationId
         WHERE e.id = ?`,
        [userId]
      );

      return rows.length
        ? `YOUR PROFILE:\n${JSON.stringify(rows, null, 2)}`
        : "No profile found.";
    }
    if (rows && rows.length > 0) {
  return `DATA:\n${JSON.stringify(rows, null, 2)}`;
}
return "No records found";


    return null;

  } catch (err) {
    console.error("Employee context error:", err.message);
    return "Error fetching employee data";
  }
};

export const fetchClientDashboardContext = async (message, intent, clientId) => {
  try {
    if (intent === "EMPLOYEE_INFO") {
      const [rows] = await db.query(
        `SELECT e.name, e.email, d.name as department, des.name as designation
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         LEFT JOIN designations des ON des.id = e.designationId
         JOIN client_hr_assignments cha ON cha.employee_id = e.id
         WHERE cha.client_id = ? AND e.isActive = 1 LIMIT 20`,
        [clientId]
      );
      if (rows.length) return `Your assigned employees:\n${JSON.stringify(rows, null, 2)}`;
      return `No employees assigned to your account yet.`;
    }
    if (intent === "ATTENDANCE") {
      const [rows] = await db.query(
        `SELECT e.name, a.date, a.status, a.check_in, a.check_out
         FROM client_attendance a
         JOIN employees e ON e.id = a.employee_id
         WHERE a.client_id = ?
         ORDER BY a.date DESC LIMIT 10`,
        [clientId]
      );
      if (rows.length) return `Attendance:\n${JSON.stringify(rows, null, 2)}`;
      return `No attendance records found.`;
    }
    if (intent === "SALARY") {
      const [rows] = await db.query(
        `SELECT e.name, p.month, p.net_salary, p.status
         FROM client_payroll p
         JOIN employees e ON e.id = p.employee_id
         WHERE p.client_id = ?
         ORDER BY p.created_at DESC LIMIT 10`,
        [clientId]
      );
      if (rows.length) return `Payroll info:\n${JSON.stringify(rows, null, 2)}`;
      return `No payroll records found.`;
    }
    if (intent === "COMPANY_STATS") {
      const [[emp]] = await db.query(
        `SELECT COUNT(*) as total FROM client_hr_assignments WHERE client_id = ?`,
        [clientId]
      );
      return `You have ${emp.total} assigned employees.`;
    }
  } catch (err) {
    console.error("Client context error:", err.message);
  }
  return null;
};

export const fetchSalesDashboardContext = async (message, intent, userId) => {
  try {
    if (intent === "CLIENT_INFO") {
      const [rows] = await db.query(
        `SELECT company_name, client_name, email, status
         FROM clients WHERE status = "ACTIVE" LIMIT 10`
      );
      if (rows.length) return `Active clients:\n${JSON.stringify(rows, null, 2)}`;
    }
    if (intent === "PERFORMANCE") {
      const [rows] = await db.query(
        `SELECT target_name, target_value, achieved_value, status
         FROM super_admin_targets WHERE assigned_to = ?
         ORDER BY created_at DESC LIMIT 5`,
        [userId]
      );
      if (rows.length) return `Your targets:\n${JSON.stringify(rows, null, 2)}`;
      return `No targets assigned yet.`;
    }
    if (intent === "COMPANY_STATS") {
      const [[clients]] = await db.query(`SELECT COUNT(*) as total FROM clients WHERE status = "ACTIVE"`);
      const [[leads]] = await db.query(`SELECT COUNT(*) as total FROM leads`);
      return `Total active clients: ${clients.total}, Total leads: ${leads.total}`;
    }
    if (intent === "EMPLOYEE_INFO") {
      const [rows] = await db.query(
        `SELECT e.name, e.email, e.salary, d.name as department
         FROM employees e
         LEFT JOIN departments d ON d.id = e.departmentId
         WHERE e.id = ?`,
        [userId]
      );
      if (rows.length) return `Your profile:\n${JSON.stringify(rows, null, 2)}`;
    }
  } catch (err) {
    console.error("Sales context error:", err.message);
  }
  return null;
};