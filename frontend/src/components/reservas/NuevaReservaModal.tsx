/**
 * Modal para crear una nueva reserva.
 *
 * Flujo:
 * 1. Buscar huesped por DNI/apellido
 * 2. Elegir fechas
 * 3. Cargar habitaciones disponibles para esas fechas
 * 4. Mostrar precio estimado
 * 5. Submit
 */
import { useState, useMemo, type FormEvent } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Search, Calendar, Users, DollarSign, BedDouble, UserPlus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useHuespedes } from "../../hooks/useHuespedes";
import { useCrearReserva } from "../../hooks/useReservas";
import { habitacionesDisponibles } from "../../api/habitaciones.api";
import { useQuery } from "@tanstack/react-query";
import {
  formatearMoneda,
  calcularNoches,
  fechaHoyISO,
  sumarDias,
} from "../../utils/format";
import type { Habitacion, Huesped } from "../../types/api.types";

interface NuevaReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: number;
}

export function NuevaReservaModal({
  isOpen,
  onClose,
  hotelId,
}: NuevaReservaModalProps) {
  // ─── Form state ─────────────────────────────────
  const [search, setSearch] = useState("");
  const [huespedSel, setHuespedSel] = useState<Huesped | null>(null);
  const [fechaEntrada, setFechaEntrada] = useState(sumarDias(fechaHoyISO(), 1));
  const [fechaSalida, setFechaSalida] = useState(sumarDias(fechaHoyISO(), 3));
  const [habitacionId, setHabitacionId] = useState<number | null>(null);
  const [numAdultos, setNumAdultos] = useState(2);
  const [numNinos, setNumNinos] = useState(0);

  // ─── Queries ─────────────────────────────────────
  const { data: huespedes } = useHuespedes(search);

  const noches = calcularNoches(fechaEntrada, fechaSalida);

  // Habitaciones disponibles segun las fechas
  const { data: habitaciones } = useQuery({
    queryKey: ["disponibles", fechaEntrada, fechaSalida, hotelId],
    queryFn: () =>
      habitacionesDisponibles({
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        hotel_id: hotelId,
      }),
    enabled: noches > 0 && !!hotelId,
  });

  // Habitacion seleccionada (para mostrar precio)
  const habitacionSel = useMemo(() => {
    if (!habitacionId || !habitaciones) return null;
    return habitaciones.find((h: Habitacion) => h.id === habitacionId);
  }, [habitacionId, habitaciones]);

  // Precio estimado (asume precio_base del tipo x noches)
  const precioEstimado = useMemo(() => {
    if (!habitacionSel) return 0;
    const precio = parseFloat(habitacionSel.tipo.precio_base);
    return precio * noches;
  }, [habitacionSel, noches]);

  // Validacion de capacidad
  const capacidadOk = useMemo(() => {
    if (!habitacionSel) return true;
    return numAdultos + numNinos <= habitacionSel.tipo.capacidad;
  }, [habitacionSel, numAdultos, numNinos]);

  // ─── Mutation ────────────────────────────────────
  const crearReserva = useCrearReserva();

  // ─── Submit ──────────────────────────────────────
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!huespedSel) {
      toast.error("Seleccione un huesped");
      return;
    }
    if (!habitacionId) {
      toast.error("Seleccione una habitacion");
      return;
    }
    if (noches <= 0) {
      toast.error("Las fechas no son validas");
      return;
    }
    if (!capacidadOk) {
      toast.error("Excede la capacidad de la habitacion");
      return;
    }

    crearReserva.mutate(
      {
        hotel: hotelId,
        huesped: huespedSel.id,
        habitacion: habitacionId,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        num_adultos: numAdultos,
        num_ninos: numNinos,
      },
      {
        onSuccess: (reserva) => {
          toast.success(
            `Reserva #${reserva.id} creada para ${reserva.huesped.nombre_completo}`,
          );
          handleClose();
        },
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            const detail = e.response?.data?.detail || "Error al crear reserva";
            toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
          } else {
            toast.error("Error de conexion");
          }
        },
      },
    );
  };

  const handleClose = () => {
    setSearch("");
    setHuespedSel(null);
    setHabitacionId(null);
    setNumAdultos(2);
    setNumNinos(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nueva Reserva"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ─── HUESPED ─────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Huesped
          </label>

          {!huespedSel ? (
            <>
              <Input
                placeholder="Buscar por DNI, nombre o apellido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />

              {search.length > 0 && huespedes && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {huespedes.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500 text-center">
                      No se encontraron huespedes con "{search}".
                    </p>
                  ) : (
                    huespedes.slice(0, 5).map((h: Huesped) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          setHuespedSel(h);
                          setSearch("");
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-primary-50 border-b border-gray-100 last:border-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">
                          {h.nombre_completo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {h.tipo_doc}: {h.num_doc}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div>
                <p className="font-semibold text-gray-900">
                  {huespedSel.nombre_completo}
                </p>
                <p className="text-xs text-gray-600">
                  {huespedSel.tipo_doc}: {huespedSel.num_doc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHuespedSel(null)}
                className="text-xs text-primary-700 hover:underline"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* ─── FECHAS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Check-in
            </label>
            <input
              type="date"
              value={fechaEntrada}
              onChange={(e) => setFechaEntrada(e.target.value)}
              min={fechaHoyISO()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Check-out
            </label>
            <input
              type="date"
              value={fechaSalida}
              onChange={(e) => setFechaSalida(e.target.value)}
              min={sumarDias(fechaEntrada, 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
        </div>

        {noches > 0 && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">{noches}</span> noches
          </p>
        )}

        {/* ─── HABITACION ──────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <BedDouble className="w-4 h-4" />
            Habitacion ({habitaciones?.length ?? 0} disponibles)
          </label>
          <select
            value={habitacionId ?? ""}
            onChange={(e) => setHabitacionId(parseInt(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          >
            <option value="">-- Seleccione una habitacion --</option>
            {habitaciones?.map((h: Habitacion) => (
              <option key={h.id} value={h.id}>
                Hab. {h.numero} - {h.tipo.nombre} (cap. {h.tipo.capacidad}) - S/{" "}
                {h.tipo.precio_base}/noche
              </option>
            ))}
          </select>
        </div>

        {/* ─── HUESPEDES ──────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Personas
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Adultos</label>
              <input
                type="number"
                min={1}
                max={10}
                value={numAdultos}
                onChange={(e) => setNumAdultos(parseInt(e.target.value) || 1)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Ninos</label>
              <input
                type="number"
                min={0}
                max={10}
                value={numNinos}
                onChange={(e) => setNumNinos(parseInt(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
          </div>
          {habitacionSel && !capacidadOk && (
            <p className="mt-1 text-xs text-red-600">
              La habitacion soporta maximo {habitacionSel.tipo.capacidad} personas.
            </p>
          )}
        </div>

        {/* ─── PRECIO ESTIMADO ───────────────────────────────── */}
        {habitacionSel && noches > 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary-700" />
              <h3 className="font-semibold text-gray-900">Precio estimado</h3>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>
                  S/ {habitacionSel.tipo.precio_base} x {noches} noches
                </span>
                <span>{formatearMoneda(precioEstimado)}</span>
              </div>
              <div className="border-t border-primary-200 pt-1 mt-2 flex justify-between font-bold text-gray-900">
                <span>TOTAL</span>
                <span className="text-lg text-primary-700">
                  {formatearMoneda(precioEstimado)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              * El precio final se calcula en el backend dia por dia (puede variar con tarifas por temporada).
            </p>
          </div>
        )}

        {/* ─── ACCIONES ──────────────────────────────────────── */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={crearReserva.isPending}
            disabled={!huespedSel || !habitacionId || !capacidadOk}
          >
            Crear Reserva
          </Button>
        </div>
      </form>
    </Modal>
  );
}