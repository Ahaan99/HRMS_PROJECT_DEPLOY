import API from "./api";

// ===============================
// LIST
// ===============================
export const getAttendanceList = () =>
  API.get("/client/attendance");

// ===============================
// CREATE
// ===============================
export const createAttendance = (data) =>
  API.post("/client/attendance", data);

// ===============================
// UPDATE
// ===============================
export const updateAttendance = (id, data) =>
  API.put(`/client/attendance/${id}`, data);

// ===============================
// DELETE
// ===============================
export const deleteAttendance = (id) =>
  API.delete(`/client/attendance/${id}`);