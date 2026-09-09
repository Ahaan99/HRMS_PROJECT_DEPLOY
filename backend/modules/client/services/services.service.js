import { db } from "../../../config/db.js";

// GET
export const fetchServices = async (clientId) => {
  const [rows] = await db.query(
    `SELECT * FROM client_services 
     WHERE client_id = ? AND is_active = TRUE
     ORDER BY id DESC`,
    [clientId]
  );
  return rows;
};

// CREATE
export const createServiceItem = async (data) => {
  const {
    client_id,
    employee_id,
    service_name,
    plan_name,
    pricing_type,
    pricing_value,
    replacement_months,
    token_amount,
    payment_terms,
    description,
    mrp,
  } = data;

  const [result] = await db.query(
    `INSERT INTO client_services
    (client_id, employee_id, service_name, plan_name, pricing_type, pricing_value,
     replacement_months, token_amount, payment_terms, description, mrp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      employee_id,
      service_name,
      plan_name,
      pricing_type,
      pricing_value,
      replacement_months,
      token_amount,
      payment_terms,
      description,
      mrp,
    ]
  );

  return { id: result.insertId, ...data };
};

// UPDATE
export const updateServiceItem = async (id, clientId, data) => {
  const {
    service_name,
    plan_name,
    pricing_type,
    pricing_value,
    replacement_months,
    token_amount,
    payment_terms,
    description,
    employee_id,
    mrp,
    is_active,
  } = data;

  await db.query(
    `UPDATE client_services
     SET service_name=?, plan_name=?, pricing_type=?, pricing_value=?,
         replacement_months=?, token_amount=?, payment_terms=?, description=?,
         employee_id=?, mrp=?, is_active=?
     WHERE id=? AND client_id=?`,
    [
      service_name,
      plan_name,
      pricing_type,
      pricing_value,
      replacement_months,
      token_amount,
      payment_terms,
      description,
      employee_id || null,
      mrp,
      is_active ?? true,
      id,
      clientId,
    ]
  );

  return { id, ...data };
};

// DELETE (soft delete)
export const deleteServiceItem = async (id, clientId) => {
  await db.query(
    `UPDATE client_services SET is_active = FALSE WHERE id=? AND client_id=?`,
    [id, clientId]
  );
};
