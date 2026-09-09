import * as service from "./itAuth.service.js";

export const loginIT = async (req, res) => {
  try {
    const data = await service.loginITService(req.body);
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
