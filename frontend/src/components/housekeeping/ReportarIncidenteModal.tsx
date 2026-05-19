/**
 * Modal para que housekeeping reporte desperfectos o consumos del minibar.
 */
import { useState, type FormEvent } from "react";
import { AlertCircle, Send, X, Wrench, Wine, Package, MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "../ui/Button";
import { useCrearIncidente } from "../../hooks/useIncidentes";
import type { TipoIncidente } from "../../api/incidentes.api";

interface ReportarIncidenteModalProps {
  isOpen: boolean;
  habitacionId: number;
  habitacionNumero: string;
  onClose: () => void;
}

const tipos: { value: TipoIncidente; label: string; icon: typeof Wrench; color: string }[] = [
  { value: "DESPERFECTO", label: "Desperfecto", icon: Wrench, color: "red" },
  { value: "CONSUMO_MINIBAR", label: "Consumo minibar", icon: Wine, color: "amber" },
  { value: "ITEM_FALTANTE", label: "Item faltante", icon: Package, color: "orange" },
  { value: "OTRO", label: "Otro", icon: MoreHorizontal, color: "gray" },
];

export function ReportarIncidenteModal({
  isOpen,
  habitacionId,
  habitacionNumero,
  onClose,
}: ReportarIncidenteModalProps) {
  const [tipo, setTipo] = useState<TipoIncidente>("DESPERFECTO");
  const [descripcion, setDescripcion] = useState("");
  const crear = useCrearIncidente();

  const handleClose = () => {
    setTipo("DESPERFECTO");
    setDescripcion("");
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!descripcion.trim() || descripcion.trim().length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres");
      return;
    }

    crear.mutate(
      {
        habitacion: habitacionId,
        tipo,
        descripcion: descripcion.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Incidente reportado correctamente");
          handleClose();
        },
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            toast.error(e.response?.data?.detail || "Error al reportar");
          }
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Reportar incidente - Hab. {habitacionNumero}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo de incidente */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de incidente
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tipos.map((t) => {
                const Icon = t.icon;
                const seleccionado = tipo === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipo(t.value)}
                    className={`flex items-center gap-2 px-3 py-3 border-2 rounded-lg transition-all text-sm font-medium ${
                      seleccionado
                        ? "border-primary-500 bg-primary-50 text-primary-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Se encontraron 2 cervezas y 1 agua consumidas del minibar. También falta toalla de mano."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none"
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 10 caracteres. Detalla qué encontraste y dónde.
            </p>
          </div>

          {/* Info adicional */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <strong>Importante:</strong> Recepción recibirá esta notificación al
            instante para cobrar al huésped o coordinar mantenimiento.
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Send className="w-4 h-4" />}
              loading={crear.isPending}
            >
              Reportar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}