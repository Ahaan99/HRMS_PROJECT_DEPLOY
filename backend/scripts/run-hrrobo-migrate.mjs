/**
 * One-time HR Robo migration into hrms_db.
 *
 *   node scripts/run-hrrobo-migrate.mjs
 *
 * 1. Runs modules/hrRobo/hrRobo.schema.sql (CREATE TABLE IF NOT EXISTS - safe to re-run)
 * 2. If the old Python HR_robo folder is present, imports:
 *      - integration_store.json  -> robo_snapshots
 *      - video_storage/videos_index.json -> robo_videos (+ copies files to uploads/hr-robo/video)
 * 3. If the old hr_robo_db MySQL database exists, imports admin_users -> robo_admin_users
 * Uses the backend .env (same DB connection as the running server).
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const ROOT = process.cwd();
dotenv.config({ path: path.join(ROOT, ".env") });

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || process.env.DB_PASS || "",
  database: process.env.DB_NAME || "hrms_db",
  multipleStatements: true,
});
const log = (...a) => console.log("[hr-robo-migrate]", ...a);

/* 1. schema */
const sql = fs.readFileSync(path.join(ROOT, "modules", "hrRobo", "hrRobo.schema.sql"), "utf8");
await conn.query(sql);
log("schema ok (robo_snapshots, robo_videos, robo_admin_users, robo_interview_sessions)");

/* 2. legacy JSON files */
const candidates = [
  process.env.HR_ROBO_LEGACY_DIR,
  path.join(ROOT, "..", "HR_robo"),
  path.join(ROOT, "..", "hr-robo"),
].filter(Boolean);
const legacy = candidates.find((p) => fs.existsSync(p));

if (legacy) {
  log("legacy HR_robo folder:", legacy);
  const storeFile = path.join(legacy, "integration_store.json");
  if (fs.existsSync(storeFile)) {
    const store = JSON.parse(fs.readFileSync(storeFile, "utf8"));
    let n = 0;
    for (const k of ["reports", "proctor_logs", "candidates", "schedules", "config", "synced_at"]) {
      if (store[k] === undefined || store[k] === null) continue;
      await conn.query(
        "INSERT INTO robo_snapshots (snap_key, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)",
        [k, JSON.stringify(store[k])],
      );
      n++;
    }
    log(`integration_store.json -> robo_snapshots (${n} keys)`);
  }

  const vdir = path.join(legacy, "video_storage");
  const idxFile = path.join(vdir, "videos_index.json");
  const dest = path.join(ROOT, "uploads", "hr-robo", "video");
  fs.mkdirSync(dest, { recursive: true });
  if (fs.existsSync(idxFile)) {
    const idx = JSON.parse(fs.readFileSync(idxFile, "utf8"));
    let n = 0;
    for (const [cid, m] of Object.entries(idx)) {
      if (!m?.file) continue;
      const srcFile = path.join(vdir, "video", m.file);
      if (fs.existsSync(srcFile) && !fs.existsSync(path.join(dest, m.file))) {
        fs.copyFileSync(srcFile, path.join(dest, m.file));
      }
      await conn.query(
        `INSERT INTO robo_videos (candidate_id, candidate_name, file, mime, duration, size, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE candidate_name=VALUES(candidate_name), file=VALUES(file), mime=VALUES(mime),
           duration=VALUES(duration), size=VALUES(size), uploaded_at=VALUES(uploaded_at)`,
        [
          Number(cid),
          m.candidate_name || "",
          m.file,
          m.mime || "video/webm",
          Number(m.duration || 0),
          Number(m.size || 0),
          m.uploaded_at ? new Date(m.uploaded_at) : new Date(),
        ],
      );
      n++;
    }
    log(`videos_index.json -> robo_videos (${n} recordings)`);
  }
} else {
  log("no legacy HR_robo folder found - skipping JSON import");
}

/* 3. legacy hr_robo_db.admin_users */
const legacyDb = process.env.HR_ROBO_LEGACY_DB || "hr_robo_db";
const [[dbRow]] = await conn.query(
  "SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
  [legacyDb],
);
if (dbRow) {
  const [[tbl]] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admin_users'",
    [legacyDb],
  );
  if (tbl) {
    const [r] = await conn.query(
      `INSERT IGNORE INTO robo_admin_users (id, name, email, hashed_password, role, is_active, last_login, created_at)
       SELECT id, name, email, hashed_password, role, is_active, last_login, created_at
       FROM \`${legacyDb}\`.admin_users`,
    );
    log(`${legacyDb}.admin_users -> robo_admin_users (${r.affectedRows} rows)`);
  }
} else {
  log(`legacy database ${legacyDb} not present - skipping admin_users import`);
}

const [[{ s }]] = await conn.query("SELECT COUNT(*) s FROM robo_snapshots");
const [[{ v }]] = await conn.query("SELECT COUNT(*) v FROM robo_videos");
const [[{ a }]] = await conn.query("SELECT COUNT(*) a FROM robo_admin_users");
log(`done. snapshots=${s} videos=${v} admin_users=${a}`);
await conn.end();
