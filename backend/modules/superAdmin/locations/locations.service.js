import { db } from "../../../config/db.js";

export const createLocationService = async ({ name }) => {
  if (!name) throw new Error("Location required");

  const trimmed = String(name).trim();
  if (!trimmed) throw new Error("Location required");

  try {
    const [res] = await db.query(
      `INSERT INTO locations (name) VALUES (?)`,
      [trimmed]
    );
    return { id: res.insertId };
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      throw new Error(`Location "${trimmed}" already exists`);
    }
    throw e;
  }
};

export const getLocationsService = async () => {
  const [rows] = await db.query(`SELECT id, name FROM locations`);
  return rows;
};