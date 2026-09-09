import bcrypt from "bcryptjs";
import { logLoginEvent } from "../security/security.controller.js";
import crypto from "crypto";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { signToken } from "../../../utils/jwt.js";
import { sendSms } from "../../../utils/sms.js";
import { sendEmail, otpEmailHtml } from "../../../utils/mailer.js";
import { db } from "../../../config/db.js";

/* Create a tracked session and return a token carrying its jti */
const createSession = async (user, req) => {
  const jti = crypto.randomBytes(24).toString("hex");
  const device = (req.headers["user-agent"] || "Unknown device").slice(0, 250);
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null;
  await db.query(
    "INSERT INTO user_sessions (user_id, role, jti, device, ip) VALUES (?,?,?,?,?)",
    [user.id, user.role, jti, device, ip],
  );
  return signToken({ ...user, jti });
};

export const loginSuperAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    "SELECT id, name, email, password_hash, status FROM super_admins WHERE email = ? LIMIT 1",
    [email],
  );

  if (!rows.length) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const admin = rows[0];

  if (admin.status !== "ACTIVE") {
    return res.status(403).json({ success: false, message: "Account blocked" });
  }

  const isMatch = await bcrypt.compare(password, admin.password_hash);

  if (!isMatch) {
    await logLoginEvent(req, {
      user: email,
      role: "SUPER_ADMIN",
      action: "Login",
      status: "failed",
    });
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  /* ---- Two-factor authentication (OTP) ---- */
  const [[flags]] = await db.query(
    "SELECT two_factor_enabled, otp_channel, phone FROM super_admins WHERE id = ?",
    [admin.id],
  );
  if (flags && Number(flags.two_factor_enabled) === 1) {
    const otp = String(crypto.randomInt(100000, 1000000));
    await db.query(
      "UPDATE super_admins SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = ?",
      [otp, admin.id],
    );

    let channel = "EMAIL";
    let delivered = false;
    if (flags.otp_channel === "SMS" && flags.phone) {
      const result = await sendSms(
        flags.phone,
        `Your HRMS login OTP is ${otp}. Valid for 5 minutes.`,
      );
      channel = "SMS";
      delivered = !!result.delivered;
    }
    if (!delivered && admin.email) {
      const r = await sendEmail(
        admin.email,
        "Your HRMS admin login OTP",
        otpEmailHtml(otp, 5),
      );
      if (r.delivered) {
        delivered = true;
        channel = "EMAIL";
      }
    }
    if (!delivered) {
      /* SECURITY: never return the OTP in the API response. If it could not
         be delivered to the REGISTERED email/phone, invalidate it and fail
         the login — an unverified address must never receive the code. */
      await db.query(
        "UPDATE super_admins SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?",
        [admin.id],
      );
      if (process.env.NODE_ENV !== "production")
        console.log(`[2FA dev] OTP for ${admin.email} was NOT delivered: ${otp} (invalidated)`);
      return res.status(502).json({
        success: false,
        message:
          "Could not deliver OTP to your registered email/phone. Please verify your registered contact details.",
      });
    }

    return res.json({
      success: true,
      requires_otp: true,
      admin_id: admin.id,
      channel,
      message: `OTP sent via ${channel} to your registered contact`,
    });
  }

  const user = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: "SUPER_ADMIN",
  };

  const token = await createSession(user, req);

  await logLoginEvent(req, {
    user: admin.email,
    role: "SUPER_ADMIN",
    action: "Login",
    status: "success",
  });

  res.json({ success: true, token, user });
});

/* ================= OTP VERIFY ================= */
export const verifySuperAdminOtp = asyncHandler(async (req, res) => {
  const { admin_id, otp } = req.body;
  if (!admin_id || !otp)
    return res.status(400).json({ success: false, message: "admin_id and otp are required" });

  /* expiry evaluated in SQL so it uses the same clock that wrote the row */
  const [rows] = await db.query(
    "SELECT id, name, email, otp_code, (otp_expires_at > NOW()) AS not_expired FROM super_admins WHERE id = ? LIMIT 1",
    [admin_id],
  );
  if (!rows.length)
    return res.status(401).json({ success: false, message: "Invalid request" });

  const admin = rows[0];
  if (!admin.otp_code || admin.otp_code !== String(otp)) {
    await logLoginEvent(req, {
      user: admin.email,
      role: "SUPER_ADMIN",
      action: "OTP Verify",
      status: "failed",
    });
    return res.status(401).json({ success: false, message: "Invalid OTP" });
  }
  if (!Number(admin.not_expired))
    return res.status(401).json({ success: false, message: "OTP expired. Login again." });

  await db.query(
    "UPDATE super_admins SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?",
    [admin.id],
  );

  const user = { id: admin.id, name: admin.name, email: admin.email, role: "SUPER_ADMIN" };
  const token = await createSession(user, req);
  await logLoginEvent(req, {
    user: admin.email,
    role: "SUPER_ADMIN",
    action: "OTP Verify",
    status: "success",
  });
  res.json({ success: true, token, user });
});

