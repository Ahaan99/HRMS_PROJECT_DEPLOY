import mysql from "mysql2/promise";
import { ENV } from "./env.js";

export const db = mysql.createPool({
  host: ENV.DB_HOST,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  port: ENV.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ✅ Return DATE/DATETIME columns as literal strings ("2026-08-24 18:45:00")
  // instead of JS Date objects. This stops mysql2 from applying the server
  // timezone on read and the browser from applying IST again on display,
  // which was shifting attendance check-in / check-out times.
  dateStrings: true,
});
