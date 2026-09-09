import { verifyToken } from "../utils/jwt.js";

export const employeeAuthMiddleware = (
  req,
  res,
  next
) => {
  try {
    const header =
      req.headers.authorization;

    if (
      !header ||
      !header.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token =
      header.split(" ")[1];

    const decoded =
      verifyToken(token);

    req.employee = decoded;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};