/**
 * Tarjeta visual de una habitacion en el plano del hotel.
 * El color de fondo depende del estado (verde/rojo/amarillo/gris).
 */
import { BedDouble, Wrench, Sparkles, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import type { Habitacion } from "../../types/api.types";

interface HabitacionCardProps {
  habitacion: Habitacion;
  onClick: (h: Habitacion) => void;
}

interface EstiloEstado {
  bg: string;
  border: string;
  text: string;
  icon: typeof BedDouble;
}

const estilosPorEstado: { [key: string]: EstiloEstado } = {
  DISPONIBLE: {
    bg: "bg-green-50 hover:bg-green-100",
    border: "border-green-300",
    text: "text-green-900",
    icon: CheckCircle2,
  },
  OCUPADA: {
    bg: "bg-red-50 hover:bg-red-100",
    border: "border-red-300",
    text: "text-red-900",
    icon: BedDouble,
  },
  LIMPIEZA: {
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-900",
    icon: Sparkles,
  },
  MANTENIMIENTO: {
    bg: "bg-gray-100 hover:bg-gray-200",
    border: "border-gray-400",
    text: "text-gray-700",
    icon: Wrench,
  },
};

export function HabitacionCard({ habitacion, onClick }: HabitacionCardProps) {
  const estilo = estilosPorEstado[habitacion.estado];
  const Icon = estilo.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(habitacion)}
      className={clsx(
        "relative aspect-square rounded-xl border-2 p-3",
        "flex flex-col items-center justify-center gap-1",
        "transition-all duration-150 cursor-pointer",
        "hover:scale-105 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary-500/40",
        estilo.bg,
        estilo.border,
      )}
      title={`Habitacion ${habitacion.numero} - ${habitacion.estado_display}`}
    >
      <Icon className={clsx("w-6 h-6", estilo.text)} />
      <p className={clsx("text-xl font-bold", estilo.text)}>
        {habitacion.numero}
      </p>
      <p className={clsx("text-xs font-medium", estilo.text)}>
        {habitacion.tipo.nombre}
      </p>
    </button>
  );
}