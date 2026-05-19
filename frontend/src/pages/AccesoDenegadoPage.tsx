/**
 * Pantalla mostrada cuando un usuario intenta acceder a una ruta
 * que no le corresponde por su rol.
 */
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/auth.store";
import { getRutaInicial, getNombreRol } from "../utils/roles";

export function AccesoDenegadoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const volverInicio = () => {
    if (user) {
      navigate(getRutaInicial(user.rol));
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acceso denegado
        </h1>

        <p className="text-gray-600 mb-2">
          No tienes permisos para acceder a esta sección.
        </p>

        {user && (
          <p className="text-sm text-gray-500 mb-6">
            Tu rol actual es: <span className="font-semibold">{getNombreRol(user.rol)}</span>
          </p>
        )}

        <Button
          variant="primary"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={volverInicio}
          className="w-full"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}