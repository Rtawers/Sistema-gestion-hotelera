/**
 * Seccion de un piso con todas sus habitaciones en grid.
 */
import { Building2 } from "lucide-react";
import { HabitacionCard } from "./HabitacionCard";
import type { Habitacion } from "../../types/api.types";

interface PisoSectionProps {
  piso: number;
  habitaciones: Habitacion[];
  onHabitacionClick: (h: Habitacion) => void;
}

export function PisoSection({
  piso,
  habitaciones,
  onHabitacionClick,
}: PisoSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary-100 rounded-lg">
          <Building2 className="w-4 h-4 text-primary-700" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Piso {piso}</h2>
        <span className="text-sm text-gray-500">
          ({habitaciones.length} habitaciones)
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {habitaciones.map((hab) => (
          <HabitacionCard
            key={hab.id}
            habitacion={hab}
            onClick={onHabitacionClick}
          />
        ))}
      </div>
    </div>
  );
}