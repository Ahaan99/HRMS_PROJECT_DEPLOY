import API from "../api/axios";

export const getMyEODReports = () =>
  API.get("/hr/eod");

export const createEOD = (payload) =>
  API.post("/hr/eod", payload);

export const updateEOD = (
  id,
  payload
) =>
  API.patch(
    `/hr/eod/${id}`,
    payload
  );
  