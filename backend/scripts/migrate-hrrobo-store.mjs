/**
 * One-time import of the legacy Python HR_robo data into robo_snapshots.
 *
 *   node scripts/migrate-hrrobo-store.mjs            (fills only empty keys)
 *   node scripts/migrate-hrrobo-store.mjs --force    (overwrites)
 *
 * Source: ../HR_robo/integration_store.json (the FastAPI service's store).
 * Two families of keys are written because the served interview UI pushes
 * its own dataset (ui_*) back to /api/integration/sync a few seconds after
 * it loads - if ui_* stayed empty it would wipe the imported reports.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../config/db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.argv.find((a) => a.endsWith(".json")) || path.resolve(here, "../../HR_robo/integration_store.json");
const FORCE = process.argv.includes("--force");

const isEmpty = (v) =>
  v === null || v === undefined || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && Object.keys(v).length === 0);

const parse = (raw) => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return raw;
  try { return JSON.parse(raw); } catch { return raw; }
};

async function current(key) {
  const [[row]] = await db.query("SELECT data FROM robo_snapshots WHERE snap_key = ? LIMIT 1", [key]);
  return row ? parse(row.data) : null;
}

async function put(key, value) {
  await db.query(
    "INSERT INTO robo_snapshots (snap_key, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)",
    [key, JSON.stringify(value)],
  );
}

const src = JSON.parse(fs.readFileSync(SRC, "utf8"));
const plan = {
  // HRMS-portal integration snapshot (what /api/integration/* serves)
  reports: src.reports ?? [],
  proctor_logs: src.proctor_logs ?? [],
  candidates: src.candidates ?? [],
  schedules: src.schedules ?? [],
  config: src.config ?? {},
  // Interview-UI shared dataset (what /api/store serves and the UI syncs back)
  ui_ai_reports: (src.reports ?? []).map(({ recommendation, ...r }) => r),
  ui_proctor_logs: src.proctor_logs ?? [],
  ui_candidates: src.candidates ?? [],
  ui_schedules: src.schedules ?? [],
  ui_proctor_config: src.config ?? {},
};

let written = 0;
for (const [key, value] of Object.entries(plan)) {
  const cur = await current(key);
  if (!FORCE && !isEmpty(cur)) { console.log(`skip  ${key} (already has data)`); continue; }
  if (isEmpty(value)) { console.log(`skip  ${key} (source empty)`); continue; }
  await put(key, value);
  written++;
  console.log(`write ${key} <- ${Array.isArray(value) ? value.length + " items" : "object"}`);
}
if (written && src.synced_at) await put("synced_at", src.synced_at);
console.log(`done: ${written} key(s) written from ${path.basename(SRC)}`);
await db.end();
