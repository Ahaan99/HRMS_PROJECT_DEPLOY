/**
 * One-time EVS schema + data migration runner.
 * Uses the same DB credentials as the backend (.env) so no mysql CLI needed.
 *   node scripts/run-evs-schema.mjs
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const sqlPath = path.resolve("modules/evs/evs.schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hrms_db",
  multipleStatements: true,
});

const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);

let ok = 0;
let skipped = 0;
for (const stmt of statements) {
  try {
    const [r] = await conn.query(stmt);
    ok++;
    if (r?.affectedRows !== undefined && /^INSERT/i.test(stmt)) {
      const table = stmt.match(/INTO\s+(\w+)/i)?.[1];
      console.log(`  migrated ${r.affectedRows} row(s) -> ${table}`);
    }
  } catch (e) {
    // Old standalone DB may not exist on this machine - that's fine.
    if (e.code === "ER_BAD_DB_ERROR" || e.code === "ER_NO_SUCH_TABLE") {
      skipped++;
    } else {
      console.error("FAILED:", stmt.slice(0, 80), "\n ", e.message);
    }
  }
}

const [tables] = await conn.query("SHOW TABLES LIKE 'evs\\_%'");
console.log(`\nDone. ${ok} statements ok, ${skipped} skipped (old DB absent).`);
console.log("EVS tables in", process.env.DB_NAME + ":", tables.map((t) => Object.values(t)[0]).join(", "));
await conn.end();
