import {
  getPortalUsersService,
} from "./users.service.js";

export const getPortalUsersController = async (req, res) => {
  try {
    const portal = req.query.portal || "ALL";

    const result = await getPortalUsersService(portal);

    // console.log("-----------------------------------------------------",result);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Super Admin Users error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};