/**
 * IT-portal schema hardening (idempotent). Run once per environment:
 *   node scripts/run-it-portal-migrate.mjs
 *
 *  1. complaints.created_by_role  -> add 'it' and 'manager' to the ENUM so IT
 *     developers can raise complaints (insert was rejected before).
 *  2. work_policies.client_id     -> DEFAULT 0 (company-wide) so portals whose
 *     tokens carry no tenant id can create policies.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
});

const steps = [
  [
    "complaints.created_by_role enum += it, manager",
    `ALTER TABLE complaints
       MODIFY created_by_role ENUM('employee','hr','client','sales','admin','it','manager') NOT NULL`,
  ],
  [
    "complaints.assigned_to_role enum += it",
    `ALTER TABLE complaints
       MODIFY assigned_to_role ENUM('hr','admin','manager','it') NULL`,
  ],
  [
    "complaint_replies.sender_role widen",
    `ALTER TABLE complaint_replies
       MODIFY sender_role VARCHAR(30) NOT NULL`,
  ],
  [
    "work_policies.client_id default 0",
    `ALTER TABLE work_policies MODIFY client_id INT NOT NULL DEFAULT 0`,
  ],
];

for (const [label, sql] of steps) {
  try {
    await db.query(sql);
    console.log("OK   ", label);
  } catch (e) {
    console.log("SKIP ", label, "-", e.message);
  }
}
await db.end();
