import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

export const documentService = {
  getTypes: () => axios.get(`${API}/documents/types`, { headers: getHeaders() }),
  generate: (payload) =>
    axios.post(`${API}/documents/generate`, payload, { headers: getHeaders() }),
  list: () => axios.get(`${API}/documents`, { headers: getHeaders() }),
  remove: (id) => axios.delete(`${API}/documents/${id}`, { headers: getHeaders() }),
  email: (id, to) =>
    axios.post(`${API}/documents/${id}/email`, { to }, { headers: getHeaders() }),
  sign: (id, signed_by, signature_data = null) =>
    axios.post(
      `${API}/documents/${id}/sign`,
      { signed_by, signature_data },
      { headers: getHeaders() },
    ),
};
