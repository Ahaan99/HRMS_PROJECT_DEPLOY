import { Navigate } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";

export default function ProtectedRoute({ children }) {
  const { employee, loading } = useEmployeeAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!employee) {
    return <Navigate to="/login" replace />;
  }

  return children;
}