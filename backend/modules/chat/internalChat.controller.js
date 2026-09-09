import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";
import { db } from "../../config/db.js";

/*
  Two kinds of rooms share the internal_messages table:
    group rooms  - "hr-it", "hr-superadmin", "it-superadmin" (everyone of both types)
    direct rooms - "dm-<a>-<b>" where a/b are "<type>.<id>" sorted, e.g. "dm-hr.14-it.25"
*/
const GROUP_ROOMS = ["hr-it", "hr-superadmin", "it-superadmin"];
const TYPES = ["hr", "it", "superadmin"];

// Which department each chat identity maps to, and who they may DM.
const TYPE_DEPARTMENTS = { hr: ["HR"], it: ["IT"] };
const COUNTERPART = { it: ["hr"], hr: ["it"], superadmin: ["hr", "it"] };

const participantKey = (type, id) => `${type}.${Number(id)}`;
const dmRoom = (a, b) => `dm-${[a, b].sort().join("-")}`;

const parseDmRoom = (room) => {
  const m = /^dm-(hr|it|superadmin)\.(\d+)-(hr|it|superadmin)\.(\d+)$/.exec(room);
  if (!m) return null;
  const a = participantKey(m[1], m[2]);
  const b = participantKey(m[3], m[4]);
  if (a === b || dmRoom(a, b) !== room) return null;
  return [a, b];
};

const canAccess = (room, user) => {
  if (GROUP_ROOMS.includes(room)) return room.split("-").includes(user.type);
  const parts = parseDmRoom(room);
  return Boolean(parts && parts.includes(participantKey(user.type, user.id)));
};

/* ============================================ */
/* AUTH: accepts employee OR superadmin tokens  */
/* ============================================ */

export const internalChatAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const decoded = jwt.verify(header.split(" ")[1], ENV.JWT_SECRET);

    if (decoded.role === "SUPER_ADMIN") {
      req.internalUser = { type: "superadmin", id: decoded.id || 0 };
    } else if (decoded.employee_id) {
      /* portal identity (hr | it) comes from the request, but only employees may claim it */
      const claimed = req.body?.senderType || req.query?.senderType || "hr";
      req.internalUser = { type: claimed === "it" ? "it" : "hr", id: decoded.employee_id };
    } else {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/* ============================= */
/* DIRECTORY: who can I DM?      */
/* ============================= */

export const getInternalDirectory = async (req, res) => {
  try {
    const me = req.internalUser;
    const myKey = participantKey(me.type, me.id);
    const people = [];

    for (const type of COUNTERPART[me.type] || []) {
      const [rows] = await db.query(
        `SELECT e.id, e.name, e.employeeCode,
                (SELECT name FROM designations WHERE id = e.designationId) AS designation
         FROM employees e JOIN departments d ON d.id = e.departmentId
         WHERE d.name IN (?) AND e.isActive = 1
         ORDER BY e.name`,
        [TYPE_DEPARTMENTS[type]],
      );
      for (const r of rows) {
        people.push({
          type,
          id: r.id,
          name: r.name,
          employeeCode: r.employeeCode,
          designation: r.designation || null,
          room: dmRoom(myKey, participantKey(type, r.id)),
        });
      }
    }

    if (people.length) {
      const [last] = await db.query(
        `SELECT m.room, m.message, m.created_at, m.sender_type, m.sender_id
         FROM internal_messages m
         JOIN (SELECT room, MAX(id) AS id FROM internal_messages WHERE room IN (?) GROUP BY room) x
           ON x.id = m.id`,
        [people.map((p) => p.room)],
      );
      const byRoom = Object.fromEntries(last.map((l) => [l.room, l]));
      for (const p of people) {
        const l = byRoom[p.room];
        p.last_message = l?.message ?? null;
        p.last_at = l?.created_at ?? null;
        p.last_from_me = l ? l.sender_type === me.type && Number(l.sender_id) === Number(me.id) : false;
      }
      people.sort((a, b) => {
        if (a.last_at && b.last_at) return new Date(b.last_at) - new Date(a.last_at);
        if (a.last_at) return -1;
        if (b.last_at) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    res.json({ success: true, me: { type: me.type, id: me.id }, data: people });
  } catch (err) {
    console.error("internal chat directory error:", err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* GET INTERNAL MESSAGES         */
/* ============================= */

const MESSAGE_SELECT = `
  SELECT m.id, m.room, m.sender_type, m.sender_id, m.message, m.created_at,
         CASE WHEN m.sender_type = 'superadmin' THEN 'Super Admin' ELSE e.name END AS sender_name
  FROM internal_messages m
  LEFT JOIN employees e ON e.id = m.sender_id AND m.sender_type IN ('hr','it')`;

export const getInternalMessages = async (req, res) => {
  try {
    const { room } = req.params;
    if (!GROUP_ROOMS.includes(room) && !parseDmRoom(room)) {
      return res.status(400).json({ success: false, message: "Bad room" });
    }
    if (!canAccess(room, req.internalUser)) {
      return res.status(403).json({ success: false, message: "No access" });
    }
    const [rows] = await db.query(
      `${MESSAGE_SELECT} WHERE m.room = ? ORDER BY m.created_at ASC, m.id ASC LIMIT 500`,
      [room],
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("internal chat get error:", err);
    res.status(500).json({ success: false });
  }
};

/* ============================= */
/* SEND INTERNAL MESSAGE         */
/* ============================= */

export const sendInternalMessage = async (req, res) => {
  try {
    const { room, message } = req.body;
    if (!GROUP_ROOMS.includes(room) && !parseDmRoom(room)) {
      return res.status(400).json({ success: false, message: "Bad room" });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: "Message required" });
    }
    if (!canAccess(room, req.internalUser)) {
      return res.status(403).json({ success: false, message: "No access" });
    }

    // For a DM, the other participant must be a real active employee (or the super admin).
    const parts = parseDmRoom(room);
    if (parts) {
      const other = parts.find((p) => p !== participantKey(req.internalUser.type, req.internalUser.id));
      const [type, id] = other.split(".");
      if (!TYPES.includes(type)) return res.status(400).json({ success: false, message: "Bad room" });
      if (type !== "superadmin") {
        const [[emp]] = await db.query(
          `SELECT 1 FROM employees e JOIN departments d ON d.id = e.departmentId
           WHERE e.id = ? AND e.isActive = 1 AND d.name IN (?)`,
          [id, TYPE_DEPARTMENTS[type]],
        );
        if (!emp) return res.status(404).json({ success: false, message: "Recipient not found" });
      }
    }

    const [result] = await db.query(
      `INSERT INTO internal_messages (room, sender_type, sender_id, message) VALUES (?,?,?,?)`,
      [room, req.internalUser.type, req.internalUser.id, String(message).trim()],
    );
    const [[row]] = await db.query(`${MESSAGE_SELECT} WHERE m.id = ?`, [result.insertId]);
    res.json({ success: true, data: row });
  } catch (err) {
    console.error("internal chat send error:", err);
    res.status(500).json({ success: false });
  }
};
