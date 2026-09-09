import bcrypt from "bcryptjs";
import {db} from "../../../config/db.js";

export const resetPasswordController = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // since only ONE super admin → no need req.user.id
    const [rows] = await db.query(
      "SELECT id, password_hash FROM super_admins LIMIT 1"
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = rows[0];

    const isMatch = await bcrypt.compare(
      oldPassword,
      admin.password_hash
    );

    if (!isMatch) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE super_admins SET password_hash = ? WHERE id = ?",
      [hashedPassword, admin.id]
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

