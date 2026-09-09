import { db } from "../../config/db.js";
import { logAudit } from "../compliance/compliance.controller.js";

const err = (res, e) => res.status(500).json({ success: false, message: e.message });

const STAGES = ["Proposal Sent", "Details Submitted", "Agreement Generated", "Agreement Signed", "Onboarded"];

export const listOnboardings = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM client_onboardings ORDER BY updated_at DESC");
    const counts = {};
    for (const s of STAGES) counts[s] = rows.filter((r) => r.stage === s).length;
    res.json({ onboardings: rows, counts, stages: STAGES });
  } catch (e) { err(res, e); }
};

export const createOnboarding = async (req, res) => {
  try {
    const { client_name, contact_person, email, phone, service, proposal_notes } = req.body;
    if (!client_name)
      return res.status(400).json({ success: false, message: "client name is required" });
    const [r] = await db.query(
      `INSERT INTO client_onboardings (client_name, contact_person, email, phone, service, proposal_notes)
       VALUES (?,?,?,?,?,?)`,
      [client_name, contact_person || null, email || null, phone || null, service || null, proposal_notes || null]
    );
    await logAudit(req.user?.name, "CREATE", "Onboarding", `Proposal for ${client_name}`);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

export const updateOnboarding = async (req, res) => {
  try {
    const allowed = ["client_name","contact_person","email","phone","service","stage","proposal_notes","requirements","agreement_terms"];
    const sets = [], vals = [];
    for (const k of allowed) if (k in req.body) { sets.push(`${k} = ?`); vals.push(req.body[k] === "" ? null : req.body[k]); }
    if (!sets.length) return res.status(400).json({ success: false, message: "Nothing to update" });
    if (req.body.stage && !STAGES.includes(req.body.stage))
      return res.status(400).json({ success: false, message: "Invalid stage" });
    vals.push(req.params.id);
    await db.query(`UPDATE client_onboardings SET ${sets.join(", ")} WHERE id = ?`, vals);
    if (req.body.stage) await logAudit(req.user?.name, "STAGE", "Onboarding", `#${req.params.id} -> ${req.body.stage}`);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};

export const deleteOnboarding = async (req, res) => {
  try {
    await db.query("DELETE FROM client_onboardings WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};
