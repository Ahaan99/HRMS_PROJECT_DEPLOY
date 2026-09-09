// import bcrypt from "bcryptjs";
// import mysql from "mysql2/promise";

// const dbConfig = {
//   host: "127.0.0.1",
//   user: "root",
//   password: "1234",
//   database: "hrms_db",
// };

// const email = "admin@hrms.com";
// const password = "admin123";

// async function resetAdminPassword() {
//   let connection;
//   try {
//     connection = await mysql.createConnection(dbConfig);
//     console.log("Connected to database");

//     const passwordHash = await bcrypt.hash(password, 10);
//     console.log("Generated password hash:", passwordHash);

//     const [result] = await connection.execute(
//       "UPDATE super_admins SET password_hash = ? WHERE email = ?",
//       [passwordHash, email]
//     );

//     if (result.affectedRows > 0) {
//       console.log(`✓ Password updated successfully for ${email}`);
//     } else {
//       console.log(`✗ No admin found with email: ${email}`);
      
//       const [admins] = await connection.execute("SELECT * FROM super_admins");
//       console.log("Existing admins:", admins);
//     }

//     await connection.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error:", error.message);
//     if (connection) await connection.end();
//   }
// }

// resetAdminPassword();




import bcrypt from "bcryptjs";
import { db } from "./config/db.js";

const email = "admin@hrms.com";
const password = "admin123";

async function resetAdminPassword() {
  try {
    console.log("Connected to database (via pool)");

    const passwordHash = await bcrypt.hash(password, 10);
    console.log("Generated password hash");

    const [result] = await db.query(
      "UPDATE super_admins SET password_hash = ? WHERE email = ?",
      [passwordHash, email]
    );

    if (result.affectedRows > 0) {
      console.log(`✓ Password updated successfully for ${email}`);
    } else {
      console.log(`✗ No admin found with email: ${email}`);

      const [admins] = await db.query("SELECT * FROM super_admins");
      console.log("Existing admins:", admins);
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

resetAdminPassword();