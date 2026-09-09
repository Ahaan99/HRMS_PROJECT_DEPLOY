import * as service from "./eod.service.js";

export const getMyEODReports = async (
  req,
  res
) => {
  try {
    const employeeId =
      req.employee.id;

    const data =
      await service.getMyEODReports(
        employeeId
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

export const createEOD = async (
  req,
  res
) => {
  try {
    await service.createEOD(
      req.body,
      req.employee.id
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

export const updateEOD = async (
  req,
  res
) => {
  try {
    await service.updateEOD(
      req.params.id,
      req.body,
      req.employee.id
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