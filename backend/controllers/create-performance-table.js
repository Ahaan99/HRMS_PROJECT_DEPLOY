// import mysql from "mysql2/promise";

// const dbConfig = {
//   host: "127.0.0.1",
//   user: "root",
//   password: "1234",
//   database: "hrms_db",
// };

// async function createPerformanceTable() {
//   let connection;
//   try {
//     connection = await mysql.createConnection(dbConfig);
//     console.log("Connected to database");

//     // Create performance table
//     await connection.query(`
//       CREATE TABLE IF NOT EXISTS performance (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         employee_id INT NOT NULL,
//         rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
//         review TEXT,
//         review_date DATE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
//       )
//     `);
//     console.log("✓ Performance table created/verified");

//     // Check if table exists
//     const [tables] = await connection.query("SHOW TABLES LIKE 'performance'");
//     console.log("Tables found:", tables.length > 0 ? "YES" : "NO");

//     await connection.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error:", error.message);
//     if (connection) await connection.end();
//   }
// }

// createPerformanceTable();



import { db } from "./config/db.js";

async function createPerformanceTable() {
  try {
    console.log("Connected to database (via pool)");

    // Create table
    await db.query(`
      CREATE TABLE IF NOT EXISTS performance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        review_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    console.log("✓ Performance table created/verified");

    // Check table exists
    const [tables] = await db.query(
      "SHOW TABLES LIKE 'performance'"
    );

    console.log("Tables found:", tables.length > 0 ? "YES" : "NO");

  } catch (error) {
    console.error("Error:", error.message);
  }
}

createPerformanceTable();