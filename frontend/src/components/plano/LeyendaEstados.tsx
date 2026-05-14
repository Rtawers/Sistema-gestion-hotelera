/**
 * Leyenda visual con los 4 estados de habitacion.
 */
import { BedDouble, Wrench, Sparkles, CheckCircle2 } from "lucide-react";

const items = [
  { label: "Disponible", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  { label: "Ocupada", color: "bg-red-100 text-red-800 border-red-300", icon: BedDouble },
  { label: "En limpieza", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Sparkles },
  { label: "Mantenimiento", color: "bg-gray-200 text-gray-700 border-gray-400", icon: Wrench },
];

export function LeyendaEstados() {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
      <p className="text-sm font-medium text-gray-600 mr-2">Leyenda:</p>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${item.color}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}