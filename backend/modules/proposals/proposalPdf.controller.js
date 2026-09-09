import { db } from "../../config/db.js";
import { buildProposalPdf } from "./proposalPdf.js";
import { parseRow, clientMatch, CLIENT_VISIBLE_SQL, CLIENT_VISIBLE_STATUSES } from "./proposals.controller.js";

const send = async (res, row) => {
  const proposal = parseRow(row);
  const bytes = await buildProposalPdf(proposal);
  const filename = `${(proposal.proposal_number || `proposal-${proposal.id}`).replace(/[^\w.-]+/g, "_")}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", bytes.length);
  res.end(Buffer.from(bytes));
};

// Client portal: only proposals that belong to the logged-in client and are client-visible.
export const downloadMyProposalPdf = async (req, res) => {
  try {
    const m = await clientMatch(req.client);
    const [[row]] = await db.query(
      `SELECT * FROM proposals WHERE id = ? AND ${m.sql} AND ${CLIENT_VISIBLE_SQL}`,
      [req.params.id, ...m.params, ...CLIENT_VISIBLE_STATUSES],
    );
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    await send(res, row);
  } catch (e) {
    console.error("Proposal PDF error:", e);
    res.status(500).json({ success: false, message: "Failed to generate proposal PDF" });
  }
};

// Sales portal: only proposals authored by the logged-in rep.
export const downloadSalesProposalPdf = async (req, res) => {
  try {
    const repId = Number(req.salesUser?.employeeId);
    if (!repId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const [[row]] = await db.query(
      `SELECT * FROM proposals WHERE id = ? AND sales_employee_id = ? AND created_by_role = 'sales'`,
      [req.params.id, repId],
    );
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    await send(res, row);
  } catch (e) {
    console.error("Proposal PDF error:", e);
    res.status(500).json({ success: false, message: "Failed to generate proposal PDF" });
  }
};

// Super admin: any proposal by id.
export const downloadProposalPdf = async (req, res) => {
  try {
    const [[row]] = await db.query(`SELECT * FROM proposals WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    await send(res, row);
  } catch (e) {
    console.error("Proposal PDF error:", e);
    res.status(500).json({ success: false, message: "Failed to generate proposal PDF" });
  }
};
