import { Navigate, Outlet } from "react-router";
import type { UserRole } from "./authTypes";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute({ allowedRole }: { allowedRole: UserRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}
