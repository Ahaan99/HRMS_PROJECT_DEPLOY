import {
  createClientSalesReportService,
  getClientSalesReportService,
  updateClientSalesReportService,
} from "./clientSalesReport.service.js";

// helper
const getEmployeeFromToken = (req) => {
  if (req.employee?.employee_id) return req.employee.employee_id;
  return null;
};

// ================= CREATE =================
export const createClientSalesReport = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const employee_id = getEmployeeFromToken(req);

    const id = await createClientSalesReportService(
      client_code,
      employee_id,
      req.body
    );

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= GET =================
export const getClientSalesReport = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const employee_id = getEmployeeFromToken(req);

    const data = await getClientSalesReportService(
      client_code,
      employee_id
    );

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= UPDATE =================
export const updateClientSalesReport = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const { id } = req.params;

    await updateClientSalesReportService(
      client_code,
      id,
      req.body
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 

