/**
 * Creates / upgrades the whole schema without starting the HTTP server:
 *   npm run db:setup
 * Identical to what `npm run dev` does on boot (initDb + module schemas +
 * migrations + seeds), useful for CI or a first-time production database.
 */
import "dotenv/config";
import { db } from "../config/db.js";
import { initDb } from "../config/initDb.js";
import { bootstrapSchemas } from "../config/schemaBootstrap.js";
import { seedSuperAdmin } from "../config/seedSuperAdmin.js";
import { seedMasters } from "../config/seedMasters.js";

await db.query("SELECT 1");
console.log("MySQL connected");
await initDb();
await bootstrapSchemas();
await seedSuperAdmin();
await seedMasters();
const [[{ n }]] = await db.query(
  "SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
);
console.log(`Schema ready: ${n} tables in ${process.env.DB_NAME || "hrms_db"}`);
await db.end();
