import { db } from "../../../config/db.js";
import nodemailer from "nodemailer";
import { ENV } from "../../../config/env.js";

const SMTP_PORT = Number(ENV.EMAIL_PORT) || 587;
const SMTP_CONFIGURED = Boolean(ENV.EMAIL_USER && ENV.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: ENV.EMAIL_HOST || "smtp.gmail.com",
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_CONFIGURED ? { user: ENV.EMAIL_USER, pass: ENV.EMAIL_PASS } : undefined,
});

const FROM_ADDRESS = ENV.EMAIL_FROM || ENV.EMAIL_USER || "noreply@hrms.com";

if (!SMTP_CONFIGURED) {
  console.warn("[email] EMAIL_USER / EMAIL_PASS are not set — Email System sends will fail until configured in backend/.env");
}

/* Turn raw nodemailer errors into something an admin can act on */
const describeMailError = (err) => {
  const msg = err?.message || "";
  if (!SMTP_CONFIGURED) return "SMTP is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env and restart the server.";
  if (err?.code === "EAUTH" || /invalid login|username and password not accepted|535/i.test(msg))
    return "SMTP login rejected. For Gmail, EMAIL_PASS must be a 16-character App Password (2-Step Verification enabled), not the account password.";
  if (err?.code === "ESOCKET" || err?.code === "ECONNECTION" || err?.code === "ETIMEDOUT" || /ECONNREFUSED|ETIMEDOUT|getaddrinfo/i.test(msg))
    return `Could not reach SMTP server ${ENV.EMAIL_HOST || "smtp.gmail.com"}:${SMTP_PORT}. Check EMAIL_HOST/EMAIL_PORT and outbound firewall.`;
  if (/recipient|550|553|no recipients/i.test(msg)) return "Recipient address was rejected by the mail server.";
  return msg || "Failed to send email";
};

const saveEmailLog = async (data) => {
  const {
    recipient_email,
    recipient_name,
    subject,
    body,
    template_id,
    status,
    error_message
  } = data;

  await db.query(
    `INSERT INTO email_logs 
     (recipient_email, recipient_name, subject, body, template_id, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [recipient_email, recipient_name, subject, body, template_id, status, error_message || null]
  );
};

export const sendEmailController = async (req, res) => {
  try {
    const { to, toName, subject, body, templateId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Recipient email, subject and body are required"
      });
    }

    let emailBody = body;
    let emailSubject = subject;

    if (templateId) {
      const [templates] = await db.query(
        `SELECT * FROM email_templates WHERE id = ?`,
        [templateId]
      );
      if (templates.length > 0) {
        const t = templates[0];
        emailSubject = subject || t.subject;
        emailBody = body || t.body;
      }
    }

    try {
      await transporter.sendMail({
        from: FROM_ADDRESS,
        to: to,
        subject: emailSubject,
        html: emailBody,
      });

      await saveEmailLog({
        recipient_email: to,
        recipient_name: toName || "",
        subject: emailSubject,
        body: emailBody,
        template_id: templateId || null,
        status: "sent",
        error_message: null
      });

      res.json({ success: true, message: "Email sent successfully" });
    } catch (mailErr) {
      await saveEmailLog({
        recipient_email: to,
        recipient_name: toName || "",
        subject: emailSubject,
        body: emailBody,
        template_id: templateId || null,
        status: "failed",
        error_message: mailErr.message
      });

      console.error("[email] send failed:", mailErr.code || "", mailErr.message);
      res.status(500).json({
        success: false,
        message: describeMailError(mailErr),
        error: mailErr.message
      });
    }
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendBulkEmailController = async (req, res) => {
  try {
    const { recipients, subject, body, templateId } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Recipients array is required"
      });
    }

    if (!subject && !body && !templateId) {
      return res.status(400).json({
        success: false,
        message: "Subject, body or templateId is required"
      });
    }

    let emailBody = body;
    let emailSubject = subject;

    if (templateId) {
      const [templates] = await db.query(
        `SELECT * FROM email_templates WHERE id = ?`,
        [templateId]
      );
      if (templates.length > 0) {
        const t = templates[0];
        emailSubject = subject || t.subject;
        emailBody = body || t.body;
      }
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const { email, name } = recipient;
      
      try {
        await transporter.sendMail({
          from: FROM_ADDRESS,
          to: email,
          subject: emailSubject,
          html: emailBody,
        });

        await saveEmailLog({
          recipient_email: email,
          recipient_name: name || "",
          subject: emailSubject,
          body: emailBody,
          template_id: templateId || null,
          status: "sent",
          error_message: null
        });

        sentCount++;
      } catch (mailErr) {
        await saveEmailLog({
          recipient_email: email,
          recipient_name: name || "",
          subject: emailSubject,
          body: emailBody,
          template_id: templateId || null,
          status: "failed",
          error_message: mailErr.message
        });

        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Bulk email completed`,
      data: { sent: sentCount, failed: failedCount, total: recipients.length }
    });
  } catch (err) {
    console.error("Bulk email error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getEmailTemplatesController = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM email_templates ORDER BY id DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch templates" });
  }
};

export const saveEmailTemplateController = async (req, res) => {
  try {
    const { templateName, subject, body, category } = req.body;

    if (!templateName || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Template name, subject and body are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO email_templates (template_name, subject, body, category) VALUES (?, ?, ?, ?)`,
      [templateName, subject, body, category || "general"]
    );

    res.json({
      success: true,
      message: "Template saved successfully",
      data: { id: result.insertId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save template" });
  }
};

export const updateEmailTemplateController = async (req, res) => {
  try {
    const { id } = req.params;
    const { templateName, subject, body, category } = req.body;

    await db.query(
      `UPDATE email_templates SET template_name = ?, subject = ?, body = ?, category = ? WHERE id = ?`,
      [templateName, subject, body, category || "general", id]
    );

    res.json({ success: true, message: "Template updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update template" });
  }
};

export const deleteEmailTemplateController = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM email_templates WHERE id = ?`, [id]);
    res.json({ success: true, message: "Template deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete template" });
  }
};

export const getEmailLogsController = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "";
    const params = [];

    if (status) {
      whereClause = "WHERE status = ?";
      params.push(status);
    }

    const [rows] = await db.query(
      `SELECT * FROM email_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM email_logs ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch email logs" });
  }
};

export const getEmailStatsController = async (req, res) => {
  try {
    const [[total]] = await db.query(
      `SELECT COUNT(*) as count FROM email_logs`
    );
    
    const [[sent]] = await db.query(
      `SELECT COUNT(*) as count FROM email_logs WHERE status = 'sent'`
    );
    
    const [[failed]] = await db.query(
      `SELECT COUNT(*) as count FROM email_logs WHERE status = 'failed'`
    );

    const [recentFailed] = await db.query(
      `SELECT * FROM email_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        total: total.count,
        sent: sent.count,
        failed: failed.count,
        recentFailed
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};
