import API from "../api/axios";

/* =========================================
CREATE CLIENT
========================================= */
export const createClient = async (
  payload
) => {
  const { data } = await API.post(
    "/sales/clients",
    payload
  );

  return data;
};