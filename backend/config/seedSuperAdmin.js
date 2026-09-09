import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { ENV } from "./env.js";

export const seedSuperAdmin = async () => {
  /* ================= SUPER ADMIN ================= */
  const email = process.env.SUPER_ADMIN_EMAIL || ENV.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD || ENV.SUPER_ADMIN_PASSWORD;

  if (email && password) {
    const [rows] = await db.query(
      "SELECT id FROM super_admins WHERE email = ? LIMIT 1",
      [email],
    );

    if (!rows.length) {
      const passwordHash = await bcrypt.hash(password, 10);

      await db.query(
        "INSERT INTO super_admins (name, email, password_hash) VALUES (?, ?, ?)",
        ["Super Admin", email, passwordHash],
      );

      console.log("✅ Super Admin seeded");
    }
  } else {
    console.log("⚠️ Super Admin seed skipped");
  }

  /* ================= MANAGER ================= */
  const managerEmail = process.env.MANAGER_EMAIL || ENV.MANAGER_EMAIL;
  const managerPassword = process.env.MANAGER_PASSWORD || ENV.MANAGER_PASSWORD;

  if (managerEmail && managerPassword) {
    const [rows] = await db.query(
      "SELECT id FROM managers WHERE email = ? LIMIT 1",
      [managerEmail],
    );

    if (!rows.length) {
      const passwordHash = await bcrypt.hash(managerPassword, 10);

      await db.query(
        "INSERT INTO managers (name, email, password, is_active) VALUES (?, ?, ?, ?)",
        ["Manager", managerEmail, passwordHash, 1],
      );

      console.log("✅ Manager seeded");
    }
  } else {
    console.log("⚠️ Manager seed skipped");
  }

  /* ================= TL ================= */
  const tlEmail = process.env.TL_EMAIL || ENV.TL_EMAIL;

  const tlPassword = process.env.TL_PASSWORD || ENV.TL_PASSWORD;

  if (tlEmail && tlPassword) {
    const [rows] = await db.query(
      "SELECT id FROM team_leaders WHERE email = ? LIMIT 1",
      [tlEmail],
    );

    if (!rows.length) {
      const passwordHash = await bcrypt.hash(tlPassword, 10);

      await db.query(
        "INSERT INTO team_leaders (name, email, password, is_active) VALUES (?, ?, ?, ?)",
        ["Team Leader", tlEmail, passwordHash, 1],
      );

      console.log("✅ TL seeded");
    }
  } else {
    console.log("⚠️ TL seed skipped");
  }

  
};
