import {
  getExitRequestsService,
  createExitRequestService,
  updateExitStatusService,
  deleteExitRequestService,
  getExitStatsService,
} from "./superAdminExit.service.js";

export const getExitRequests = async (req, res) => {
  try {
    const { status, search } = req.query;

    const data = await getExitRequestsService(status, search);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createExitRequest = async (req, res) => {
  try {
    const { employee_id, resignation_date, notice_period_days } = req.body;
    if (!employee_id || !resignation_date || !notice_period_days) {
      return res.status(400).json({
        success: false,
        message: "Employee ID, resignation date and notice period are required",
      });
    }

    const id = await createExitRequestService(req.body);

    res.json({
      success: true,
      message: "Exit request submitted",
      data: { id },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateExitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    await updateExitStatusService(id, req.body);

    res.json({
      success: true,
      message: `Exit request ${req.body.status}`,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteExitRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteExitRequestService(id);

    res.json({
      success: true,
      message: "Exit request deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getExitStats = async (req, res) => {
  try {
    const data = await getExitStatsService();
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
