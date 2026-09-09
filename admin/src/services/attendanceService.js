import API from "./api";

export const getAutoAttendance = (params) =>
  API.get("/super-admin/attendance/auto", { params });

export const syncAttendance = (payload) =>
  API.post("/super-admin/attendance/sync", payload);

export const importAttendanceCSV = (formData) =>
  API.post("/super-admin/attendance/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getShiftSettings = () =>
  API.get("/super-admin/attendance/settings");

export const updateShiftSettings = (payload) =>
  API.put("/super-admin/attendance/settings", payload);

export const generateAttendance = (payload) =>
  API.post("/super-admin/attendance/generate", payload);

export const getAutoAttendanceLogs = (params) =>
  API.get("/super-admin/attendance/logs", { params });
