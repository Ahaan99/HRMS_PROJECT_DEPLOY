import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../../config/db.js";
import { ENV } from "../../config/env.js";
import { signToken } from "../../utils/jwt.js";
import { sendSms } from "../../utils/sms.js";
import { sendEmail, otpEmailHtml } from "../../utils/mailer.js";

/* Normalize Indian mobile numbers to E.164 for Twilio */
const normalizePhone = (p) => {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (String(p).trim().startsWith("+")) return String(p).trim();
  return null; // invalid — don't attempt SMS
};

const PORTALS = ["hr", "employee", "client", "sales", "it"];
const OTP_TTL_MIN = 5;
const MAX_ATTEMPTS = 5;
const isEmail = (v) => /@/.test(v);

/* Find the account for a portal by email OR phone */
const findSubject = async (portal, identifier) => {
  const field = isEmail(identifier) ? "email" : "phone";
  if (portal === "client") {
    const [[row]] = await db.query(
      `SELECT id, client_code, company_name, email, phone, status
       FROM clients WHERE ${field} = ? LIMIT 1`,
      [identifier],
    );
    if (!row) return null;
    if (row.status !== "ACTIVE") throw new Error("Account is not active");
    return row;
  }
  const [[row]] = await db.query(
    `SELECT id, name, email, phone, employeeCode, joiningId, departmentId, isActive
     FROM employees WHERE ${field} = ? LIMIT 1`,
    [identifier],
  );
  if (!row) return null;
  if (!row.isActive) throw new Error("Account is not active");
  if (portal === "sales") {
    const salesDept = Number(ENV.SALES_DEPT_ID);
    if (salesDept && row.departmentId !== salesDept)
      throw new Error("Access denied for this portal");
  }
  return row;
};

