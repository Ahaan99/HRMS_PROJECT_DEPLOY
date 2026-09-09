import bcrypt from "bcryptjs";

import { db } from "../../../config/db.js";

/* =====================================================
   Helper: Generate Client Code (C1001 style)
===================================================== */
const generateClientCode = async () => {
  try {
    const [rows] = await db.query(`
      SELECT id FROM clients ORDER BY id DESC LIMIT 1
    `);

    if (!rows.length) return "C1001";

    const nextId = rows[0].id + 1;
    return `C${1000 + nextId}`;
  } catch (err) {
    throw new Error(`Client code generation failed: ${err.message}`);
  }
};
/* =========================================
CREATE CLIENT
========================================= */
export const createSalesClient = async (
  req,
  res
) => {
  try {
    const {
      company_name,
      client_name,
      email,
      phone,
      business_address,
      gst_number,
      website,
      company_description,
      password,
    } = req.body;

    const employee_id =
      req.salesUser.employeeId;

    if (!company_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name required",
      });
    }

    if (!password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password required",
      });
    }

    const password_hash =
      await bcrypt.hash(password, 10);

    const client_code =
      await generateClientCode();

    await db.query(
      `
      INSERT INTO clients (
        client_code,
        company_name,
        client_name,
        email,
        phone,
        business_address,
        gst_number,
        website,
        company_description,
        password_hash,
        employee_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        client_code,
        company_name,
        client_name || null,
        email || null,
        phone || null,
        business_address || null,
        gst_number || null,
        website || null,
        company_description || null,
        password_hash,
        employee_id,
      ]
    );

    return res.json({
      success: true,
      message: "Client created successfully",
    });
  } catch (err) {
    console.error(
      "Create sales client error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};