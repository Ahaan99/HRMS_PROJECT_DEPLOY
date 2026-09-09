import API from "./api";

export const createLocation = (data) =>
  API.post("/super-admin/locations", data);

export const getLocations = () =>
  API.get("/super-admin/locations");