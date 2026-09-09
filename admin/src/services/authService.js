import API from "./api";

export const superAdminLogin = (payload) => {
  return API.post("/super-admin/auth/login", payload);
};
