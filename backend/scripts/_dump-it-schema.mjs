import "dotenv/config";
import { db } from "../config/db.js";
import { writeFileSync } from "fs";

const tables = ["it_tasks","it_bugs","it_code_reviews","it_milestones","it_timesheets","it_daily_work","dev_deployments","dev_tasks","dev_bugs","dev_timesheets","dev_milestones"];
let out = "";
for (const t of tables) {
  try {
    const [r] = await db.query("SHOW CREATE TABLE " + t);
    out += r[0]["Create Table"] + "\n----\n";
  } catch (e) { out += `${t}: ${e.message}\n----\n`; }
}
writeFileSync("D:/HRMS_new/_mcp_screens/_it_schema.log", out);
process.exit(0);
