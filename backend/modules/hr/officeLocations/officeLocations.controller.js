import { db } from "../../../config/db.js";

/*
 * GET /api/hr/office-locations
 * Returns active office locations shaped for the IT portal
 * OfficeLocation component ({ id, name, latitude, longitude, radius }
 * where radius is in km).
 */
export const getOfficeLocations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         name,
         latitude,
         longitude,
         radius_m / 1000 AS radius
       FROM office_locations
       WHERE is_active = 1
       ORDER BY id ASC`
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.log("OFFICE LOCATIONS GET ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/*
 * POST /api/hr/office-locations
 * Body: array of { name, latitude, longitude, radius } (radius in km).
 * The frontend sends the full list, so we replace the active set.
 */
export const saveOfficeLocations = async (req, res) => {
  try {
    const locations = req.body;

    if (!Array.isArray(locations)) {
      return res
        .status(400)
        .json({ success: false, message: "Expected an array of locations" });
    }

    for (const loc of locations) {
      if (
        !loc ||
        !loc.name ||
        loc.latitude === undefined ||
        loc.longitude === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Each location needs name, latitude and longitude",
        });
      }
    }

    /* Replace the active set with the submitted list */
    await db.query(`UPDATE office_locations SET is_active = 0`);

    for (const loc of locations) {
      await db.query(
        `INSERT INTO office_locations (name, latitude, longitude, radius_m, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [
          loc.name,
          Number(loc.latitude),
          Number(loc.longitude),
          Math.round((Number(loc.radius) || 0.1) * 1000),
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.log("OFFICE LOCATIONS SAVE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
