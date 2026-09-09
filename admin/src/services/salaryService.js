import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

export const salaryService = {
  /* Approval Matrix */
  getMatrix: () => axios.get(`${API}/salary/matrix`, { headers: getHeaders() }),
  updateMatrixRule: (id, payload) =>
    axios.put(`${API}/salary/matrix/${id}`, payload, { headers: getHeaders() }),

  /* Salary Revisions */
  getRevisions: () => axios.get(`${API}/salary/revisions`, { headers: getHeaders() }),
  createRevision: (payload) =>
    axios.post(`${API}/salary/revisions`, payload, { headers: getHeaders() }),
  decideRevision: (id, action, remarks) =>
    axios.put(
      `${API}/salary/revisions/${id}/decide`,
      { action, remarks },
      { headers: getHeaders() }
    ),
  cancelRevision: (id) =>
    axios.put(`${API}/salary/revisions/${id}/cancel`, {}, { headers: getHeaders() }),

  /* Salary History */
  getHistory: () => axios.get(`${API}/salary/history`, { headers: getHeaders() }),
};
