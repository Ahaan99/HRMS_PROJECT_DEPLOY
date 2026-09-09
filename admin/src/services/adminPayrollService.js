import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;


export const getAdminPayroll = async () => {

  const token = localStorage.getItem("hrms_admin_token");

  const res = await axios.get(
    `${API}/admin/payroll`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res.data;
};



export const addPayroll = async (data) => {

  const token = localStorage.getItem("hrms_admin_token");

  const res = await axios.post(
    `${API}/admin/payroll/add`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res.data;
};



export const autoGeneratePayroll = async (payroll_month) => {
  const token = localStorage.getItem("hrms_admin_token");

  const res = await axios.post(
    `${API}/admin/payroll/auto-generate`,
    { payroll_month },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return res.data;
};



export const deletePayroll = async (id) => {

  const token = localStorage.getItem("hrms_admin_token");

  const res = await axios.delete(
    `${API}/admin/payroll/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res.data;
};



export const downloadPayrollPdf = async (employeeCode, month) => {

  const token = localStorage.getItem("hrms_admin_token");

  const res = await axios.get(
    `${API}/admin/payroll/pdf/${employeeCode}?month=${month}`,
    {
      responseType: "blob",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const url = window.URL.createObjectURL(new Blob([res.data]));

  const link = document.createElement("a");

  link.href = url;
  link.download = `payroll-${employeeCode}.pdf`;

  link.click();
};