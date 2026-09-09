import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const submitClientRating = asyncHandler(async (req, res) => {
  const { client_id, rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
  }

  const [result] = await db.query(
    "INSERT INTO client_ratings (client_id, rating, feedback) VALUES (?, ?, ?)",
    [client_id, rating, feedback]
  );

  res.json({ success: true, message: "Thank you for your feedback!", data: { id: result.insertId } });
});

const submitCandidateRating = asyncHandler(async (req, res) => {
  const { candidate_id, rating, feedback } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
  }

  const [result] = await db.query(
    "INSERT INTO candidate_ratings (candidate_id, rating, feedback) VALUES (?, ?, ?)",
    [candidate_id, rating, feedback]
  );

  res.json({ success: true, message: "Thank you for your feedback!", data: { id: result.insertId } });
});

const getRatingAnalytics = asyncHandler(async (req, res) => {
  const [clientRatings] = await db.query(`
    SELECT 
      COUNT(*) as total,
      AVG(rating) as average,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
    FROM client_ratings
  `);

  const [candidateRatings] = await db.query(`
    SELECT 
      COUNT(*) as total,
      AVG(rating) as average,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
    FROM candidate_ratings
  `);

  const [recentClientRatings] = await db.query(
    "SELECT * FROM client_ratings ORDER BY created_at DESC LIMIT 10"
  );

  const [recentCandidateRatings] = await db.query(
    "SELECT * FROM candidate_ratings ORDER BY created_at DESC LIMIT 10"
  );

  res.json({ 
    success: true, 
    data: {
      client: clientRatings[0],
      candidate: candidateRatings[0],
      recent_client_ratings: recentClientRatings,
      recent_candidate_ratings: recentCandidateRatings
    }
  });
});

export { submitClientRating, submitCandidateRating, getRatingAnalytics };
