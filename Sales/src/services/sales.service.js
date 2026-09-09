import axios from "../api/axios";

export const getSalesReports = () => axios.get("/sales/reports");