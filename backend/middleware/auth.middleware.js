import { verifyToken } from "../utils/jwt.js";
import { db } from "../config/db.js";

export const protect = (allowedRoles = []) => async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);

    /* Session revocation check (tokens issued with a tracked session) */
    if (decoded.jti) {
      const [[session]] = await db.query(
        "SELECT revoked FROM user_sessions WHERE jti = ? LIMIT 1",
        [decoded.jti],
      );
      if (!session || session.revoked) {
        return res
          .status(401)
          .json({ success: false, message: "Session expired. Please log in again." });
      }
      /* touch last_seen (fire and forget) */
      db.query("UPDATE user_sessions SET last_seen = NOW() WHERE jti = ?", [
        decoded.jti,
      ]).catch(() => {});
    }

    req.user = decoded;
    if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
