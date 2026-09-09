import * as service from "./locations.service.js";

export const createLocation = async (req, res) => {
  try {
    const data = await service.createLocationService(req.body);
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getLocations = async (req, res) => {
  try {
    const data = await service.getLocationsService();
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};