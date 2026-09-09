import API from "./api";

export const revenueService = {
  getAll: () => API.get("/revenue"),
  getTotal: () => API.get("/revenue/total"),
  getByDateRange: (startDate, endDate) =>
    API.get(`/revenue/by-date-range?startDate=${startDate}&endDate=${endDate}`),
  add: (data) => API.post("/revenue/add", data),
  update: (id, data) => API.put(`/revenue/${id}`, data),
  delete: (id) => API.delete(`/revenue/${id}`),
};

export const expenseService = {
  getAll: () => API.get("/expense"),
  getTotal: () => API.get("/expense/total"),
  getByCategory: () => API.get("/expense/by-category"),
  getByDateRange: (startDate, endDate) =>
    API.get(`/expense/by-date-range?startDate=${startDate}&endDate=${endDate}`),
  add: (data) => API.post("/expense/add", data),
  update: (id, data) => API.put(`/expense/${id}`, data),
  delete: (id) => API.delete(`/expense/${id}`),
};

export const ledgerService = {
  getAll: () => API.get("/ledger"),
  getBalances: () => API.get("/ledger/balances"),
  getByDateRange: (startDate, endDate) =>
    API.get(`/ledger/by-date-range?startDate=${startDate}&endDate=${endDate}`),
  add: (data) => API.post("/ledger/add", data),
  delete: (id) => API.delete(`/ledger/${id}`),
};

export const inventoryService = {
  getAll: () => API.get("/client/inventory"),

  getTotalValue: () => API.get("/client/inventory/total-value"),

  getLowStock: (threshold) =>
    API.get(`/client/inventory/low-stock?threshold=${threshold}`),

  add: (data) => API.post("/client/inventory/add", data),

  updateStock: (id, quantity) =>
    API.put(`/client/inventory/stock/${id}`, { quantity }),

  update: (id, data) => API.put(`/client/inventory/${id}`, data),

  delete: (id) => API.delete(`/client/inventory/${id}`),
};

export const assetService = {
  getAll: () => API.get("/client/assets"),

  getByStatus: (status) => API.get(`/client/assets/by-status/${status}`),

  getTotalValue: () => API.get("/client/assets/total-value"),

  add: (data) => API.post("/client/assets/add", data),

  updateStatus: (id, status) =>
    API.put(`/client/assets/status/${id}`, { status }),

  update: (id, data) => API.put(`/client/assets/${id}`, data),

  delete: (id) => API.delete(`/client/assets/${id}`),
};

export const purchaseOrderService = {
  getAll: () => API.get("/client/purchase-orders"),
  getByStatus: (status) =>
    API.get(`/client/purchase-orders/by-status/${status}`),
  add: (data) => API.post("/client/purchase-orders/add", data),
  updateStatus: (id, status) =>
    API.put(`/client/purchase-orders/status/${id}`, { status }),
  delete: (id) => API.delete(`/client/purchase-orders/${id}`),
};

export const taxService = {
  getAll: () => API.get("/client/tax"),

  getByType: (type) => API.get(`/client/tax/by-type/${type}`),

  getTotals: () => API.get("/client/tax/totals"),

  add: (data) => API.post("/client/tax/add", data),

  delete: (id) => API.delete(`/client/tax/${id}`),
};

export const auditLogService = {
  getAll: (limit = 100) => API.get(`/client/audit-logs?limit=${limit}`),

  getByUser: (userId, limit = 50) =>
    API.get(`/client/audit-logs/user/${userId}?limit=${limit}`),

  getByDateRange: (startDate, endDate) =>
    API.get(
      `/client/audit-logs/by-date-range?startDate=${startDate}&endDate=${endDate}`,
    ),
};

export const reportService = {
  getProfitLoss: () => API.get("/client/reports/profit-loss"),
  getBalanceSheet: () => API.get("/client/reports/balance-sheet"),
  getCashFlow: () => API.get("/client/reports/cash-flow"),
  getSummary: () => API.get("/client/reports/summary"),
};

export default API;
