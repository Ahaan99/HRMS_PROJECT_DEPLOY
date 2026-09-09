import { db } from "../../../config/db.js";
import { PLAN_CATALOG, UNIVERSAL_TERMS } from "../../proposals/planCatalog.js";
import {
  buildProposalValues,
  ensureClientLinked,
  expireStale,
  nextProposalNumber,
  parseRow,
  PROPOSAL_SELECT,
} from "../../proposals/proposals.controller.js";

/* ------------------------------------------------------------------ */
/* Sales portal — a rep drafts proposals for their OWN clients and     */
/* submits them for Super Admin approval. Approval (-> SENT) and the   */
/* client's accept/reject live in the shared proposals module.         */
/* ------------------------------------------------------------------ */

const REP_EDITABLE = new Set(["DRAFT", "REVISION"]);

const repId = (req) => Number(req.salesUser?.employeeId);

/* Loads a proposal only if it belongs to the logged-in rep. */
const loadOwn = async (req) => {
  const [[row]] = await db.query(
    `${PROPOSAL_SELECT} WHERE p.id = ? AND p.sales_employee_id = ? AND p.created_by_role = 'sales'`,
    [req.params.id, repId(req)],
  );
  return row || null;
};

const repName = async (req) => {
  const [[row]] = await db.query("SELECT name, email FROM employees WHERE id = ?", [repId(req)]);
  return row?.name || row?.email || req.salesUser?.email || "Sales";
};

/* A rep may only address proposals to clients they own. */
const assertOwnClient = async (req, clientId) => {
  if (!clientId) return "Select one of your clients for this proposal";
  const [[row]] = await db.query(
    "SELECT id FROM clients WHERE id = ? AND employee_id = ? LIMIT 1",
    [clientId, repId(req)],
  );
  return row ? null : "You can only raise proposals for clients assigned to you";
};

/* ---------- reference data ---------- */

