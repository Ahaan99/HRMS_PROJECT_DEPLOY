import { db } from "../../config/db.js";

const getUserId = (user) => user.id || user.employee_id;

export const getTodayBirthdaysService = async () => {
  const [rows] = await db.query(`
    SELECT 
      id,
      full_name AS name,
      email,
      dob
    FROM joining_forms
    WHERE dob IS NOT NULL
      AND DATE_FORMAT(dob, '%m-%d') = DATE_FORMAT(CURDATE(), '%m-%d')
  `);

  return rows || [];
};

export const createBirthdayNotifications = async (birthdays, user) => {
  try {
    for (const b of birthdays) {
      const userId = getUserId(user);

      const [exists] = await db.query(
        `
        SELECT id FROM birthday_notifications
        WHERE user_id = ?
        AND employee_id = ?
        AND DATE(created_at) = CURDATE()
        LIMIT 1
        `,
        [userId, b.id],
      );

      if (exists.length === 0) {
        await db.query(
          `
        INSERT INTO birthday_notifications
        (user_id, role, employee_id, message)
        VALUES (?, ?, ?, ?)
        `,
        [userId, user.role, b.id, `🎉 Happy Birthday ${b.name}`],
        );
      }
    }
  } catch (err) {
    console.error("Notification error:", err);
  }
};

export const getNotificationsService = async (user) => {
  const [rows] = await db.query(
    `
    SELECT *
    FROM birthday_notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [user.id],
  );

  return rows || [];
};

export const markNotificationsReadService = async (user) => {
  await db.query(
    `
    UPDATE birthday_notifications
    SET is_read = 1
    WHERE user_id = ?
    AND is_read = 0
    `,
    [user.id],
  );
};

