import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

export const leaveService = {
  // Applications
  getApplications: (status) =>
    axios.get(`${API}/leave/applications${status ? `?status=${status}` : ""}`, {
      headers: getHeaders(),
    }),
  decide: (id, status, approver_note) =>
    axios.put(
      `${API}/leave/applications/${id}/decide`,
      { status, approver_note },
      { headers: getHeaders() }
    ),

  // Leaves raised inside client portals (all clients)
  getClientLeaves: (status) =>
    axios.get(`${API}/leave/client-leaves${status ? `?status=${status}` : ""}`, {
      headers: getHeaders(),
    }),
  decideClientLeave: (id, decision, note) =>
    axios.put(
      `${API}/leave/client-leaves/${id}/decide`,
      { decision, note },
      { headers: getHeaders() }
    ),

  // Balances
  getBalances: (year) =>
    axios.get(`${API}/leave/balances${year ? `?year=${year}` : ""}`, {
      headers: getHeaders(),
    }),

  // Calendar
  getCalendar: (year, month) =>
    axios.get(`${API}/leave/calendar?year=${year}&month=${month}`, {
      headers: getHeaders(),
    }),

  // Types
  getTypes: () => axios.get(`${API}/leave/types`, { headers: getHeaders() }),
  addType: (data) => axios.post(`${API}/leave/types`, data, { headers: getHeaders() }),
  updateType: (id, data) =>
    axios.put(`${API}/leave/types/${id}`, data, { headers: getHeaders() }),
  deleteType: (id) => axios.delete(`${API}/leave/types/${id}`, { headers: getHeaders() }),

  // Holidays
  getHolidays: () => axios.get(`${API}/leave/holidays`, { headers: getHeaders() }),
  addHoliday: (data) => axios.post(`${API}/leave/holidays`, data, { headers: getHeaders() }),
  deleteHoliday: (id) =>
    axios.delete(`${API}/leave/holidays/${id}`, { headers: getHeaders() }),

  // Comp-offs
  getCompOffs: () => axios.get(`${API}/leave/comp-offs`, { headers: getHeaders() }),
  decideCompOff: (id, status) =>
    axios.put(`${API}/leave/comp-offs/${id}/decide`, { status }, { headers: getHeaders() }),

  // Overtime
  getOvertime: (status) =>
    axios.get(`${API}/overtime/all${status ? `?status=${status}` : ""}`, {
      headers: getHeaders(),
    }),
  decideOvertime: (id, status, remarks) =>
    axios.put(`${API}/overtime/${id}/decide`, { status, remarks }, { headers: getHeaders() }),
};
