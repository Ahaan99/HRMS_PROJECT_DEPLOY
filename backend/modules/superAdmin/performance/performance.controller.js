import * as service from "./performance.service.js";

export const getAll = async (req, res) => {
  try {
    const data = await service.getAll(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    await service.create(req.body, req.user);
    res.json({ success: true, message: "Created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    await service.update(req.params.id, req.body);
    res.json({ success: true, message: "Updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---- EXTRA ----

export const getStats = async (req, res) => {
  try {
    const data = await service.getStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getByEmployee = async (req, res) => {
  try {
    const data = await service.getByEmployee(req.params.employeeId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const bulkUpdate = async (req, res) => {
  try {
    await service.bulkUpdate(req.body);
    res.json({ success: true, message: "Bulk Updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportReport = async (req, res) => {
  try {
    const buffer = await service.exportReport(req.query);

    res.setHeader("Content-Disposition", "attachment; filename=performance.csv");
    res.setHeader("Content-Type", "text/csv");

    res.send(buffer);
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