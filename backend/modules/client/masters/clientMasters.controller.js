import * as service from "./clientMasters.service.js";

export const getDepartments = async (req, res) => {
  try {
    const data = await service.getDepartmentsService();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDesignations = async (req, res) => {
  try {
    const data = await service.getDesignationsService();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStatuses = async (req, res) => {
  try {
    const data = await service.getStatusesService();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};