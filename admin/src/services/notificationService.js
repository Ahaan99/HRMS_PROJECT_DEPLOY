import API from "./api";

export const getTodayBirthdays = () => API.get("/birthdays/today");

export const getNotifications = () => API.get("/birthdays/notifications");

export const markNotificationsRead = () => API.put("/birthdays/read");
