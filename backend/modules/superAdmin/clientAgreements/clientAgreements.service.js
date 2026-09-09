import { db } from "../../../config/db.js";

/* =========================================
CREATE
========================================= */
export const createClientAgreement = async (data) => {
  const sql = `
    INSERT INTO client_agreements (
      client_id,
      agreement_title,
      agreement_type,
      agreement_number,
      start_date,
      expiry_date,
      agreement_pdf,
      status,
      remarks
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.client_id || null,
    data.agreement_title,
    data.agreement_type || null,
    data.agreement_number || null,
    data.start_date || null,
    data.expiry_date || null,
    data.agreement_pdf,
    data.status || "active",
    data.remarks || null,
  ];

  await db.query(sql, values);
};

/* =========================================
GET ALL
========================================= */
export const getAllClientAgreements = async () => {
  const sql = `
    SELECT
      ca.*,
      c.company_name
    FROM client_agreements ca
    LEFT JOIN clients c
      ON ca.client_id = c.id
    ORDER BY ca.id DESC
  `;

  const [rows] = await db.query(sql);

  return rows;
};

/* =========================================
DELETE
========================================= */
export const deleteClientAgreement = async (id) => {
  await db.query(
    `
    DELETE FROM client_agreements
    WHERE id = ?
    `,
    [id]
  );
};
