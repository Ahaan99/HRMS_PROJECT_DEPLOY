import * as service from "./hrAuth.service.js";

export const loginHR = async (req, res) => {
  try {
    const data = await service.loginHRService(req.body);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
