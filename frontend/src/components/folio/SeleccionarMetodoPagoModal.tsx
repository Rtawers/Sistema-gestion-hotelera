/**
 * Modal bonito para seleccionar el metodo de pago.
 * Reemplaza el window.prompt feo que teniamos antes.
 */
import { useState } from "react";
import { X, Banknote, CreditCard, Send, Smartphone, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";

export type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA" | "YAPE" | "PLIN";

interface SeleccionarMetodoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (metodo: MetodoPago) => void;
  monto: number;
  loading?: boolean;
}

const metodos: {
  id: MetodoPago;
  label: string;
  descripcion: string;
  icon: typeof Banknote;
  color: string;
  bgColor: string;
}[] = [
  {
    id: "EFECTIVO",
    label: "Efectivo",
    descripcion: "Pago en efectivo en recepción",
    icon: Banknote,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  {
    id: "TARJETA",
    label: "Tarjeta",
    descripcion: "Crédito o débito (POS)",
    icon: CreditCard,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  {
    id: "TRANSFERENCIA",
    label: "Transferencia",
    descripcion: "Transferencia bancaria",
    icon: Building2,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  {
    id: "YAPE",
    label: "Yape",
    descripcion: "Aplicación móvil Yape",
    icon: Smartphone,
    color: "text-violet-700",
    bgColor: "bg-violet-100",
  },
  {
    id: "PLIN",
    label: "Plin",
    descripcion: "Aplicación móvil Plin",
    icon: Smartphone,
    color: "text-cyan-700",
    bgColor: "bg-cyan-100",
  },
];

export function SeleccionarMetodoPagoModal({
  isOpen,
  onClose,
  onConfirmar,
  monto,
  loading,
}: SeleccionarMetodoPagoModalProps) {
  const [seleccionado, setSeleccionado] = useState<MetodoPago>("EFECTIVO");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Seleccionar método de pago
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Monto a pagar:{" "}
              <span className="font-bold text-primary-600">
                S/ {monto.toFixed(2)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Opciones */}
        <div className="p-5 space-y-2">
          {metodos.map((m) => {
            const Icon = m.icon;
            const activo = seleccionado === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSeleccionado(m.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  activo
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`p-2.5 rounded-lg ${m.bgColor}`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      activo ? "text-primary-700" : "text-gray-900"
                    }`}
                  >
                    {m.label}
                  </p>
                  <p className="text-xs text-gray-500">{m.descripcion}</p>
                </div>
                {activo && (
                  <CheckCircle2 className="w-5 h-5 text-primary-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 p-5 pt-2 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Send className="w-4 h-4" />}
            loading={loading}
            onClick={() => onConfirmar(seleccionado)}
          >
            Confirmar pago
          </Button>
        </div>
      </div>
    </div>
  );
}