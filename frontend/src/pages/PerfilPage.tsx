/**
 * Página de perfil del usuario logueado.
 * Permite ver y actualizar campos limitados.
 */
import { useState, useEffect, type FormEvent } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { usePerfil, useActualizarPerfil } from "../hooks/usePerfil";
import { formatearFecha } from "../utils/format";

const rolColores: { [key: string]: "purple" | "blue" | "amber" } = {
  ADMIN: "purple",
  RECEPCIONISTA: "blue",
  HOUSEKEEPING: "amber",
};

export function PerfilPage() {
  const { data: perfil, isLoading } = usePerfil();
  const actualizar = useActualizarPerfil();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    if (perfil) {
      setFirstName(perfil.first_name || "");
      setLastName(perfil.last_name || "");
      setEmail(perfil.email || "");
      setTelefono(perfil.telefono || "");
    }
  }, [perfil]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    actualizar.mutate(
      {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
      },
      {
        onSuccess: () => toast.success("Perfil actualizado correctamente"),
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            toast.error(e.response?.data?.detail || "Error al actualizar");
          } else {
            toast.error("Error de conexion");
          }
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <UserIcon className="w-7 h-7 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Gestione su información personal
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando perfil...</p>
          </div>
        )}

        {perfil && (
          <>
            {/* Tarjeta de información de cuenta */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" />
                Información de cuenta
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Usuario</p>
                  <p className="font-semibold text-gray-900">
                    {perfil.username}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rol</p>
                  <Badge color={rolColores[perfil.rol] || "gray"}>
                    {perfil.rol_display}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Miembro desde</p>
                  <p className="text-sm text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatearFecha(perfil.date_joined.split("T")[0])}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Último acceso</p>
                  <p className="text-sm text-gray-700">
                    {perfil.last_login
                      ? formatearFecha(perfil.last_login.split("T")[0])
                      : "Nunca"}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario de actualización */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Datos personales
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Nombres"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Sus nombres"
                />
                <Input
                  label="Apellidos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sus apellidos"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  placeholder="correo@ejemplo.com"
                />
                <Input
                  label="Teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  icon={<Phone className="w-4 h-4" />}
                  placeholder="987654321"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  loading={actualizar.isPending}
                >
                  Guardar cambios
                </Button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}