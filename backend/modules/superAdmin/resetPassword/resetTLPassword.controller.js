import bcrypt from "bcryptjs";
import { db } from "../../../config/db.js";

export const resetTLPasswordController =
  async (req, res) => {
    try {
      const { newPassword } =
        req.body;

      if (!newPassword) {
        return res
          .status(400)
          .json({
            message:
              "New password required",
          });
      }

      // only one TL
      const [rows] =
        await db.query(
          `
        SELECT id
        FROM team_leaders
        LIMIT 1
        `
        );

      if (!rows.length) {
        return res
          .status(404)
          .json({
            message:
              "TL not found",
          });
      }

      const tl = rows[0];

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      await db.query(
        `
        UPDATE team_leaders
        SET password = ?
        WHERE id = ?
        `,
        [
          hashedPassword,
          tl.id,
        ]
      );

      res.json({
        success: true,
        message:
          "TL password updated successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Server error",
      });
    }
  };