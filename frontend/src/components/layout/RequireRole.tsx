/**
 * Wrapper que protege rutas segun el rol del usuario.
 *
 * Uso:
 *   <RequireRole roles={["ADMIN"]}>
 *     <UsuariosPage />
 *   </RequireRole>
 */
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import type { Rol } from "../../types/api.types";

interface RequireRoleProps {
  roles: Rol[];
  children: React.ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // No autenticado -> al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Autenticado pero sin el rol requerido -> Acceso denegado
  if (!roles.includes(user.rol)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <>{children}</>;
}