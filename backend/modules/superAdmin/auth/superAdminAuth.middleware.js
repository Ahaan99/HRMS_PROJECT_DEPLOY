import { verifyToken } from "../../../utils/jwt.js";

const superAdminAuthMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = header.split(" ")[1];
  const decoded = verifyToken(token);

  if (decoded.role !== "SUPER_ADMIN") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  req.user = decoded;
  next();
};

export default superAdminAuthMiddleware;
