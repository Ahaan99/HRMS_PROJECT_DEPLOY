// _grep.mjs — reliable recursive regex grep (MCP grep tool returns empty results).
// Usage: node scripts/_grep.mjs "<dir relative to HRMS Merging>" "<regex>" [extRegex] [maxLines]
// Output: prints and writes scripts/_grep-out.txt  as  file:line: text
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const [dirArg, reArg, extArg = "\\.(js|jsx|mjs|ts|tsx|html|css|json|py|sql|md)$", maxArg = "400"] = process.argv.slice(2);
const re = new RegExp(reArg, "i");
const extRe = new RegExp(extArg, "i");
const out = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", ".mcp_backups", ".mcp_logs", "_mcp_screens", "uploads", "video_storage"].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (extRe.test(e.name)) {
      let src; try { src = fs.readFileSync(p, "utf8"); } catch { continue; }
      const lines = src.split("\n");
      for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) {
        out.push(`${path.relative(ROOT, p).replace(/\\/g, "/")}:${i + 1}: ${lines[i].trim().slice(0, 220)}`);
        if (out.length >= +maxArg) break;
      }
    }
    if (out.length >= +maxArg) return;
  }
}
const start = path.resolve(ROOT, dirArg);
if (fs.existsSync(start)) walk(start); else out.push("NO SUCH DIR: " + start);
const txt = out.join("\n") || "(no matches)";
fs.writeFileSync(path.join(__dirname, "_grep-out.txt"), txt);
console.log(txt);
