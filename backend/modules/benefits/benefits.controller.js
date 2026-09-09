import { db } from "../../config/db.js";

const err = (res, e) => res.status(500).json({ success: false, message: e.message });

/* ---------------- Benefits ---------------- */
export const listBenefits = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employee_benefits ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { err(res, e); }
};

export const createBenefit = async (req, res) => {
  try {
    const { employee_id, employee_name, benefit_type, title, provider, policy_number, amount, start_date, end_date, status, notes } = req.body;
    if (!employee_id || !benefit_type || !title)
      return res.status(400).json({ success: false, message: "employee, type and title are required" });
    const [r] = await db.query(
      `INSERT INTO employee_benefits (employee_id, employee_name, benefit_type, title, provider, policy_number, amount, start_date, end_date, status, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [employee_id, employee_name || "", benefit_type, title, provider || null, policy_number || null, Number(amount) || 0, start_date || null, end_date || null, status || "Active", notes || null]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const updateBenefit = async (req, res) => {
  try {
    const allowed = ["benefit_type","title","provider","policy_number","amount","start_date","end_date","status","notes"];
    const sets = [], vals = [];
    for (const k of allowed) if (k in req.body) { sets.push(`${k} = ?`); vals.push(req.body[k] === "" ? null : req.body[k]); }
    if (!sets.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    vals.push(req.params.id);
    await db.query(`UPDATE employee_benefits SET ${sets.join(", ")} WHERE id = ?`, vals);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

export const deleteBenefit = async (req, res) => {
  try {
    await db.query("DELETE FROM employee_benefits WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

/* ---------------- Trainings ---------------- */
export const listTrainings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*,
              (SELECT COUNT(*) FROM training_assignments a WHERE a.training_id = t.id) AS assigned,
              (SELECT COUNT(*) FROM training_assignments a WHERE a.training_id = t.id AND a.status = 'Completed') AS completed
       FROM trainings t ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (e) { err(res, e); }
};

export const createTraining = async (req, res) => {
  try {
    const { title, description, category, trainer, mode, start_date, end_date, status } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "title is required" });
    const [r] = await db.query(
      `INSERT INTO trainings (title, description, category, trainer, mode, start_date, end_date, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [title, description || null, category || null, trainer || null, mode || "Online", start_date || null, end_date || null, status || "Planned"]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const updateTraining = async (req, res) => {
  try {
    const allowed = ["title","description","category","trainer","mode","start_date","end_date","status"];
    const sets = [], vals = [];
    for (const k of allowed) if (k in req.body) { sets.push(`${k} = ?`); vals.push(req.body[k] === "" ? null : req.body[k]); }
    if (!sets.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    vals.push(req.params.id);
    await db.query(`UPDATE trainings SET ${sets.join(", ")} WHERE id = ?`, vals);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

export const deleteTraining = async (req, res) => {
  try {
    await db.query("DELETE FROM trainings WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

/* -------- Training assignments -------- */
export const listAssignments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, t.title AS training_title FROM training_assignments a
       JOIN trainings t ON t.id = a.training_id
       ${req.query.training_id ? "WHERE a.training_id = ?" : ""}
       ORDER BY a.created_at DESC`,
      req.query.training_id ? [req.query.training_id] : []
    );
    res.json(rows);
  } catch (e) { err(res, e); }
};

export const assignTraining = async (req, res) => {
  try {
    const { training_id, employee_id, employee_name } = req.body;
    if (!training_id || !employee_id)
      return res.status(400).json({ success: false, message: "training and employee are required" });
    const [r] = await db.query(
      "INSERT INTO training_assignments (training_id, employee_id, employee_name) VALUES (?,?,?)",
      [training_id, employee_id, employee_name || ""]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const updateAssignment = async (req, res) => {
  try {
    const { status, completion_date, score } = req.body;
    await db.query(
      `UPDATE training_assignments SET
        status = COALESCE(?, status),
        completion_date = CASE WHEN ? = 'Completed' THEN COALESCE(?, CURDATE()) ELSE completion_date END,
        score = COALESCE(?, score)
       WHERE id = ?`,
      [status || null, status || null, completion_date || null, score || null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

/* ---------------- Certifications ---------------- */
export const listCertifications = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM certifications ORDER BY created_at DESC");
    res.json(rows);
  } catch (e) { err(res, e); }
};

export const createCertification = async (req, res) => {
  try {
    const { employee_id, employee_name, name, issuer, issue_date, expiry_date, credential_id } = req.body;
    if (!employee_id || !name)
      return res.status(400).json({ success: false, message: "employee and name are required" });
    const [r] = await db.query(
      `INSERT INTO certifications (employee_id, employee_name, name, issuer, issue_date, expiry_date, credential_id)
       VALUES (?,?,?,?,?,?,?)`,
      [employee_id, employee_name || "", name, issuer || null, issue_date || null, expiry_date || null, credential_id || null]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const deleteCertification = async (req, res) => {
  try {
    await db.query("DELETE FROM certifications WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

/* ---------------- Skills ---------------- */
export const listSkills = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employee_skills ORDER BY employee_name, skill");
    res.json(rows);
  } catch (e) { err(res, e); }
};

export const createSkill = async (req, res) => {
  try {
    const { employee_id, employee_name, skill, level } = req.body;
    if (!employee_id || !skill)
      return res.status(400).json({ success: false, message: "employee and skill are required" });
    const [r] = await db.query(
      "INSERT INTO employee_skills (employee_id, employee_name, skill, level) VALUES (?,?,?,?)",
      [employee_id, employee_name || "", skill, level || "Beginner"]
    );
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const updateSkill = async (req, res) => {
  try {
    await db.query("UPDATE employee_skills SET level = ? WHERE id = ?", [req.body.level, req.params.id]);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

export const deleteSkill = async (req, res) => {
  try {
    await db.query("DELETE FROM employee_skills WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};
