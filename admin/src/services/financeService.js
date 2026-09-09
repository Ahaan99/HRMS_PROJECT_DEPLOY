import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("hrms_admin_token")}`,
});

export const revenueService = {
  getAll: () =>
    axios.get(`${API}/finance/revenue`, {
      headers: getHeaders(),
    }),

  add: (data) =>
    axios.post(`${API}/finance/revenue`, data, {
      headers: getHeaders(),
    }),

  update: (id, data) =>
    axios.put(`${API}/finance/revenue/${id}`, data, {
      headers: getHeaders(),
    }),

  delete: (id) =>
    axios.delete(`${API}/finance/revenue/${id}`, {
      headers: getHeaders(),
    }),

  getInvoices: () =>
    axios.get(`${API}/finance/invoices`, {
      headers: getHeaders(),
    }),
};

// ======================
// 💸 EXPENSE SERVICE
// ======================

export const expenseService = {
  getAll: () =>
    axios.get(`${API}/finance/expenses`, {
      headers: getHeaders(),
    }),

  add: (data) =>
    axios.post(`${API}/finance/expenses`, data, {
      headers: getHeaders(),
    }),

  update: (id, data) =>
    axios.put(`${API}/finance/expenses/${id}`, data, {
      headers: getHeaders(),
    }),

  delete: (id) =>
    axios.delete(`${API}/finance/expenses/${id}`, {
      headers: getHeaders(),
    }),

  getEmployees: () =>
    axios.get(`${API}/finance/employees-expense`, {
      headers: getHeaders(),
    }),
};