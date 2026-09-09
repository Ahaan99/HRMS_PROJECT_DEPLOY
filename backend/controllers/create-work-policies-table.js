// import mysql from "mysql2/promise";

// const dbConfig = {
//   host: "127.0.0.1",
//   user: "root",
//   password: "1234",
//   database: "hrms_db",
// };

// async function createWorkPoliciesTable() {
//   let connection;
//   try {
//     connection = await mysql.createConnection(dbConfig);
//     console.log("Connected to database");

//     // Create work_policies table
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS work_policies (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         title VARCHAR(255) NOT NULL,
//         type VARCHAR(50) NOT NULL DEFAULT 'general',
//         department_id INT DEFAULT 0,
//         description TEXT,
//         is_active INT DEFAULT 1,
//         is_automated INT DEFAULT 0,
//         auto_deduction VARCHAR(255),
//         auto_apply INT DEFAULT 0,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       )
//     `);
//     console.log("✓ work_policies table created/verified");

//     // Check if table exists
//     const [tables] = await connection.query("SHOW TABLES LIKE 'work_policies'");
//     console.log("Tables found:", tables.length > 0 ? "YES" : "NO");

//     await connection.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error:", error.message);
//     if (connection) await connection.end();
//   }
// }

// createWorkPoliciesTable();




import { db } from "./config/db.js";

async function createWorkPoliciesTable() {
  try {
    console.log("Connected to database (via pool)");

    // Create table
    await db.query(`
      CREATE TABLE IF NOT EXISTS work_policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        department_id INT DEFAULT 0,
        description TEXT,
        is_active INT DEFAULT 1,
        is_automated INT DEFAULT 0,
        auto_deduction VARCHAR(255),
        auto_apply INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("✓ work_policies table created/verified");

    // Check table exists
    const [tables] = await db.query(
      "SHOW TABLES LIKE 'work_policies'"
    );

    console.log("Tables found:", tables.length > 0 ? "YES" : "NO");

  } catch (error) {
    console.error("Error:", error.message);
  }
}

createWorkPoliciesTable();