/* ---------- POST /request  { portal, identifier } ---------- */
export const requestOtp = async (req, res) => {
  try {
    const { portal, identifier } = req.body;
    if (!PORTALS.includes(portal))
      return res.status(400).json({ success: false, message: "Invalid portal" });
    if (!identifier?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Email or phone number is required" });

    const id = identifier.trim();
    const subject = await findSubject(portal, id);
    if (!subject)
      return res
        .status(404)
        .json({ success: false, message: "No account found for this email/phone" });

    /* simple rate limit: max 3 unexpired OTPs per identifier */
    const [[recent]] = await db.query(
      `SELECT COUNT(*) AS c FROM login_otps
       WHERE portal = ? AND identifier = ? AND used = 0 AND expires_at > NOW()
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
      [portal, id],
    );
    if (recent.c >= 3)
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please wait a few minutes.",
      });

    const otp = String(crypto.randomInt(100000, 1000000));
    await db.query(
      `INSERT INTO login_otps (portal, subject_id, identifier, otp_code, expires_at)
       VALUES (?,?,?,?, DATE_ADD(NOW(), INTERVAL ${OTP_TTL_MIN} MINUTE))`,
      [portal, subject.id, id, otp],
    );

    /* delivery: email first when we have one, SMS as fallback/primary for phone logins */
    let delivered = false;
    let channel = "NONE";
    const email = isEmail(id) ? id : subject.email;
    const phone = normalizePhone(!isEmail(id) ? id : subject.phone);

    if (isEmail(id) && email) {
      const r = await sendEmail(
        email,
        "Your HRMS login OTP",
        otpEmailHtml(otp, OTP_TTL_MIN),
      );
      if (r.delivered) {
        delivered = true;
        channel = "EMAIL";
      }
    }
    if (!delivered && phone) {
      const r = await sendSms(
        phone,
        `Your HRMS login OTP is ${otp}. Valid for ${OTP_TTL_MIN} minutes.`,
      );
      if (r?.delivered) {
        delivered = true;
        channel = "SMS";
      }
    }
    if (!delivered && !isEmail(id) && email) {
      /* phone login but SMS failed — try their email on file */
      const r = await sendEmail(
        email,
        "Your HRMS login OTP",
        otpEmailHtml(otp, OTP_TTL_MIN),
      );
      if (r.delivered) {
        delivered = true;
        channel = "EMAIL";
      }
    }
    if (!delivered) {
      /* SECURITY: never hand the OTP back in the API response. If it could
         not be delivered to the REGISTERED email/phone, invalidate it and
         fail — an unreachable/fake address must never be able to log in.
         (Server console log below is for local development only.) */
      await db.query(
        `UPDATE login_otps SET used = 1
         WHERE portal = ? AND identifier = ? AND otp_code = ? AND used = 0`,
        [portal, id, otp],
      );
      if (process.env.NODE_ENV !== "production")
        console.log(`[OTP dev] ${portal} OTP for ${id} was NOT delivered: ${otp} (invalidated)`);
      return res.status(502).json({
        success: false,
        message:
          "Could not deliver OTP to your registered email/phone. Please contact your administrator to verify your registered contact details.",
      });
    }

    res.json({
      success: true,
      message:
        channel === "EMAIL"
          ? "OTP sent to your registered email"
          : "OTP sent via SMS to your registered phone",
      channel,
      expires_in: OTP_TTL_MIN * 60,
    });
  } catch (e) {
    const code = /not active|denied/.test(e.message) ? 403 : 500;
    res.status(code).json({ success: false, message: e.message });
  }
};

/* Build the same token/response shape each portal's password login uses */
const issueForPortal = async (portal, subject) => {
  if (portal === "hr" || portal === "it") {
    const token = jwt.sign(
      {
        id: subject.id,
        employee_id: subject.id,
        employee_code: subject.employeeCode,
        role: "hr",
      },
      ENV.JWT_SECRET,
      { expiresIn: "7d" },
    );
    return {
      token,
      employee: {
        id: subject.id,
        employee_code: subject.employeeCode,
        name: subject.name,
        email: subject.email,
      },
    };
  }

  if (portal === "employee") {
    const [[dept]] = await db.query(
      "SELECT name FROM departments WHERE id = ? LIMIT 1",
      [subject.departmentId],
    );
    const user = {
      id: subject.id,
      role: "EMPLOYEE",
      name: subject.name,
      email: subject.email,
      employeeCode: subject.employeeCode,
      joiningId: subject.joiningId,
      department: dept?.name || null,
    };
    return { token: signToken(user), user };
  }

  if (portal === "sales") {
    const token = jwt.sign(
      {
        employeeId: subject.id,
        employeeCode: subject.employeeCode,
        email: subject.email,
        role: "sales",
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN || "7d" },
    );
    return {
      token,
      user: { id: subject.id, name: subject.name, email: subject.email },
    };
  }

  /* client */
  const [features] = await db.query(
    `SELECT feature_key FROM client_features WHERE client_id = ? AND is_enabled = 1`,
    [subject.id],
  );
  const token = jwt.sign(
    { id: subject.id, client_code: subject.client_code, role: "client_admin" },
    ENV.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
  return {
    token,
    client: {
      id: subject.id,
      client_code: subject.client_code,
      company_name: subject.company_name,
      email: subject.email,
    },
    enabledFeatures: features.map((f) => f.feature_key),
  };
};

/* ---------- POST /verify  { portal, identifier, otp } ---------- */
export const verifyOtp = async (req, res) => {
  try {
    const { portal, identifier, otp } = req.body;
    if (!PORTALS.includes(portal) || !identifier?.trim() || !otp)
      return res
        .status(400)
        .json({ success: false, message: "portal, identifier and otp are required" });

    const id = identifier.trim();
    /* expiry is evaluated in SQL (expires_at > NOW()) so the check uses the
       same clock/timezone that wrote the row — comparing in Node caused
       fresh OTPs to look expired when MySQL and Node timezones differed */
    const [[row]] = await db.query(
      `SELECT *, (expires_at > NOW()) AS not_expired FROM login_otps
       WHERE portal = ? AND identifier = ? AND used = 0
       ORDER BY id DESC LIMIT 1`,
      [portal, id],
    );
    if (!row)
      return res
        .status(401)
        .json({ success: false, message: "No pending OTP. Request a new one." });
    if (!Number(row.not_expired))
      return res
        .status(401)
        .json({ success: false, message: "OTP expired. Request a new one." });
    if (row.attempts >= MAX_ATTEMPTS)
      return res
        .status(429)
        .json({ success: false, message: "Too many wrong attempts. Request a new OTP." });

    if (row.otp_code !== String(otp).trim()) {
      await db.query("UPDATE login_otps SET attempts = attempts + 1 WHERE id = ?", [
        row.id,
      ]);
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    await db.query("UPDATE login_otps SET used = 1 WHERE id = ?", [row.id]);

    const subject = await findSubject(portal, id);
    if (!subject)
      return res.status(401).json({ success: false, message: "Account not found" });

    const data = await issueForPortal(portal, subject);
    res.json({ success: true, message: "Login successful", ...data });
  } catch (e) {
    const code = /not active|denied/.test(e.message) ? 403 : 500;
    res.status(code).json({ success: false, message: e.message });
  }
};
