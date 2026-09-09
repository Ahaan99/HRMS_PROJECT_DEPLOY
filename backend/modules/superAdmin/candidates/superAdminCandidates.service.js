import { db } from "../../../config/db.js";

const CANDIDATE_SELECT = `
  SELECT 
    c.id,
    c.candidateId,
    c.name,
    c.email,
    c.phone,
    c.jobTitle,
    c.statusId,
    s.name as statusName,
    c.note,
    c.isActive,
    c.createdAt,
    c.updatedAt
  FROM candidates c
  JOIN candidate_statuses s ON s.id = c.statusId
`;

export const createCandidate = async (payload) => {
  const {
    candidateId,
    name,
    email,
    phone,
    jobTitle,
    statusId,
    note,
    isActive,
  } = payload;

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!jobTitle) throw new Error("jobTitle is required");

  const finalCandidateId =
    candidateId || `CAN${Math.floor(1000 + Math.random() * 9000)}`;

  const [dup] = await db.query("SELECT id FROM candidates WHERE email = ?", [
    email,
  ]);
  if (dup.length > 0) throw new Error("Email already exists");

  const [statusExists] = await db.query(
    "SELECT id FROM candidate_statuses WHERE id = ?",
    [statusId || 1]
  );
  if (statusExists.length === 0) throw new Error("Invalid statusId");

  const [result] = await db.query(
    `INSERT INTO candidates
      (candidateId, name, email, phone, jobTitle, statusId, note, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      finalCandidateId,
      name,
      email,
      phone || null,
      jobTitle,
      statusId || 1,
      note || null,
      isActive === false ? 0 : 1,
    ]
  );

  const [rows] = await db.query(`${CANDIDATE_SELECT} WHERE c.id = ?`, [
    result.insertId,
  ]);

  return rows[0];
};

export const getAllCandidates = async () => {
  const [rows] = await db.query(`${CANDIDATE_SELECT} ORDER BY c.id DESC`);
  return rows;
};

export const getCandidateById = async (id) => {
  const [rows] = await db.query(`${CANDIDATE_SELECT} WHERE c.id = ?`, [id]);

  if (rows.length === 0) throw new Error("Candidate not found");

  return rows[0];
};

export const updateCandidate = async (id, payload) => {
  const [existing] = await db.query("SELECT * FROM candidates WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Candidate not found");

  const old = existing[0];

  const updated = {
    candidateId: payload.candidateId ?? old.candidateId,
    name: payload.name ?? old.name,
    email: payload.email ?? old.email,
    phone: payload.phone ?? old.phone,
    jobTitle: payload.jobTitle ?? old.jobTitle,
    statusId: payload.statusId ?? old.statusId,
    note: payload.note ?? old.note,
    isActive: payload.isActive ?? old.isActive,
  };

  if (updated.email !== old.email) {
    const [dup] = await db.query("SELECT id FROM candidates WHERE email = ?", [
      updated.email,
    ]);
    if (dup.length > 0) throw new Error("Email already exists");
  }

  const [statusExists] = await db.query(
    "SELECT id FROM candidate_statuses WHERE id = ?",
    [updated.statusId]
  );
  if (statusExists.length === 0) throw new Error("Invalid statusId");

  await db.query(
    `UPDATE candidates SET
      candidateId = ?,
      name = ?,
      email = ?,
      phone = ?,
      jobTitle = ?,
      statusId = ?,
      note = ?,
      isActive = ?
    WHERE id = ?`,
    [
      updated.candidateId,
      updated.name,
      updated.email,
      updated.phone,
      updated.jobTitle,
      updated.statusId,
      updated.note,
      updated.isActive === false ? 0 : 1,
      id,
    ]
  );

  const [rows] = await db.query(`${CANDIDATE_SELECT} WHERE c.id = ?`, [id]);
  return rows[0];
};

export const deleteCandidate = async (id) => {
  const [existing] = await db.query("SELECT id FROM candidates WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) throw new Error("Candidate not found");

  await db.query("DELETE FROM candidates WHERE id = ?", [id]);
  return true;
}