/**
 * Badge para mostrar estados con colores.
 */
import type { ReactNode } from "react";
import clsx from "clsx";

type BadgeColor =
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "purple"
  | "gray";

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
}

const colors: { [key: string]: string } = {
  green: "bg-green-100 text-green-800 border-green-200",
  red: "bg-red-100 text-red-800 border-red-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
};

export function Badge({ color = "gray", children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
        colors[color],
      )}
    >
      {children}
    </span>
  );
}

/**
 * Helper que mapea el estado de Reserva al color del Badge.
 */
export function colorPorEstadoReserva(estado: string): BadgeColor {
  switch (estado) {
    case "CONFIRMADA":
      return "blue";
    case "CHECKIN":
      return "green";
    case "CHECKOUT":
      return "gray";
    case "CANCELADA":
    case "NO_SHOW":
      return "red";
    case "PENDIENTE":
      return "amber";
    default:
      return "gray";
  }
}