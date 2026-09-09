import {
  createClientSalesService,
  getClientSalesListService,
  getClientSalesStatsService,
  updateClientSalesService 
} from "./clientSales.service.js";

// ===============================
// helper → detect employee token
// ===============================
const getEmployeeFromToken = (req) => {
  // if employee middleware later adds req.employee, prefer it
  if (req.employee?.employee_id) {
    return req.employee.employee_id;
  }

  // fallback → decode from req.user (if present in your auth)
  if (req.user?.role === "CLIENT_EMPLOYEE") {
    return req.user.employee_id;
  }

  return null;
};

// ===============================
// CREATE
// ===============================
export const createClientSalesController = async (req, res) => {
  try {
  const client_code = req.client?.client_code || req.employee?.client_code;    

    const id = await createClientSalesService(client_code, req.body);

    res.json({ success: true, id });
  } catch (err) {
    console.error("Create sales error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===============================
// LIST
// ===============================
export const getClientSalesListController = async (req, res) => {
  try {

  const client_code = req.client?.client_code || req.employee?.client_code;    
    // const employee_id = req.clientEmployee?.id || null;
      const employee_id = getEmployeeFromToken(req);

    const rows = await getClientSalesListService(
      client_code,
      employee_id,
      req.query
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(`Sales list error: ${err}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===============================
// STATS
// ===============================
export const getClientSalesStatsController = async (req, res) => {
  try {
  const client_code = req.client?.client_code || req.employee?.client_code;    
    const employee_id = req.clientEmployee?.id || null;

    const stats = await getClientSalesStatsService(
      client_code,
      employee_id
    );

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Sales stats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ===============================
// UPDATE
// ===============================
export const updateClientSalesController = async (req, res) => {
  try {
  const client_code = req.client?.client_code || req.employee?.client_code;    
    const { id } = req.params;

    await updateClientSalesService(client_code, id, req.body);

    res.json({
      success: true,
      message: "Record updated successfully",
    });
  } catch (err) {
    console.error("Update sales error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
