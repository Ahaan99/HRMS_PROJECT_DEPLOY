import * as service from "./performance.service.js";

export const getMyPerformance = async (
  req,
  res
) => {

  try {
    const employeeCode =
      req.salesUser.employeeCode;

    const data =
      await service.getMyPerformance(
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
