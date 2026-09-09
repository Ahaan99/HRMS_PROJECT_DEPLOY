import * as service from "./workPolicy.service.js";
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

// Get Client Code from Client/Employee
const getClientCode = (req) => {
  return req.client?.client_code || req.employee?.client_code;
};

// ✅ GET ALL (SECURE)
export const getAllPolicies = async (req, res) => {
  try {
    const clientCode = getClientCode(req);

    if (!clientCode) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const clientId = await getClientId(clientCode);

    const data = await service.getAllPolicies(clientId);

    res.json({ success: true, data });
  } catch (err) {
    console.error("GET POLICIES:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ CREATE
export const createPolicy = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const data = await service.createPolicy({
      ...req.body,
      client_id: clientId,
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error("CREATE POLICY:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ UPDATE (SECURE)
export const updatePolicy = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const data = await service.updatePolicy(
      req.params.id,
      clientId,
      req.body
    );

    res.json({ success: true, policy: data });
  } catch (err) {
    console.error("UPDATE POLICY:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ DELETE (SECURE)
export const deletePolicy = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    await service.deletePolicy(req.params.id, clientId);

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE POLICY:", err);
    res.status(500).json({ message: err.message });
  }
};