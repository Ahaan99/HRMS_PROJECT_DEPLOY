import * as service from "./clientInvoice.service.js";

const getEmployeeFromToken = (req) => {
  if (req.employee?.employee_id) return req.employee.employee_id;
  return null;
};

// CREATE
export const createInvoice = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const employee_id = getEmployeeFromToken(req);

    const data = await service.createInvoice(
      client_code,
      employee_id,
      req.body
    );

    res.json({ success: true, invoice: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL
export const getInvoices = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const employee_id = getEmployeeFromToken(req);

    const data = await service.getInvoices(
      client_code,
      employee_id
    );

    res.json({ success: true, invoices: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET BY ID
export const getInvoiceById = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const source = req.query.source === "sales" ? "sales" : "client";
    const data = await service.getInvoiceById(
      client_code,
      req.params.id,
      source
    );

    res.json({ success: true, invoice: data });
  } catch (err) {
    const status = err.message === "Not found" ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};