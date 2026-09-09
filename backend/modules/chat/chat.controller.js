import { db } from "../../config/db.js";
import { generateAIResponse } from "./ai.service.js";

// helper → get client_id from client_code
const getClientId = async (client_code) => {
  const [rows] = await db.query(
    `SELECT id FROM clients WHERE client_code = ? LIMIT 1`,
    [client_code],
  );

  if (!rows.length) throw new Error("Client not found");
  return rows[0].id;
};

/* ============================= */
/* GET ALL HR FOR CLIENT SIDEBAR */
/* ============================= */

export const getAllHR = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.id,
        e.name,
        e.email
      FROM employees e
      JOIN departments d ON d.id = e.departmentId
      WHERE d.name = 'HR'
      AND e.isActive = 1
      ORDER BY e.name ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* GET ALL CLIENTS FOR HR        */
/* ============================= */

export const getAllClients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        company_name,
        client_name,
        email
      FROM clients
      WHERE status = 'ACTIVE'
      ORDER BY company_name ASC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* START CONVERSATION            */
/* ============================= */

export const startConversation = async (req, res) => {
  try {
    let clientId;
    let hrId;

    /* ============================= */
    /* CLIENT STARTING CONVERSATION  */
    /* ============================= */

    if (req.client) {
      const client_code = req.client.client_code;

      if(!client_code){
        clientId = req.body.clientId
      }
      else{
        clientId = await getClientId(client_code);
      }

      hrId = req.body.hrId;
    }

    /* ============================= */
    /* HR STARTING CONVERSATION      */
    /* ============================= */

    if (req.employee) {
      hrId = req.employee.id;

      clientId = req.body.clientId;
    }

    if (!clientId || !hrId) {
      return res.status(400).json({
        success: false,
        message: "clientId or hrId missing",
      });
    }

    const [existing] = await db.query(
      `SELECT id FROM conversations WHERE client_id=? AND hr_id=?`,
      [clientId, hrId],
    );

    if (existing.length > 0) {
      return res.json({
        success: true,
        conversationId: existing[0].id,
      });
    }

    const [result] = await db.query(
      `INSERT INTO conversations (client_id, hr_id)
       VALUES (?,?)`,
      [clientId, hrId],
    );

    res.json({
      success: true,
      conversationId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* GET MESSAGES                  */
/* ============================= */

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const [rows] = await db.query(
      `SELECT 
        id,
        sender_type,
        sender_id,
        message,
        created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY id ASC`,
      [conversationId],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* SEND MESSAGE                  */
/* ============================= */

export const sendMessage = async (req,res)=>{
  try{

    const {conversationId, message} = req.body;

    let senderId;
    let senderType;

    /* ============================= */
    /* HR SENDING MESSAGE            */
    /* ============================= */

    if(req.employee){
      senderId = req.employee.id;
      senderType = req.body.senderType === "it" ? "it" : "hr";
    }

    /* ============================= */
    /* CLIENT SENDING MESSAGE        */
    /* ============================= */

    if(req.client?.client_code){
      const client_code = req.client.client_code;

      senderId = await getClientId(client_code);

      senderType = "client";
    }

    if(!conversationId || !message){
      return res.status(400).json({
        success:false,
        message:"conversationId and message required"
      });
    }

    await db.query(
      `INSERT INTO messages 
       (conversation_id, sender_type, sender_id, message)
       VALUES (?,?,?,?)`,
      [conversationId, senderType, senderId, message]
    );

    res.json({ success:true });

  }catch(err){
    console.error(err);
    res.status(500).json({success:false});
  }
};
/* ============================= */
/* CLIENT CONVERSATIONS LIST     */
/* ============================= */

export const getClientConversations = async (req, res) => {
  try {
    const clientId = req.client.id;

    const [rows] = await db.query(
      `
      SELECT 
        c.id AS conversation_id,
        e.id AS hr_id,
        e.name AS hr_name,
        e.email
      FROM conversations c
      JOIN employees e ON e.id = c.hr_id
      WHERE c.client_id = ?
      ORDER BY c.created_at DESC
    `,
      [clientId],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* HR CONVERSATIONS LIST         */
/* ============================= */

export const getHRConversations = async (req, res) => {
  try {
    const hrId = req.employee.id;

    const [rows] = await db.query(
      `
      SELECT 
        c.id AS conversation_id,
        cl.id AS client_id,
        cl.company_name,
        cl.client_name,
        cl.email
      FROM conversations c
      JOIN clients cl ON cl.id = c.client_id
      WHERE c.hr_id = ?
      ORDER BY c.created_at DESC
    `,
      [hrId],
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const askAI = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        message: "conversationId and message are required",
      });
    }

    const answer = await generateAIResponse({ conversationId, message });

    await db.query(
      `INSERT INTO messages (conversation_id, sender_type, sender_id, message)
       VALUES (?,?,?,?)`,
      [conversationId, "ai", 0, answer],
    );

    res.json({ success: true, answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
