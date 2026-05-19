/**
 * Pantalla de gestion de usuarios (HU16) - solo ADMIN.
 * Listar, crear, activar/desactivar y resetear password.
 */
import { useState } from "react";
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  Key,
  Power,
  Shield,
  Mail,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  useUsuarios,
  useActivarUsuario,
  useCambiarPasswordEmpleado,
} from "../hooks/useUsuarios";
import { CrearUsuarioModal } from "../components/usuarios/CrearUsuarioModal";
import type { UsuarioEmpleado } from "../api/usuarios.api";
import type { Rol } from "../types/api.types";

const coloresRol: { [k in Rol]: "purple" | "blue" | "amber" } = {
  ADMIN: "purple",
  RECEPCIONISTA: "blue",
  HOUSEKEEPING: "amber",
};

export function UsuariosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { data: usuarios, isLoading, error } = useUsuarios();
  const activar = useActivarUsuario();
  const cambiarPass = useCambiarPasswordEmpleado();

  const handleToggleActivo = (u: UsuarioEmpleado) => {
    if (!window.confirm(`¿Seguro de ${u.is_active ? "DESACTIVAR" : "ACTIVAR"} a ${u.username}?`)) {
      return;
    }
    activar.mutate(u.id, {
      onSuccess: (r) => toast.success(r.detail),
      onError: () => toast.error("Error al cambiar estado"),
    });
  };

  const handleResetPass = (u: UsuarioEmpleado) => {
    const nueva = window.prompt(
      `Nueva password para ${u.username} (mínimo 8 caracteres):`,
    );
    if (!nueva) return;

    if (nueva.length < 8) {
      toast.error("La password debe tener al menos 8 caracteres");
      return;
    }

    cambiarPass.mutate(
      { id: u.id, password: nueva },
      {
        onSuccess: (r) => toast.success(r.detail),
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            toast.error(e.response?.data?.detail || "Error");
          }
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-7 h-7 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            </div>
            <p className="text-gray-600 mt-1">
              Administrar empleados del sistema (HU16)
            </p>
          </div>

          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setModalAbierto(true)}
          >
            Nuevo empleado
          </Button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando usuarios...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Error al cargar usuarios.</p>
          </div>
        )}

        {!isLoading && usuarios && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rol</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contacto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{u.username}</p>
                        <p className="text-xs text-gray-500">ID: {u.id}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={coloresRol[u.rol]}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          {u.rol_display}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {u.email || "—"}
                        </div>
                        {u.telefono && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {u.telefono}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <Badge color="green">Activo</Badge>
                        ) : (
                          <Badge color="red">Inactivo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleResetPass(u)}
                            title="Resetear password"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActivo(u)}
                            title={u.is_active ? "Desactivar" : "Activar"}
                            className={`p-2 rounded-lg transition-colors ${
                              u.is_active
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && usuarios && usuarios.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay usuarios registrados</p>
          </div>
        )}
      </main>

      <CrearUsuarioModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </div>
  );
}