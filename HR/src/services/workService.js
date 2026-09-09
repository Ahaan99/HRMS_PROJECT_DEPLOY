import API from "../api/axios";

export const getMyAssignments = () =>
  API.get("/hr/work-assignments");

export const updateMyAssignment = (
  id,
  payload
) =>
  API.patch(
    `/hr/work-assignments/${id}`,
    payload
  );