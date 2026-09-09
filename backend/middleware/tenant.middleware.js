export const attachClient = (req, res, next) => {
  try {
    // comes from your auth middleware (JWT verify).
    // Client-admin JWTs are signed with { id, client_code, role }
    // (see clientAuth.service.js), so fall back to `id` when the
    // token belongs to a client admin.
    const clientId =
      req.user?.clientId ??
      (req.user?.role === "client_admin" ? req.user?.id : null);

    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: "Client context missing",
      });
    }

    // attach for controllers
    req.clientId = clientId;

    next();
  } catch (err) {
    console.error("attachClient error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};