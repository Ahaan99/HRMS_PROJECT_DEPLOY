import { db } from "../../../config/db.js";
import PDFDocument from "pdfkit";

/* ------------------------------------------------------------------ */
/* Table bootstrap                                                      */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_leave_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      client_employee_id INT NOT NULL,
      leave_type VARCHAR(60) NOT NULL DEFAULT 'Casual',
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      days DECIMAL(5,1) NOT NULL,
      reason TEXT NULL,
      status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
      approver_note VARCHAR(255) NULL,
      decided_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_client (client_id),
      INDEX idx_emp (client_employee_id)
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS client_offer_letters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT NOT NULL,
      candidate_name VARCHAR(150) NOT NULL,
      candidate_email VARCHAR(150) NULL,
      position VARCHAR(150) NOT NULL,
      salary_monthly INT NOT NULL DEFAULT 0,
      joining_date DATE NOT NULL,
      template VARCHAR(40) NOT NULL DEFAULT 'standard',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_client (client_id)
    )
  `);
};
ensureTables().catch((e) => console.error("client leaveOffer init:", e.message));

/* ------------------------------------------------------------------ */
/* Leave: create / list / decide                                        */
/* ------------------------------------------------------------------ */
export const createLeave = async (req, res) => {
  try {
    const clientId = req.client.id;
    const { client_employee_id, leave_type = "Casual", from_date, to_date, reason } = req.body;
    if (!client_employee_id || !from_date || !to_date)
      return res.status(400).json({ success: false, message: "Employee, from and to dates are required" });

    const [[emp]] = await db.query(
      "SELECT id, name FROM client_employees WHERE id = ? AND client_id = ?",
      [client_employee_id, clientId]);
    if (!emp) return res.status(404).json({ success: false, message: "Employee not found for this client" });

    const days = Math.max((new Date(to_date) - new Date(from_date)) / 86400000 + 1, 0.5);
    const [r] = await db.query(
      `INSERT INTO client_leave_applications
       (client_id, client_employee_id, leave_type, from_date, to_date, days, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, client_employee_id, leave_type, from_date, to_date, days, reason || null]);
    res.json({ success: true, id: r.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listLeaves = async (req, res) => {
  try {
    const clientId = req.client.id;
    const { status } = req.query;
    const where = ["l.client_id = ?"];
    const params = [clientId];
    if (status) { where.push("l.status = ?"); params.push(status); }
    // LEFT JOIN: client_employees rows are hard-deleted, so an INNER JOIN silently hid
    // every leave that belonged to a since-removed employee.
    const [rows] = await db.query(
      `SELECT l.*,
              COALESCE(e.name, CONCAT('Former employee #', l.client_employee_id)) AS employee_name,
              e.employeeCode
       FROM client_leave_applications l
       LEFT JOIN client_employees e ON e.id = l.client_employee_id
       WHERE ${where.join(" AND ")}
       ORDER BY l.status = 'Pending' DESC, l.created_at DESC`,
      params);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const decideLeave = async (req, res) => {
  try {
    const clientId = req.client.id;
    const { decision, note } = req.body; // Approved | Rejected
    if (!["Approved", "Rejected"].includes(decision))
      return res.status(400).json({ success: false, message: "Decision must be Approved or Rejected" });

    const [r] = await db.query(
      `UPDATE client_leave_applications
       SET status = ?, approver_note = ?, decided_at = NOW()
       WHERE id = ? AND client_id = ? AND status = 'Pending'`,
      [decision, note || null, req.params.id, clientId]);
    if (!r.affectedRows)
      return res.status(404).json({ success: false, message: "Leave not found or already decided" });
    res.json({ success: true, message: `Leave ${decision.toLowerCase()}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Super Admin: cross-client visibility + override decisions            */
/* ------------------------------------------------------------------ */
export const adminListClientLeaves = async (req, res) => {
  try {
    const { status, client_id } = req.query;
    const where = ["1=1"];
    const params = [];
    if (status) { where.push("l.status = ?"); params.push(status); }
    if (client_id) { where.push("l.client_id = ?"); params.push(client_id); }
    const [rows] = await db.query(
      `SELECT l.*,
              COALESCE(e.name, CONCAT('Former employee #', l.client_employee_id)) AS employee_name,
              e.employeeCode,
              c.company_name AS client_name, c.client_code
       FROM client_leave_applications l
       LEFT JOIN client_employees e ON e.id = l.client_employee_id
       LEFT JOIN clients c ON c.id = l.client_id
       WHERE ${where.join(" AND ")}
       ORDER BY l.status = 'Pending' DESC, l.created_at DESC`,
      params);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const adminDecideClientLeave = async (req, res) => {
  try {
    const decision = req.body.decision || req.body.status;
    const note = req.body.note ?? req.body.approver_note;
    if (!["Approved", "Rejected"].includes(decision))
      return res.status(400).json({ success: false, message: "Decision must be Approved or Rejected" });
    if (!/^\d+$/.test(String(req.params.id)))
      return res.status(400).json({ success: false, message: "Invalid leave id" });

    const approver = req.user?.name || "Super Admin";
    const [r] = await db.query(
      `UPDATE client_leave_applications
       SET status = ?, approver_note = ?, decided_at = NOW()
       WHERE id = ? AND status = 'Pending'`,
      [decision, note ? `${note} (${approver})` : `Decided by ${approver}`, req.params.id]);
    if (!r.affectedRows)
      return res.status(404).json({ success: false, message: "Leave not found or already decided" });
    res.json({ success: true, message: `Leave ${decision.toLowerCase()}` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* Restricted offer letters (client-branded, fixed templates)           */
/* ------------------------------------------------------------------ */
const TEMPLATES = {
  standard: { label: "Standard Offer", probation: 3, notice: 30 },
  senior: { label: "Senior Role Offer", probation: 6, notice: 60 },
  intern: { label: "Internship Offer", probation: 1, notice: 15 },
};

export const listOfferTemplates = (req, res) => {
  res.json({
    success: true,
    data: Object.entries(TEMPLATES).map(([key, t]) => ({ key, label: t.label })),
  });
};

export const listOfferLetters = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM client_offer_letters WHERE client_id = ? ORDER BY created_at DESC",
      [req.client.id]);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const generateClientOffer = async (req, res) => {
  try {
    const clientId = req.client.id;
    const { candidate_name, candidate_email, position, salary_monthly, joining_date, template = "standard" } = req.body;
    if (!candidate_name || !position || !joining_date)
      return res.status(400).json({ success: false, message: "Candidate name, position and joining date are required" });
    const tpl = TEMPLATES[template] || TEMPLATES.standard;

    const [[client]] = await db.query(
      "SELECT company_name, email FROM clients WHERE id = ?",
      [clientId]);
    const company = client?.company_name || "Company";

    await db.query(
      `INSERT INTO client_offer_letters
       (client_id, candidate_name, candidate_email, position, salary_monthly, joining_date, template)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, candidate_name, candidate_email || null, position, Number(salary_monthly) || 0, joining_date, template]);

    const monthly = Number(salary_monthly) || 0;
    const annual = monthly * 12;
    const inr = (n) => Number(n || 0).toLocaleString("en-IN");
    const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const doc = new PDFDocument({ margin: 0, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
      `attachment; filename=Offer-${candidate_name.replace(/\s+/g, "_")}.pdf`);
    doc.pipe(res);

    const W = 595.28, M = 56, CW = W - M * 2;
    doc.rect(0, 0, W, 92).fill("#1a2b4a");
    doc.rect(0, 92, W, 4).fill("#c8a24a");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text(company, M, 28, { width: CW });
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#c8a24a").text("PRIVATE & CONFIDENTIAL", M, 62);

    let y = 116;
    doc.font("Helvetica").fontSize(9.5).fillColor("#444444");
    doc.text(`Date: ${fmt(new Date())}`, M, y, { width: CW, align: "right" });
    y += 24;
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#111111").text(candidate_name, M, y);
    if (candidate_email) { y += 14; doc.font("Helvetica").fontSize(9.5).fillColor("#555555").text(candidate_email, M, y); }
    y += 26;
    doc.rect(M, y - 4, CW, 22).fill("#f4f6fa");
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#1a2b4a")
      .text(`Subject: Offer of Employment - ${position} (${tpl.label})`, M + 8, y, { width: CW - 16 });
    y += 34;
    doc.font("Helvetica").fontSize(10).fillColor("#222222");
    doc.text(
      `Dear ${candidate_name},\n\n` +
      `We are pleased to offer you the position of ${position} at ${company}. ` +
      `Your date of joining will be ${fmt(joining_date)}.\n\n` +
      (monthly ? `Your compensation will be INR ${inr(monthly)} per month (INR ${inr(annual)} per annum). ` : "") +
      `You will be on probation for ${tpl.probation} month(s), and the notice period applicable is ${tpl.notice} days.\n\n` +
      `This offer is contingent on satisfactory document verification. Please confirm your acceptance by signing below.\n\n` +
      `We look forward to working with you.`,
      M, y, { width: CW, lineGap: 3 });
    y = doc.y + 30;
    doc.text("Sincerely,", M, y);
    y += 30;
    doc.font("Helvetica-Bold").text(`Authorized Signatory, ${company}`, M, y);
    y += 40;
    doc.rect(M, y, CW, 70).lineWidth(1).stroke("#cccccc");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1a2b4a").text("CANDIDATE ACCEPTANCE", M + 12, y + 10);
    doc.font("Helvetica").fontSize(9.5).fillColor("#222222");
    doc.text("Signature: ______________________", M + 12, y + 38);
    doc.text("Date: ________________", M + 300, y + 38);
    doc.rect(0, 812, W, 30).fill("#1a2b4a");
    doc.font("Helvetica").fontSize(8).fillColor("#c9d4e5")
      .text(`${company}  |  Generated via HRMS Client Portal`, M, 822, { width: CW, align: "center" });
    doc.end();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
