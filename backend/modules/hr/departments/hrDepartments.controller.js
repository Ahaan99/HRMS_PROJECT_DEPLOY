import {
    getAllDepartmentsService,
} from "./hrDepartments.service.js";

// LIST
export const getAllDepartments = async (req, res) => {
  try {
    const rows = await getAllDepartmentsService();

    res.json({
      success: true,
      departments: rows, // ⚠️ KEEP THIS FOR FRONTEND
    });
  } catch (err) {
    console.error("Get departments error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};
