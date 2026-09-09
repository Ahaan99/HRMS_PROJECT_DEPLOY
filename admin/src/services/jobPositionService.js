import API from "./api";

export const createJobPosition = (data) =>
  API.post("/super-admin/job-positions", data);

export const getJobPositions = () =>
  API.get("/super-admin/job-positions");
