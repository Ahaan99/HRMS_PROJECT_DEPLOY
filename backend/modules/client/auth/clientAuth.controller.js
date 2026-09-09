import { loginClientAdminService } from "./clientAuth.service.js";

export const loginClientAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const data = await loginClientAdminService({ email, password });

    return res.json({
      success: true,
      message: "Login successful",
      ...data,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};