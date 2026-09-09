import { db } from "../../config/db.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const createTicket = asyncHandler(async (req, res) => {
  const { ticket_type, user_id, subject, description, priority } = req.body;
  
  const [result] = await db.query(
    `INSERT INTO support_tickets (ticket_type, user_id, subject, description, priority)
     VALUES (?, ?, ?, ?, ?)`,
    [ticket_type, user_id, subject, description, priority || "MEDIUM"]
  );

  res.json({ success: true, message: "Ticket created", data: { id: result.insertId } });
});

const getTickets = asyncHandler(async (req, res) => {
  const { ticket_type, status, priority, assigned_to } = req.query;
  
  let query = "SELECT * FROM support_tickets WHERE 1=1";
  const params = [];

  if (ticket_type) {
    query += " AND ticket_type = ?";
    params.push(ticket_type);
  }
  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (priority) {
    query += " AND priority = ?";
    params.push(priority);
  }
  if (assigned_to) {
    query += " AND assigned_to = ?";
    params.push(assigned_to);
  }

  query += " ORDER BY FIELD(priority, 'HIGH', 'MEDIUM', 'LOW'), created_at DESC";

  const [rows] = await db.query(query, params);
  res.json({ success: true, data: rows });
});

const updateTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, priority, assigned_to } = req.body;

  let query = "UPDATE support_tickets SET";
  const params = [];
  const updates = [];

  if (status) {
    updates.push(" status = ?");
    params.push(status);
  }
  if (priority) {
    updates.push(" priority = ?");
    params.push(priority);
  }
  if (assigned_to !== undefined) {
    updates.push(" assigned_to = ?");
    params.push(assigned_to);
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update" });
  }

  query += updates.join(",") + " WHERE id = ?";
  params.push(id);

  await db.query(query, params);
  res.json({ success: true, message: "Ticket updated" });
});

const getTicketStats = asyncHandler(async (req, res) => {
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed,
      SUM(CASE WHEN priority = 'HIGH' AND status != 'CLOSED' THEN 1 ELSE 0 END) as high_priority
    FROM support_tickets
  `);

  res.json({ success: true, data: stats[0] });
});

export { createTicket, getTickets, updateTicket, getTicketStats };
