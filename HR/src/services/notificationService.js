import API from "../api/axios";

export const getTodayBirthdays = () =>
  API.get("/birthdays/today");

export const getNotifications = () =>
  API.get("/birthdays/notifications");

export const markNotificationsRead = () =>
  API.put("/birthdays/read");
