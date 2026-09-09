// Throwaway: boot server.js against the empty hrms_fresh_test DB and probe it.
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config({ path: ".env.freshtest" });
const BASE = "http://127.0.0.1:5099";
const p = spawn(process.execPath, ["server.js"], { env: process.env, stdio: ["ignore", "pipe", "pipe"] });
let out = "";
p.stdout.on("data", (d) => (out += d));
p.stderr.on("data", (d) => (out += d));
const t0 = Date.now();

const finish = (code) => {
  p.kill();
  setTimeout(() => {
    fs.writeFileSync("_fresh-boot.log", out);
    console.log("--- boot log (schema / error lines) ---");
    console.log(out.split(/\r?\n/).filter((l) => /schema|FAILED|Error|error|ready|Connected|running/i.test(l)).slice(0, 80).join("\n"));
    process.exit(code);
  }, 600);
};

const iv = setInterval(async () => {
  try {
    const r = await fetch(BASE + "/api/health");
    if (!r.ok) return;
    clearInterval(iv);
    console.log("HEALTH 200 after", Math.round((Date.now() - t0) / 1000), "s");
    const l = await fetch(BASE + "/api/super-admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: process.env.SUPER_ADMIN_EMAIL || "admin@hrms.com", password: process.env.SUPER_ADMIN_PASSWORD || "admin123" }),
    });
    console.log("LOGIN", l.status);
    const j = await l.json();
    const h = { Authorization: "Bearer " + j.token };
    for (const u of [
      "/api/hr-robo/api/health",
      "/api/smart-attendance/api/health",
      "/api/evs/health",
      "/api/super-admin/dashboard/stats",
      "/api/super-admin/offer-letter/templates",
      "/api/super-admin/itdev/summary",
      "/api/hr-robo/api/integration/summary",
      "/api/super-admin/employees",
      "/api/super-admin/complaints",
    ]) {
      const r2 = await fetch(BASE + u, { headers: h });
      console.log(r2.status, u);
    }
    finish(0);
  } catch {
    if (Date.now() - t0 > 90000) { console.log("TIMEOUT"); finish(1); }
  }
}, 1500);
