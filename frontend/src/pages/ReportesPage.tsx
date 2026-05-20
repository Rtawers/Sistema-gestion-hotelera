/**
 * Pantalla de reportes con graficos de ocupacion + revenue (HU13, HU14).
 * Los KPIs se calculan a partir de las habitaciones REALES.
 */
import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Building,
  Loader2,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../components/layout/Navbar";
import { useHabitaciones } from "../hooks/useHabitaciones";
import { useHoteles } from "../hooks/useOcupacion";
import { obtenerRevenuePorTipo } from "../api/reportes.api";
import { fechaHoyISO, formatearMoneda } from "../utils/format";

export function ReportesPage() {
  const [fecha, setFecha] = useState(fechaHoyISO());

  // Por defecto: año actual
  const hoy = new Date();
  const inicioAnio = `${hoy.getFullYear()}-01-01`;
  const finAnio = fechaHoyISO();

  const [revenueDesde, setRevenueDesde] = useState(inicioAnio);
  const [revenueHasta, setRevenueHasta] = useState(finAnio);

  const { data: hoteles } = useHoteles();
  const hotelActivo = hoteles?.[0];

  const { data: habitaciones, isLoading } = useHabitaciones(hotelActivo?.id);

  // Revenue por tipo
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenue-por-tipo", revenueDesde, revenueHasta],
    queryFn: () => obtenerRevenuePorTipo(revenueDesde, revenueHasta),
    staleTime: 60_000,
  });

  // ─── Calculos REALES basados en habitaciones ───────
  const totalHabitaciones = habitaciones?.length ?? 0;
  const habitacionesOcupadas =
    habitaciones?.filter((h) => h.estado === "OCUPADA").length ?? 0;
  const tasaOcupacionReal =
    totalHabitaciones > 0
      ? Math.round((habitacionesOcupadas / totalHabitaciones) * 10000) / 100
      : 0;

  // Datos para el grafico: habitaciones por estado
  const dataEstados = useMemo(() => {
    if (!habitaciones) return [];
    const grupos = {
      DISPONIBLE: 0,
      OCUPADA: 0,
      LIMPIEZA: 0,
      MANTENIMIENTO: 0,
    };
    habitaciones.forEach((h) => {
      grupos[h.estado as keyof typeof grupos]++;
    });
    return [
      { estado: "Disponible", cantidad: grupos.DISPONIBLE, color: "#10b981" },
      { estado: "Ocupada", cantidad: grupos.OCUPADA, color: "#ef4444" },
      { estado: "Limpieza", cantidad: grupos.LIMPIEZA, color: "#f59e0b" },
      { estado: "Mantenim.", cantidad: grupos.MANTENIMIENTO, color: "#6b7280" },
    ];
  }, [habitaciones]);

  // Datos para el grafico de habitaciones por tipo (conteo)
  const dataTipos = useMemo(() => {
    if (!habitaciones) return [];
    const grupos = new Map<string, number>();
    habitaciones.forEach((h) => {
      const nombre = h.tipo.nombre;
      grupos.set(nombre, (grupos.get(nombre) || 0) + 1);
    });
    return Array.from(grupos.entries()).map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
    }));
  }, [habitaciones]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
            </div>
            <p className="text-gray-600 mt-1">
              Análisis de ocupación, distribución e ingresos del hotel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
        </div>

        {/* KPIs principales — calculados desde habitaciones REALES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tasa de ocupación</p>
                <p className="text-3xl font-bold text-gray-900">
                  {tasaOcupacionReal}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Building className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Habitaciones ocupadas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {habitacionesOcupadas}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total habitaciones</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalHabitaciones}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Ingresos {hoy.getFullYear()}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {revenueData ? formatearMoneda(revenueData.total) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Cargando datos...</p>
          </div>
        )}

        {/* Gráficos básicos */}
        {!isLoading && habitaciones && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Habitaciones por estado
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataEstados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                    {dataEstados.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Habitaciones por tipo
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataTipos}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue por tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Ingresos por tipo de habitación
              </h2>
              <p className="text-sm text-gray-500">
                Total facturado en folios pagados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={revenueDesde}
                onChange={(e) => setRevenueDesde(e.target.value)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={revenueHasta}
                onChange={(e) => setRevenueHasta(e.target.value)}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
          </div>

          {loadingRevenue ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : revenueData && revenueData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `S/ ${v}`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                  formatter={(value) => [
                  formatearMoneda(Number(value ?? 0)),
                  "Revenue",
                   ]}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No hay datos de revenue en este rango.</p>
              <p className="text-xs mt-1">
                Los datos aparecen cuando hay folios pagados (check-outs
                completos).
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}