export const getMyClients = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, client_code, company_name, client_name, email, phone, status
       FROM clients WHERE employee_id = ? ORDER BY company_name ASC`,
      [repId(req)],
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getPlanCatalog = async (_req, res) => {
  res.json({ success: true, data: { plans: PLAN_CATALOG, universal_terms: UNIVERSAL_TERMS } });
};

/* ---------- list / detail ---------- */

export const listMine = async (req, res) => {
  try {
    await expireStale();
    const { status, q } = req.query;
    let sql = `${PROPOSAL_SELECT} WHERE p.sales_employee_id = ? AND p.created_by_role = 'sales'`;
    const params = [repId(req)];
    if (status) {
      sql += " AND p.status = ?";
      params.push(status);
    }
    if (q) {
      sql += " AND (p.proposal_number LIKE ? OR p.client_name LIKE ? OR p.client_company LIKE ? OR p.title LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    /* items needing the rep's attention first */
    sql += " ORDER BY (p.status = 'REVISION') DESC, p.updated_at DESC";
    const [rows] = await db.query(sql, params);

    const [[stats]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'DRAFT') AS draft,
         SUM(status = 'PENDING_APPROVAL') AS pending_approval,
         SUM(status = 'REVISION') AS revision,
         SUM(status = 'SENT') AS sent,
         SUM(status = 'ACCEPTED') AS accepted,
         SUM(status = 'REJECTED') AS rejected,
         SUM(status = 'EXPIRED') AS expired,
         COALESCE(SUM(CASE WHEN status = 'ACCEPTED' THEN total ELSE 0 END), 0) AS accepted_value,
         COALESCE(SUM(CASE WHEN status = 'SENT' THEN total ELSE 0 END), 0) AS open_value
       FROM proposals WHERE sales_employee_id = ? AND created_by_role = 'sales'`,
      [repId(req)],
    );

    res.json({ success: true, data: rows.map(parseRow), stats });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getMine = async (req, res) => {
  try {
    await expireStale();
    const row = await loadOwn(req);
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    res.json({ success: true, data: parseRow(row) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ---------- create / edit / delete ---------- */

export const createMine = async (req, res) => {
  try {
    const ownErr = await assertOwnClient(req, req.body?.client_id);
    if (ownErr) return res.status(403).json({ success: false, message: ownErr });

    const { error, values: v } = await buildProposalValues(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const proposal_number = await nextProposalNumber();
    const createdBy = await repName(req);

    const [r] = await db.query(
      `INSERT INTO proposals
        (proposal_number, client_id, client_code, client_name, client_email,
         client_phone, client_company, title, intro, items,
         subtotal, discount_pct, discount_amount, tax_pct, tax_amount, total,
         currency, valid_until, terms, notes,
         token_amount, agreement_months, replacement_months,
         created_by, created_by_role, sales_employee_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sales', ?, 'DRAFT')`,
      [
        proposal_number,
        v.client_id,
        v.client_code,
        v.client_name,
        v.client_email,
        v.client_phone,
        v.client_company,
        v.title,
        v.intro,
        v.items,
        v.subtotal,
        v.discount_pct,
        v.discount_amount,
        v.tax_pct,
        v.tax_amount,
        v.total,
        v.currency,
        v.valid_until,
        v.terms,
        v.notes,
        v.token_amount,
        v.agreement_months,
        v.replacement_months,
        createdBy,
        repId(req),
      ],
    );

    res.json({ success: true, data: { id: r.insertId, proposal_number } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const updateMine = async (req, res) => {
  try {
    const row = await loadOwn(req);
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    if (!REP_EDITABLE.has(row.status))
      return res.status(400).json({
        success: false,
        message:
          row.status === "PENDING_APPROVAL"
            ? "This proposal is with the Super Admin for approval. Withdraw it first if you need to make changes."
            : "This proposal has already gone to the client and can no longer be edited",
      });

    const ownErr = await assertOwnClient(req, req.body?.client_id);
    if (ownErr) return res.status(403).json({ success: false, message: ownErr });

    const { error, values: v } = await buildProposalValues(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    await db.query(
      `UPDATE proposals SET
        client_id = ?, client_code = ?, client_name = ?, client_email = ?,
        client_phone = ?, client_company = ?, title = ?, intro = ?, items = ?,
        subtotal = ?, discount_pct = ?, discount_amount = ?, tax_pct = ?,
        tax_amount = ?, total = ?, currency = ?, valid_until = ?, terms = ?, notes = ?,
        token_amount = ?, agreement_months = ?, replacement_months = ?
       WHERE id = ? AND sales_employee_id = ?`,
      [
        v.client_id,
        v.client_code,
        v.client_name,
        v.client_email,
        v.client_phone,
        v.client_company,
        v.title,
        v.intro,
        v.items,
        v.subtotal,
        v.discount_pct,
        v.discount_amount,
        v.tax_pct,
        v.tax_amount,
        v.total,
        v.currency,
        v.valid_until,
        v.terms,
        v.notes,
        v.token_amount,
        v.agreement_months,
        v.replacement_months,
        row.id,
        repId(req),
      ],
    );

    res.json({ success: true, data: { id: row.id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const deleteMine = async (req, res) => {
  try {
    const row = await loadOwn(req);
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    if (row.status !== "DRAFT")
      return res.status(400).json({
        success: false,
        message: "Only drafts can be deleted. Ask the Super Admin to remove submitted proposals.",
      });
    await db.query("DELETE FROM proposals WHERE id = ? AND sales_employee_id = ?", [
      row.id,
      repId(req),
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ---------- workflow ---------- */

/* DRAFT / REVISION -> PENDING_APPROVAL */
export const submitMine = async (req, res) => {
  try {
    const row = await loadOwn(req);
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    if (!REP_EDITABLE.has(row.status))
      return res.status(400).json({
        success: false,
        message: `A ${row.status.replace("_", " ").toLowerCase()} proposal cannot be submitted`,
      });

    const linkErr = await ensureClientLinked(row);
    if (linkErr) return res.status(400).json({ success: false, message: linkErr });

    await db.query(
      `UPDATE proposals SET status = 'PENDING_APPROVAL', submitted_at = NOW()
       WHERE id = ? AND sales_employee_id = ?`,
      [row.id, repId(req)],
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* PENDING_APPROVAL -> DRAFT (rep pulls it back before the admin acts) */
export const withdrawMine = async (req, res) => {
  try {
    const row = await loadOwn(req);
    if (!row) return res.status(404).json({ success: false, message: "Proposal not found" });
    if (row.status !== "PENDING_APPROVAL")
      return res.status(400).json({
        success: false,
        message: "Only proposals waiting for approval can be withdrawn",
      });
    await db.query(
      `UPDATE proposals SET status = 'DRAFT', submitted_at = NULL
       WHERE id = ? AND sales_employee_id = ?`,
      [row.id, repId(req)],
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
