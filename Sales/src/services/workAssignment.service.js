import API from "../api/axios";

export const updateStatusAPI = (id, status) =>
  API.patch(`/sales/work-assignment/status/${id}`, { status });

export const updateProgressAPI = (id, currentValue) =>
  API.patch(`/sales/work-assignment/progress/${id}`, {
    currentValue,
  });