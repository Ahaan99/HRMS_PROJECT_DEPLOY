// Production-boot contract test. Uses port 5999 so the dev server on :5000 is untouched.
import { spawn } from "child_process";
import { randomBytes } from "crypto";

const run = (label, envOverrides, expectListen) =>
  new Promise((resolve) => {
    const env = { ...process.env, NODE_ENV: "production", PORT: "5999", ...envOverrides };
    const child = spawn(process.execPath, ["server.js"], { env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const onData = (d) => (out += d.toString());
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    const finish = (ok, info) => { try { child.kill("SIGTERM"); } catch {} console.log(`${ok ? "PASS" : "FAIL"}  ${label}  -> ${info}`); resolve(ok); };
    child.on("exit", (code) => {
      if (expectListen) finish(false, `exited early code=${code}: ${out.replace(/\s+/g, " ").slice(0, 300)}`);
      else finish(code !== 0 && /REFUSING TO START/.test(out), `exit=${code} ${out.replace(/\s+/g, " ").slice(0, 220)}`);
    });
    if (expectListen) {
      const started = Date.now();
      const poll = async () => {
        if (Date.now() - started > 45000) return finish(false, "no listener on :5999 after 45s: " + out.slice(-300));
        try {
          const r = await fetch("http://127.0.0.1:5999/api/super-admin/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
          const helmet = r.headers.get("x-content-type-options") === "nosniff";
          const noPowered = !r.headers.get("x-powered-by");
          return finish(r.status < 500 && helmet && noPowered, `status=${r.status} nosniff=${helmet} x-powered-by-hidden=${noPowered}`);
        } catch { setTimeout(poll, 1000); }
      };
      setTimeout(poll, 3000);
    }
  });

const strong = () => randomBytes(32).toString("hex");
const a = await run("production + default secrets => refuses to start", { JWT_SECRET: "change_me_in_env", SALES_JWT_SECRET: "change_me_in_env", SUPER_ADMIN_PASSWORD: "admin123", CORS_ORIGINS: "" }, false);
const b = await run("production + strong secrets + CORS_ORIGINS => boots with helmet", {
  JWT_SECRET: strong(), SALES_JWT_SECRET: strong(), SUPER_ADMIN_PASSWORD: strong(), MANAGER_PASSWORD: strong(), TL_PASSWORD: strong(),
  CORS_ORIGINS: "https://admin.example.com,https://hr.example.com",
}, true);
process.exit(a && b ? 0 : 1);
