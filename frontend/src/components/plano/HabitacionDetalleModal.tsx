/**
 * Modal con el detalle de la habitacion seleccionada.
 *
 * Si el usuario es Housekeeping o Admin, muestra botones
 * para cambiar el estado (segun las transiciones permitidas).
 */
import toast from "react-hot-toast";
import { BedDouble, MapPin, Users, DollarSign, Wrench, Sparkles, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useCambiarEstadoHabitacion } from "../../hooks/useHabitaciones";
import { useAuthStore } from "../../store/auth.store";
import type { Habitacion, EstadoHabitacion } from "../../types/api.types";

interface HabitacionDetalleModalProps {
  habitacion: Habitacion | null;
  onClose: () => void;
}

// Transiciones permitidas (mismas que en el backend)
const transicionesValidas: Record<EstadoHabitacion, EstadoHabitacion[]> = {
  DISPONIBLE: ["MANTENIMIENTO"],
  OCUPADA: ["LIMPIEZA"],
  LIMPIEZA: ["DISPONIBLE", "MANTENIMIENTO"],
  MANTENIMIENTO: ["DISPONIBLE"],
};

const iconosPorEstado: Record<EstadoHabitacion, typeof BedDouble> = {
  DISPONIBLE: CheckCircle2,
  OCUPADA: BedDouble,
  LIMPIEZA: Sparkles,
  MANTENIMIENTO: Wrench,
};

const labelsPorEstado: Record<EstadoHabitacion, string> = {
  DISPONIBLE: "Disponible",
  OCUPADA: "Ocupada",
  LIMPIEZA: "En limpieza",
  MANTENIMIENTO: "Mantenimiento",
};

export function HabitacionDetalleModal({
  habitacion,
  onClose,
}: HabitacionDetalleModalProps) {
  const user = useAuthStore((s) => s.user);
  const cambiarEstado = useCambiarEstadoHabitacion();

  if (!habitacion) return null;

  const puedeGestionar =
    user?.rol === "HOUSEKEEPING" || user?.rol === "ADMIN" || user?.es_admin;
  const transiciones = transicionesValidas[habitacion.estado] || [];

  const handleCambioEstado = (nuevoEstado: EstadoHabitacion) => {
    cambiarEstado.mutate(
      { id: habitacion.id, nuevo_estado: nuevoEstado },
      {
        onSuccess: () => {
          toast.success(
            `Habitacion ${habitacion.numero}: ${labelsPorEstado[nuevoEstado]}`,
          );
          onClose();
        },
        onError: (error: unknown) => {
          if (axios.isAxiosError(error)) {
            const detail =
              error.response?.data?.detail || "Error al cambiar el estado";
            toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
          } else {
            toast.error("Error de conexion");
          }
        },
      },
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Habitacion ${habitacion.numero}`}
      size="md"
    >
      {/* Info principal */}
      <div className="space-y-4">
        {/* Estado actual */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg">
              {(() => {
                const Icon = iconosPorEstado[habitacion.estado];
                return <Icon className="w-5 h-5 text-gray-700" />;
              })()}
            </div>
            <div>
              <p className="text-xs text-gray-500">Estado actual</p>
              <p className="font-bold text-gray-900">
                {habitacion.estado_display}
              </p>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-medium">Piso</span>
            </div>
            <p className="mt-1 font-bold text-blue-900">{habitacion.piso}</p>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Capacidad</span>
            </div>
            <p className="mt-1 font-bold text-purple-900">
              {habitacion.tipo.capacidad} personas
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <BedDouble className="w-4 h-4" />
            <span className="text-xs font-medium">Tipo</span>
          </div>
          <p className="mt-1 font-bold text-amber-900">
            {habitacion.tipo.nombre}
          </p>
        </div>

        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Precio base</span>
          </div>
          <p className="mt-1 font-bold text-green-900">
            S/ {habitacion.tipo.precio_base} / noche
          </p>
        </div>

        {/* Acciones (housekeeping/admin) */}
        {puedeGestionar && transiciones.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Cambiar estado:
            </p>
            <div className="flex flex-wrap gap-2">
              {transiciones.map((estado) => (
                <Button
                  key={estado}
                  variant="secondary"
                  size="sm"
                  loading={cambiarEstado.isPending}
                  onClick={() => handleCambioEstado(estado)}
                >
                  {labelsPorEstado[estado]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {puedeGestionar && transiciones.length === 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 italic">
              No hay transiciones disponibles desde este estado.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}