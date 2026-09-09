import * as employeeService from "./superAdminEmployees.service.js";

// ===================== CREATE =====================
export const createEmployee = async (req, res) => {
  try {
    const payload = { ...req.body };

    // numeric conversions
    payload.departmentId = payload.departmentId ? Number(payload.departmentId) : null;
    payload.designationId = payload.designationId ? Number(payload.designationId) : null;
    payload.statusId = payload.statusId ? Number(payload.statusId) : 1;
    payload.salary = payload.salary ? Number(payload.salary) : 0;

    // joiningId fix
    payload.joiningId =
      payload.joiningId === "null" || payload.joiningId === ""
        ? null
        : payload.joiningId
        ? Number(payload.joiningId)
        : null;

    // isActive fix
    payload.isActive =
      payload.isActive === "true" ||
      payload.isActive === "1" ||
      payload.isActive === 1 ||
      payload.isActive === true
        ? 1
        : 0;

    const data = await employeeService.createEmployee({
      ...payload,
      profile_image: req.file?.filename || null,
    });

    return res.status(201).json({
      success: true,
      employee: data,
    });
  } catch (err) {
    console.error("CREATE ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================== GET ALL =====================
export const getAllEmployees = async (req, res) => {
  try {
    const data = await employeeService.getAllEmployees();

    return res.status(200).json({
      success: true,
      employees: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================== GET BY ID =====================
export const getEmployeeById = async (req, res) => {
  try {
    const data = await employeeService.getEmployeeById(req.params.id);

    return res.status(200).json({
      success: true,
      employee: data,
    });
  } catch (err) {
    return res.status(404).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================== UPDATE =====================

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    // conversions
    payload.departmentId = payload.departmentId ? Number(payload.departmentId) : null;
    payload.designationId = payload.designationId ? Number(payload.designationId) : null;
    payload.statusId = payload.statusId ? Number(payload.statusId) : 1;
    payload.salary =
  payload.salary === "" || payload.salary === undefined || payload.salary === null
    ? 0
    : Number(payload.salary);
    payload.joiningId = payload.joiningId ? Number(payload.joiningId) : null;

    payload.isActive =
      payload.isActive === "1" || payload.isActive === 1 ? 1 : 0;

    // 🔥 IMAGE FIX
    if (req.file) {
      payload.profile_image = req.file.filename;
    }

    const data = await employeeService.updateEmployee(id, payload);

    return res.status(200).json({
      success: true,
      employee: data,
    });

  } catch (err) {
    console.log("UPDATE ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================== DELETE =====================
export const deleteEmployee = async (req, res) => {
  try {
    await employeeService.deleteEmployee(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Employee deleted",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ===================== BY DEPARTMENT =====================
export const getEmployeesByDepartmentController = async (req, res) => {
  try {
    const { departmentId } = req.query;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "departmentId required",
      });
    }

    const data = await employeeService.getEmployeesByDepartment(departmentId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};