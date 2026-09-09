import { db } from "../../../config/db.js";

// helper
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");

  return rows[0].id;
};

// ✅ GET ALL (SECURE)
export const getPerformances = async (req, res) => {
  try {
    // ✅ get client_code from both roles
    const clientCode = req.client?.client_code || req.employee?.client_code;

    if (!clientCode) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: client_code missing",
      });
    }

    const clientId = await getClientId(clientCode);

    let query = `
      SELECT * FROM performances 
      WHERE client_id = ?
    `;
    let params = [clientId];

    // ✅ employee → only own data
    if (req.employee) {
      query += " AND employeeId = ?";
      params.push(req.employee.employee_id);
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.query(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("GET ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ CREATE
export const createPerformance = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const { employeeId, rating, review, reviewDate } = req.body;

    const date = new Date(reviewDate);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const [result] = await db.query(
      `INSERT INTO performances 
      (client_id, employeeId, score, review, month, year, reviewDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, employeeId, rating, review, month, year, reviewDate],
    );

    const [rows] = await db.query(`SELECT * FROM performances WHERE id = ?`, [
      result.insertId,
    ]);

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE (SECURE)
export const updatePerformance = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const { id } = req.params;
    const { employeeId, rating, review, reviewDate } = req.body;

    let month = null;
    let year = null;

    if (reviewDate) {
      const date = new Date(reviewDate);
      if (!isNaN(date)) {
        month = date.toLocaleString("default", { month: "long" });
        year = date.getFullYear();
      }
    }

    await db.query(
      `UPDATE performances 
       SET employeeId = ?, score = ?, review = ?, month = ?, year = ?, reviewDate = ? 
       WHERE id = ? AND client_id = ?`,
      [employeeId, rating, review, month, year, reviewDate, id, clientId],
    );

    const [rows] = await db.query(
      `SELECT * FROM performances WHERE id = ? AND client_id = ?`,
      [id, clientId],
    );

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE (SECURE)
export const deletePerformance = async (req, res) => {
  try {
    const clientId = await getClientId(req.client.client_code);

    const { id } = req.params;

    await db.query(`DELETE FROM performances WHERE id = ? AND client_id = ?`, [
      id,
      clientId,
    ]);

    res.json({ success: true, message: "Performance deleted" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
