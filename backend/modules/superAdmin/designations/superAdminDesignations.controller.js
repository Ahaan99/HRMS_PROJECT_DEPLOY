import * as designationService from "./superAdminDesignations.service.js";

export const createDesignation = async (req, res) => {
  try {
    const data = await designationService.createDesignation(req.body);

    return res.status(201).json({
      success: true,
      message: "Designation created",
      designation: data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to create designation",
    });
  }
};

export const getAllDesignations = async (req, res) => {
  try {
    const data = await designationService.getAllDesignations();

    return res.status(200).json({
      success: true,
      designations: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch designations",
    });
  }
};

export const getDesignationById = async (req, res) => {
  try {
    const data = await designationService.getDesignationById(req.params.id);

    return res.status(200).json({
      success: true,
      designation: data,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message || "Designation not found",
    });
  }
};

export const updateDesignation = async (req, res) => {
  try {
    const data = await designationService.updateDesignation(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Designation updated",
      designation: data,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update designation",
    });
  }
};

export const deleteDesignation = async (req, res) => {
  try {
    await designationService.deleteDesignation(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Designation deleted",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to delete designation",
    });
  }
};
