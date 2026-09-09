import { loginClientEmployeeService } from "./clientEmployeeAuth.service.js";

export const loginClientEmployee = async (req, res) => {
  try {
    const { email, password, client_code } = req.body;

    if (!email || !password || !client_code) {
      return res.status(400).json({
        success: false,
        message: "Email, password and client_code are required",
      });
    }

    const data = await loginClientEmployeeService({
      email,
      password,
      client_code,
    });

    return res.json({
      success: true,
      message: "Login successful",
      ...data,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message || "Login failed",
    });
  }
};
