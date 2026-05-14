/**
 * Pantalla principal (dashboard) - temporal.
 * En HITO 4 Parte 4 sera reemplazada por el Plano del Hotel.
 */
import { useAuthStore } from "../store/auth.store";
import { Navbar } from "../components/layout/Navbar";
import { CheckCircle2, Server, Sparkles, Users, BedDouble, Calendar } from "lucide-react";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.username}
          </h1>
          <p className="text-gray-600 mt-1">
            Rol: {user?.rol_display}
          </p>
        </div>

        {/* Tarjetas de estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BedDouble className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Habitaciones</h3>
            </div>
            <p className="text-sm text-gray-600">
              Plano del hotel disponible en HITO 4 Parte 4
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Reservas</h3>
            </div>
            <p className="text-sm text-gray-600">
              Gestion de reservas en HITO 4 Parte 5
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Huespedes</h3>
            </div>
            <p className="text-sm text-gray-600">
              Gestion de clientes en HITO 4 Parte 5
            </p>
          </div>
        </div>

        {/* Card de estado de conexion */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Conexion al Backend
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Autenticacion JWT</p>
                <p className="text-sm text-gray-600">
                  Token activo, rol: {user?.rol}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Server className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">API REST</p>
                <p className="text-sm text-gray-600">
                  {import.meta.env.VITE_API_URL}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}