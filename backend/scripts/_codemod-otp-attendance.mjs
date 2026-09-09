// Smart-attendance OTP: accept HRMS employee tokens, deliver OTP by email, limit attempts, resend cooldown.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
const p = path.join(root, "backend/modules/attendance/attendance.controller.js");
const raw = fs.readFileSync(p, "utf8");
const crlf = raw.includes("\r\n");
let s = raw.replace(/\r\n/g, "\n");
const once = (from, to, label) => {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1, got ${n}`);
  s = s.replace(from, to);
};

once(
  `import { asyncHandler } from "../../utils/asyncHandler.js";`,
  `import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendEmail } from "../../utils/mailer.js";`,
  "import",
);

once(
  `const OTP_DEBUG = /^(1|true|yes)$/i.test(process.env.OTP_DEBUG || "");`,
  `const OTP_DEBUG = /^(1|true|yes)$/i.test(process.env.OTP_DEBUG || "");
const OTP_TTL_SEC = 300;
const OTP_RESEND_SEC = 45;
const OTP_MAX_ATTEMPTS = 5;`,
  "constants",
);

// HRMS employee tokens -> attendance employee identity (emp_id = employeeCode)
once(
  `  /* HRMS token -> Super Admin / HR act as attendance admin */
  if (["SUPER_ADMIN", "hr"].includes(p.role)) {
    return { id: \`hrms-\${p.id}\`, name: p.name || "HRMS Admin", mobile: "", role: "admin", emp_id: "", hrms: true };
  }
  return null;`,
  `  /* HRMS token -> Super Admin / HR act as attendance admin */
  if (["SUPER_ADMIN", "hr"].includes(p.role)) {
    return { id: \`hrms-\${p.id}\`, name: p.name || "HRMS Admin", mobile: "", role: "admin", emp_id: "", hrms: true };
  }
  /* HRMS employee token -> attendance employee keyed by employeeCode */
  if (String(p.role).toUpperCase() === "EMPLOYEE" && p.id) {
    const [[e]] = await db.query("SELECT id, employeeCode, name, email, phone FROM employees WHERE id = ? AND isActive = 1 LIMIT 1", [p.id]);
    if (!e?.employeeCode) return null;
    return { id: \`hrms-emp-\${e.id}\`, name: e.name, mobile: e.phone || "", email: e.email || "", role: "employee", emp_id: e.employeeCode, hrms: true };
  }
  return null;`,
  "resolveUser",
);

once(
  `export const otpSend = asyncHandler(async (req, res) => {
  const u = req.saUser;
  const otp = String(crypto.randomInt(100000, 1000000));
  await setSetting(\`otp_\${u.emp_id}\`, { otp, expires: Date.now() / 1000 + 300, mobile: u.mobile });
  if (OTP_DEBUG) console.log(\`[smart-attendance] OTP for \${u.name} (\${u.emp_id}) \${u.mobile}: \${otp}\`);
  const m = u.mobile || "";
  const payload = { ok: true, message: \`OTP sent to \${m.slice(0, 2)}****\${m.slice(-2)}\` };
  if (OTP_DEBUG) payload.otp_dev = otp;
  res.json(payload);
});`,
  `const maskEmail = (e = "") => {
  const [user = "", domain = ""] = String(e).split("@");
  if (!domain) return "";
  return \`\${user.slice(0, 2)}\${"*".repeat(Math.max(2, user.length - 2))}@\${domain}\`;
};
const maskMobile = (m = "") => (m ? \`\${m.slice(0, 2)}****\${m.slice(-2)}\` : "");

/** Email of the attendance user: HRMS employees carry it; legacy accounts are looked up by emp_id. */
async function otpEmailFor(u) {
  if (u.email) return u.email;
  const [[e]] = await db.query("SELECT email FROM employees WHERE employeeCode = ? LIMIT 1", [u.emp_id]);
  return e?.email || "";
}

export const otpSend = asyncHandler(async (req, res) => {
  const u = req.saUser;
  if (await findToday(u.emp_id)) return bad(res, "Attendance already marked for today");
  const key = \`otp_\${u.emp_id}\`;
  const prev = await getSetting(key);
  const nowSec = Date.now() / 1000;
  if (prev?.sent_at && nowSec - Number(prev.sent_at) < OTP_RESEND_SEC) {
    const wait = Math.ceil(OTP_RESEND_SEC - (nowSec - Number(prev.sent_at)));
    return res.json({ ok: false, error: \`Please wait \${wait}s before requesting another OTP\`, retry_in: wait });
  }
  const otp = String(crypto.randomInt(100000, 1000000));
  const email = await otpEmailFor(u);
  await setSetting(key, { otp, expires: nowSec + OTP_TTL_SEC, sent_at: nowSec, attempts: 0, mobile: u.mobile, email });
  if (OTP_DEBUG) console.log(\`[smart-attendance] OTP for \${u.name} (\${u.emp_id}) \${email || u.mobile}: \${otp}\`);

  let delivered = false;
  if (email) {
    const r = await sendEmail(
      email,
      "Your attendance OTP",
      \`<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#111">Attendance check-in code</h2>
        <p style="color:#555;margin:0 0 16px">Hi \${u.name || ""}, use this one-time code to mark your attendance. It expires in \${OTP_TTL_SEC / 60} minutes.</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f6f7f9;border-radius:8px;color:#111">\${otp}</div>
        <p style="color:#999;font-size:12px;margin:16px 0 0">If you did not request this, ignore this email.</p>
      </div>\`,
    );
    delivered = Boolean(r.delivered);
  }
  const where = email ? maskEmail(email) : maskMobile(u.mobile);
  const payload = {
    ok: true,
    delivered,
    channel: email ? "email" : "none",
    expires_in: OTP_TTL_SEC,
    retry_in: OTP_RESEND_SEC,
    message: delivered
      ? \`OTP sent to \${where}\`
      : email
        ? \`OTP generated for \${where} (email delivery unavailable - contact HR)\`
        : "No email on file - ask HR to add your email to receive OTPs",
  };
  if (OTP_DEBUG) payload.otp_dev = otp;
  res.json(payload);
});`,
  "otpSend",
);

once(
  `  if (Date.now() / 1000 > Number(stored.expires)) {
    await setSetting(\`otp_\${u.emp_id}\`, null);
    return bad(res, "OTP has expired. Please request a new one");
  }
  if (entered !== stored.otp) return bad(res, "Incorrect OTP");`,
  `  if (Date.now() / 1000 > Number(stored.expires)) {
    await setSetting(\`otp_\${u.emp_id}\`, null);
    return bad(res, "OTP has expired. Please request a new one");
  }
  if (entered !== stored.otp) {
    const attempts = Number(stored.attempts || 0) + 1;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await setSetting(\`otp_\${u.emp_id}\`, null);
      return bad(res, "Too many incorrect attempts. Please request a new OTP");
    }
    await setSetting(\`otp_\${u.emp_id}\`, { ...stored, attempts });
    return bad(res, \`Incorrect OTP (\${OTP_MAX_ATTEMPTS - attempts} attempts left)\`);
  }`,
  "otpVerify attempts",
);

fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s, "utf8");
console.log("attendance.controller.js patched");
