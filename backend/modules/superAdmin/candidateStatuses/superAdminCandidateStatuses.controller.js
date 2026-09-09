import * as statusService from "./superAdminCandidateStatuses.service.js";

export const getAllCandidateStatuses = async (req, res) => {
  try {
    const data = await statusService.getAllCandidateStatuses();

    return res.status(200).json({
      success: true,
      statuses: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch candidate statuses",
    });
  }
};
