import { db } from "../../../config/db.js";

export const createTemplate = async (data) => {
  await db.query(
    `
    INSERT INTO agreement_templates
    (
      template_name,
      template_file
    )
    VALUES (?,?)
    `,
    [
      data.template_name,
      data.template_file,
    ]
  );
};

export const getTemplates = async () => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM agreement_templates
    ORDER BY id DESC
    `
  );

  return rows;
};


/* =========================================
GET TEMPLATE BY ID
========================================= */
export const getTemplateById = async (id) => {

    console.log("SERVICE ID:", id);
  const [rows] = await db.query(
    `
    SELECT *
    FROM agreement_templates
    WHERE id = ?
    `,
    [id]
  );
   console.log("ROWS:", rows);
  return rows[0];
};