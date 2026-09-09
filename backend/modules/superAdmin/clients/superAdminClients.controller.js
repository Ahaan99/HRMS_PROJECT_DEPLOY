import { db } from "../../../config/db.js";
import bcrypt from "bcryptjs";

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

/* =====================================================
   Create Client
===================================================== */
export const createClient = async (req, res) => {
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
      assignedHRs = [],
    } = req.body;

    if (!company_name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const client_code = await generateClientCode();

    const [result] = await db.query(
      `
      INSERT INTO clients
      (client_code, company_name, client_name, email, phone,
       business_address, gst_number, website, company_description, password_hash)
      VALUES (?,?,?,?,?,?,?,?,?,?)
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
        password_hash || null,
      ],
    );

    const clientId = result.insertId;

    /* ===============================
       Auto Seed Default Features
    =============================== */

    const [defaultFeatures] = await db.query(`
      SELECT feature_key
      FROM features
    `);

    for (const feature of defaultFeatures) {
      await db.query(
        `
        INSERT IGNORE INTO client_features (client_id, feature_key, is_enabled)
        VALUES (?, ?, 1)
      `,
        [clientId, feature.feature_key ?? feature],
      );
    }

    /* ===============================
       Assign HRs (multiple)
    =============================== */
    if (Array.isArray(assignedHRs) && assignedHRs.length) {
      const values = assignedHRs.map((hrId) => [clientId, hrId]);

      await db.query(
        `
        INSERT IGNORE INTO client_hr_assignments
        (client_id, hr_employee_id)
        VALUES ?
      `,
        [values],
      );
    }

    return res.json({
      success: true,
      message: "Client created successfully",
      data: {
        clientId,
        client_code,
      },
    });
  } catch (err) {
    console.error("createClient error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};

/* =====================================================
   Get All Clients (List)
===================================================== */
export const getAllClients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM clients ORDER BY id DESC
    `);

    return res.json({
      success: true,
      message: "Clients fetched successfully",
      data: rows,
    });
  } catch (err) {
    console.error("getAllClients error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};

/* =====================================================
   Get Client Profile (FULL CONTROL CENTER)
===================================================== */
export const getClientProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const [[client]] = await db.query(`SELECT * FROM clients WHERE id = ?`, [
      id,
    ]);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    /* =========================================
       Fetch ALL features from master table
    ========================================== */
    const [allFeatures] = await db.query(`
      SELECT feature_key
      FROM features
    `);

    /* =========================================
       Ensure client has all features
    ========================================== */
    for (const f of allFeatures) {
      const featureKey = f.feature_key;

      const [[existing]] = await db.query(
        `
        SELECT id
        FROM client_features
        WHERE client_id = ? AND feature_key = ?
        `,
        [id, featureKey],
      );

      if (!existing) {
        await db.query(
          `
          INSERT INTO client_features
          (client_id, feature_key, is_enabled)
          VALUES (?, ?, 0)
          `,
          [id, featureKey],
        );
      }
    }

    /* =========================================
       Fetch client features AFTER sync
    ========================================== */
    const [features] = await db.query(
      `
      SELECT feature_key, is_enabled
      FROM client_features
      WHERE client_id = ?
      ORDER BY feature_key
      `,
      [id],
    );

    /* =========================================
       Fetch Assigned HRs
    ========================================== */
    const [hrs] = await db.query(
      `
      SELECT e.id, e.name, e.email
      FROM client_hr_assignments cha
      JOIN employees e ON e.id = cha.hr_employee_id
      WHERE cha.client_id = ?
      `,
      [id],
    );

    return res.json({
      success: true,
      message: "Client profile fetched",
      data: {
        client,
        features,
        assignedHRs: hrs,
      },
    });
  } catch (err) {
    console.error("getClientProfile error:", err);

    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};

/* =====================================================
   Toggle Feature
===================================================== */
/* =====================================================
   Master Control: full feature matrix (clients x modules)
===================================================== */
export const getFeatureMatrix = async (req, res) => {
  try {
    const [features] = await db.query(
      `SELECT feature_key FROM features ORDER BY id`,
    );
    const [clients] = await db.query(
      `SELECT id, client_code, company_name, client_name, status FROM clients ORDER BY company_name`,
    );

    // Ensure every client has a row for every feature (seed missing as disabled)
    for (const c of clients) {
      await db.query(
        `
        INSERT INTO client_features (client_id, feature_key, is_enabled)
        SELECT ?, f.feature_key, 1
        FROM features f
        WHERE NOT EXISTS (
          SELECT 1 FROM client_features cf
          WHERE cf.client_id = ? AND cf.feature_key = f.feature_key
        )
        `,
        [c.id, c.id],
      );
    }

    const [rows] = await db.query(
      `SELECT client_id, feature_key, is_enabled FROM client_features`,
    );

    const map = {};
    for (const r of rows) {
      if (!map[r.client_id]) map[r.client_id] = {};
      map[r.client_id][r.feature_key] = !!r.is_enabled;
    }

    return res.json({
      success: true,
      features: features.map((f) => f.feature_key),
      clients: clients.map((c) => ({
        ...c,
        features: map[c.id] || {},
      })),
    });
  } catch (err) {
    console.error("getFeatureMatrix error:", err);
    return res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
};

/* =====================================================
   Master Control: bulk enable/disable all modules for a client
===================================================== */
export const bulkToggleClientFeatures = async (req, res) => {
  try {
    const { client_id, is_enabled } = req.body;
    if (!client_id || typeof is_enabled === "undefined") {
      return res.status(400).json({
        success: false,
        message: "client_id and is_enabled are required",
      });
    }

    await db.query(
      `UPDATE client_features SET is_enabled = ? WHERE client_id = ?`,
      [is_enabled ? 1 : 0, client_id],
    );

    return res.json({
      success: true,
      message: `All modules ${is_enabled ? "enabled" : "disabled"} for client`,
    });
  } catch (err) {
    console.error("bulkToggleClientFeatures error:", err);
    return res
      .status(500)
      .json({ success: false, message: `Server error: ${err.message}` });
  }
};

export const toggleClientFeature = async (req, res) => {
  try {
    const { client_id, feature_key, is_enabled } = req.body;

    if (!client_id || !feature_key) {
      return res.status(400).json({
        success: false,
        message: "client_id and feature_key are required",
      });
    }

    await db.query(
      `
      UPDATE client_features
      SET is_enabled = ?
      WHERE client_id = ? AND feature_key = ?
    `,
      [is_enabled ? 1 : 0, client_id, feature_key],
    );

    return res.json({
      success: true,
      message: "Feature updated successfully",
    });
  } catch (err) {
    console.error("toggleClientFeature error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};

/* =====================================================
   Update Client Basic Info
===================================================== */
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      company_name,
      client_name,
      email,
      phone,
      business_address,
      gst_number,
      website,
      company_description,
      status,
      password,
    } = req.body;

    let passwordClause = "";
    let passwordValue = [];

    if (password && password.trim()) {
      const password_hash = await bcrypt.hash(password, 10);
      passwordClause = ", password_hash = ?";
      passwordValue.push(password_hash);
    }

    await db.query(
      `
      UPDATE clients SET
        company_name = ?,
        client_name = ?,
        email = ?,
        phone = ?,
        business_address = ?,
        gst_number = ?,
        website = ?,
        company_description = ?,
        status = ?
        ${passwordClause}
      WHERE id = ?
      `,
      [
        company_name,
        client_name,
        email,
        phone,
        business_address,
        gst_number,
        website,
        company_description,
        status,
        ...passwordValue,
        id,
      ],
    );

    return res.json({
      success: true,
      message: "Client updated successfully",
    });
  } catch (err) {
    console.error("updateClient error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};
/* =====================================================
   Delete Client
===================================================== */
/*
  Deleting a client used to be a bare `DELETE FROM clients` that relied on
  ON DELETE CASCADE. MySQL cascades clients -> client_lead_batches, but
  client_leads.batch_id is a plain FK (NO ACTION), so the cascade was blocked:
  "Cannot delete or update a parent row: a foreign key constraint fails
   (client_leads_ibfk_2 FOREIGN KEY (batch_id) REFERENCES client_lead_batches)".

  Fix: run inside a transaction and clear dependents in FK-safe order —
  1) tables that reference other client tables (leads before batches),
  2) every remaining table with a client_id column (discovered from
     information_schema so new modules cannot re-introduce the bug),
  3) the client row itself.
*/
const CLIENT_DELETE_ORDER = [
  // child tables first (they reference other client-scoped tables)
  "client_leads",
  "client_lead_batches",
  "client_hr_assignments",
  "client_features",
];

export const deleteClient = async (req, res) => {
  const { id } = req.params;
  const clientId = Number(id);
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid client id" });
  }

  let conn;
  try {
    const [[client]] = await db.query(
      `SELECT id, client_code, company_name FROM clients WHERE id = ? LIMIT 1`,
      [clientId],
    );
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    // Discover every table in this schema that has a client_id column.
    const [colRows] = await db.query(
      `SELECT TABLE_NAME
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND COLUMN_NAME = 'client_id'
          AND TABLE_NAME <> 'clients'`,
    );
    const discovered = colRows.map((r) => r.TABLE_NAME);
    const ordered = [
      ...CLIENT_DELETE_ORDER.filter((t) => discovered.includes(t)),
      ...discovered.filter((t) => !CLIENT_DELETE_ORDER.includes(t)),
    ];

    conn = await db.getConnection();
    await conn.beginTransaction();

    const cleared = {};
    // Two passes: rows may reference each other across tables in an order we
    // cannot know statically, so retry anything that fails with an FK error.
    let pending = [...ordered];
    for (let pass = 0; pass < 3 && pending.length; pass++) {
      const failed = [];
      for (const table of pending) {
        try {
          const [r] = await conn.query(
            `DELETE FROM \`${table}\` WHERE client_id = ?`,
            [clientId],
          );
          cleared[table] = r.affectedRows;
        } catch (e) {
          if (e.code === "ER_ROW_IS_REFERENCED_2" || e.errno === 1451) {
            failed.push(table);
          } else if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_FIELD_ERROR") {
            // table/column missing on this deployment - nothing to clear
          } else {
            throw e;
          }
        }
      }
      pending = failed;
    }
    if (pending.length) {
      throw new Error(
        `Could not clear dependent rows in: ${pending.join(", ")} (foreign key still referenced)`,
      );
    }

    const [result] = await conn.query(`DELETE FROM clients WHERE id = ?`, [clientId]);
    await conn.commit();

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    return res.json({
      success: true,
      message: `Client ${client.company_name || client.client_code} deleted successfully`,
      data: { clientId, cleared },
    });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch { /* ignore */ }
    }
    console.error("deleteClient error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  } finally {
    if (conn) conn.release();
  }
};

/* =====================================================
   Assign / Unassign HR (Toggle)
===================================================== */
export const toggleClientHR = async (req, res) => {
  try {
    const { client_id, hr_employee_id } = req.body;

    if (!client_id || !hr_employee_id) {
      return res.status(400).json({
        success: false,
        message: "client_id and hr_employee_id are required",
      });
    }

    // check existing
    const [[existing]] = await db.query(
      `
      SELECT id
      FROM client_hr_assignments
      WHERE client_id = ? AND hr_employee_id = ?
      `,
      [client_id, hr_employee_id],
    );

    // ========================
    // UNASSIGN
    // ========================
    if (existing) {
      await db.query(
        `
        DELETE FROM client_hr_assignments
        WHERE client_id = ? AND hr_employee_id = ?
        `,
        [client_id, hr_employee_id],
      );

      return res.json({
        success: true,
        message: "HR unassigned successfully",
      });
    }

    // ========================
    // ASSIGN
    // ========================
    await db.query(
      `
      INSERT INTO client_hr_assignments
      (client_id, hr_employee_id)
      VALUES (?, ?)
      `,
      [client_id, hr_employee_id],
    );

    return res.json({
      success: true,
      message: "HR assigned successfully",
    });
  } catch (err) {
    console.error("toggleClientHR error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};
