// import mysql from "mysql2/promise";

// const dbConfig = {
//   host: "127.0.0.1",
//   user: "root",
//   password: "1234",
//   database: "hrms_db",
// };

// const features = [
//   "OVERVIEW",
//   "EMPLOYEE_MANAGEMENT",
//   "ATTENDANCE_TRACKER",
//   "INTERVIEW_TRACKER",
//   "PAYROLL",
//   "SALES_REPORT",
//   "LIVE_CHAT",
//   "PERFORMANCE_TRACKER",
//   "PERFORMANCE_REPORT",
//   "WORK_POLICY",
//   "WORK_TARGET",
// ];

// async function enableAllFeatures() {
//   let connection;
//   try {
//     connection = await mysql.createConnection(dbConfig);
//     console.log("Connected to database");

//     // Get client ID
//     const [clients] = await connection.query(
//       "SELECT id FROM clients WHERE email = 'admin@test.com'"
//     );

//     if (clients.length === 0) {
//       console.log("Client not found!");
//       await connection.end();
//       return;
//     }

//     const clientId = clients[0].id;
//     console.log(`Client ID: ${clientId}`);

//     // Delete existing features
//     await connection.query("DELETE FROM client_features WHERE client_id = ?", [clientId]);
//     console.log("✓ Cleared existing features");

//     // Insert all features
//     for (const feature of features) {
//       await connection.query(
//         "INSERT INTO client_features (client_id, feature_key, is_enabled) VALUES (?, ?, 1)",
//         [clientId, feature]
//       );
//       console.log(`✓ Added feature: ${feature}`);
//     }

//     console.log("\n========================================");
//     console.log("  All features enabled for test client");
//     console.log("========================================\n");

//     await connection.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error:", error.message);
//     if (connection) await connection.end();
//   }
// }

// enableAllFeatures();





import { db } from "./config/db.js";

const features = [
  "OVERVIEW",
  "EMPLOYEE_MANAGEMENT",
  "ATTENDANCE_TRACKER",
  "INTERVIEW_TRACKER",
  "PAYROLL",
  "SALES_REPORT",
  "LIVE_CHAT",
  "PERFORMANCE_TRACKER",
  "PERFORMANCE_REPORT",
  "WORK_POLICY",
  "WORK_TARGET",
];

async function enableAllFeatures() {
  try {
    console.log("Connected to database (via pool)");

    // Get client ID
    const [clients] = await db.query(
      "SELECT id FROM clients WHERE email = ?",
      ["admin@test.com"]
    );

    if (clients.length === 0) {
      console.log("Client not found!");
      return;
    }

    const clientId = clients[0].id;
    console.log(`Client ID: ${clientId}`);

    // Clear old features
    await db.query(
      "DELETE FROM client_features WHERE client_id = ?",
      [clientId]
    );
    console.log("✓ Cleared existing features");

    // Insert new features
    for (const feature of features) {
      await db.query(
        `INSERT INTO client_features 
         (client_id, feature_key, is_enabled) 
         VALUES (?, ?, 1)`,
        [clientId, feature]
      );

      console.log(`✓ Added feature: ${feature}`);
    }

    console.log("\n========================================");
    console.log("  All features enabled for test client");
    console.log("========================================\n");

  } catch (error) {
    console.error("Error:", error.message);
  }
}

enableAllFeatures();

