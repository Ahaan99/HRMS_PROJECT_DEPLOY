import { db } from "../../../config/db.js";

export const createDesignation = async (payload) => {
  const { departmentId, name, isActive } = payload;

  if (!departmentId) throw new Error("departmentId is required");
  if (!name) throw new Error("Designation name is required");

  const [dept] = await db.query("SELECT id FROM departments WHERE id = ?", [
    departmentId,
  ]);

  if (dept.length === 0) throw new Error("Department not found");

  const [existing] = await db.query(
    "SELECT id FROM designations WHERE departmentId = ? AND name = ?",
    [departmentId, name.trim()]
  );

  if (existing.length > 0) throw new Error("Designation already exists");

  const [result] = await db.query(
    "INSERT INTO designations (departmentId, name, isActive) VALUES (?, ?, ?)",
    [departmentId, name.trim(), isActive === false ? 0 : 1]
  );

  const [rows] = await db.query("SELECT * FROM designations WHERE id = ?", [
    result.insertId,
  ]);

  return rows[0];
};

export const getAllDesignations = async () => {
  const [rows] = await db.query(
    `SELECT d.*, dept.name as departmentName
     FROM designations d
     JOIN departments dept ON dept.id = d.departmentId
     ORDER BY d.id DESC`
  );

  return rows;
};

export const getDesignationById = async (id) => {
  const [rows] = await db.query("SELECT * FROM designations WHERE id = ?", [id]);

  if (rows.length === 0) throw new Error("Designation not found");

  return rows[0];
};

export const updateDesignation = async (id, payload) => {
  const [existing] = await db.query("SELECT * FROM designations WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Designation not found");

  const old = existing[0];

  const updated = {
    departmentId: payload.departmentId ?? old.departmentId,
    name: payload.name?.trim() ?? old.name,
    isActive: payload.isActive ?? old.isActive,
  };

  const [dept] = await db.query("SELECT id FROM departments WHERE id = ?", [
    updated.departmentId,
  ]);
  if (dept.length === 0) throw new Error("Department not found");

  if (updated.departmentId !== old.departmentId || updated.name !== old.name) {
    const [dup] = await db.query(
      "SELECT id FROM designations WHERE departmentId = ? AND name = ?",
      [updated.departmentId, updated.name]
    );
    if (dup.length > 0) throw new Error("Designation already exists");
  }

  await db.query(
    "UPDATE designations SET departmentId = ?, name = ?, isActive = ? WHERE id = ?",
    [
      updated.departmentId,
      updated.name,
      updated.isActive === false ? 0 : 1,
      id,
    ]
  );

  const [rows] = await db.query("SELECT * FROM designations WHERE id = ?", [id]);
  return rows[0];
};

export const deleteDesignation = async (id) => {
  const [existing] = await db.query("SELECT id FROM designations WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Designation not found");

  await db.query("DELETE FROM designations WHERE id = ?", [id]);
  return true;
};
