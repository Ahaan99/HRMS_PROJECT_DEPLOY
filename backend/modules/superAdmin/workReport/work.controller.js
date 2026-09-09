import * as service from "./work.service.js";

// ASSIGNMENTS
export const getAssignments = async (req, res) => {
  try {
    const data = await service.getAssignments();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    await service.createAssignment(req.body, req.user);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    await service.updateAssignment(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    await service.deleteAssignment(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getAssignmentStats = async (req, res) => {
  const data = await service.getAssignmentStats();
  res.json({ success: true, data });
};

// EOD
export const getEODReports = async (req, res) => {
  const data = await service.getEODReports();
  res.json({ success: true, data });
};

export const createEOD = async (req, res) => {
  try {
    await service.createEOD(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateEOD = async (req, res) => {
  await service.updateEOD(req.params.id, req.body);
  res.json({ success: true });
};

export const getEODStats = async (req, res) => {
  const data = await service.getEODStats();
  res.json({ success: true, data });
};

export const getPendingEOD = async (req, res) => {
  const data = await service.getPendingEOD();
  res.json({ success: true, data });
};

export const approveEOD = async (req, res) => {
  await service.approveEOD(req.params.id, req.body, req.user);
  res.json({ success: true });
};

export const getDepartments = async (req, res) => {
  try {
    const data = await service.getDepartments();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const data = await service.getEmployees();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectEOD = async (req, res) => {
  try {
    await service.rejectEOD(req.params.id, req.user);
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
};

export const deleteEOD = async (req, res) => {
  await service.deleteEOD(req.params.id);
  res.json({ success: true });
};
