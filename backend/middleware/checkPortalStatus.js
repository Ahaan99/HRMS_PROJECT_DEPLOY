import {db} from "../config/db.js";

const checkPortalStatus = (portalName) => {
  return async (req, res, next) => {
    try {
      const [rows] = await db.query(
        "SELECT is_enabled FROM portal_settings WHERE portal_name = ?",
        [portalName]
      );

      if (!rows.length || rows[0].is_enabled === 0) {
        return res.status(403).json({
          success: false,
          message: "Portal is currently disabled for maintains",
          portal_disabled: true,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
};

export default checkPortalStatus;