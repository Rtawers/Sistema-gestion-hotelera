/**
 * Pagina de gestion de reservas.
 * Lista todas las reservas con filtros + boton para crear.
 */
import { useState } from "react";
import { Calendar, Plus, Loader2, AlertCircle, Search } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ReservaRow } from "../components/reservas/ReservaRow";
import { NuevaReservaModal } from "../components/reservas/NuevaReservaModal";
import { DetalleReservaModal } from "../components/reservas/DetalleReservaModal";
import { useReservas } from "../hooks/useReservas";
import { useHoteles } from "../hooks/useOcupacion";
import type { EstadoReserva, Reserva } from "../types/api.types";

const estadosFiltro: { value: EstadoReserva | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "CONFIRMADA", label: "Confirmadas" },
  { value: "CHECKIN", label: "En check-in" },
  { value: "CHECKOUT", label: "Check-out" },
  { value: "CANCELADA", label: "Canceladas" },
];

export function ReservasPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [reservaDetalle, setReservaDetalle] = useState<Reserva | null>(null);

  const { data: hoteles } = useHoteles();
  const hotelActivo = hoteles?.[0];

  const { data: reservas, isLoading, error } = useReservas({
    hotel_id: hotelActivo?.id,
    estado: filtroEstado || undefined,
  });

  // Filtro client-side por nombre/documento
  const reservasFiltradas = reservas?.filter((r) => {
    if (!busqueda) return true;

    const q = busqueda.toLowerCase();

    return (
      r.huesped.nombre_completo.toLowerCase().includes(q) ||
      r.huesped.num_doc.toLowerCase().includes(q) ||
      r.habitacion.numero.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-7 h-7 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Reservas
              </h1>
            </div>

            <p className="text-gray-600 mt-1">
              Gestion de reservas del hotel
            </p>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
            disabled={!hotelActivo}
          >
            Nueva Reserva
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por huesped, DNI o numero de habitacion..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={filtroEstado}
            onChange={(e) =>
              setFiltroEstado(e.target.value as EstadoReserva | "")
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          >
            {estadosFiltro.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando reservas...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">
              Error al cargar las reservas.
            </p>
          </div>
        )}

        {/* Vacio */}
        {!isLoading &&
          reservasFiltradas &&
          reservasFiltradas.length === 0 && (
            <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />

              <p className="font-medium">
                No hay reservas para mostrar.
              </p>

              <p className="text-sm mt-1">
                Cree una nueva reserva con el boton de arriba.
              </p>
            </div>
          )}

        {/* Tabla */}
        {!isLoading &&
          reservasFiltradas &&
          reservasFiltradas.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        ID
                      </th>

                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Huesped
                      </th>

                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Habitacion
                      </th>

                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Fechas
                      </th>

                      <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">
                        Precio
                      </th>

                      <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Estado
                      </th>

                      <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reservasFiltradas.map((r) => (
                      <ReservaRow
                        key={r.id}
                        reserva={r}
                        onVer={() => setReservaDetalle(r)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                Total: {reservasFiltradas.length} reservas
              </div>
            </div>
          )}
      </main>

      {/* Modal nueva reserva */}
      {hotelActivo && (
        <NuevaReservaModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          hotelId={hotelActivo.id}
        />
      )}

      {/* Modal detalle reserva */}
      <DetalleReservaModal
        reserva={reservaDetalle}
        onClose={() => setReservaDetalle(null)}
      />
    </div>
  );
}