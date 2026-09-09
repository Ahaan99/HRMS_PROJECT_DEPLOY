import { db } from "./db.js";
import { ENV } from "./env.js";

const dbName = process.env.DB_NAME || ENV.DB_NAME;

export const seedMasters = async () => {
  // Departments
  await db.query(`
    INSERT IGNORE INTO departments (id, name) VALUES
    (1, 'HR'),
    (2, 'Sales'),
    (3, 'IT'),
    (4, 'Marketing'),
    (5, 'Others')
  `);

  // Designations
  await db.query(`
    INSERT IGNORE INTO designations (id, departmentId, name) VALUES
    (1, 1, 'HR Manager'),
    (2, 1, 'Recruiter'),

    (3, 2, 'Sales Executive'),
    (4, 2, 'Sales Manager'),

    (5, 3, 'Frontend Developer'),
    (6, 3, 'Backend Developer'),

    (7, 4, 'SEO Executive'),
    (8, 4, 'Social Media Manager'),

    (9, 3, 'IT'),
    (10, 5, 'Others')
  `);

  // Statuses
  await db.query(`
    INSERT IGNORE INTO employee_statuses (id, name) VALUES
    (1, 'WORKING'),
    (2, 'ON_NOTICE'),
    (3, 'RESIGNED'),
    (4, 'TERMINATED')
  `);

  await db.query(`
    INSERT IGNORE INTO candidate_statuses (id, name) VALUES
    (1, 'APPLIED'),
    (2, 'SHORTLISTED'),
    (3, 'INTERVIEW'),
    (4, 'SELECTED'),
    (5, 'REJECTED')
    `);

  await db.query(`
      INSERT IGNORE INTO portal_settings (portal_name, is_enabled)
      VALUES
      ('HR', true),
      ('CLIENT', true),
      ('SALES', true);    
    `);

  await db.query(`
    INSERT IGNORE INTO revenue_categories (name)
    VALUES
    ('Sales'),
    ('Invoice'),
    ('Subscription'),
    ('Manual')
    ON DUPLICATE KEY UPDATE name=name; 
  `);

  await db.query(`
    INSERT IGNORE INTO expense_categories (name)
      VALUES
      ('Salary'),
      ('Office Rent'),
      ('Software'),
      ('Marketing'),
      ('Infrastructure'),
      ('Other')
    ON DUPLICATE KEY UPDATE name=name;
  `);

  await db.query(`
    INSERT INTO features (feature_key) VALUES
      ('EMPLOYEE_MANAGEMENT'),
      ('CANDIDATE_MANAGEMENT'),
      ('ATTENDANCE_TRACKER'),
      ('INTERVIEW_TRACKER'),
      ('PAYROLL'),
      ('HR_CALLING'),
      ('SALES_REPORT'),
      ('PERFORMANCE_TRACKER'),
      ('PERFORMANCE_REPORT'),
      ('WORK_POLICY'),
      ('WORK_TARGET'),
      ('FINANCE_DASHBOARD'),
      ('INVENTORY'),
      ('ASSETS'),
      ('PURCHASE_ORDERS'),
      ('TAX'),
      ('AUDIT_LOGS'),
      ('WORK_ASSIGNMENT'),
      ('LIVE_CHAT'),
      ('COMPLAINT'),
      ('LEADS')
      ON DUPLICATE KEY UPDATE feature_key = VALUES(feature_key);
    `);

  await db.query(`
    INSERT IGNORE INTO expense_categories (name) VALUES 
    ('Salary'),
    ('Office Rent'),
    ('Marketing'),
    ('Utilities');
  `);

  await db.query(`
    INSERT IGNORE INTO revenue_categories (name) VALUES 
    ('Sales'),
    ('Service'),
    ('Subscription');
  `);

//   // ================================
//   // POLICIES SEED
//   // ================================
//   await db.query(`
// INSERT IGNORE INTO policies (title, category, priority, description, is_active, auto_apply)
// VALUES
// ('Annual Leave Entitlement', 'leave', 'high', '18 days annual leave with carry forward', 1, 1),
// ('Sick Leave Policy', 'leave', 'high', '12 days paid sick leave', 1, 1),
// ('Casual Leave Rules', 'leave', 'medium', 'Casual leave rules', 1, 1),
// ('Maternity Leave Policy', 'leave', 'high', 'Maternity benefits', 1, 1),
// ('Paternity Leave Policy', 'leave', 'medium', 'Paternity leave', 1, 1),

// ('Standard Working Hours', 'time', 'high', 'Office working hours', 1, 1),
// ('Flexible Hours Policy', 'time', 'medium', 'Flexible timing', 0, 1),
// ('Shift Timings', 'time', 'high', 'Shift based work', 1, 1),

// ('Lunch Break Duration', 'lunch', 'medium', 'Lunch break rules', 1, 1),
// ('Tea Break Rules', 'lunch', 'low', 'Short breaks', 1, 1),

// ('Half-Day Policy', 'attendance', 'high', 'Half day rules', 1, 1),
// ('WFH (Work From Home)', 'attendance', 'medium', 'Work from home policy', 1, 1),
// ('Absent Marking Rules', 'attendance', 'high', 'Absent rules', 1, 1),

// ('Salary Payment Schedule', 'salary', 'high', 'Salary dates', 1, 1),
// ('Performance Bonus', 'salary', 'medium', 'Bonus rules', 1, 1),
// ('Annual Increment Policy', 'salary', 'high', 'Increment rules', 1, 1),

// ('Late Arrival Penalty', 'penalty', 'high', 'Late fine rules', 1, 1),
// ('Absent Penalty Rules', 'penalty', 'high', 'Absent penalty', 1, 1),
// ('Unauthorized Absence', 'penalty', 'high', 'Unauthorized leave', 1, 1),
// ('Salary Advance Policy', 'penalty', 'medium', 'Advance salary rules', 1, 1)
// `);

// // ================================
// // POLICY RULES SEED
// // ================================

// // Get policies
// const [policies] = await db.query(`SELECT id, title FROM policies`);

// const getId = (title) => policies.find(p => p.title === title)?.id;

// // Annual Leave Rules
// await db.query(`
// INSERT IGNORE INTO policy_rules (policy_id, label, value, type)
// VALUES
// (${getId("Annual Leave Entitlement")}, 'Annual Leave Days', '18', 'number'),
// (${getId("Annual Leave Entitlement")}, 'Carry Forward Allowed', 'Max 5 days', 'text'),
// (${getId("Annual Leave Entitlement")}, 'Leave Encashment', 'Allowed', 'text')
// `);

// // Sick Leave
// await db.query(`
// INSERT IGNORE INTO policy_rules (policy_id, label, value, type)
// VALUES
// (${getId("Sick Leave Policy")}, 'Sick Leave Days', '12', 'number'),
// (${getId("Sick Leave Policy")}, 'Medical Certificate', 'Required after 3 days', 'text')
// `);

// // Half Day
// await db.query(`
// INSERT IGNORE INTO policy_rules (policy_id, label, value, type)
// VALUES
// (${getId("Half-Day Policy")}, 'Max Per Month', '2', 'number'),
// (${getId("Half-Day Policy")}, 'Minimum Hours', '4', 'text')
// `);

// // Late Penalty
// await db.query(`
// INSERT IGNORE INTO policy_rules (policy_id, label, value, type)
// VALUES
// (${getId("Late Arrival Penalty")}, 'Grace Period', '10 min', 'text'),
// (${getId("Late Arrival Penalty")}, 'Fine', '100', 'number')
// `);

  console.log("Master tables seeded");
};
