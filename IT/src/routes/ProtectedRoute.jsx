import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("hrms_it_Token");
  return token ? <Outlet /> : <Navigate to="/" replace />;
}
