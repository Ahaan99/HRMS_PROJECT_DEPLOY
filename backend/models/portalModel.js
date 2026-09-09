import { db } from "../config/db.js"

export const getAllPortals = async () => {
  const [rows] = await db.query("SELECT * FROM portal_settings");
  return rows;
};

export const updatePortalStatus = async (portal, status) => {
  const [result] = await db.query(
    "UPDATE portal_settings SET is_enabled = ? WHERE portal_name = ?",
    [status, portal]
  );
  return result;
};

export const getPortalStatus = async (portal) => {
  const [rows] = await db.query(
    "SELECT is_enabled FROM portal_settings WHERE portal_name = ?",
    [portal]
  );

  return rows[0];
};
