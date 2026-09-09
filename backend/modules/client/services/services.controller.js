import {
  fetchServices,
  createServiceItem,
  updateServiceItem,
  deleteServiceItem,
} from "./services.service.js";

import { db } from "../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code]
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// GET
export const getAllServices = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const data = await fetchServices(clientId);
    res.json(data);
  } catch (err) {
    console.error("getAllServices:", err);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

// CREATE
export const createService = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

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
    } = req.body;

    // basic validation
    if (!service_name || !plan_name || !pricing_type || !pricing_value) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newItem = await createServiceItem({
      client_id: clientId,
      employee_id: employee_id || null,
      service_name,
      plan_name,
      pricing_type,
      pricing_value: Number(pricing_value),
      mrp: Number(mrp || 0),
      replacement_months: Number(replacement_months || 0),
      token_amount: Number(token_amount || 0),
      payment_terms,
      description,
    });

    res.status(201).json(newItem);
  } catch (err) {
    console.error("createService:", err);
    res.status(500).json({ message: "Failed to create service" });
  }
};

// UPDATE
export const updateService = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { id } = req.params;

    const updated = await updateServiceItem(id, clientId, req.body);

    res.json(updated);
  } catch (err) {
    console.error("updateService:", err);
    res.status(500).json({ message: "Failed to update service" });
  }
};

// DELETE
export const deleteService = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);
    const { id } = req.params;

    await deleteServiceItem(id, clientId);

    res.json({ message: "Service deleted" });
  } catch (err) {
    console.error("deleteService:", err);
    res.status(500).json({ message: "Failed to delete service" });
  }
};