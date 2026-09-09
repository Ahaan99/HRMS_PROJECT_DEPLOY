// import bcrypt from "bcryptjs";
// import mysql from "mysql2/promise";

// const dbConfig = {
//   host: "127.0.0.1",
//   user: "root",
//   password: "1234",
//   database: "hrms_db",
// };

// const testClient = {
//   client_code: "TEST001",
//   company_name: "Test Company",
//   email: "admin@test.com",
//   password: "admin123",
//   status: "ACTIVE",
// };

// async function createTestClient() {
//   let connection;
//   try {
//     connection = await mysql.createConnection(dbConfig);
//     console.log("Connected to database");

//     const passwordHash = await bcrypt.hash(testClient.password, 10);
//     console.log("Generated password hash");

//     // Check if client already exists
//     const [existing] = await connection.query(
//       "SELECT id FROM clients WHERE email = ?",
//       [testClient.email]
//     );

//     if (existing.length > 0) {
//       // Update existing
//       await connection.query(
//         "UPDATE clients SET client_code = ?, company_name = ?, password_hash = ?, status = ? WHERE email = ?",
//         [testClient.client_code, testClient.company_name, passwordHash, testClient.status, testClient.email]
//       );
//       console.log(`✓ Updated existing client: ${testClient.email}`);
//     } else {
//       // Insert new
//       await connection.query(
//         `INSERT INTO clients (client_code, company_name, email, password_hash, status) 
//          VALUES (?, ?, ?, ?, ?)`,
//         [testClient.client_code, testClient.company_name, testClient.email, passwordHash, testClient.status]
//       );
//       console.log(`✓ Created new client: ${testClient.email}`);
//     }

//     console.log("\n========================================");
//     console.log("  TEST LOGIN CREDENTIALS");
//     console.log("========================================");
//     console.log(`  Email:    ${testClient.email}`);
//     console.log(`  Password: ${testClient.password}`);
//     console.log("========================================\n");

//     await connection.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error:", error.message);
//     if (connection) await connection.end();
//   }
// }

// createTestClient();






import bcrypt from "bcryptjs";
import { db } from "./config/db.js";

const testClient = {
  client_code: "TEST001",
  company_name: "Test Company",
  email: "admin@test.com",
  password: "admin123",
  status: "ACTIVE",
};

async function createTestClient() {
  try {
    console.log("Connected to database (via pool)");

    const passwordHash = await bcrypt.hash(testClient.password, 10);

    // Check if exists
    const [existing] = await db.query(
      "SELECT id FROM clients WHERE email = ?",
      [testClient.email]
    );

    if (existing.length > 0) {
      // Update
      await db.query(
        `UPDATE clients 
         SET client_code = ?, company_name = ?, password_hash = ?, status = ? 
         WHERE email = ?`,
        [
          testClient.client_code,
          testClient.company_name,
          passwordHash,
          testClient.status,
          testClient.email,
        ]
      );

      console.log(`✓ Updated existing client: ${testClient.email}`);
    } else {
      // Insert
      await db.query(
        `INSERT INTO clients 
         (client_code, company_name, email, password_hash, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          testClient.client_code,
          testClient.company_name,
          testClient.email,
          passwordHash,
          testClient.status,
        ]
      );

      console.log(`✓ Created new client: ${testClient.email}`);
    }

    console.log("\n========================================");
    console.log("  TEST LOGIN CREDENTIALS");
    console.log("========================================");
    console.log(`  Email:    ${testClient.email}`);
    console.log(`  Password: ${testClient.password}`);
    console.log("========================================\n");

  } catch (error) {
    console.error("Error:", error.message);
  }
}

createTestClient();