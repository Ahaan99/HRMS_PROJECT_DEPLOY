import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const getBlacklist = asyncHandler(async (req, res) => {
  const { status, appeal_status } = req.query;
  
  let query = `
    SELECT bc.*, c.name as candidate_name, c.email as candidate_email, c.phone as candidate_phone,
           ce.name as blacklisted_by_name
    FROM blacklisted_candidates bc
    JOIN candidates c ON bc.candidate_id = c.id
    LEFT JOIN client_employees ce ON bc.blacklisted_by = ce.id
    WHERE 1=1
  `;
  const params = [];

  if (status !== undefined) {
    query += " AND bc.is_appealed = ?";
    params.push(status);
  }
  if (appeal_status) {
    query += " AND bc.appeal_status = ?";
    params.push(appeal_status);
  }

  query += " ORDER BY bc.created_at DESC";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const blacklistCandidate = asyncHandler(async (req, res) => {
  const { candidate_id, reason, candidate_email, candidate_phone } = req.body;
  const blacklisted_by = req.user.employeeId;

  const [existing] = await db.query(
    "SELECT id FROM blacklisted_candidates WHERE candidate_id = ?",
    [candidate_id]
  );

  if (existing.length > 0) {
    return res.status(400).json({ success: false, message: "Candidate already blacklisted" });
  }

  const [result] = await db.query(
    `INSERT INTO blacklisted_candidates (candidate_id, reason, blacklisted_by, candidate_email, candidate_phone)
     VALUES (?, ?, ?, ?, ?)`,
    [candidate_id, reason, blacklisted_by, candidate_email, candidate_phone]
  );

  await db.query(
    "UPDATE candidates SET isActive = 0 WHERE id = ?",
    [candidate_id]
  );

  res.json({ success: true, message: "Candidate blacklisted", data: { id: result.insertId } });
});

const appealBlacklist = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { appeal_status } = req.body;

  await db.query(
    "UPDATE blacklisted_candidates SET is_appealed = 1, appeal_status = ? WHERE id = ?",
    [appeal_status, id]
  );

  if (appeal_status === "APPROVED") {
    const [blacklist] = await db.query("SELECT candidate_id FROM blacklisted_candidates WHERE id = ?", [id]);
    if (blacklist.length > 0) {
      await db.query("UPDATE candidates SET isActive = 1 WHERE id = ?", [blacklist[0].candidate_id]);
    }
  }

  res.json({ success: true, message: "Appeal status updated" });
});

const checkBlacklist = asyncHandler(async (req, res) => {
  const { email, phone } = req.query;

  let query = "SELECT * FROM blacklisted_candidates WHERE 1=0";
  const params = [];

  if (email) {
    query += " OR candidate_email = ?";
    params.push(email);
  }
  if (phone) {
    query += " OR candidate_phone = ?";
    params.push(phone);
  }

  const [rows] = await db.query(query, params);

  res.json({ 
    success: true, 
    data: { 
      is_blacklisted: rows.length > 0,
      details: rows.length > 0 ? rows[0] : null
    } 
  });
});

export { blacklistCandidate, getBlacklist, appealBlacklist, checkBlacklist };
