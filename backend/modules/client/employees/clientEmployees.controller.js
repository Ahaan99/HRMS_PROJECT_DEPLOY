import * as service from "./clientEmployees.service.js";

export const createEmployee = async (req, res) => {
  try {
    const data = await service.createEmployeeService(
      req.client.client_code,
      req.body
    );
    res.json({ success: true, ...data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const listEmployees = async (req, res) => {
  try {
    const data = await service.listEmployeesService(
      req.client.client_code
    );
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    await service.updateEmployeeService(
      req.client.client_code,
      req.params.id,
      req.body
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const toggleEmployee = async (req, res) => {
  try {
    await service.toggleEmployeeService(
      req.client.client_code,
      req.params.id
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    await service.deleteEmployeeService(
      req.client.client_code,
      req.params.id
    );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};