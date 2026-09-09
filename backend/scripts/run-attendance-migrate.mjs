/**
 * One-time Smart Attendance migration into hrms_db.
 *
 *   node scripts/run-attendance-migrate.mjs
 *
 * 1. Runs modules/attendance/attendance.schema.sql (IF NOT EXISTS - safe to re-run)
 * 2. If the old `smart_attendance` MySQL database exists, copies
 *    users, employees, attendance, corrections, settings -> attendance_* tables.
 *    Old dlib face encodings are NOT compatible with browser face-api.js, so
 *    employees are imported with face_engine = NULL and must re-register once.
 * Uses the backend .env (same DB connection as the running server).
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const ROOT = process.cwd();
dotenv.config({ path: path.join(ROOT, ".env") });
const log = (...a) => console.log("[attendance-migrate]", ...a);

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  database: process.env.DB_NAME || "hrms_db",
  multipleStatements: true,
});

/* 1. schema */
await conn.query(fs.readFileSync(path.join(ROOT, "modules", "attendance", "attendance.schema.sql"), "utf8"));
log("schema ok (attendance_users, attendance_employees, attendance_records, attendance_corrections, attendance_settings)");

/* 2. legacy database */
const legacy = process.env.SMART_ATTENDANCE_LEGACY_DB || "smart_attendance";
const [[dbRow]] = await conn.query("SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?", [legacy]);

if (!dbRow) {
  log(`legacy database ${legacy} not present - skipping data import`);
} else {
  const has = async (t) =>
    (await conn.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", [legacy, t]))[0].length > 0;
  const cols = async (t) =>
    (await conn.query("SELECT COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", [legacy, t]))[0].map((r) => r.c);
  const copy = async (src, dest, wanted, extra = "") => {
    if (!(await has(src))) return log(`${legacy}.${src} missing - skipped`);
    const present = await cols(src);
    const use = wanted.filter((c) => present.includes(c));
    const [r] = await conn.query(
      `INSERT IGNORE INTO ${dest} (${use.join(",")}${extra ? "," + extra.split("=")[0] : ""})
       SELECT ${use.join(",")}${extra ? "," + extra.split("=")[1] : ""} FROM \`${legacy}\`.\`${src}\``,
    );
    log(`${legacy}.${src} -> ${dest} (${r.affectedRows} rows)`);
  };

  await copy("users", "attendance_users", ["id", "name", "mobile", "password", "role", "emp_id", "created"]);
  /* employees: keep identity, drop dlib encodings (must re-register with face-api) */
  await copy("employees", "attendance_employees", ["id", "emp_id", "name", "registered_at"], "face_engine=NULL");
  await copy("attendance", "attendance_records", [
    "id", "emp_id", "name", "date", "time", "status", "method", "ip", "approval", "check_out", "hours", "overtime",
    "lat", "lng", "hrms_sync", "hrms_sync_error", "hrms_sync_at", "corrected", "corrected_by", "corrected_at",
    "correction_reason", "original", "approved_by", "approved_at",
  ]);
  await copy("corrections", "attendance_corrections", [
    "id", "emp_id", "name", "date", "check_in", "check_out", "reason", "state", "requested_at", "decided_by", "decided_at",
  ]);
  if (await has("settings")) {
    const sc = await cols("settings");
    const keyCol = sc.includes("skey") ? "skey" : sc.includes("key") ? "`key`" : sc[0];
    const dataCol = sc.includes("data") ? "data" : sc.includes("value") ? "value" : sc[1];
    const [r] = await conn.query(
      `INSERT IGNORE INTO attendance_settings (skey, data) SELECT ${keyCol}, ${dataCol} FROM \`${legacy}\`.settings WHERE ${keyCol} IN ('office','shift')`,
    );
    log(`${legacy}.settings -> attendance_settings (${r.affectedRows} rows; office + shift only)`);
  }
}

const count = async (t) => (await conn.query(`SELECT COUNT(*) n FROM ${t}`))[0][0].n;
log(
  `done. users=${await count("attendance_users")} employees=${await count("attendance_employees")} records=${await count("attendance_records")} corrections=${await count("attendance_corrections")} settings=${await count("attendance_settings")}`,
);
log("NOTE: employees must re-register their face once (browser face-api.js replaces dlib).");
await conn.end();
