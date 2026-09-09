import {
  createClientSaleService,
  getAllClientSalesService,
  updateClientSaleService,
  deleteClientSaleService,
} from "./superAdminSales.service.js";

// ===============================
// CREATE
// ===============================
export const createClientSale = async (req, res) => {
  try {
    const {
      client_id,
      plan_name,
      billing_months,
      amount,
      purchase_date,
      start_date,
      due_date,
    } = req.body;

    if (
      !client_id ||
      !plan_name ||
      !billing_months ||
      !amount ||
      !purchase_date ||
      !start_date ||
      !due_date
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (billing_months < 1 || billing_months > 12) {
      return res.status(400).json({
        success: false,
        message: "billing_months must be between 1 and 12",
      });
    }

    const result = await createClientSaleService(req.body);

    res.status(201).json({
      success: true,
      message: "Client sale created successfully",
      data: result,
    });
  } catch (error) {
    console.error("createClientSale error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create client sale",
    });
  }
};

// ===============================
// GET ALL
// ===============================
export const getAllClientSales = async (req, res) => {
  try {
    const rows = await getAllClientSalesService();

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("getAllClientSales error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales",
    });
  }
};

// ===============================
// UPDATE
// ===============================
export const updateClientSale = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateClientSaleService(id, req.body);

    res.json({
      success: true,
      message: "Client sale updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("updateClientSale error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update client sale",
    });
  }
};

// ===============================
// DELETE
// ===============================
export const deleteClientSale = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteClientSaleService(id);

    res.json({
      success: true,
      message: "Client sale deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("deleteClientSale error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete client sale",
    });
  }
};