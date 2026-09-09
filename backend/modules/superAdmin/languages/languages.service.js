import { db } from "../../../config/db.js";

export const createLanguageService = async ({ name }) => {
  if (!name) throw new Error("Language required");

  const trimmed = String(name).trim();
  if (!trimmed) throw new Error("Language required");

  try {
    const [res] = await db.query(
      `INSERT INTO languages (name) VALUES (?)`,
      [trimmed]
    );
    return { id: res.insertId };
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      throw new Error(`Language "${trimmed}" already exists`);
    }
    throw e;
  }
};

export const getLanguagesService = async () => {
  const [rows] = await db.query(`SELECT id, name FROM languages`);
  return rows;
};