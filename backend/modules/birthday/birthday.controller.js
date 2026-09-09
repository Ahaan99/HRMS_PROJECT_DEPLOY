import {
  getTodayBirthdaysService,
  createBirthdayNotifications,
  getNotificationsService,
  markNotificationsReadService
} from "./birthday.service.js";

export const getTodayBirthdays = async (req, res) => {
  try {
    const data = await getTodayBirthdaysService();

    // create notifications
    await createBirthdayNotifications(data, req.user);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const data = await getNotificationsService(req.user);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await markNotificationsReadService(req.user);

    res.json({
      success: true,
      message: "Marked as read",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

