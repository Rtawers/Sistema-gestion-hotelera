/**
 * ProtectedRoute: protege rutas que requieren autenticacion.
 *
 * Si el usuario NO esta autenticado, lo redirige a /login.
 * Si SI lo esta, renderiza el children.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirigir al login y guardar la URL a la que queria entrar
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}