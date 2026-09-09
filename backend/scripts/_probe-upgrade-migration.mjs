/* Scratch probe: prove the 7 Sep backend upgrades a database that still has
 * the OLD (deployed 2026-09-02/03) proposals schema, in place, without
 * touching existing rows. Uses a throw-away database, dropped at the end. */
import fs from "node:fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const PROBE_DB = "hrms_upgrade_probe_tmp";
const out = [];
const checks = [];
const log = (...a) => out.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
const check = (name, ok, extra) => { checks.push({ name, ok: !!ok }); log((ok ? "PASS" : "FAIL") + "  " + name, extra ?? ""); };

const admin = await mysql.createConnection({
  host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 3306), multipleStatements: true,
});

try {
  await admin.query(`DROP DATABASE IF EXISTS \`${PROBE_DB}\``);
  await admin.query(`CREATE DATABASE \`${PROBE_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.query(`USE \`${PROBE_DB}\``);

  /* --- OLD schema exactly as shipped in the deployed 0-hrms-backend zip --- */
  await admin.query(`
    CREATE TABLE proposals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      proposal_number VARCHAR(30) NOT NULL UNIQUE,
      client_id INT NULL,
      client_code VARCHAR(50) NULL,
      client_name VARCHAR(150) NOT NULL,
      client_email VARCHAR(150) NULL,
      client_phone VARCHAR(30) NULL,
      client_company VARCHAR(200) NULL,
      title VARCHAR(200) NOT NULL,
      intro TEXT NULL,
      items JSON NOT NULL,
      subtotal DECIMAL(12,2) DEFAULT 0,
      discount_pct DECIMAL(5,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      tax_pct DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      valid_until DATE NULL,
      terms TEXT NULL,
      notes TEXT NULL,
      token_amount DECIMAL(12,2) DEFAULT 0,
      agreement_months INT NULL,
      replacement_months INT NULL,
      status ENUM('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED') DEFAULT 'DRAFT',
      response_note VARCHAR(500) NULL,
      created_by VARCHAR(120) NULL,
      sent_at DATETIME NULL,
      responded_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_proposals_client (client_code),
      INDEX idx_proposals_status (status)
    );
    CREATE TABLE clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_code VARCHAR(50) NOT NULL,
      company_name VARCHAR(200) NOT NULL,
      email VARCHAR(150) NULL,
      status VARCHAR(20) DEFAULT 'ACTIVE'
    );
    INSERT INTO clients (id, client_code, company_name, email) VALUES (1, 'C1001', 'Legacy Client', 'legacy@example.com');
    INSERT INTO proposals (proposal_number, client_id, client_code, client_name, title, items, subtotal, total, status, created_by, sent_at)
      VALUES ('PRP-2026-0001', 1, 'C1001', 'Legacy Client', 'Old sent proposal', '[{"service":"Payroll","qty":1,"rate":5000}]', 5000, 5000, 'SENT', 'Super Admin', NOW()),
             ('PRP-2026-0002', 1, 'C1001', 'Legacy Client', 'Old accepted proposal', '[{"service":"Recruitment","qty":2,"rate":7500}]', 15000, 15000, 'ACCEPTED', 'Super Admin', NOW());
  `);
  const [[before]] = await admin.query("SELECT COUNT(*) AS n FROM proposals");
  log("old schema created; rows before:", before.n);

  /* --- boot the NEW controller against the probe DB (dotenv won't override) --- */
  process.env.DB_NAME = PROBE_DB;
  const mod = await import("../modules/proposals/proposals.controller.js");
  const { db } = await import("../config/db.js");
  await new Promise((r) => setTimeout(r, 4000)); // ensureTable() runs fire-and-forget at import

  const [cols] = await admin.query(
    "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'proposals'",
    [PROBE_DB],
  );
  const byName = Object.fromEntries(cols.map((c) => [c.COLUMN_NAME, c]));
  for (const c of ["sales_employee_id", "created_by_role", "submitted_at", "approval_note", "approved_by", "approved_at"]) {
    check(`column added: ${c}`, !!byName[c], byName[c]?.COLUMN_TYPE);
  }
  check("created_by_role defaults to 'admin'", String(byName.created_by_role?.COLUMN_DEFAULT) === "admin", byName.created_by_role?.COLUMN_DEFAULT);
  check("status ENUM widened", /PENDING_APPROVAL/.test(byName.status?.COLUMN_TYPE) && /REVISION/.test(byName.status?.COLUMN_TYPE), byName.status?.COLUMN_TYPE);

  const [[cli]] = await admin.query(
    "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'employee_id'",
    [PROBE_DB],
  );
  check("clients.employee_id added", Number(cli.n) === 1);

  const [rows] = await admin.query("SELECT proposal_number, status, created_by_role, total FROM proposals ORDER BY id");
  check("existing rows preserved (2)", rows.length === 2, rows);
  check("existing statuses unchanged", rows[0].status === "SENT" && rows[1].status === "ACCEPTED");
  check("existing rows tagged created_by_role='admin'", rows.every((r) => r.created_by_role === "admin"));

  /* --- the new sales workflow statuses must be writable now --- */
  await admin.query(
    "INSERT INTO proposals (proposal_number, client_id, client_code, client_name, title, items, status, created_by_role, sales_employee_id, submitted_at) VALUES ('PRP-2026-0003', 1, 'C1001', 'Legacy Client', 'New sales draft', '[]', 'PENDING_APPROVAL', 'sales', 10, NOW())",
  );
  await admin.query("UPDATE proposals SET status = 'REVISION', approval_note = 'probe note' WHERE proposal_number = 'PRP-2026-0003'");
  const [[nrow]] = await admin.query("SELECT status, approval_note FROM proposals WHERE proposal_number = 'PRP-2026-0003'");
  check("PENDING_APPROVAL -> REVISION writable", nrow.status === "REVISION" && nrow.approval_note === "probe note", nrow);

  /* --- second boot must be a no-op (idempotent) --- */
  const [colsBefore] = await admin.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'proposals'", [PROBE_DB]);
  const ensure = mod.ensureTable || mod.default?.ensureTable;
  if (typeof ensure === "function") { await ensure(); log("ensureTable() re-run explicitly"); } else { log("ensureTable not exported - idempotency judged by column count only"); }
  const [colsAfter] = await admin.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'proposals'", [PROBE_DB]);
  check("second run is a no-op (column count stable)", colsBefore[0].n === colsAfter[0].n, `${colsBefore[0].n} -> ${colsAfter[0].n}`);

  /* --- the shared SELECT used by all three portals must run on the migrated table --- */
  const sel = mod.PROPOSAL_SELECT;
  if (sel) {
    const [q] = await db.query(`${sel} ORDER BY p.id`);
    check("PROPOSAL_SELECT runs on migrated table", Array.isArray(q) && q.length === 3, `rows=${q?.length}`);
  } else {
    log("PROPOSAL_SELECT not exported - skipped");
  }

  await db.end();
} catch (e) {
  check("probe crashed", false, e.message);
  log(e.stack);
} finally {
  try { await admin.query(`DROP DATABASE IF EXISTS \`${PROBE_DB}\``); log("probe database dropped"); } catch (e) { log("drop failed:", e.message); }
  await admin.end();
  const pass = checks.filter((c) => c.ok).length;
  log(`\nRESULT: ${pass}/${checks.length} ${pass === checks.length ? "PASS" : "FAIL"}`);
  fs.writeFileSync(new URL("./_probe-upgrade-migration.out.txt", import.meta.url), out.join("\n"));
  process.exitCode = pass === checks.length ? 0 : 1;
}
