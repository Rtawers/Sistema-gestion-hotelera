/**
 * Portal publico de reservas para clientes externos (HU01).
 *
 * Flujo:
 * 1. Cliente ingresa fechas y huespedes.
 * 2. Sistema muestra habitaciones disponibles.
 * 3. Cliente elige una y abre el modal de datos.
 * 4. Cliente confirma la reserva -> pantalla de exito con codigo.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Hotel,
  Calendar,
  Users,
  Search,
  Loader2,
  BedDouble,
  Wifi,
  Coffee,
  MapPin,
  LogIn,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  buscarDisponibilidad,
  type HabitacionPublica,
} from "../api/publico.api";
import { FormularioReservaPublica } from "../components/portal/FormularioReservaPublica";
import { formatearMoneda, fechaHoyISO } from "../utils/format";

export function PortalReservaPage() {
  const navigate = useNavigate();

  // Estado de busqueda
  const hoy = fechaHoyISO();
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaISO = manana.toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(hoy);
  const [checkOut, setCheckOut] = useState(mananaISO);
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos] = useState(0);

  const [habitaciones, setHabitaciones] = useState<HabitacionPublica[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // Modal de formulario
  const [habitacionSel, setHabitacionSel] = useState<HabitacionPublica | null>(null);

  const handleBuscar = async () => {
    if (!checkIn || !checkOut) {
      toast.error("Indique las fechas de check-in y check-out");
      return;
    }
    if (checkOut <= checkIn) {
      toast.error("Check-out debe ser posterior a Check-in");
      return;
    }

    setBuscando(true);
    setBuscado(true);
    try {
      const data = await buscarDisponibilidad({
        check_in: checkIn,
        check_out: checkOut,
      });
      setHabitaciones(data.disponibles);

      if (data.disponibles.length === 0) {
        toast.error("No hay habitaciones disponibles en esas fechas");
      } else {
        toast.success(`${data.disponibles.length} habitaciones disponibles`);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.detail || "Error al buscar");
      } else {
        toast.error("Error de conexion");
      }
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-600 rounded-xl">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Hotel USS</h1>
              <p className="text-xs text-gray-500">Reserva tu estadía online</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<LogIn className="w-4 h-4" />}
            onClick={() => navigate("/login")}
          >
            ¿Eres empleado? Inicia sesión
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HERO */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Encuentra tu habitación ideal
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Reserva en cualquier momento, sin esperas. Habitaciones disponibles
            las 24 horas.
          </p>
        </div>

        {/* BUSCADOR */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-600" />
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                min={hoy}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className=" text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-600" />
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary-600" />
                Adultos
              </label>
              <select
                value={adultos}
                onChange={(e) => setAdultos(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary-600" />
                Niños
              </label>
              <select
                value={ninos}
                onChange={(e) => setNinos(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              >
                {[0, 1, 2, 3].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                icon={<Search className="w-5 h-5" />}
                loading={buscando}
                onClick={handleBuscar}
              >
                {buscando ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </div>

        {/* RESULTADOS */}
        {buscando && (
          <div className="flex flex-col items-center py-16 text-gray-500">
            <Loader2 className="w-12 h-12 animate-spin mb-3" />
            <p>Buscando habitaciones disponibles...</p>
          </div>
        )}

        {!buscando && buscado && habitaciones.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <BedDouble className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Sin disponibilidad
            </h3>
            <p className="text-gray-500">
              No tenemos habitaciones libres en esas fechas. Intenta con otras.
            </p>
          </div>
        )}

        {!buscando && habitaciones.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {habitaciones.length} habitaciones disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {habitaciones.map((h) => (
                <div
                  key={h.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  {/* Imagen placeholder */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <BedDouble className="w-20 h-20 text-primary-400" />
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">
                          Habitación {h.numero}
                        </h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {h.hotel_nombre} - Piso {h.piso}
                        </p>
                      </div>
                      <Badge color="blue">{h.tipo.nombre}</Badge>
                    </div>

                    {/* Caracteristicas */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 my-3 pb-3 border-b border-gray-100">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {h.tipo.capacidad} {h.tipo.capacidad === 1 ? "persona" : "personas"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" />
                        WiFi
                      </span>
                      <span className="flex items-center gap-1">
                        <Coffee className="w-3.5 h-3.5" />
                        Desayuno
                      </span>
                    </div>

                    {/* Precio + boton */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Desde</p>
                        <p className="text-2xl font-bold text-primary-700">
                          {formatearMoneda(h.tipo.precio_base)}
                        </p>
                        <p className="text-xs text-gray-500">por noche</p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setHabitacionSel(h)}
                      >
                        Reservar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE FORMULARIO */}
      {habitacionSel && (
        <FormularioReservaPublica
          habitacion={habitacionSel}
          checkIn={checkIn}
          checkOut={checkOut}
          adultos={adultos}
          ninos={ninos}
          onClose={() => setHabitacionSel(null)}
          onSuccess={(codigo) => {
            setHabitacionSel(null);
            navigate(`/reserva-confirmada/${codigo}`);
          }}
        />
      )}
    </div>
  );
}