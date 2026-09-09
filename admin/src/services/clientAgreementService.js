import API from "./api";

export const getClientAgreements = async () => {
  const { data } = await API.get("/super-admin/client-agreements");
  return data;
};

export const createClientAgreement = async (formData) => {
  const { data } = await API.post(
    "/super-admin/client-agreements",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
};

export const deleteClientAgreement = async (id) => {
  const { data } = await API.delete(`/super-admin/client-agreements/${id}`);
  return data;
};

export const getAgreementTemplates = async () => {
  const { data } = await API.get("/super-admin/agreement-templates");
  return data;
};