import * as service from "./languages.service.js";

export const createLanguage = async (req, res) => {
  try {
    const data = await service.createLanguageService(req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getLanguages = async (req, res) => {
  try {
    const data = await service.getLanguagesService();
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};