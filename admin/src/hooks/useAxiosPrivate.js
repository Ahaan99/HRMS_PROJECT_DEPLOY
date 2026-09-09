import { useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function useAxiosPrivate() {
  const { auth } = useAuth();

  useEffect(() => {
    const requestIntercept = API.interceptors.request.use(
      (config) => {
        if (auth?.token) {
          config.headers.Authorization = `Bearer ${auth.token}`;
        }
        return config;
        
      },
      (error) => Promise.reject(error)
    );

    return () => {
      API.interceptors.request.eject(requestIntercept);
    };
  }, [auth?.token]);

  return API;
}
