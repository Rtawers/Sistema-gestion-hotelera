/**
 * Fila de una reserva en la tabla.
 * Muestra info clave + acciones segun el estado.
 */
import { useState } from "react";
import { LogIn, X, Eye, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Badge, colorPorEstadoReserva } from "../ui/Badge";
import { Button } from "../ui/Button";
import { formatearFecha, formatearMoneda } from "../../utils/format";
import { useCancelarReserva, useHacerCheckin, useConfirmarReserva } from "../../hooks/useReservas";
import type { Reserva } from "../../types/api.types";

interface ReservaRowProps {
  reserva: Reserva;
  onVer: () => void;
}

export function ReservaRow({ reserva, onVer }: ReservaRowProps) {
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const cancelar = useCancelarReserva();
  const checkin = useHacerCheckin();
  const confirmar = useConfirmarReserva();

  const puedeConfirmar = reserva.estado === "PENDIENTE";
  const puedeCheckin = reserva.estado === "CONFIRMADA";
  const puedeCancelar = ["PENDIENTE", "CONFIRMADA"].includes(reserva.estado);

  const handleConfirmar = () => {
    setAccionEnCurso("confirmar");

    confirmar.mutate(reserva.id, {
      onSuccess: () => {
        toast.success("Reserva confirmada");
        setAccionEnCurso(null);
      },
      onError: (e: unknown) => {
        setAccionEnCurso(null);

        if (axios.isAxiosError(e)) {
          const detail = e.response?.data?.detail || "Error al confirmar";

          toast.error(
            typeof detail === "string"
              ? detail
              : JSON.stringify(detail)
          );
        } else {
          toast.error("Error de conexion");
        }
      },
    });
  };

  const handleCheckin = () => {
    setAccionEnCurso("checkin");
    checkin.mutate(reserva.id, {
      onSuccess: () => {
        toast.success(
          `Check-in realizado para ${reserva.huesped.nombre_completo}`,
        );
        setAccionEnCurso(null);
      },
      onError: (e: unknown) => {
        setAccionEnCurso(null);
        if (axios.isAxiosError(e)) {
          const detail = e.response?.data?.detail || "Error al hacer check-in";
          toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
        } else {
          toast.error("Error de conexion");
        }
      },
    });
  };

  const handleCancelar = () => {
    const motivo = window.prompt("Motivo de cancelacion (opcional):", "");
    if (motivo === null) return; // usuario cancelo el prompt

    setAccionEnCurso("cancelar");
    cancelar.mutate(
      { id: reserva.id, motivo },
      {
        onSuccess: () => {
          toast.success(`Reserva #${reserva.id} cancelada`);
          setAccionEnCurso(null);
        },
        onError: (e: unknown) => {
          setAccionEnCurso(null);
          if (axios.isAxiosError(e)) {
            const detail = e.response?.data?.detail || "Error al cancelar";
            toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
          } else {
            toast.error("Error de conexion");
          }
        },
      },
    );
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* ID */}
      <td className="py-3 px-4 text-sm text-gray-500 font-mono">
        #{reserva.id}
      </td>

      {/* Huesped */}
      <td className="py-3 px-4">
        <p className="font-medium text-gray-900">
          {reserva.huesped.nombre_completo}
        </p>
        <p className="text-xs text-gray-500">
          {reserva.huesped.tipo_doc}: {reserva.huesped.num_doc}
        </p>
      </td>

      {/* Habitacion */}
      <td className="py-3 px-4">
        <p className="font-medium text-gray-900">
          Hab. {reserva.habitacion.numero}
        </p>
        <p className="text-xs text-gray-500">{reserva.habitacion.tipo_nombre}</p>
      </td>

      {/* Fechas */}
      <td className="py-3 px-4">
        <p className="text-sm text-gray-900">
          {formatearFecha(reserva.fecha_entrada)}
        </p>
        <p className="text-xs text-gray-500">
          a {formatearFecha(reserva.fecha_salida)} ({reserva.num_noches} noches)
        </p>
      </td>

      {/* Precio */}
      <td className="py-3 px-4 text-right">
        <p className="font-semibold text-gray-900">
          {formatearMoneda(reserva.precio_total)}
        </p>
        <p className="text-xs text-gray-500">
          {reserva.total_huespedes}{" "}
          {reserva.total_huespedes === 1 ? "persona" : "personas"}
        </p>
      </td>

      {/* Estado */}
      <td className="py-3 px-4">
        <Badge color={colorPorEstadoReserva(reserva.estado)}>
          {reserva.estado_display}
        </Badge>
      </td>

      {/* Acciones */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 justify-end flex-wrap">
          {/* Boton VER siempre disponible */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={onVer}
          >
            Ver
          </Button>

          {puedeConfirmar && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle className="w-3.5 h-3.5" />}
              loading={accionEnCurso === "confirmar"}
              onClick={handleConfirmar}
            >
              Confirmar
            </Button>
          )}

          {puedeCheckin && (
            <Button
              variant="primary"
              size="sm"
              icon={<LogIn className="w-3.5 h-3.5" />}
              loading={accionEnCurso === "checkin"}
              onClick={handleCheckin}
            >
              Check-in
            </Button>
          )}
          {puedeCancelar && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-3.5 h-3.5" />}
              loading={accionEnCurso === "cancelar"}
              onClick={handleCancelar}
            >
              Cancelar
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
