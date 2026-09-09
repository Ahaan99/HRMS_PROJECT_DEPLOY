import {
  createFieldSalesService,
  getFieldSalesListService,
  updateFieldSalesService,
  updateFieldSalesLocationService,
} from "./fieldSales.service.js";

// ================= CREATE =================
export const createFieldSalesController = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId;

    const id = await createFieldSalesService(employeeId, req.body);

    res.json({ success: true, id });
  } catch (err) {
    console.error("FieldSales create error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= LIST =================
export const getFieldSalesListController = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId;

    const rows = await getFieldSalesListService(
      employeeId,
      req.query
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("FieldSales list error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE =================
export const updateFieldSalesController = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId;
    const { id } = req.params;

    await updateFieldSalesService(employeeId, id, req.body);

    res.json({
      success: true,
      message: "Lead updated",
    });
  } catch (err) {
    console.error("FieldSales update error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE LOCATION =================
export const updateLeadLocation = async (req, res) => {
  try {
    const employeeId = req.salesUser.employeeId;
    const { id } = req.params;

    await updateFieldSalesLocationService(
      employeeId,
      id,
      req.body
    );

    res.json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (err) {
    console.error("Location update error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};