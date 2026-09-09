// import mysql from "mysql2/promise";
// import { db } from "../config/db";
// const dbConfig = {
//   host: "127.0.0.1",
//   user: "root",
//   password: "1234",
//   database: "hrms_db",
// };

// async function addSampleMealPolicies() {
//   let connection;
//   try {
//     // connection = await mysql.createConnection(dbConfig);
//     connection = db;
//     console.log("Connected to database");

//     // Check if meal policies already exist
//     const [existing] = await connection.query(
//       "SELECT COUNT(*) as count FROM work_policies WHERE type = 'meal_management'"
//     );
    
//     if (existing[0].count > 0) {
//       console.log(`Meal policies already exist (${existing[0].count} records). Skipping...`);
//       await connection.end();
//       return;
//     }

//     const mealPolicies = [
//       {
//         title: "No Meal Discussion with Management",
//         type: "meal_management",
//         description: "Employees are strictly prohibited from discussing meal preferences, food choices, or dining arrangements during management meetings or official discussions. This policy ensures professional focus during work hours.",
//         is_automated: 1,
//         auto_deduction: "Warning for first offense, 1 day salary deduction for second offense",
//         auto_apply: 1,
//       },
//       {
//         title: "No Food/Drinks in Meeting Rooms",
//         type: "meal_management",
//         description: "Consumption of food and beverages is not allowed in meeting rooms during official discussions and presentations.",
//         is_automated: 1,
//         auto_deduction: "Verbal warning, written notice for repeat",
//         auto_apply: 1,
//       },
//       {
//         title: "Strict No-Talk Policy During Management Briefing",
//         type: "meal_management",
//         description: "Complete silence must be maintained during management briefings and official announcements. Only raise questions after the session ends.",
//         is_automated: 1,
//         auto_deduction: "Formal warning for non-compliance",
//         auto_apply: 1,
//       },
//     ];

//     for (const policy of mealPolicies) {
//       await connection.query(
//         `INSERT INTO work_policies (title, type, description, is_active, is_automated, auto_deduction, auto_apply) 
//          VALUES (?, ?, ?, 1, ?, ?, ?)`,
//         [policy.title, policy.type, policy.description, policy.is_automated, policy.auto_deduction, policy.auto_apply]
//       );
//       console.log(`✓ Added: ${policy.title}`);
//     }

//     console.log("\nSample meal policies added successfully!");

//     await connection.end();
//     console.log("Database connection closed");
//   } catch (error) {
//     console.error("Error:", error.message);
//     if (connection) await connection.end();
//   }
// }

// addSampleMealPolicies();



import { db } from "../config/db.js";

async function addSampleMealPolicies() {
  try {
    console.log("Connected to database (via pool)");

    // Check if already exists
    const [existing] = await db.query(
      "SELECT COUNT(*) as count FROM work_policies WHERE type = 'meal_management'"
    );

    if (existing[0].count > 0) {
      console.log(
        `Meal policies already exist (${existing[0].count}). Skipping...`
      );
      return;
    }

    const mealPolicies = [
      {
        title: "No Meal Discussion with Management",
        type: "meal_management",
        description:
          "Employees are strictly prohibited from discussing meal preferences, food choices, or dining arrangements during management meetings.",
        is_automated: 1,
        auto_deduction:
          "Warning for first offense, 1 day salary deduction for second offense",
        auto_apply: 1,
      },
      {
        title: "No Food/Drinks in Meeting Rooms",
        type: "meal_management",
        description:
          "Consumption of food and beverages is not allowed in meeting rooms.",
        is_automated: 1,
        auto_deduction: "Verbal warning, written notice for repeat",
        auto_apply: 1,
      },
      {
        title: "Strict No-Talk Policy During Management Briefing",
        type: "meal_management",
        description:
          "Complete silence must be maintained during management briefings.",
        is_automated: 1,
        auto_deduction: "Formal warning for non-compliance",
        auto_apply: 1,
      },
    ];

    for (const policy of mealPolicies) {
      await db.query(
        `INSERT INTO work_policies 
         (title, type, description, is_active, is_automated, auto_deduction, auto_apply) 
         VALUES (?, ?, ?, 1, ?, ?, ?)`,
        [
          policy.title,
          policy.type,
          policy.description,
          policy.is_automated,
          policy.auto_deduction,
          policy.auto_apply,
        ]
      );

      console.log(`✓ Added: ${policy.title}`);
    }

    console.log("✅ Sample meal policies added successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

addSampleMealPolicies();