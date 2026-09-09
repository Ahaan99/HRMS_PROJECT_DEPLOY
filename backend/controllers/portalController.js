import {
  getAllPortals,
  updatePortalStatus,
} from "../models/portalModel.js";

export const getPortalSettings = async (req, res) => {
  try {
    const portals = await getAllPortals();

    res.json({
      success: true,
      portals,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePortal = async (req, res) => {
  try {
    const { portal_name, is_enabled } = req.body;

    await updatePortalStatus(portal_name, is_enabled);

    res.json({
      success: true,
      message: "Portal status updated",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
