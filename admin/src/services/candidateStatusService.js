import API from "./api";

export const getCandidateStatuses = async () => {
  const { data } = await API.get("/super-admin/candidate-statuses");
  return data;
};
