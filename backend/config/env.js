import dotenv from "dotenv";
dotenv.config();

/*
  All secrets MUST come from the .env file (see README section 3.1).
  Only non-sensitive local-development defaults are provided here.
*/

export const ENV = {
  PORT: process.env.PORT || 5000,

  // MySQL
  DB_PORT: process.env.DB_PORT || 3306,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_USER: process.env.DB_USER || "root",
  DB_NAME: process.env.DB_NAME || "hrms_db",
  DB_PASSWORD: process.env.DB_PASSWORD || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "change_me_in_env",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Super Admin seed account
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || "admin@hrms.com",
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || "admin123",

  // Sales
  SALES_JWT_SECRET: process.env.SALES_JWT_SECRET || "change_me_in_env",
  SALES_DEPT_ID: process.env.SALES_DEPT_ID || 2,

  // Manager seed account
  MANAGER_EMAIL: process.env.MANAGER_EMAIL || "manager@hrms.com",
  MANAGER_PASSWORD: process.env.MANAGER_PASSWORD || "123",

  // Team Leader seed account
  TL_EMAIL: process.env.TL_EMAIL || "tl@hrms.com",
  TL_PASSWORD: process.env.TL_PASSWORD || "123",

  // Email / SMTP (used by superAdmin email module + utils/mailer.js)
  EMAIL_HOST: process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
  EMAIL_PORT: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER || process.env.SMTP_USER || "",
  EMAIL_PASS: process.env.EMAIL_PASS || process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || "",

  // Twilio (optional — SMS/OTP). Set these in .env; never hardcode.
  TWILIO_SID: process.env.TWILIO_SID || "",
  TWILIO_AUTH: process.env.TWILIO_AUTH || "",
  TWILIO_PHONE: process.env.TWILIO_PHONE || "",
  MY_PHONE: process.env.MY_PHONE || "",
};
