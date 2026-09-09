// jobPositions.service.js

import { db } from "../../../config/db.js";

export const createJobPosition = async (title) => {
  await db.query(
    `INSERT INTO job_positions (title) VALUES (?)`,
    [title]
  );
};

export const getJobPositions = async () => {
  const [rows] = await db.query(`
    SELECT * FROM job_positions ORDER BY created_at DESC
  `);
  return rows;
};