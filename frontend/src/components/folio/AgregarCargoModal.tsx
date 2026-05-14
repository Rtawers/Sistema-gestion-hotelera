/**
 * Modal pequeno para agregar un cargo a la estancia.
 */
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Plus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAgregarCargo } from "../../hooks/useEstancias";
import type { TipoCargo } from "../../types/api.types";

interface AgregarCargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  estanciaId: number;
}

const tiposCargo: { value: TipoCargo; label: string }[] = [
  { value: "RESTAURANTE", label: "Restaurante" },
  { value: "LAVANDERIA", label: "Lavanderia" },
  { value: "MINIBAR", label: "Minibar" },
  { value: "SPA", label: "Spa" },
  { value: "OTRO", label: "Otro" },
];

export function AgregarCargoModal({
  isOpen,
  onClose,
  estanciaId,
}: AgregarCargoModalProps) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState<TipoCargo>("OTRO");

  const agregar = useAgregarCargo(estanciaId);

  const reset = () => {
    setConcepto("");
    setMonto("");
    setTipo("OTRO");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!concepto.trim()) {
      toast.error("Ingrese un concepto");
      return;
    }
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      toast.error("El monto debe ser un numero positivo");
      return;
    }

    agregar.mutate(
      { concepto: concepto.trim(), monto: montoNum.toFixed(2), tipo },
      {
        onSuccess: (cargo) => {
          toast.success(`Cargo agregado: ${cargo.concepto}`);
          handleClose();
        },
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            const detail = e.response?.data?.detail || "Error al agregar cargo";
            toast.error(typeof detail === "string" ? detail : JSON.stringify(detail));
          } else {
            toast.error("Error de conexion");
          }
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar cargo"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tipo de cargo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCargo)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          >
            {tiposCargo.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Concepto"
          placeholder="Ej: Cena para 2 personas"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          required
        />

        <Input
          label="Monto (S/)"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            loading={agregar.isPending}
          >
            Agregar
          </Button>
        </div>
      </form>
    </Modal>
  );
}