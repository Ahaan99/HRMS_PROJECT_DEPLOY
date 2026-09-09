import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {db} from "../../../config/db.js";
import { ENV } from "../../../config/env.js";

export const loginClientAdminService = async ({ email, password }) => {

  // 1️⃣ find client admin (from clients table)
  const [clients] = await db.query(
    `SELECT id, client_code, company_name, email, password_hash, status
     FROM clients
     WHERE email = ? LIMIT 1`,
    [email]
  );
  if (!clients.length) {

    throw new Error("Invalid Credentials");
  }

  const client = clients[0];

  // 2️⃣ status check (important)
  if (client.status !== "ACTIVE") {
    throw new Error("Account is not active");
  }

  // 3️⃣ password compare
  const isMatch = await bcrypt.compare(password, client.password_hash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }
  
  // 4️⃣ get enabled features
  const [features] = await db.query(
    `SELECT feature_key, is_enabled
     FROM client_features
     WHERE client_id = ? AND is_enabled = 1`,
    [client.id]
  );

  const enabledFeatures = features.map((f) => f.feature_key);

  // 5️⃣ create JWT (match your super admin style)
  const token = jwt.sign(
    {
      id: client.id, 
      client_code: client.client_code,
      role: "client_admin",
    },
    ENV.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  return {
    token,
    client: {
      id: client.id,
      client_code: client.client_code,
      company_name: client.company_name,
      email: client.email,
    },
    enabledFeatures,
  };
};
