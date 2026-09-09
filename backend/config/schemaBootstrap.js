/**
 * Boot-time schema bootstrap for everything initDb() does not own.
 *
 * Runs on every server start, right after initDb(). Every step is idempotent,
 * so a fresh database gets the full schema on first boot and an existing
 * database is left untouched:
 *
 *   1. merged-module schemas   modules/{hrRobo,attendance,evs}/*.schema.sql
 *      (CREATE TABLE IF NOT EXISTS; the EVS file also tries to import from the
 *       old standalone DB and those statements are skipped when it is absent)
 *   2. SQL migrations          migrations/*.sql, tracked in schema_migrations
 *      (same logic as scripts/run-migrations.mjs)
 *   3. IT-portal hardening     ENUM widening + defaults (scripts/run-it-portal-migrate.mjs)
 *
 * Nothing here throws: a failing statement is logged and the server keeps
 * booting, and un-applied migrations are retried on the next start.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { ENV } from "./env.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(here, "..");
const log = (...a) => console.log("[schema]", ...a);

/* Dedicated connection: procedure bodies and multi-statement files need
   multipleStatements, which the shared pool deliberately does not enable. */
const openConnection = () =>
  mysql.createConnection({
    host: ENV.DB_HOST,
    port: Number(ENV.DB_PORT || 3306),
    user: ENV.DB_USER,
    password: ENV.DB_PASSWORD,
    database: ENV.DB_NAME,
    multipleStatements: true,
  });

const splitStatements = (sql) =>
  sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);

/* mysql CLI-only directive; the driver handles procedure bodies natively. */
const stripDelimiter = (sql) => sql.replace(/^\s*DELIMITER\s+\S+\s*$/gim, "").replace(/\$\$/g, ";");

const OLD_DB_ABSENT = new Set(["ER_BAD_DB_ERROR", "ER_NO_SUCH_TABLE", "ER_TABLEACCESS_DENIED_ERROR", "ER_DBACCESS_DENIED_ERROR"]);

async function applyModuleSchemas(conn) {
  const files = [
    "modules/hrRobo/hrRobo.schema.sql",
    "modules/attendance/attendance.schema.sql",
    "modules/evs/evs.schema.sql",
  ];
  for (const rel of files) {
    const full = path.join(backendRoot, rel);
    if (!fs.existsSync(full)) continue;
    let ok = 0, skipped = 0, failed = 0;
    for (const stmt of splitStatements(fs.readFileSync(full, "utf8"))) {
      try {
        await conn.query(stmt);
        ok++;
      } catch (e) {
        if (OLD_DB_ABSENT.has(e.code)) skipped++;
        else { failed++; console.error("[schema]", rel, "-", e.sqlMessage || e.message); }
      }
    }
    log(`${path.basename(rel)}: ${ok} ok${skipped ? `, ${skipped} skipped (legacy DB absent)` : ""}${failed ? `, ${failed} FAILED` : ""}`);
  }
}

async function applyMigrations(conn) {
  const dir = path.join(backendRoot, "migrations");
  if (!fs.existsSync(dir)) return;
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(191) PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const [done] = await conn.query("SELECT name FROM schema_migrations");
  const applied = new Set(done.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  let n = 0;
  for (const f of files) {
    if (applied.has(f)) continue;
    try {
      await conn.query(stripDelimiter(fs.readFileSync(path.join(dir, f), "utf8")));
      await conn.query("INSERT IGNORE INTO schema_migrations (name) VALUES (?)", [f]);
      log("migration applied:", f);
      n++;
    } catch (e) {
      console.error("[schema] migration FAILED (will retry next boot):", f, "-", e.sqlMessage || e.message);
    }
  }
  if (!n) log(`migrations: ${files.length} already applied`);
}

async function applyItPortalFixes(conn) {
  const steps = [
    `ALTER TABLE complaints MODIFY created_by_role ENUM('employee','hr','client','sales','admin','it','manager') NOT NULL`,
    `ALTER TABLE complaints MODIFY assigned_to_role ENUM('hr','admin','manager','it') NULL`,
    `ALTER TABLE complaint_replies MODIFY sender_role VARCHAR(30) NOT NULL`,
    `ALTER TABLE work_policies MODIFY client_id INT NOT NULL DEFAULT 0`,
  ];
  for (const sql of steps) {
    try { await conn.query(sql); } catch { /* table not created yet or already widened */ }
  }
}

export async function bootstrapSchemas() {
  const conn = await openConnection();
  try {
    await applyModuleSchemas(conn);
    await applyMigrations(conn);
    await applyItPortalFixes(conn);
  } finally {
    await conn.end();
  }
}
