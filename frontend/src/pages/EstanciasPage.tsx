/**
 * Pagina de estancias en curso y finalizadas.
 */
import { useState, useMemo } from "react";
import { BedDouble, Loader2, AlertCircle, Search } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Input } from "../components/ui/Input";
import { EstanciaRow } from "../components/folio/EstanciaRow";
import { useEstancias } from "../hooks/useEstancias";
import type { EstadoEstancia } from "../types/api.types";

const filtros: { value: EstadoEstancia | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "FINALIZADA", label: "Finalizadas" },
];

export function EstanciasPage() {
  const [filtro, setFiltro] = useState<EstadoEstancia | "">("EN_CURSO");
  const [busqueda, setBusqueda] = useState("");

  const { data: estancias, isLoading, error } = useEstancias();

  const filtradas = useMemo(() => {
    if (!estancias) return [];
    return estancias.filter((e) => {
      if (filtro && e.estado !== filtro) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        return (
          e.huesped.nombre_completo.toLowerCase().includes(q) ||
          e.huesped.num_doc.toLowerCase().includes(q) ||
          e.habitacion.numero.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [estancias, filtro, busqueda]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Estancias</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Gestion de folios, cargos y check-out
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por huesped, DNI o habitacion..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as EstadoEstancia | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          >
            {filtros.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando estancias...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Error al cargar las estancias.</p>
          </div>
        )}

        {/* Vacio */}
        {!isLoading && filtradas.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
            <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No hay estancias para mostrar.</p>
            <p className="text-sm mt-1">
              Las estancias se crean al hacer check-in en una reserva.
            </p>
          </div>
        )}

        {/* Tabla */}
        {!isLoading && filtradas.length > 0 && (
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
                      Check-in
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Estado
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Total
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((e) => (
                    <EstanciaRow key={e.id} estancia={e} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Total: {filtradas.length} estancias
            </div>
          </div>
        )}
      </main>
    </div>
  );
}