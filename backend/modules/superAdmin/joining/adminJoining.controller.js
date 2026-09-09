import { db } from "../../../config/db.js";

/* =========================
   GET ALL JOININGS
========================= */
export const getJoinings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM joining_forms ORDER BY id DESC`
    );

    
    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



/* =========================
   GET BY ID
========================= */
export const getJoiningById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM joining_forms WHERE id=?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   CREATE JOINING (FIXED)
========================= */
export const createJoining = async (req, res) => {
  try {
    const body = req.body;

    const photo = req.files?.photo?.[0]?.filename || null;
    const signature = req.files?.signature?.[0]?.filename || null;
    // =========================
// SAFE TYPE CONVERSION FIX
// =========================
body.departmentId =
  body.departmentId === "" || body.departmentId === "null"
    ? null
    : Number(body.departmentId);

body.designationId =
  body.designationId === "" || body.designationId === "null"
    ? null
    : Number(body.designationId);

body.joiningDate =
  body.joiningDate
    ? new Date(body.joiningDate).toISOString().slice(0, 10)
    : null;

   await db.query(
  `
  INSERT INTO joining_forms
  (
    hr_id,
    full_name,
    father_name,
    dob,
    gender,
    marital_status,
    mobile,
    email,
    present_address,
    present_city,
    total_experience,
    qualification12,
    board12,
    year12,
    percent12,
    qualification_grad,
    university_grad,
    year_grad,
    percent_grad,
    qualification_pg,
    university_pg,
    year_pg,
    percent_pg,
    photo,
    signature
  )
 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `,
  [
     1,
    body.full_name,
    body.father_name,
    body.dob || null,
    body.gender,
    body.marital_status || null,
    body.mobile,
    body.email,
    body.present_address,
    body.present_city,
    body.total_experience || null,
    body.qualification12 || null,
    body.board12 || null,
    body.year12 || null,
    body.percent12 || null,
    body.qualification_grad || null,
    body.university_grad || null,
    body.year_grad || null,
    body.percent_grad || null,
    body.qualification_pg || null,
    body.university_pg || null,
    body.year_pg || null,
    body.percent_pg || null,
    photo,
    signature,
  ]
);

    res.json({
      success: true,
      message: "Joining Created",
    });
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   UPDATE JOINING (FIXED)
========================= */
export const updateJoining = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const photo = req.files?.photo?.[0]?.filename;
    const signature = req.files?.signature?.[0]?.filename;

    const [oldRows] = await db.query(
      "SELECT photo, signature FROM joining_forms WHERE id=?",
      [id]
    );

    if (!oldRows.length) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const oldPhoto = oldRows[0].photo;
    const oldSignature = oldRows[0].signature;

await db.query(
`
UPDATE joining_forms SET
  full_name = ?,
  father_name = ?,
  dob = ?,
  gender = ?,
  marital_status = ?,
  mobile = ?,
  email = ?,
  present_address = ?,
  present_city = ?,
  total_experience = ?,
  qualification12 = ?,
  board12 = ?,
  year12 = ?,
  percent12 = ?,
  qualification_grad = ?,
  university_grad = ?,
  year_grad = ?,
  percent_grad = ?,
  qualification_pg = ?,
  university_pg = ?,
  year_pg = ?,
  percent_pg = ?,
  photo = ?,
  signature = ?
WHERE id = ?
`,
[
  body.full_name,
  body.father_name,
  body.dob,
  body.gender,
  body.marital_status || null,
  body.mobile,
  body.email,
  body.present_address,
  body.present_city,
  body.total_experience,
  body.qualification12 ?? null,
  body.board12 ?? null,
  body.year12 ?? null,
  body.percent12 ?? null,
  body.qualification_grad ?? null,
  body.university_grad ?? null,
  body.year_grad ?? null,
  body.percent_grad ?? null,
  body.qualification_pg ?? null,
  body.university_pg ?? null,
  body.year_pg ?? null,
  body.percent_pg ?? null,
  photo || oldPhoto,
  signature || oldSignature,
  id
]
);

    res.json({
      success: true,
      message: "Updated successfully",
    });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   DELETE JOINING
========================= */
export const deleteJoining = async (req, res) => {
  try {
    await db.query(
      `DELETE FROM joining_forms WHERE id=?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};