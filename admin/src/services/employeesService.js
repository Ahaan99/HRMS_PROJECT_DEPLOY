import API from "./api";

export const getEmployees = () => API.get("/super-admin/employees");

// ✅ FIXED CREATE EMPLOYEE
export const createEmployee = (formData) =>
  API.post("/super-admin/employees", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });



export const updateEmployee = (id, formData) => {
  return API.put(
    `/super-admin/employees/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

export const deleteEmployee = (id) =>
  API.delete(`/super-admin/employees/${id}`);
