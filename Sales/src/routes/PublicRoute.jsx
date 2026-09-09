import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { auth } = useAuth();

  if (auth?.token) {
    return <Navigate to="/sales-reports" replace />;
  }

  return children;
}