/**
 * Dashboard principal con KPIs del hotel.
 *
 * Los KPIs se calculan a partir de las habitaciones REALES (no del endpoint /ocupacion/)
 * para evitar desincronización entre estado y reservas.
 */
import {
  Building,
  Calendar,
  BedDouble,
  TrendingUp,
  Loader2,
  Users,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { Navbar } from "../components/layout/Navbar";
import { useHabitaciones } from "../hooks/useHabitaciones";
import { useHoteles } from "../hooks/useOcupacion";
import { useReservas } from "../hooks/useReservas";
import { useEstancias } from "../hooks/useEstancias";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: hoteles } = useHoteles();
  const hotelActivo = hoteles?.[0];

  const { data: habitaciones, isLoading: lh } = useHabitaciones(hotelActivo?.id);
  const { data: reservas } = useReservas({ hotel_id: hotelActivo?.id });
  const { data: estancias } = useEstancias();

  // ─── Cálculos basados en datos REALES ──────────────
  const totalHabitaciones = habitaciones?.length ?? 0;
  const habitacionesOcupadas =
    habitaciones?.filter((h) => h.estado === "OCUPADA").length ?? 0;
  const tasaOcupacionReal =
    totalHabitaciones > 0
      ? Math.round((habitacionesOcupadas / totalHabitaciones) * 10000) / 100
      : 0;

  const estanciasEnCurso =
    estancias?.filter((e) => e.estado === "EN_CURSO").length ?? 0;
  const reservasConfirmadas =
    reservas?.filter((r) => r.estado === "CONFIRMADA").length ?? 0;
  const enLimpieza =
    habitaciones?.filter((h) => h.estado === "LIMPIEZA").length ?? 0;

  const tarjetas = [
    {
      titulo: "Tasa de Ocupación",
      valor: `${tasaOcupacionReal}%`,
      icono: TrendingUp,
      color: "bg-primary-100 text-primary-700",
      ruta: "/reportes",
    },
    {
      titulo: "Habitaciones",
      valor: totalHabitaciones,
      icono: Building,
      color: "bg-blue-100 text-blue-700",
      ruta: "/recepcion",
    },
    {
      titulo: "Reservas Confirmadas",
      valor: reservasConfirmadas,
      icono: Calendar,
      color: "bg-green-100 text-green-700",
      ruta: "/reservas",
    },
    {
      titulo: "Huéspedes Hospedados",
      valor: estanciasEnCurso,
      icono: BedDouble,
      color: "bg-purple-100 text-purple-700",
      ruta: "/estancias",
    },
    {
      titulo: "Pendientes de limpieza",
      valor: enLimpieza,
      icono: Sparkles,
      color: "bg-amber-100 text-amber-700",
      ruta: "/tareas",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.username}
          </h1>
          <p className="text-gray-600 mt-1">
            {hotelActivo?.nombre || "Hotel"} -{" "}
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* KPIs */}
        {lh && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        )}

        {!lh && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {tarjetas.map((t) => {
              const Icon = t.icono;
              return (
                <button
                  key={t.titulo}
                  type="button"
                  onClick={() => navigate(t.ruta)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all text-left hover:-translate-y-0.5"
                >
                  <div className={`inline-flex p-2 rounded-lg mb-3 ${t.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{t.titulo}</p>
                  <p className="text-3xl font-bold text-gray-900">{t.valor}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Acceso rápido */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Acceso rápido
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate("/recepcion")}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              Plano del Hotel
            </button>
            <button
              onClick={() => navigate("/reservas")}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              Reservas
            </button>
            <button
              onClick={() => navigate("/estancias")}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              Estancias / Folios
            </button>
            <button
              onClick={() => navigate("/perfil")}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              Mi Perfil
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}