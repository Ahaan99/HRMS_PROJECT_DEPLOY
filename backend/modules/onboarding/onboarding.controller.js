import { db } from "../../config/db.js";
import { logAudit } from "../compliance/compliance.controller.js";
import { buildProfessionalAgreementPdf } from "../superAdmin/clientAgreements/agreementPdf.builder.js";
import { findExistingClient, provisionClient } from "../superAdmin/clients/clientProvisioning.js";

const STAGES = ["Proposal Sent", "Details Submitted", "Agreement Generated", "Agreement Signed", "Onboarded"];

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const err = (res, e) => res.status(e.status || 500).json({ success: false, message: e.message });

const LIST_SQL = `
  SELECT o.*,
         c.client_code, c.company_name AS client_company_name, c.status AS client_status,
         a.agreement_number, a.agreement_pdf, a.status AS agreement_status,
         ex.id AS existing_client_id, ex.client_code AS existing_client_code
    FROM client_onboardings o
    LEFT JOIN clients c ON c.id = o.client_id
    LEFT JOIN client_agreements a ON a.id = o.agreement_id
    LEFT JOIN clients ex ON o.client_id IS NULL AND o.email IS NOT NULL AND LOWER(ex.email) = LOWER(o.email)
`;

const getOne = async (id) => {
  const [rows] = await db.query(`${LIST_SQL} WHERE o.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

export const listOnboardings = async (req, res) => {
  try {
    const [rows] = await db.query(`${LIST_SQL} ORDER BY o.updated_at DESC`);
    const counts = Object.fromEntries(STAGES.map((s) => [s, rows.filter((r) => r.stage === s).length]));
    res.json({ onboardings: rows, counts, stages: STAGES });
  } catch (e) { err(res, e); }
};

export const createOnboarding = async (req, res) => {
  try {
    const { client_name, contact_person, email, phone, service, proposal_notes } = req.body;
    if (!client_name?.trim()) return fail(res, 400, "Client name is required");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Enter a valid email address");

    const [dupe] = await db.query(
      `SELECT id, stage FROM client_onboardings
        WHERE stage <> 'Onboarded' AND (LOWER(client_name) = LOWER(?) OR (? IS NOT NULL AND LOWER(email) = LOWER(?)))
        LIMIT 1`,
      [client_name.trim(), email || null, email || null],
    );
    if (dupe.length) return fail(res, 409, `An onboarding for this client is already in progress (stage: ${dupe[0].stage})`);

    const [r] = await db.query(
      `INSERT INTO client_onboardings (client_name, contact_person, email, phone, service, proposal_notes)
       VALUES (?,?,?,?,?,?)`,
      [client_name.trim(), contact_person || null, email || null, phone || null, service || null, proposal_notes || null],
    );
    await logAudit(req.user?.name, "CREATE", "Onboarding", `Proposal for ${client_name}`);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { err(res, e); }
};

/* ---------- stage transitions ---------- */

const toDetailsSubmitted = async (row) => {
  if (!row.requirements?.trim()) {
    throw Object.assign(new Error("Add the client requirements before marking details as submitted"), { status: 400 });
  }
  return {};
};

const toAgreementGenerated = async (row) => {
  if (row.agreement_id) return {};
  if (!row.contact_person?.trim()) {
    throw Object.assign(new Error("A contact person is required to generate the agreement"), { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  const { pdfUrl, agreementNumber } = await buildProfessionalAgreementPdf({
    client_company_name: row.client_name,
    client_representative_name: row.contact_person,
    client_email: row.email,
    effective_date: today,
    expiry_date: expiry.toISOString().slice(0, 10),
    services_scope: row.service
      ? `The Service Provider shall render ${row.service} services to the Client.${row.requirements ? ` Client requirements: ${row.requirements}` : ""}`
      : row.requirements
        ? `Client requirements: ${row.requirements}`
        : undefined,
    remarks: row.agreement_terms || undefined,
  });

  const [ins] = await db.query(
    `INSERT INTO client_agreements
       (client_id, onboarding_id, agreement_title, agreement_type, agreement_number, start_date, expiry_date, agreement_pdf, status, remarks)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      row.client_id || row.existing_client_id || null,
      row.id,
      `Master Service Agreement — ${row.client_name}`,
      "Master Service Agreement",
      agreementNumber,
      today,
      expiry.toISOString().slice(0, 10),
      pdfUrl,
      "draft",
      row.agreement_terms || null,
    ],
  );
  return { agreement_id: ins.insertId, result: { agreement_number: agreementNumber, pdfUrl } };
};

