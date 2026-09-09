import { db } from "../../../config/db.js";

export const getAllCandidateStatuses = async () => {
  const [rows] = await db.query(
    "SELECT * FROM candidate_statuses ORDER BY id ASC"
  );
  return rows;
};
