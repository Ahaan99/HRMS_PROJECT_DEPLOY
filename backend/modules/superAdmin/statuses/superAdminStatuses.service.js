import { db } from "../../../config/db.js";

export const createStatus = async (payload) => {
  const { name, isActive } = payload;

  if (!name) throw new Error("Status name is required");

  const [existing] = await db.query(
    "SELECT id FROM employee_statuses WHERE name = ?",
    [name.trim()]
  );

  if (existing.length > 0) throw new Error("Status already exists");

  const [result] = await db.query(
    "INSERT INTO employee_statuses (name, isActive) VALUES (?, ?)",
    [name.trim(), isActive === false ? 0 : 1]
  );

  const [rows] = await db.query(
    "SELECT * FROM employee_statuses WHERE id = ?",
    [result.insertId]
  );

  return rows[0];
};

export const getAllStatuses = async () => {
  const [rows] = await db.query(
    "SELECT * FROM employee_statuses ORDER BY id DESC"
  );
  return rows;
};

export const getStatusById = async (id) => {
  const [rows] = await db.query(
    "SELECT * FROM employee_statuses WHERE id = ?",
    [id]
  );

  if (rows.length === 0) throw new Error("Status not found");

  return rows[0];
};

export const updateStatus = async (id, payload) => {
  const [existing] = await db.query(
    "SELECT * FROM employee_statuses WHERE id = ?",
    [id]
  );

  if (existing.length === 0) throw new Error("Status not found");

  const old = existing[0];

  const updated = {
    name: payload.name?.trim() ?? old.name,
    isActive: payload.isActive ?? old.isActive,
  };

  if (updated.name !== old.name) {
    const [dup] = await db.query(
      "SELECT id FROM employee_statuses WHERE name = ?",
      [updated.name]
    );
    if (dup.length > 0) throw new Error("Status already exists");
  }

  await db.query(
    "UPDATE employee_statuses SET name = ?, isActive = ? WHERE id = ?",
    [updated.name, updated.isActive === false ? 0 : 1, id]
  );

  const [rows] = await db.query(
    "SELECT * FROM employee_statuses WHERE id = ?",
    [id]
  );

  return rows[0];
};

export const deleteStatus = async (id) => {
  const [existing] = await db.query(
    "SELECT id FROM employee_statuses WHERE id = ?",
    [id]
  );

  if (existing.length === 0) throw new Error("Status not found");

  await db.query("DELETE FROM employee_statuses WHERE id = ?", [id]);
  return true;
};