/* ================= SESSIONS / DEVICES ================= */
export const listSessions = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, jti, device, ip, created_at, last_seen
     FROM user_sessions
     WHERE user_id = ? AND role = ? AND revoked = 0
     ORDER BY last_seen DESC`,
    [req.user.id, req.user.role],
  );
  res.json({
    success: true,
    sessions: rows.map((s) => ({
      ...s,
      current: s.jti === req.user.jti,
      jti: undefined,
    })),
  });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const [result] = await db.query(
    "UPDATE user_sessions SET revoked = 1 WHERE id = ? AND user_id = ? AND role = ?",
    [req.params.id, req.user.id, req.user.role],
  );
  if (!result.affectedRows)
    return res.status(404).json({ success: false, message: "Session not found" });
  res.json({ success: true, message: "Session revoked" });
});

export const revokeOtherSessions = asyncHandler(async (req, res) => {
  if (!req.user.jti)
    return res
      .status(400)
      .json({ success: false, message: "Current token has no session. Re-login first." });
  await db.query(
    "UPDATE user_sessions SET revoked = 1 WHERE user_id = ? AND role = ? AND jti != ?",
    [req.user.id, req.user.role, req.user.jti],
  );
  res.json({ success: true, message: "All other sessions signed out" });
});

/* ================= OTP CHANNEL SETTINGS ================= */
export const getOtpSettings = asyncHandler(async (req, res) => {
  const [[row]] = await db.query(
    "SELECT otp_channel, phone FROM super_admins WHERE id = ?",
    [req.user.id],
  );
  res.json({
    success: true,
    otp_channel: row?.otp_channel || "EMAIL",
    phone: row?.phone || "",
  });
});

export const updateOtpSettings = asyncHandler(async (req, res) => {
  const { otp_channel, phone } = req.body;
  if (!["EMAIL", "SMS"].includes(otp_channel))
    return res.status(400).json({ success: false, message: "otp_channel must be EMAIL or SMS" });
  if (otp_channel === "SMS" && !phone?.trim())
    return res.status(400).json({ success: false, message: "Phone number required for SMS OTP" });
  await db.query(
    "UPDATE super_admins SET otp_channel = ?, phone = ? WHERE id = ?",
    [otp_channel, phone?.trim() || null, req.user.id],
  );
  res.json({ success: true, message: "OTP settings updated" });
});

/* ================= 2FA SETTINGS ================= */
export const get2FA = asyncHandler(async (req, res) => {
  const [[row]] = await db.query(
    "SELECT two_factor_enabled FROM super_admins WHERE id = ?",
    [req.user.id],
  );
  res.json({ enabled: Number(row?.two_factor_enabled) === 1 });
});

export const toggle2FA = asyncHandler(async (req, res) => {
  const enabled = req.body.enabled ? 1 : 0;
  await db.query("UPDATE super_admins SET two_factor_enabled = ? WHERE id = ?", [
    enabled,
    req.user.id,
  ]);
  res.json({ success: true, enabled: enabled === 1 });
});

/* ================= MANAGER LOGIN ================= */
export const loginManager = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    "SELECT id, name, email, password, is_active FROM managers WHERE email = ? LIMIT 1",
    [email],
  );

  if (!rows.length) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const manager = rows[0];

  if (!manager.is_active) {
    return res.status(403).json({ success: false, message: "Account blocked" });
  }

  const isMatch = await bcrypt.compare(password, manager.password);

  if (!isMatch) {
    await logLoginEvent(req, {
      user: email,
      role: "MANAGER",
      action: "Login",
      status: "failed",
    });
  }

  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const user = {
    id: manager.id,
    name: manager.name,
    email: manager.email,
    role: "MANAGER",
  };

  const token = signToken(user);

  await logLoginEvent(req, {
    user: manager.email,
    role: "MANAGER",
    action: "Login",
    status: "success",
  });

  res.json({ success: true, token, user });
});

/* ================= TL LOGIN ================= */
export const loginTL = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    "SELECT id, name, email, password, is_active FROM team_leaders WHERE email = ? LIMIT 1",
    [email],
  );

  if (!rows.length) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const tl = rows[0];

  if (!tl.is_active) {
    return res.status(403).json({ success: false, message: "Account blocked" });
  }

  const isMatch = await bcrypt.compare(password, tl.password);

  if (!isMatch) {
    await logLoginEvent(req, {
      user: email,
      role: "TL",
      action: "Login",
      status: "failed",
    });
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const user = {
    id: tl.id,
    name: tl.name,
    email: tl.email,
    role: "TL",
  };

  const token = signToken(user);

  await logLoginEvent(req, {
    user: tl.email,
    role: "TL",
    action: "Login",
    status: "success",
  });

  res.json({ success: true, token, user });
});

/* ================= CHANGE PASSWORD (SUPER_ADMIN) ================= */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "currentPassword and newPassword are required",
    });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters",
    });
  }

  const [rows] = await db.query(
    "SELECT id, password_hash FROM super_admins WHERE id = ? LIMIT 1",
    [req.user.id],
  );
  const admin = rows[0];
  if (!admin) {
    return res.status(404).json({ success: false, message: "Admin not found" });
  }

  const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!isMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Current password is incorrect" });
  }

  const hash = await bcrypt.hash(String(newPassword), 10);
  await db.query("UPDATE super_admins SET password_hash = ? WHERE id = ?", [
    hash,
    admin.id,
  ]);

  res.json({ success: true, message: "Password changed successfully" });
});
