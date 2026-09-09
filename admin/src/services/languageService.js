import API from "./api";

export const createLanguage = (data) =>
  API.post("/super-admin/languages", data);

export const getLanguages = () =>
  API.get("/super-admin/languages");