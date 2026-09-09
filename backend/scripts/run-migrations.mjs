// Applies every backend/migrations/*.sql in name order and records them in
// schema_migrations so each file runs once. All files are also idempotent,
// so `--force` (re-run everything) is safe.
//   node scripts/run-migrations.mjs [--force]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const here = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(here, ".."));
const force = process.argv.includes("--force");

const { ENV } = await import("../config/env.js");
const conn = await mysql.createConnection({
  host: ENV.DB_HOST,
  port: ENV.DB_PORT || 3306,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  multipleStatements: true,
});

await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(191) PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
const [done] = await conn.query("SELECT name FROM schema_migrations");
const applied = new Set(done.map((r) => r.name));

// mysql CLI-only directive; the driver handles procedure bodies natively.
const stripDelimiter = (sql) =>
  sql
    .replace(/^\s*DELIMITER\s+\S+\s*$/gim, "")
    .replace(/\$\$/g, ";");

const dir = path.join(here, "..", "migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
let failed = 0;

for (const f of files) {
  if (applied.has(f) && !force) {
    console.log("skip   ", f);
    continue;
  }
  const sql = stripDelimiter(fs.readFileSync(path.join(dir, f), "utf8"));
  try {
    await conn.query(sql);
    await conn.query("INSERT IGNORE INTO schema_migrations (name) VALUES (?)", [f]);
    console.log("applied", f);
  } catch (e) {
    failed++;
    console.error("FAILED ", f, "-", e.sqlMessage || e.message);
  }
}
await conn.end();
process.exitCode = failed ? 1 : 0;
