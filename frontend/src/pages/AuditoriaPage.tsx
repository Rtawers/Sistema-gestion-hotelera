/**
 * Pantalla de auditoria (HU15) - solo accesible por ADMIN.
 * Muestra el historial de acciones criticas del sistema.
 */
import { useState } from "react";
import {
  ScrollText,
  Loader2,
  AlertCircle,
  LogIn,
  LogOut,
  Calendar,
  XCircle,
  CheckCircle,
  Wallet,
  TrendingDown,
  UserPlus,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Badge } from "../components/ui/Badge";
import { useAuditoria } from "../hooks/useAuditoria";
import type { AccionLog } from "../api/auditoria.api";

const iconosAccion: { [k in AccionLog]: typeof LogIn } = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  RESERVA_CREADA: Calendar,
  RESERVA_CANCELADA: XCircle,
  CHECKIN: CheckCircle,
  CHECKOUT: LogOut,
  CARGO_AGREGADO: Plus,
  PAGO_REGISTRADO: Wallet,
  DESCUENTO_APLICADO: TrendingDown,
  USUARIO_CREADO: UserPlus,
  INCIDENTE_REPORTADO: AlertTriangle,
};

const coloresAccion: { [k in AccionLog]: "blue" | "red" | "amber" | "green" | "gray" | "purple" } = {
  LOGIN: "blue",
  LOGOUT: "gray",
  RESERVA_CREADA: "green",
  RESERVA_CANCELADA: "red",
  CHECKIN: "green",
  CHECKOUT: "blue",
  CARGO_AGREGADO: "amber",
  PAGO_REGISTRADO: "green",
  DESCUENTO_APLICADO: "amber",
  USUARIO_CREADO: "purple",
  INCIDENTE_REPORTADO: "red",
};

const accionesDisponibles: { value: AccionLog | ""; label: string }[] = [
  { value: "", label: "Todas las acciones" },
  { value: "RESERVA_CANCELADA", label: "Cancelaciones de reserva" },
  { value: "CHECKIN", label: "Check-ins" },
  { value: "CHECKOUT", label: "Check-outs" },
  { value: "PAGO_REGISTRADO", label: "Pagos" },
  { value: "INCIDENTE_REPORTADO", label: "Incidentes reportados" },
  { value: "USUARIO_CREADO", label: "Usuarios creados" },
];

export function AuditoriaPage() {
  const [filtroAccion, setFiltroAccion] = useState<AccionLog | "">("");
  const { data: logs, isLoading, error } = useAuditoria(
    filtroAccion === "" ? undefined : filtroAccion,
  );

  const formatearFechaHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Auditoría</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Historial de acciones críticas del sistema (HU15)
          </p>
        </div>

        {/* Filtro por acción */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Filtrar por tipo de acción
          </label>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value as AccionLog | "")}
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          >
            {accionesDisponibles.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando logs...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">Error al cargar los logs.</p>
          </div>
        )}

        {!isLoading && logs && logs.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
            <ScrollText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No hay logs registrados aún.</p>
            <p className="text-sm mt-1">
              Las acciones críticas comenzarán a registrarse aquí.
            </p>
          </div>
        )}

        {!isLoading && logs && logs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const Icon = iconosAccion[log.accion] || ScrollText;
                const color = coloresAccion[log.accion] || "gray";
                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        color === "red" ? "bg-red-100" :
                        color === "green" ? "bg-green-100" :
                        color === "amber" ? "bg-amber-100" :
                        color === "blue" ? "bg-blue-100" :
                        color === "purple" ? "bg-purple-100" : "bg-gray-100"
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          color === "red" ? "text-red-700" :
                          color === "green" ? "text-green-700" :
                          color === "amber" ? "text-amber-700" :
                          color === "blue" ? "text-blue-700" :
                          color === "purple" ? "text-purple-700" : "text-gray-700"
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {log.accion_display}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatearFechaHora(log.created_at)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 mb-1">
                          Por: <span className="font-medium">{log.usuario_username}</span>
                          {log.ip && (
                            <span className="text-gray-400"> · IP {log.ip}</span>
                          )}
                        </p>

                        {Object.keys(log.detalles).length > 0 && (
                          <div className="mt-2 text-xs bg-gray-50 rounded-lg p-2 font-mono text-gray-700 overflow-x-auto">
                            {JSON.stringify(log.detalles, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {logs && logs.length >= 200 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            Mostrando los últimos 200 logs. Para ver más, usa los filtros.
          </div>
        )}
      </main>
    </div>
  );
}