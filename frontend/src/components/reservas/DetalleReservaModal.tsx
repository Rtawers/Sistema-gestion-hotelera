/**
 * Modal de solo lectura con los datos completos de una reserva.
 */
import {
  X,
  Calendar,
  User as UserIcon,
  BedDouble,
  IdCard,
  Users,
  Globe,
  DollarSign,
  Hash,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { formatearFecha, formatearMoneda } from "../../utils/format";
import type { Reserva } from "../../types/api.types";

interface DetalleReservaModalProps {
  reserva: Reserva | null;
  onClose: () => void;
}

const coloresEstado: { [key: string]: "amber" | "green" | "red" | "blue" | "gray" } = {
  PENDIENTE: "amber",
  CONFIRMADA: "green",
  CANCELADA: "red",
  CHECK_IN: "blue",
  CHECKOUT: "gray",
};

const coloresOrigen: { [key: string]: "blue" | "purple" | "amber" } = {
  WEB: "blue",
  TELEFONO: "purple",
  WALKIN: "amber",
};

export function DetalleReservaModal({ reserva, onClose }: DetalleReservaModalProps) {
  if (!reserva) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-primary-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary-600" />
              Reserva #{reserva.id}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Detalles completos de la reserva
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Estado y origen */}
          <div className="flex gap-2">
            <Badge color={coloresEstado[reserva.estado] || "gray"}>
              Estado: {reserva.estado_display}
            </Badge>
            <Badge color={coloresOrigen[reserva.origen] || "gray"}>
              <Globe className="w-3 h-3 inline mr-1" />
              Origen: {reserva.origen}
            </Badge>
          </div>

          {/* Huésped */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary-600" />
              HUÉSPED
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Nombre completo</p>
                <p className="font-semibold text-gray-900">
                  {reserva.huesped.nombre_completo}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <IdCard className="w-3 h-3" />
                  Documento
                </p>
                <p className="font-semibold text-gray-900">
                  {reserva.huesped.tipo_doc} {reserva.huesped.num_doc}
                </p>
              </div>
            </div>
          </div>

          {/* Habitación */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-blue-600" />
              HABITACIÓN
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Número</p>
                <p className="font-bold text-lg text-blue-900">
                  Hab. {reserva.habitacion.numero}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="font-semibold text-gray-900">
                  {reserva.habitacion.tipo_nombre}
                </p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-purple-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              FECHAS DE ESTADÍA
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Check-in</p>
                <p className="font-semibold text-gray-900">
                  {formatearFecha(reserva.fecha_entrada)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Check-out</p>
                <p className="font-semibold text-gray-900">
                  {formatearFecha(reserva.fecha_salida)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200 flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Huéspedes
              </span>
              <span className="font-semibold text-gray-900">
                {reserva.num_adultos} adulto(s)
                {reserva.num_ninos > 0 && `, ${reserva.num_ninos} niño(s)`}
              </span>
            </div>
          </div>

          {/* Precio */}
          <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-bold text-gray-900">PRECIO TOTAL</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {formatearMoneda(reserva.precio_total)}
              </p>
            </div>
          </div>

          {/* Observaciones */}
          {reserva.observaciones && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="text-sm font-bold text-gray-900 mb-2">
                Observaciones
              </h3>
              <p className="text-sm text-gray-700">{reserva.observaciones}</p>
            </div>
          )}

          {/* Botón cerrar */}
          <div className="flex justify-end pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}