const toAgreementSigned = async (row) => {
  if (!row.agreement_id) throw Object.assign(new Error("Generate the agreement first"), { status: 400 });
  await db.query(`UPDATE client_agreements SET status = 'active' WHERE id = ?`, [row.agreement_id]);
  return {};
};

const toOnboarded = async (row) => {
  if (row.client_id) return {};
  if (!row.email?.trim()) {
    throw Object.assign(new Error("A client email is required to create the client login"), { status: 400 });
  }

  const existing = await findExistingClient({ email: row.email, phone: row.phone });
  let clientId, client_code, tempPassword = null, linkedExisting = false;

  if (existing) {
    ({ id: clientId, client_code } = existing);
    linkedExisting = true;
  } else {
    ({ clientId, client_code, tempPassword } = await provisionClient({
      company_name: row.client_name,
      client_name: row.contact_person,
      email: row.email,
      phone: row.phone,
      company_description: row.service ? `Service: ${row.service}` : null,
    }));
  }

  if (row.agreement_id) {
    await db.query(`UPDATE client_agreements SET client_id = ? WHERE id = ?`, [clientId, row.agreement_id]);
  }
  return { client_id: clientId, onboarded_at: new Date(), result: { client_code, tempPassword, linkedExisting, email: row.email } };
};

const TRANSITIONS = {
  "Details Submitted": toDetailsSubmitted,
  "Agreement Generated": toAgreementGenerated,
  "Agreement Signed": toAgreementSigned,
  Onboarded: toOnboarded,
};

export const updateOnboarding = async (req, res) => {
  try {
    const row = await getOne(req.params.id);
    if (!row) return fail(res, 404, "Onboarding record not found");

    const editable = ["client_name", "contact_person", "email", "phone", "service", "proposal_notes", "requirements", "agreement_terms"];
    if (row.stage === "Onboarded" && editable.some((k) => k in req.body)) {
      return fail(res, 400, "Onboarded records are read-only. Edit the client from Client Management.");
    }

    const sets = [], vals = [];
    for (const k of editable) {
      if (k in req.body) { sets.push(`${k} = ?`); vals.push(req.body[k] === "" ? null : req.body[k]); }
    }

    let extra = {};
    if (req.body.stage) {
      const target = req.body.stage;
      if (!STAGES.includes(target)) return fail(res, 400, "Invalid stage");
      const from = STAGES.indexOf(row.stage), to = STAGES.indexOf(target);
      if (to !== from + 1) return fail(res, 400, `Move to "${STAGES[from + 1] || "—"}" next; stages must be completed in order`);

      const merged = { ...row };
      editable.forEach((k) => { if (k in req.body) merged[k] = req.body[k] === "" ? null : req.body[k]; });
      const patch = await TRANSITIONS[target](merged);
      extra = patch.result || {};
      for (const [k, v] of Object.entries(patch)) {
        if (["agreement_id", "client_id", "onboarded_at"].includes(k)) { sets.push(`${k} = ?`); vals.push(v); }
      }
      sets.push("stage = ?"); vals.push(target);
    }

    if (!sets.length) return fail(res, 400, "Nothing to update");
    vals.push(row.id);
    await db.query(`UPDATE client_onboardings SET ${sets.join(", ")} WHERE id = ?`, vals);

    if (req.body.stage) {
      const detail = req.body.stage === "Onboarded" && extra.client_code
        ? `#${row.id} -> Onboarded as ${extra.client_code}${extra.linkedExisting ? " (existing client)" : " (new client)"}`
        : `#${row.id} -> ${req.body.stage}`;
      await logAudit(req.user?.name, "STAGE", "Onboarding", detail);
    }

    res.json({ success: true, ...extra });
  } catch (e) { err(res, e); }
};

export const deleteOnboarding = async (req, res) => {
  try {
    const row = await getOne(req.params.id);
    if (!row) return fail(res, 404, "Onboarding record not found");
    if (row.stage === "Onboarded") return fail(res, 400, "Onboarded records cannot be deleted; the client already exists");
    if (row.agreement_id) await db.query(`DELETE FROM client_agreements WHERE id = ? AND client_id IS NULL`, [row.agreement_id]);
    await db.query("DELETE FROM client_onboardings WHERE id = ?", [row.id]);
    await logAudit(req.user?.name, "DELETE", "Onboarding", `#${row.id} ${row.client_name}`);
    res.json({ success: true });
  } catch (e) { err(res, e); }
};
