import API from "./api";

// Backend response shape: { success: true, data: { forms: [...], pagination: {...} } }
// Isliye res.data.data unwrap karna zaroori hai, warna forms list kabhi nahi milti
const unwrapForms = (res) => res.data?.data || res.data;

// GET all candidate forms
export const getCandidateForms = async (page = 1, limit = 50) => {
  const res = await API.get(`/forms?type=candidate&page=${page}&limit=${limit}`);
  return unwrapForms(res); // { forms: [...], pagination: { pages, total } }
};

// GET all client forms
export const getClientForms = async (page = 1, limit = 50) => {
  const res = await API.get(`/forms?type=client&page=${page}&limit=${limit}`);
  return unwrapForms(res);
};

// GET all forms
export const getAllForms = async (page = 1, limit = 50) => {
  const res = await API.get(`/forms?page=${page}&limit=${limit}`);
  return unwrapForms(res);
};

// GET single form
export const getFormById = async (id) => {
  const res = await API.get(`/forms/${id}`);
  return res.data;
};

// UPDATE form status
export const updateFormStatus = async (id, status) => {
  const res = await API.put(`/forms/${id}`, { status });
  return res.data;
};

// DELETE form
export const deleteForm = async (id) => {
  const res = await API.delete(`/forms/${id}`);
  return res.data;
};