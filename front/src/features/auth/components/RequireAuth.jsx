import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingScreen } from "../../../shared/ui/LoadingScreen";

export function RequireAuth({ children }) {
  const { user, isLoading } = useAuth();
  const loc = useLocation();

  if (isLoading)
    return <LoadingScreen label="Validando sesión…" fullscreen={true} />;
  if (!user)
    return <Navigate to="/auth/login" replace state={{ from: loc.pathname }} />;
  return children;
}
