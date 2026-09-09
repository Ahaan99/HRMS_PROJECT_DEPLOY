/**
 * EVS (Employee Verification System) authentication.
 *
 * Replaces the old standalone FastAPI /login, /sso-login, /me endpoints.
 * Accounts are NOT stored separately any more - the EVS portal accepts the
 * same credentials as the HRMS Super Admin, HR and Client portals and issues
 * a standard HRMS JWT (verified by middleware/auth.middleware.js `protect`).
 *
 * Response shape is kept identical to the old Python backend so the EVS
 * React frontend works unchanged:
 *   { access_token, token_type: "bearer", name, role }
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { db } from "../../config/db.js";
import { signToken } from "../../utils/jwt.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { loginHRService } from "../hr/auth/hrAuth.service.js";
import { loginClientAdminService } from "../client/auth/clientAuth.service.js";

/* Roles allowed to use the verification portal (chosen by the product owner) */
export const EVS_ROLES = ["SUPER_ADMIN", "hr", "client_admin"];

/* Human-readable label shown in the EVS UI header */
const roleLabel = (role) =>
  ({ SUPER_ADMIN: "Admin", hr: "HR", client_admin: "Client" })[role] || "User";

/* Shared secret with the Admin Panel SSO link minting (evsSso.routes.js) */
const EVS_SSO_KEY = process.env.EVS_SSO_KEY || "hrms-evs-sso-2026";
const SSO_MAX_AGE_SECONDS = 120;

/* ------------------------------------------------------------------ */
/* POST /api/evs/login                                                 */
/* Body: username|email + password (multipart, urlencoded or JSON).    */
/* Tries Super Admin -> HR -> Client, in that order.                   */
/* ------------------------------------------------------------------ */
export const evsLogin = asyncHandler(async (req, res) => {
  const email = String(req.body?.username || req.body?.email || "").trim();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ detail: "Email and password are required" });
  }

  /* 1. Super Admin */
  const [admins] = await db.query(
    "SELECT id, name, email, password_hash, status FROM super_admins WHERE email = ? LIMIT 1",
    [email],
  );
  if (admins.length) {
    const admin = admins[0];
    if (admin.status !== "ACTIVE") {
      return res.status(403).json({ detail: "Account blocked" });
    }
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ detail: "Invalid password" });

    const token = signToken({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "SUPER_ADMIN",
    });
    return res.json({
      access_token: token,
      token_type: "bearer",
      name: admin.name,
      role: roleLabel("SUPER_ADMIN"),
    });
  }

  /* 2. HR */
  try {
    const hr = await loginHRService({ email, password });
    return res.json({
      access_token: hr.token,
      token_type: "bearer",
      name: hr.employee?.name || "HR",
      role: roleLabel("hr"),
    });
  } catch (e) {
    /* fall through - not an HR account or wrong password */
  }

  /* 3. Client */
  try {
    const client = await loginClientAdminService({ email, password });
    return res.json({
      access_token: client.token,
      token_type: "bearer",
      name: client.client?.company_name || "Client",
      role: roleLabel("client_admin"),
    });
  } catch (e) {
    /* fall through */
  }

  return res.status(401).json({ detail: "Invalid credentials" });
});

/* ------------------------------------------------------------------ */
/* POST /api/evs/sso-login                                             */
/* Trusted handoff from the Admin Panel: sig = HMAC(key, `${email}.${ts}`) */
/* ------------------------------------------------------------------ */
export const evsSsoLogin = asyncHandler(async (req, res) => {
  const { email, ts, sig, name } = req.body || {};
  if (!email || !ts || !sig) {
    return res.status(400).json({ detail: "Invalid SSO request" });
  }

  const tsNum = Number.parseInt(ts, 10);
  if (!Number.isFinite(tsNum)) {
    return res.status(401).json({ detail: "Invalid SSO token" });
  }
  if (Math.abs(Date.now() / 1000 - tsNum) > SSO_MAX_AGE_SECONDS) {
    return res.status(401).json({
      detail: "SSO link expired - open the portal from the HRMS admin panel again",
    });
  }

  const expected = crypto
    .createHmac("sha256", EVS_SSO_KEY)
    .update(`${email}.${ts}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(sig), "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ detail: "Invalid SSO signature" });
  }

  /* SSO links are only minted for a logged-in Super Admin */
  const [[admin]] = await db.query(
    "SELECT id, name, email FROM super_admins WHERE email = ? LIMIT 1",
    [email],
  );

  const token = signToken({
    id: admin?.id || 0,
    name: admin?.name || name || "Super Admin",
    email,
    role: "SUPER_ADMIN",
  });

  res.json({
    access_token: token,
    token_type: "bearer",
    name: admin?.name || name || "Super Admin",
    role: roleLabel("SUPER_ADMIN"),
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/evs/me   (protected)                                       */
/* ------------------------------------------------------------------ */
export const evsMe = asyncHandler(async (req, res) => {
  const u = req.user || {};
  res.json({
    id: u.id,
    name: u.name || null,
    email: u.email || null,
    role: roleLabel(u.role),
    hrms_role: u.role,
  });
});
