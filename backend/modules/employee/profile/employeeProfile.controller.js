import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { db } from "../../../config/db.js";

const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

const fileUrl = (p) => {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const rel = String(p).replace(/\\/g, "/").replace(/^.*?uploads\//, "");
  return `/uploads/${rel}`;
};

const EDUCATION_LEVELS = [
  ["10th", "qualification10", "board10", "year10", "percent10"],
  ["12th", "qualification12", "board12", "year12", "percent12"],
  ["Graduation", "qualification_grad", "university_grad", "year_grad", "percent_grad"],
  ["Post-graduation", "qualification_pg", "university_pg", "year_pg", "percent_pg"],
];

/**
 * One read model for the employee's own profile: employees row + joining form +
 * education + documents + EVS status. Everything is scoped by the JWT id.
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const employeeId = req.employee.id;

  const [[emp]] = await db.query(
    `SELECT e.id, e.employeeCode, e.joiningId, e.name, e.email, e.phone, e.avatar, e.address,
            e.emergency_name, e.emergency_relation, e.emergency_mobile,
            e.joiningDate, e.isActive, e.createdAt,
            d.name AS department, ds.name AS designation, s.name AS status
       FROM employees e
       LEFT JOIN departments d  ON d.id  = e.departmentId
       LEFT JOIN designations ds ON ds.id = e.designationId
       LEFT JOIN employee_statuses s ON s.id = e.statusId
      WHERE e.id = ? LIMIT 1`,
    [employeeId],
  );
  if (!emp) return bad(res, "Employee not found", 404);

  let joining = null;
  if (emp.joiningId) {
    const [[jf]] = await db.query(`SELECT * FROM joining_forms WHERE id = ? LIMIT 1`, [emp.joiningId]);
    joining = jf || null;
  }

  const [documents] = await db.query(
    `SELECT id, doc_type, file_path, status, remarks, verified_at, created_at
       FROM verification_documents WHERE employee_id = ? ORDER BY created_at DESC`,
    [employeeId],
  );
  const [[identity]] = await db.query(
    `SELECT aadhaar_masked, pan_masked, aadhaar_status, pan_status, remarks, updated_at
       FROM evs_identity_verifications WHERE employee_id = ? ORDER BY updated_at DESC LIMIT 1`,
    [employeeId],
  );
  const [background] = await db.query(
    `SELECT previous_company, status, rehire_eligible, created_at
       FROM background_verifications WHERE employee_id = ? ORDER BY created_at DESC`,
    [employeeId],
  );

  const education = joining
    ? EDUCATION_LEVELS.map(([level, q, b, y, p]) => ({
        level,
        qualification: joining[q] || null,
        institution: joining[b] || null,
        year: joining[y] || null,
        score: joining[p] || null,
      })).filter((r) => r.qualification || r.institution || r.year || r.score)
    : [];

  const docStates = documents.map((d) => String(d.status || "").toLowerCase());
  const idStates = identity ? [identity.aadhaar_status, identity.pan_status].map((s) => String(s || "").toLowerCase()) : [];
  const bgStates = background.map((b) => String(b.status || "").toLowerCase());
  const all = [...docStates, ...idStates, ...bgStates].filter(Boolean);
  const overall = !all.length
    ? "not_started"
    : all.some((s) => /reject|fail/.test(s))
      ? "attention"
      : all.every((s) => /verified|approved|complete/.test(s))
        ? "verified"
        : "in_progress";

  const joiningAddress = joining
    ? [joining.present_address, joining.present_city, joining.present_state, joining.present_pincode].filter(Boolean).join(", ")
    : "";

  res.json({
    success: true,
    data: {
      employee: {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        avatar: fileUrl(emp.avatar) || fileUrl(joining?.photo),
        address: emp.address ?? (joiningAddress || null),
        emergency: {
          name: emp.emergency_name ?? joining?.emergency_name ?? null,
          relation: emp.emergency_relation ?? joining?.emergency_relation ?? null,
          mobile: emp.emergency_mobile ?? joining?.emergency_mobile ?? null,
        },
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
        joiningDate: emp.joiningDate,
        isActive: emp.isActive === 1,
        memberSince: emp.createdAt,
      },
      personal: joining
        ? {
            fullName: joining.full_name,
            fatherName: joining.father_name,
            motherName: joining.mother_name,
            dob: joining.dob,
            gender: joining.gender,
            maritalStatus: joining.marital_status,
            bloodGroup: joining.blood_group,
            nationality: joining.nationality,
            altMobile: joining.alt_mobile,
          }
        : null,
      experience: joining
        ? {
            type: joining.experience_type,
            total: joining.total_experience,
            lastCompany: joining.last_company,
            lastDesignation: joining.last_designation,
          }
        : null,
      bank: joining
        ? {
            holder: joining.account_holder,
            bank: joining.bank_name,
            accountMasked: joining.account_number ? `XXXX${String(joining.account_number).slice(-4)}` : null,
            ifsc: joining.ifsc,
            branch: joining.branch,
          }
        : null,
      education,
      documents: documents.map((d) => ({ ...d, file_url: fileUrl(d.file_path) })),
      verification: {
        overall,
        identity: identity || null,
        background,
        documentsTotal: documents.length,
        documentsVerified: docStates.filter((s) => /verified|approved/.test(s)).length,
      },
    },
  });
});

const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

export const updateMyProfile = asyncHandler(async (req, res) => {
  const employeeId = req.employee.id;
  const { phone, address, emergency } = req.body || {};
  const patch = {};

  if (phone !== undefined) {
    if (phone && !PHONE_RE.test(String(phone))) return bad(res, "Enter a valid phone number");
    patch.phone = phone ? String(phone).trim() : null;
  }
  if (address !== undefined) {
    if (address && String(address).length > 500) return bad(res, "Address is too long (max 500 characters)");
    patch.address = address ? String(address).trim() : null;
  }
  if (emergency !== undefined) {
    const e = emergency || {};
    if (e.mobile && !PHONE_RE.test(String(e.mobile))) return bad(res, "Enter a valid emergency contact number");
    patch.emergency_name = e.name ? String(e.name).trim().slice(0, 120) : null;
    patch.emergency_relation = e.relation ? String(e.relation).trim().slice(0, 60) : null;
    patch.emergency_mobile = e.mobile ? String(e.mobile).trim() : null;
  }
  if (!Object.keys(patch).length) return bad(res, "Nothing to update");

  const cols = Object.keys(patch);
  await db.query(
    `UPDATE employees SET ${cols.map((c) => `\`${c}\` = ?`).join(", ")}, updatedAt = NOW() WHERE id = ?`,
    [...cols.map((c) => patch[c]), employeeId],
  );
  res.json({ success: true, message: "Profile updated" });
});

export const updateMyAvatar = asyncHandler(async (req, res) => {
  const employeeId = req.employee.id;
  if (!req.file) return bad(res, "Choose an image to upload");
  if (!/^image\/(png|jpe?g|webp)$/i.test(req.file.mimetype)) {
    fs.unlink(req.file.path, () => {});
    return bad(res, "Only PNG, JPG or WEBP images are allowed");
  }

  const [[prev]] = await db.query(`SELECT avatar FROM employees WHERE id = ?`, [employeeId]);
  const rel = path.relative(process.cwd(), req.file.path).replace(/\\/g, "/");
  await db.query(`UPDATE employees SET avatar = ?, updatedAt = NOW() WHERE id = ?`, [rel, employeeId]);

  if (prev?.avatar && !/^https?:/i.test(prev.avatar)) {
    fs.unlink(path.join(process.cwd(), prev.avatar), () => {});
  }
  res.json({ success: true, message: "Photo updated", avatar: fileUrl(rel) });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const employeeId = req.employee.id;
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return bad(res, "Current and new password are required");
  if (String(newPassword).length < 8) return bad(res, "New password must be at least 8 characters");
  if (currentPassword === newPassword) return bad(res, "New password must be different from the current one");

  const [[row]] = await db.query(`SELECT password_hash FROM employees WHERE id = ? AND isActive = 1`, [employeeId]);
  if (!row) return bad(res, "Employee not found", 404);
  const ok = await bcrypt.compare(String(currentPassword), row.password_hash);
  if (!ok) return bad(res, "Current password is incorrect", 401);

  const hash = await bcrypt.hash(String(newPassword), 10);
  await db.query(`UPDATE employees SET password_hash = ?, updatedAt = NOW() WHERE id = ?`, [hash, employeeId]);
  res.json({ success: true, message: "Password changed" });
});
