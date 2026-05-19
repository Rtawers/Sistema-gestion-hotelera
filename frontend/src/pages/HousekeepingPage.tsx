/**
 * Pantalla dedicada al rol Housekeeping.
 * Muestra habitaciones en LIMPIEZA y MANTENIMIENTO con accion rapida.
 */
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Sparkles,
  Wrench,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  useHabitacionesHousekeeping,
  useCambiarEstadoHabitacion,
} from "../hooks/useHabitaciones";
import { useHoteles } from "../hooks/useOcupacion";
import type { Habitacion } from "../types/api.types";

export function HousekeepingPage() {
  const [filtroPiso, setFiltroPiso] = useState<number | "">("");

  const { data: hoteles } = useHoteles();
  const hotelActivo = hoteles?.[0];

  const { data: habitaciones, isLoading, error } =
    useHabitacionesHousekeeping(hotelActivo?.id);

  const cambiar = useCambiarEstadoHabitacion();

  // Pisos únicos para el filtro
  const pisosUnicos = useMemo(() => {
    if (!habitaciones) return [];
    return [...new Set(habitaciones.map((h) => h.piso))].sort((a, b) => a - b);
  }, [habitaciones]);

  const filtradas = useMemo(() => {
    if (!habitaciones) return [];
    if (filtroPiso === "") return habitaciones;
    return habitaciones.filter((h) => h.piso === filtroPiso);
  }, [habitaciones, filtroPiso]);

  const marcarLista = (habitacion: Habitacion) => {
    if (
      !window.confirm(
        `Marcar habitacion ${habitacion.numero} como DISPONIBLE?`,
      )
    ) {
      return;
    }
    cambiar.mutate(
      { id: habitacion.id, nuevo_estado: "DISPONIBLE" },
      {
        onSuccess: () => {
          toast.success(`Habitacion ${habitacion.numero} lista para uso`);
        },
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            toast.error(e.response?.data?.detail || "Error al actualizar");
          }
        },
      },
    );
  };

  const enLimpieza = filtradas.filter((h) => h.estado === "LIMPIEZA").length;
  const enMantenimiento = filtradas.filter(
    (h) => h.estado === "MANTENIMIENTO",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900">Housekeeping</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Habitaciones que requieren limpieza o mantenimiento
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-medium">
                  En limpieza
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {enLimpieza}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Wrench className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-700 font-medium">
                  En mantenimiento
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {enMantenimiento}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro por piso */}
        {pisosUnicos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Piso:</span>
            <button
              onClick={() => setFiltroPiso("")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filtroPiso === ""
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Todos
            </button>
            {pisosUnicos.map((p) => (
              <button
                key={p}
                onClick={() => setFiltroPiso(p)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filtroPiso === p
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Piso {p}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando habitaciones...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Error al cargar las habitaciones.</p>
          </div>
        )}

        {/* Vacio */}
        {!isLoading && filtradas.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium">Todo en orden</p>
            <p className="text-sm mt-1">
              No hay habitaciones pendientes de atención.
            </p>
          </div>
        )}

        {/* Tarjetas */}
        {!isLoading && filtradas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtradas.map((h) => (
              <div
                key={h.id}
                className={`p-4 rounded-xl border-2 ${
                  h.estado === "LIMPIEZA"
                    ? "bg-amber-50 border-amber-300"
                    : "bg-gray-100 border-gray-400"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      Hab. {h.numero}
                    </p>
                    <p className="text-sm text-gray-600">
                      Piso {h.piso} - {h.tipo.nombre}
                    </p>
                  </div>
                  <Badge
                    color={h.estado === "LIMPIEZA" ? "amber" : "gray"}
                  >
                    {h.estado_display}
                  </Badge>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  loading={cambiar.isPending}
                  onClick={() => marcarLista(h)}
                >
                  Marcar lista
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}