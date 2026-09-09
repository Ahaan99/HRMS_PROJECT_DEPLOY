import * as statusService from "./superAdminStatuses.service.js";

export const createStatus = async (req, res) => {
  try {
    const data = await statusService.createStatus(req.body);

    return res.status(201).json({
      success: true,
      message: "Status created",
      status: data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to create status",
    });
  }
};

export const getAllStatuses = async (req, res) => {
  try {
    const data = await statusService.getAllStatuses();

    return res.status(200).json({
      success: true,
      statuses: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch statuses",
    });
  }
};

export const getStatusById = async (req, res) => {
  try {
    const data = await statusService.getStatusById(req.params.id);

    return res.status(200).json({
      success: true,
      status: data,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || "Status not found",
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const data = await statusService.updateStatus(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Status updated",
      status: data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update status",
    });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    await statusService.deleteStatus(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Status deleted",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to delete status",
    });
  }
};
