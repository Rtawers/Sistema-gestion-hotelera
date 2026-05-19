/**
 * Modal del Folio - corazón del flujo de check-out.
 *
 * Permite:
 * - Ver subtotal, IGV (18%), total
 * - Listar cargos con su estado de pago
 * - Agregar nuevos cargos (restaurante, lavanderia, etc.)
 * - Pagar cargos pendientes
 * - Hacer check-out (bloqueado si hay deuda)
 */
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Plus,
  CreditCard,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  BedDouble,
  UtensilsCrossed,
  Shirt,
  Wine,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  useFolio,
  usePagarCargosPendientes,
  useHacerCheckout,
} from "../../hooks/useEstancias";
import { formatearMoneda, formatearFecha } from "../../utils/format";
import { AgregarCargoModal } from "./AgregarCargoModal";
import type { Estancia, CargoEstancia, TipoCargo } from "../../types/api.types";

interface FolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  estancia: Estancia;
}

const iconosPorTipo: { [key: string]: typeof BedDouble } = {
  HABITACION: BedDouble,
  RESTAURANTE: UtensilsCrossed,
  LAVANDERIA: Shirt,
  MINIBAR: Wine,
  SPA: Sparkles,
  OTRO: HelpCircle,
};

export function FolioModal({ isOpen, onClose, estancia }: FolioModalProps) {
  const [cargoModalOpen, setCargoModalOpen] = useState(false);

  // Obtener folio actualizado (no usar el de la estancia, puede estar desactualizado)
  const { data: folio, isLoading } = useFolio(isOpen ? estancia.id : undefined);

  const pagar = usePagarCargosPendientes(estancia.id);
  const checkout = useHacerCheckout();

 const handlePagar = () => {
  if (!folio?.tiene_deuda) return;

  const metodos = [
    "EFECTIVO",
    "TARJETA",
    "TRANSFERENCIA",
    "YAPE",
    "PLIN",
  ];

  const input = window.prompt(
    `Seleccione metodo de pago:\n\n1) EFECTIVO\n2) TARJETA\n3) TRANSFERENCIA\n4) YAPE\n5) PLIN\n\nEscriba el numero (1-5):`,
    "1",
  );

  if (!input) return;

  const idx = parseInt(input.trim()) - 1;
  if (idx < 0 || idx >= metodos.length) {
    toast.error("Opcion invalida");
    return;
  }

  const metodoPago = metodos[idx];

  pagar.mutate(metodoPago, {
    onSuccess: (res) => {
      toast.success(`${res.cargos_pagados} cargos pagados con ${metodoPago}`);
    },
    onError: (e: unknown) => {
      if (axios.isAxiosError(e)) {
        toast.error(e.response?.data?.detail || "Error al pagar");
      } else {
        toast.error("Error de conexion");
      }
    },
  });
};

  const handleCheckout = () => {
    if (folio?.tiene_deuda) {
      toast.error("No se puede hacer check-out con cargos pendientes");
      return;
    }

    if (!window.confirm(
      "Confirmar check-out? La habitacion pasara a LIMPIEZA."
    )) {
      return;
    }

    checkout.mutate(estancia.id, {
      onSuccess: () => {
        toast.success(
          `Check-out realizado. Habitacion ${estancia.habitacion.numero} a LIMPIEZA.`,
        );
        onClose();
      },
      onError: (e: unknown) => {
        if (axios.isAxiosError(e)) {
          const detail = e.response?.data?.detail || "Error al hacer check-out";
          toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
        } else {
          toast.error("Error de conexion");
        }
      },
    });
  };

  if (!folio && !isLoading) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Folio #${estancia.id} — ${estancia.huesped.nombre_completo}`}
        size="xl"
      >
        {isLoading || !folio ? (
          <div className="text-center py-10 text-gray-500">Cargando folio...</div>
        ) : (
          <div className="space-y-5">
            {/* Info de la estancia */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">Habitacion</p>
                <p className="font-bold text-blue-900">
                  Hab. {estancia.habitacion.numero}
                </p>
                <p className="text-xs text-blue-700">
                  {estancia.habitacion.tipo_nombre}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">Check-in</p>
                <p className="font-bold text-purple-900">
                  {formatearFecha(estancia.fecha_checkin.split("T")[0])}
                </p>
                <Badge color={estancia.estado === "EN_CURSO" ? "green" : "gray"}>
                  {estancia.estado_display}
                </Badge>
              </div>
            </div>

            {/* Lista de cargos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  Cargos ({folio.cargos.length})
                </h3>
                {estancia.estado === "EN_CURSO" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setCargoModalOpen(true)}
                  >
                    Agregar cargo
                  </Button>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {folio.cargos.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-500">
                    No hay cargos registrados.
                  </p>
                ) : (
                  folio.cargos.map((cargo: CargoEstancia) => {
                    const Icon = iconosPorTipo[cargo.tipo] || HelpCircle;
                    return (
                      <div
                        key={cargo.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {cargo.concepto}
                          </p>
                          <p className="text-xs text-gray-500">
                            {cargo.tipo_display}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatearMoneda(cargo.monto)}
                        </p>
                        {cargo.pagado ? (
                          <Badge color="green">Pagado</Badge>
                        ) : (
                          <Badge color="amber">Pendiente</Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Totales */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">{formatearMoneda(folio.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>IGV (18%)</span>
                <span className="font-medium">{formatearMoneda(folio.igv)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-gray-900">
                <span>TOTAL</span>
                <span className="text-2xl text-primary-700">
                  {formatearMoneda(folio.total)}
                </span>
              </div>
            </div>

            {/* Estado del folio */}
            {folio.tiene_deuda && estancia.estado === "EN_CURSO" && (
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Existen cargos sin pagar. <strong>Debe pagarlos antes del check-out</strong>.
                </p>
              </div>
            )}

            {!folio.tiene_deuda && estancia.estado === "EN_CURSO" && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  Todos los cargos estan pagados. Puede hacer check-out.
                </p>
              </div>
            )}

            {folio.estado === "CERRADO" && (
              <div className="flex items-center gap-3 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  Folio cerrado el {folio.fecha_cierre && formatearFecha(folio.fecha_cierre.split("T")[0])}.
                </p>
              </div>
            )}

            {/* Acciones */}
            {estancia.estado === "EN_CURSO" && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <Button variant="secondary" onClick={onClose}>
                  Cerrar
                </Button>

                {folio.tiene_deuda && (
                  <Button
                    variant="primary"
                    icon={<CreditCard className="w-4 h-4" />}
                    loading={pagar.isPending}
                    onClick={handlePagar}
                  >
                    Pagar pendientes
                  </Button>
                )}

                <Button
                  variant={folio.tiene_deuda ? "secondary" : "primary"}
                  icon={<LogOut className="w-4 h-4" />}
                  loading={checkout.isPending}
                  onClick={handleCheckout}
                  disabled={folio.tiene_deuda}
                  className={!folio.tiene_deuda ? "ml-auto" : ""}
                >
                  Realizar Check-out
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Submodal para agregar cargo */}
      <AgregarCargoModal
        isOpen={cargoModalOpen}
        onClose={() => setCargoModalOpen(false)}
        estanciaId={estancia.id}
      />
    </>
  );
}