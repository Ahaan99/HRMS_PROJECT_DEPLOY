import {
  createClientSalesReportService,
  getClientSalesReportService,
  updateClientSalesReportService,
} from "./clientSalesReport.service.js";

// A logged-in client EMPLOYEE is always the salesperson on their own rows.
// A client ADMIN picks the salesperson in the form (employee_id in body).
const getEmployeeFromToken = (req) => {
  if (req.employee?.employee_id) return req.employee.employee_id;
  return null;
};

const resolveEmployeeId = (req) => {
  const fromToken = getEmployeeFromToken(req);
  if (fromToken) return fromToken;
  const fromBody = req.body?.employee_id;
  return fromBody ? Number(fromBody) : null;
};

// ================= CREATE =================
export const createClientSalesReport = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const employee_id = resolveEmployeeId(req);

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
      req.body,
      getEmployeeFromToken(req)
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 

