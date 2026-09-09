// Validate the files the admin Export menu just downloaded.
import fs from "fs";
import path from "path";
import os from "os";
import { createRequire } from "module";
const require = createRequire(path.join(process.cwd(), "..", "admin", "package.json"));
const XLSX = require("xlsx");

const dl = process.env.DL_DIR || "D:\\HRMS_new\\_mcp_downloads"; // debug-Chrome download dir
const newest = (re) => fs.readdirSync(dl).filter((f) => re.test(f)).map((f) => ({ f, t: fs.statSync(path.join(dl, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0]?.f;

const xlsxName = newest(/^payroll-\d{4}-\d{2}-\d{2}(\s\(\d+\))?\.xlsx$/);
const csvName = newest(/^payroll-\d{4}-\d{2}-\d{2}(\s\(\d+\))?\.csv$/);
let ok = true;
const check = (label, cond, info = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${label}${info ? "  -> " + info : ""}`); if (!cond) ok = false; };

check("xlsx file downloaded", !!xlsxName, xlsxName);
if (xlsxName) {
  const buf = fs.readFileSync(path.join(dl, xlsxName));
  check("xlsx is a real OOXML zip (PK magic), not HTML", buf[0] === 0x50 && buf[1] === 0x4b, `first bytes=${buf.slice(0, 2).toString("hex")} size=${buf.length}`);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true, cellStyles: true }); // cellStyles needed to read back !cols
  check("workbook parses", wb.SheetNames.length > 0, `sheets=${wb.SheetNames.join(",")}`);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  check("has header + data rows", rows.length >= 2, `rows=${rows.length} header=${(rows[0] || []).slice(0, 6).join(" | ")}`);
  const types = {};
  for (const addr of Object.keys(ws)) if (addr[0] !== "!" && !/^[A-Z]+1$/.test(addr)) types[ws[addr].t] = (types[ws[addr].t] || 0) + 1;
  check("numeric cells typed as numbers (n) not strings", (types.n || 0) > 0, `cell types=${JSON.stringify(types)}`);
  check("column widths set", Array.isArray(ws["!cols"]) && ws["!cols"].length === rows[0].length, `cols=${ws["!cols"]?.length}`);
  check("autofilter set on header", !!ws["!autofilter"], ws["!autofilter"]?.ref);
}
check("csv file downloaded", !!csvName, csvName);
if (csvName) {
  const buf = fs.readFileSync(path.join(dl, csvName));
  check("csv has UTF-8 BOM", buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf);
  const text = buf.toString("utf8").slice(1);
  const lines = text.split("\r\n").filter(Boolean);
  check("csv uses CRLF and has rows", lines.length >= 2, `lines=${lines.length} header=${lines[0].slice(0, 80)}`);
}
process.exit(ok ? 0 : 1);
