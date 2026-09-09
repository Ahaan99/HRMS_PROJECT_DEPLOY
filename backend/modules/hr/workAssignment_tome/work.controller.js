import * as service from "./work.service.js";

export const getMyAssignments = async (
  req,
  res
) => {
  try {
    const employeeCode =
      req.employee.code;
    const data =
      await service.getMyAssignments(
        employeeCode
      );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

export const updateMyAssignment = async (
  req,
  res
) => {
  try {
    const employeeCode =
      req.employee.code;

    await service.updateMyAssignment(
      req.params.id,
      req.body,
      employeeCode
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: err.message,
    });
  }
};