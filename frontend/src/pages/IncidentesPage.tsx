/**
 * Pantalla de incidentes reportados por housekeeping.
 * Visible para ADMIN y RECEPCIONISTA.
 */
import { useState } from "react";
import {
  AlertTriangle,
  Wrench,
  Wine,
  Package,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useIncidentes, useActualizarIncidente } from "../hooks/useIncidentes";
import type { Incidente, EstadoIncidente } from "../api/incidentes.api";
import { formatearFecha } from "../utils/format";

const tipoIcons: { [k: string]: typeof Wrench } = {
  DESPERFECTO: Wrench,
  CONSUMO_MINIBAR: Wine,
  ITEM_FALTANTE: Package,
  OTRO: MoreHorizontal,
};

const estadoColors: { [k in EstadoIncidente]: "red" | "amber" | "green" } = {
  REPORTADO: "red",
  EN_PROCESO: "amber",
  RESUELTO: "green",
};

export function IncidentesPage() {
  const [filtroEstado, setFiltroEstado] = useState<"" | EstadoIncidente>("");

  const { data: incidentes, isLoading, error } = useIncidentes();
  const actualizar = useActualizarIncidente();

  const filtrados = incidentes?.filter((i) =>
    filtroEstado === "" ? true : i.estado === filtroEstado,
  ) || [];

  const cambiarEstado = (incidente: Incidente, nuevoEstado: EstadoIncidente) => {
    actualizar.mutate(
      { id: incidente.id, data: { estado: nuevoEstado } },
      {
        onSuccess: () => {
          toast.success(`Incidente marcado como ${nuevoEstado}`);
        },
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            toast.error(e.response?.data?.detail || "Error al actualizar");
          }
        },
      },
    );
  };

  // KPIs
  const reportados = incidentes?.filter((i) => i.estado === "REPORTADO").length ?? 0;
  const enProceso = incidentes?.filter((i) => i.estado === "EN_PROCESO").length ?? 0;
  const resueltos = incidentes?.filter((i) => i.estado === "RESUELTO").length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900">Incidentes</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Reportes de desperfectos y consumos del minibar
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-red-700 font-medium">Reportados</p>
                <p className="text-2xl font-bold text-red-900">{reportados}</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-medium">En proceso</p>
                <p className="text-2xl font-bold text-amber-900">{enProceso}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium">Resueltos</p>
                <p className="text-2xl font-bold text-green-900">{resueltos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Estado:</span>
          <button
            onClick={() => setFiltroEstado("")}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filtroEstado === "" ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Todos
          </button>
          {(["REPORTADO", "EN_PROCESO", "RESUELTO"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                filtroEstado === e ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {e === "REPORTADO" ? "Reportados" : e === "EN_PROCESO" ? "En proceso" : "Resueltos"}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando incidentes...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Error al cargar incidentes.</p>
          </div>
        )}

        {!isLoading && filtrados.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium">No hay incidentes</p>
            <p className="text-sm mt-1">
              Cuando housekeeping reporte un problema, aparecerá aquí.
            </p>
          </div>
        )}

        {!isLoading && filtrados.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filtrados.map((i) => {
                const Icon = tipoIcons[i.tipo] || MoreHorizontal;
                return (
                  <div key={i.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-lg ${
                        i.estado === "REPORTADO" ? "bg-red-100" :
                        i.estado === "EN_PROCESO" ? "bg-amber-100" : "bg-green-100"
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          i.estado === "REPORTADO" ? "text-red-700" :
                          i.estado === "EN_PROCESO" ? "text-amber-700" : "text-green-700"
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="font-bold text-gray-900">
                              Hab. {i.habitacion_numero} - {i.tipo_display}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Reportado por {i.reportado_por_username} -{" "}
                              {formatearFecha(i.created_at.split("T")[0])}
                            </p>
                          </div>
                          <Badge color={estadoColors[i.estado]}>
                            {i.estado_display}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-700 my-2">
                          {i.descripcion}
                        </p>

                        {/* Acciones */}
                        {i.estado === "REPORTADO" && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => cambiarEstado(i, "EN_PROCESO")}
                            >
                              Marcar en proceso
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => cambiarEstado(i, "RESUELTO")}
                            >
                              Marcar resuelto
                            </Button>
                          </div>
                        )}
                        {i.estado === "EN_PROCESO" && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="mt-3"
                            onClick={() => cambiarEstado(i, "RESUELTO")}
                          >
                            Marcar resuelto
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}