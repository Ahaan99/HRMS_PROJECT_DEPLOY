import API from "./api";

export const getAllClients = async () => {
  const { data } = await API.get(
    "/super-admin/clients"
  );

  return data;
};