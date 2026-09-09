import {
  createFieldSalesService,
  getFieldSalesListService,
  updateFieldSalesService,
} from "./fieldSales.service.js";

// ✅ SAME HELPER (IMPORTANT)
const getEmployeeFromToken = (req) => {
  if (req.employee?.employee_id) return req.employee.employee_id;
  if (req.user?.role === "CLIENT_EMPLOYEE") return req.user.employee_id;
  return null;
};

// ================= CREATE =================
export const createFieldSalesController = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const id = await createFieldSalesService(client_code, req.body);

    res.json({ success: true, id });
  } catch (err) {
    console.error("FieldSales create error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= LIST =================
export const getFieldSalesListController = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const employee_id = getEmployeeFromToken(req);

    const rows = await getFieldSalesListService(
      client_code,
      employee_id,
      req.query
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("FieldSales list error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ================= UPDATE =================
export const updateFieldSalesController = async (req, res) => {
  try {
    const client_code =
      req.client?.client_code || req.employee?.client_code;

    const { id } = req.params;

    await updateFieldSalesService(client_code, id, req.body);

    res.json({
      success: true,
      message: "Lead updated successfully",
    });
  } catch (err) {
    console.error("FieldSales update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};