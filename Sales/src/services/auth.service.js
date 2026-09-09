import axios from "../api/axios";

export const loginAPI = (data) => axios.post("/auth/login", data);