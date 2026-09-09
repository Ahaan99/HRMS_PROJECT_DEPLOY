import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../../../config/db.js";

/** Next client code in the C1001 style; gap-safe (highest existing code + 1). */
export const generateClientCode = async (conn = db) => {
  const [[row]] = await conn.query(
    "SELECT MAX(CAST(SUBSTRING(client_code, 2) AS UNSIGNED)) AS maxCode FROM clients WHERE client_code REGEXP ?",
    ["^C[0-9]+$"],
  );
  return `C${Math.max(1000, Number(row?.maxCode) || 1000) + 1}`;
};

/** Readable one-time password: e.g. "Kq7x-Ma2p-9Tz". */
export const generateTempPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const pick = (n) => Array.from({ length: n }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  return `${pick(4)}-${pick(4)}-${pick(3)}`;
};

/** Find a client already registered with this email or phone (case-insensitive email). */
export const findExistingClient = async ({ email, phone }, conn = db) => {
  const clauses = [];
  const params = [];
  if (email) { clauses.push("LOWER(email) = LOWER(?)"); params.push(email.trim()); }
  if (phone) { clauses.push("phone = ?"); params.push(phone.trim()); }
  if (!clauses.length) return null;
  const [rows] = await conn.query(
    `SELECT id, client_code, company_name, client_name, email, phone, status
       FROM clients WHERE ${clauses.join(" OR ")} ORDER BY id LIMIT 1`,
    params,
  );
  return rows[0] || null;
};

/**
 * Create a client login with all default features enabled.
 * Returns { clientId, client_code, tempPassword }.
 */
export const provisionClient = async (
  { company_name, client_name, email, phone, business_address, gst_number, website, company_description, password },
  conn = db,
) => {
  if (!company_name) throw new Error("Company name is required");
  const tempPassword = password || generateTempPassword();
  const password_hash = await bcrypt.hash(tempPassword, 10);
  const client_code = await generateClientCode(conn);

  const [result] = await conn.query(
    `INSERT INTO clients
       (client_code, company_name, client_name, email, phone,
        business_address, gst_number, website, company_description, password_hash)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      client_code,
      company_name,
      client_name || null,
      email || null,
      phone || null,
      business_address || null,
      gst_number || null,
      website || null,
      company_description || null,
      password_hash,
    ],
  );
  const clientId = result.insertId;

  await conn.query(
    `INSERT IGNORE INTO client_features (client_id, feature_key, is_enabled)
     SELECT ?, feature_key, 1 FROM features`,
    [clientId],
  );

  return { clientId, client_code, tempPassword };
};
