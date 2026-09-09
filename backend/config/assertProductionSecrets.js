import { ENV } from "./env.js";

const WEAK_SECRETS = new Set(["", "change_me_in_env", "secret", "changeme"]);
const WEAK_PASSWORDS = new Set([
  "", "123", "admin", "admin123", "password", "123456",
  "manager123", "tl123", "change_me", "changeme",
]);

/* Fail fast instead of silently running production with the development
   defaults from config/env.js. Called once from server.js before listen(). */
export const assertProductionSecrets = () => {
  if (process.env.NODE_ENV !== "production") return;

  const problems = [];
  if (WEAK_SECRETS.has(String(ENV.JWT_SECRET)) || String(ENV.JWT_SECRET).length < 32)
    problems.push("JWT_SECRET must be set to a random string of at least 32 characters");
  if (WEAK_SECRETS.has(String(ENV.SALES_JWT_SECRET)) || String(ENV.SALES_JWT_SECRET).length < 32)
    problems.push("SALES_JWT_SECRET must be set to a random string of at least 32 characters");
  if (WEAK_PASSWORDS.has(String(ENV.SUPER_ADMIN_PASSWORD)))
    problems.push("SUPER_ADMIN_PASSWORD is a default/weak value");
  if (WEAK_PASSWORDS.has(String(ENV.MANAGER_PASSWORD)))
    problems.push("MANAGER_PASSWORD is a default/weak value");
  if (WEAK_PASSWORDS.has(String(ENV.TL_PASSWORD)))
    problems.push("TL_PASSWORD is a default/weak value");
  if (!process.env.CORS_ORIGINS)
    problems.push("CORS_ORIGINS must list the portal origins (comma separated) in production");
  if (!ENV.DB_PASSWORD)
    problems.push("DB_PASSWORD is empty");

  if (problems.length) {
    console.error("\nREFUSING TO START IN PRODUCTION - insecure configuration:\n  - " + problems.join("\n  - ") + "\n\nFix the values in backend/.env and restart.\n");
    process.exit(1);
  }
};
