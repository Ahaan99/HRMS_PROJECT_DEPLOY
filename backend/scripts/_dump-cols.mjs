import fs from "fs";
import { db } from "../config/db.js";
let tables = process.argv.slice(2);
if (tables.includes("--gaps")) {
  const o = JSON.parse(fs.readFileSync(new URL("./_xcheck-dataflow-out.json", import.meta.url), "utf8"));
  tables = tables.filter((t) => t !== "--gaps").concat(o.gaps.map((g) => g.table));
}
const out = [];
for (const t of tables) {
  try {
    const [rows] = await db.query(`SHOW COLUMNS FROM \`${t}\``);
    out.push(`## ${t}\n${rows.map((r) => `${r.Field}:${r.Type}`).join(", ")}`);
  } catch (e) {
    out.push(`## ${t}  -> ${e.code || e.message}`);
  }
}
fs.writeFileSync(new URL("./_dump-cols-out.txt", import.meta.url), out.join("\n\n"));
await db.end().catch(() => {});
