import { db } from "../config/db.js";

export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const clientId = req.clientId;

      const [[feature]] = await db.query(
        `
        SELECT is_enabled
        FROM client_features
        WHERE client_id = ? AND feature_key = ?
        `,
        [clientId, featureKey]
      );

      if (!feature || !feature.is_enabled) {
        return res.status(403).json({
          success: false,
          message: `${featureKey} feature disabled for this client`,
        });
      }

      next();
    } catch (err) {
      console.error("requireFeature error:", err);
      return res.status(500).json({
        success: false,
        message: `Server error: ${err.message}`,
      });
    }
  };
};