/**
 * Plano del Hotel — pantalla principal de gestion de habitaciones.
 *
 * Muestra todas las habitaciones agrupadas por piso, con colores
 * segun su estado. Click en una habitacion abre el modal de detalle.
 */
import { useMemo, useState } from "react";
import { Building, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { PisoSection } from "../components/plano/PisoSection";
import { LeyendaEstados } from "../components/plano/LeyendaEstados";
import { HabitacionDetalleModal } from "../components/plano/HabitacionDetalleModal";
import { useHabitaciones } from "../hooks/useHabitaciones";
import { useHoteles, useOcupacion } from "../hooks/useOcupacion";
import type { Habitacion } from "../types/api.types";

export function PlanoHotelPage() {
  const [habitacionSel, setHabitacionSel] = useState<Habitacion | null>(null);

  const { data: hoteles, isLoading: loadingHoteles } = useHoteles();
  const hotelActivo = hoteles?.[0]; // por ahora, el primer hotel

  const { data: habitaciones, isLoading: loadingHabs, error } =
    useHabitaciones(hotelActivo?.id);

  const fechaHoy = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { data: ocupacion } = useOcupacion(hotelActivo?.id, fechaHoy);

  // Agrupar habitaciones por piso
  const habitacionesPorPiso = useMemo(() => {
    if (!habitaciones) return new Map<number, Habitacion[]>();
    const grouped = new Map<number, Habitacion[]>();
    habitaciones.forEach((h) => {
      const list = grouped.get(h.piso) || [];
      list.push(h);
      grouped.set(h.piso, list);
    });
    // Ordenar dentro de cada piso por numero
    grouped.forEach((list) => list.sort((a, b) => a.numero.localeCompare(b.numero)));
    return grouped;
  }, [habitaciones]);

  // Pisos ordenados de arriba hacia abajo
  const pisosOrdenados = useMemo(
    () => Array.from(habitacionesPorPiso.keys()).sort((a, b) => b - a),
    [habitacionesPorPiso],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-7 h-7 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Plano del Hotel
              </h1>
            </div>
            {hotelActivo && (
              <p className="text-gray-600 mt-1">{hotelActivo.nombre}</p>
            )}
          </div>

          {/* KPI Ocupacion */}
          {habitaciones && habitaciones.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ocupacion hoy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      (habitaciones.filter((h) => h.estado === "OCUPADA").length /
                        habitaciones.length) *
                        10000,
                    ) / 100}
                    %
                  </p>
                  <p className="text-xs text-gray-500">
                    {habitaciones.filter((h) => h.estado === "OCUPADA").length} /{" "}
                    {habitaciones.length} habitaciones
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mb-6">
          <LeyendaEstados />
        </div>

        {/* Estado de carga */}
        {(loadingHoteles || loadingHabs) && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando plano del hotel...</p>
          </div>
        )}

        {/* Estado de error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">
              Error al cargar las habitaciones. Verifique la conexion con el backend.
            </p>
          </div>
        )}

        {/* Plano */}
        {!loadingHabs && habitaciones && habitaciones.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay habitaciones registradas en este hotel.</p>
          </div>
        )}

        {!loadingHabs && pisosOrdenados.map((piso) => (
          <PisoSection
            key={piso}
            piso={piso}
            habitaciones={habitacionesPorPiso.get(piso) || []}
            onHabitacionClick={setHabitacionSel}
          />
        ))}
      </main>

      {/* Modal de detalle */}
      <HabitacionDetalleModal
        habitacion={habitacionSel}
        onClose={() => setHabitacionSel(null)}
      />
    </div>
  );
}