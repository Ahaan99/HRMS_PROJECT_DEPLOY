// import mysql from "mysql2/promise";
// import {ENV} from "./config/env.js"
// const dbConfig = {
//   host: "127.0.0.1",
//   user: "root",
//   password: "1234",
//   database: "hrms_db",
// };

// async function addSamplePerformance() {
//   let connection;
//   try {
//     connection = await mysql.createConnection(dbConfig);
//     console.log("Connected to database");

//     // Get employees
//     const [employees] = await connection.query("SELECT id FROM employees LIMIT 10");
    
//     if (employees.length === 0) {
//       console.log("No employees found. Please add employees first.");
//       await connection.end();
//       return;
//     }

//     // Check if performance data already exists
//     const [existing] = await connection.query("SELECT COUNT(*) as count FROM performance");
    
//     if (existing[0].count > 0) {
//       console.log(`Performance data already exists (${existing[0].count} records). Skipping...`);
//       await connection.end();
//       return;
//     }

//     // Sample performance data
//     const ratings = [5, 4, 3, 2, 1, 4, 5, 3, 4, 2];
//     const reviews = [
//       "Excellent work, exceeded all targets!",
//       "Very good performance, consistent deliverable.",
//       "Good performance, meets expectations.",
//       "Needs improvement in some areas.",
//       "Significant issues, requires immediate attention.",
//       "Outstanding contribution to the team.",
//       "Exceptional problem-solving skills.",
//       "Good progress, keep it up.",
//       "Great initiative and leadership.",
//       "Below average, needs coaching."
//     ];

//     const today = new Date();
    
//     for (let i = 0; i < Math.min(employees.length, 10); i++) {
//       const reviewDate = new Date(today);
//       reviewDate.setDate(reviewDate.getDate() - (i * 7)); // Spread reviews over past weeks
      
//       await connection.query(
//         `INSERT INTO performance (employee_id, rating, review, review_date, created_at) 
//          VALUES (?, ?, ?, ?, NOW())`,
//         [employees[i].id, ratings[i], reviews[i], reviewDate.toISOString().split('T')[0]]
//       );
//       console.log(`✓ Added performance for employee ID ${employees[i].id}: Rating ${ratings[i]}`);
//     }

//     console.log("\nSample performance data added successfully!");
//     console.log("Login to see green/yellow/red indicators in the Performance Report.");

//     await connection.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error:", error.message);
//     if (connection) await connection.end();
//   }
// }

// addSamplePerformance();
 



import { db } from "./config/db.js";

async function addSamplePerformance() {
  try {
    console.log("Connected to database (via pool)");

    // Get employees
    const [employees] = await db.query(
      "SELECT id FROM employees LIMIT 10"
    );

    if (employees.length === 0) {
      console.log("No employees found. Add employees first.");
      return;
    }

    // Check existing
    const [existing] = await db.query(
      "SELECT COUNT(*) as count FROM performance"
    );

    if (existing[0].count > 0) {
      console.log(
        `Performance data already exists (${existing[0].count}). Skipping...`
      );
      return;
    }

    const ratings = [5, 4, 3, 2, 1, 4, 5, 3, 4, 2];

    const reviews = [
      "Excellent work, exceeded all targets!",
      "Very good performance, consistent deliverable.",
      "Good performance, meets expectations.",
      "Needs improvement in some areas.",
      "Significant issues, requires immediate attention.",
      "Outstanding contribution to the team.",
      "Exceptional problem-solving skills.",
      "Good progress, keep it up.",
      "Great initiative and leadership.",
      "Below average, needs coaching.",
    ];

    const today = new Date();

    for (let i = 0; i < Math.min(employees.length, 10); i++) {
      const reviewDate = new Date(today);
      reviewDate.setDate(reviewDate.getDate() - i * 7);

      await db.query(
        `INSERT INTO performance 
         (employee_id, rating, review, review_date, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          employees[i].id,
          ratings[i],
          reviews[i],
          reviewDate.toISOString().split("T")[0],
        ]
      );

      console.log(
        `✓ Employee ${employees[i].id} → Rating ${ratings[i]}`
      );
    }

    console.log("✅ Sample performance data added!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

addSamplePerformance(); 
