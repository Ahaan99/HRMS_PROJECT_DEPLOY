import * as service from "./clientAttendance.service.js";

// service throws Error objects tagged with an HTTP status; anything else is a 400
const fail = (res, err) =>
  res.status(err?.status || 400).json({ success: false, message: err?.message || "Request failed" });

export const createAttendance = async (req, res) => {
  try {
    const id = await service.createAttendanceService(req.user.client_code, req.body);
    res.json({ success: true, id });
  } catch (err) {
    fail(res, err);
  }
};

export const listAttendance = async (req, res) => {
  try {
    const data = await service.listAttendanceService(req.user.client_code);
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const data = await service.updateAttendanceService(req.user.client_code, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    fail(res, err);
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    await service.deleteAttendanceService(req.user.client_code, req.params.id);
    res.json({ success: true });
  } catch (err) {
    fail(res, err);
  }
};
