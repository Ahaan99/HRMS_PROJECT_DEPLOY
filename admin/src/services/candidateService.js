import API from "./api";

// GET all candidates
export const getCandidates = async () => {
  const { data } = await API.get("/super-admin/candidates");
  return data;
};

// CREATE candidate
export const createCandidate = async (payload) => {
  const { data } = await API.post("/super-admin/candidates", payload);
  return data;
};

// UPDATE candidate
export const updateCandidate = async (id, payload) => {
  const { data } = await API.put(`/super-admin/candidates/${id}`, payload);
  return data;
};

// DELETE candidate
export const deleteCandidate = async (id) => {
  const { data } = await API.delete(`/super-admin/candidates/${id}`);
  return data;
};
