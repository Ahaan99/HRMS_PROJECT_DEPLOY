import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

export const compensationService = {
  /* Reimbursements */
  getReimbursements: (status) =>
    axios.get(
      `${API}/compensation/reimbursements/all${status ? `?status=${status}` : ""}`,
      { headers: getHeaders() }
    ),
  decideReimbursement: (id, status, remarks) =>
    axios.put(
      `${API}/compensation/reimbursements/${id}/decide`,
      { status, remarks },
      { headers: getHeaders() }
    ),

  /* Rewards (Incentives & Bonuses) */
  getRewards: () =>
    axios.get(`${API}/compensation/rewards/all`, { headers: getHeaders() }),
  createReward: (payload) =>
    axios.post(`${API}/compensation/rewards`, payload, { headers: getHeaders() }),
  updateRewardStatus: (id, status) =>
    axios.put(
      `${API}/compensation/rewards/${id}/status`,
      { status },
      { headers: getHeaders() }
    ),
  deleteReward: (id) =>
    axios.delete(`${API}/compensation/rewards/${id}`, { headers: getHeaders() }),

  /* Insurance Tracking */
  getInsurance: () =>
    axios.get(`${API}/compensation/insurance/all`, { headers: getHeaders() }),
  createInsurance: (payload) =>
    axios.post(`${API}/compensation/insurance`, payload, { headers: getHeaders() }),
  updateInsuranceStatus: (id, status) =>
    axios.put(
      `${API}/compensation/insurance/${id}/status`,
      { status },
      { headers: getHeaders() }
    ),
  deleteInsurance: (id) =>
    axios.delete(`${API}/compensation/insurance/${id}`, { headers: getHeaders() }),
};
