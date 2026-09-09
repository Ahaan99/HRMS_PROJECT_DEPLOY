// import {
//   createDepartmentService,
//   getDepartmentEmployeesService,
//   updateDepartmentService,
//   deleteDepartmentService,
// } from "./superAdminDepartments.service.js";

// import * as departmentService from "./superAdminDepartments.service.js";

// // CREATE
// export const createDepartmentController = async (req, res) => {
//   try {
//     const result = await createDepartmentService(req.body);

//     res.json({
//       success: true,
//       message: "Department created",
//       data: result,
//     });
//   } catch (err) {
//     console.error("Create department error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// // LIST
// export const getAllDepartments = async (req, res) => {
//   try {
//     const data = await departmentService.getAllDepartments();

//     return res.status(200).json({
//       success: true,
//       departments: data,   // ⚠️ IMPORTANT: keep this key
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message || "Failed to fetch departments",
//     });
//   }
// };


// // EMPLOYEES BY DEPT
// export const getDepartmentEmployeesController = async (req, res) => {
//   try {
//     const rows = await getDepartmentEmployeesService(req.params.id);

//     res.json({
//       success: true,
//       data: rows,
//     });
//   } catch (err) {
//     console.error("Dept employees error:", err);
//     res.status(500).json({ success: false });
//   }
// };

// // UPDATE
// export const updateDepartmentController = async (req, res) => {
//   try {
//     const result = await updateDepartmentService(req.params.id, req.body);

//     res.json({
//       success: true,
//       message: "Department updated",
//       data: result,
//     });
//   } catch (err) {
//     console.error("Update department error:", err);
//     res.status(500).json({ success: false });
//   }
// };

// // DELETE
// export const deleteDepartmentController = async (req, res) => {
//   try {
//     const result = await deleteDepartmentService(req.params.id);

//     res.json({
//       success: true,
//       message: "Department deleted",
//       data: result,
//     });
//   } catch (err) {
//     console.error("Delete department error:", err);
//     res.status(500).json({ success: false });
//   }
// };




import {
  createDepartmentService,
  getAllDepartmentsService,
  getDepartmentEmployeesService,
  updateDepartmentService,
  deleteDepartmentService,
} from "./superAdminDepartments.service.js";

// CREATE
export const createDepartmentController = async (req, res) => {
  try {
    const department = await createDepartmentService(req.body);

    res.json({
      success: true,
      message: "Department created",
      data: department,
    });
  } catch (err) {
    console.error("Create department error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

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

// EMPLOYEES BY DEPT
export const getDepartmentEmployeesController = async (req, res) => {
  try {
    const rows = await getDepartmentEmployeesService(req.params.id);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("Dept employees error:", err);
    res.status(500).json({ success: false });
  }
};

// UPDATE
export const updateDepartmentController = async (req, res) => {
  try {
    const department = await updateDepartmentService(req.params.id, req.body);

    res.json({
      success: true,
      message: "Department updated",
      data: department,
    });
  } catch (err) {
    console.error("Update department error:", err);
    res.status(500).json({ success: false });
  }
};

// DELETE
export const deleteDepartmentController = async (req, res) => {
  try {
    await deleteDepartmentService(req.params.id);

    res.json({
      success: true,
      message: "Department deleted",
    });
  } catch (err) {
    console.error("Delete department error:", err);
    res.status(500).json({ success: false });
  }
};