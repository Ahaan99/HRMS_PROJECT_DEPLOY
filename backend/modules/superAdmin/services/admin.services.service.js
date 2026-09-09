import { db } from "../../../config/db.js";

// GET
export const fetchAdminServices = async () => {
  const [rows] = await db.query(
    `SELECT * FROM admin_services WHERE is_active = TRUE ORDER BY id DESC`
  );
  return rows;
};

// CREATE
export const createAdminServiceItem = async (data) => {
  const {
    service_name,
    plan_name,
    pricing_type,
    pricing_value,
    mrp,
    replacement_months,
    token_amount,
    payment_terms,
    description,
  } = data;

  const [result] = await db.query(
    `INSERT INTO admin_services
    (service_name, plan_name, pricing_type, pricing_value,
     mrp, replacement_months, token_amount, payment_terms, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      service_name,
      plan_name,
      pricing_type,
      pricing_value,
      mrp,
      replacement_months,
      token_amount,
      payment_terms,
      description,
    ]
  );

  return { id: result.insertId, ...data };
};

// UPDATE
export const updateAdminServiceItem = async (id, data) => {
  const {
    service_name,
    plan_name,
    pricing_type,
    pricing_value,
    mrp,
    replacement_months,
    token_amount,
    payment_terms,
    description,
    is_active,
  } = data;

  await db.query(
    `UPDATE admin_services
     SET service_name=?, plan_name=?, pricing_type=?, pricing_value=?,
         mrp=?, replacement_months=?, token_amount=?, payment_terms=?,
         description=?, is_active=?
     WHERE id=?`,
    [
      service_name,
      plan_name,
      pricing_type,
      pricing_value,
      mrp,
      replacement_months,
      token_amount,
      payment_terms,
      description,
      is_active ?? true,
      id,
    ]
  );

  return { id, ...data };
};

// DELETE
export const deleteAdminServiceItem = async (id) => {
  await db.query(
    `UPDATE admin_services SET is_active = FALSE WHERE id=?`,
    [id]
  );
};