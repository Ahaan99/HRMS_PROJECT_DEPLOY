// Read-only code scan for the TASK-05/09/11/12/14 small features.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const SKIP = /node_modules|dist|\.git|\.mcp_logs|HR_robo/i;
const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (SKIP.test(p)) continue;
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(jsx?|mjs)$/.test(e.name)) acc.push(p);
  }
  return acc;
};
const files = walk(root);
const grep = (title, re, filter = () => true, max = 25) => {
  console.log(`\n### ${title}`);
  let n = 0;
  for (const f of files) {
    if (!filter(f)) continue;
    const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
    lines.forEach((l, i) => {
      if (n < max && re.test(l)) {
        console.log(`${path.relative(root, f)}:${i + 1}: ${l.trim().slice(0, 150)}`);
        n++;
      }
    });
  }
  if (!n) console.log("(none)");
};
const inBackend = (f) => /[\\/]backend[\\/]/.test(f);
const inPortal = (name) => (f) => new RegExp(`[\\\\/]${name}[\\\\/]src[\\\\/]`).test(f);

grep("proposal download (backend)", /download|Content-Disposition|res\.sendFile|createReadStream/i, (f) => inBackend(f) && /proposal/i.test(f));
grep("proposal routes (backend)", /router\.(get|post|put|delete)/, (f) => inBackend(f) && /proposal/i.test(f));
grep("proposal download (client UI)", /download/i, (f) => inPortal("client")(f) && /proposal/i.test(f));
grep("client proposal pages", /export default/, (f) => inPortal("client")(f) && /proposal/i.test(f));
grep("avatar/profile photo (backend)", /profile_photo|profilePhoto|profile_image|profileImage|avatar|photo_url/i, inBackend, 30);
grep("avatar/profile photo (portals)", /profile_photo|profilePhoto|profile_image|profileImage|avatar_url|photoUrl|photo_url/i, (f) => !inBackend(f), 30);
grep("International nav", /international/i, (f) => !inBackend(f));
grep("HR navbar", /emergency|<img|onClick|avatar|profile/i, (f) => /HR[\\/]src[\\/]components[\\/]hr[\\/]HRNavbar\.jsx$/.test(f));
grep("joining form logo", /logo/i, (f) => !inBackend(f) && /join/i.test(f));
grep("admin layout wrapper", /Sidebar|overflow|h-screen|flex|sticky/i, (f) => /admin[\\/]src[\\/]components[\\/]layout[\\/](AdminLayout|DashboardLayout)\.jsx$/.test(f));
grep("employee layout / sidebar", /export default|<aside|overflow|fixed|sticky/i, (f) => inPortal("employee")(f) && /layout|sidebar|navbar/i.test(f));
grep("profile pages (portals)", /export default/, (f) => !inBackend(f) && /profile|settings/i.test(f) && /pages/i.test(f));
grep("work-assignment header row", /Automated Work Assignment|Work Assignment<\/h/, (f) => !inBackend(f));
