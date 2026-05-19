/**
 * Pantalla de gestion de tipos de habitacion (solo lectura).
 * Solo accesible para rol ADMIN.
 */
import { Layers, BedDouble, Users, DollarSign, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../components/layout/Navbar";
import { listarTiposHabitacion } from "../api/tipos-habitacion.api";
import { formatearMoneda } from "../utils/format";

export function TiposHabitacionPage() {
  const { data: tipos, isLoading, error } = useQuery({
    queryKey: ["tipos-habitacion"],
    queryFn: listarTiposHabitacion,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Tipos de Habitación
            </h1>
          </div>
          <p className="text-gray-600 mt-1">
            Categorías de habitaciones con sus capacidades y precios base
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando tipos...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Error al cargar los tipos.</p>
          </div>
        )}

        {!isLoading && tipos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tipos.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <BedDouble className="w-6 h-6 text-primary-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t.nombre}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      Capacidad
                    </span>
                    <span className="font-semibold text-gray-900">
                      {t.capacidad} {t.capacidad === 1 ? "persona" : "personas"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      Precio base
                    </span>
                    <span className="font-bold text-primary-700 text-lg">
                      {formatearMoneda(t.precio_base)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && tipos && tipos.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
            <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay tipos de habitación registrados.</p>
            <p className="text-sm mt-1">
              Gestione los tipos desde el panel de administración de Django.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}