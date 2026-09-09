import { createContext, useContext, useEffect, useState } from "react";

import API from "../api/axios";

const EmployeeAuthContext = createContext();

export const EmployeeAuthProvider = ({ children }) => {
const [employee, setEmployee] =
  useState(() => {
    try {
      const storedUser =
        localStorage.getItem(
          "hrms_employee_User"
        );

      if (
        !storedUser ||
        storedUser === "undefined"
      ) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  });

  const [token, setToken] = useState(
    localStorage.getItem("hrms_employee_Token"),
  );

  const [loading, setLoading] = useState(true);

  // LOGIN
  const login = (data) => {
    localStorage.setItem("hrms_employee_Token", data.token);

    localStorage.setItem("hrms_employee_User", JSON.stringify(data.user));

    setToken(data.token);

    setEmployee(data.user);
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("hrms_employee_Token");

    localStorage.removeItem("hrms_employee_User");

    setToken(null);

    setEmployee(null);
  };

  // FETCH CURRENT USER
  const fetchMe = async () => {
    try {
      const res = await API.get("/employee/auth/me");

      setEmployee(res.data.user);
      localStorage.setItem("hrms_employee_User", JSON.stringify(res.data.user));
    } catch (error) {
      console.log(error)
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <EmployeeAuthContext.Provider
      value={{
        employee,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = () => useContext(EmployeeAuthContext);
