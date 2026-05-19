/**
 * Modal pequeño para registrar un nuevo huésped rápidamente
 * desde el flujo de Nueva Reserva.
 */
import { useState, type FormEvent } from "react";
import { UserPlus, IdCard, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { crearHuesped } from "../../api/huespedes.api";
import { useQueryClient } from "@tanstack/react-query";
import type { Huesped } from "../../types/api.types";


interface NuevoHuespedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreado: (h: Huesped) => void;
}

const tiposDoc = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carnet de Extranjería" },
  { value: "PAS", label: "Pasaporte" },
];

export function NuevoHuespedModal({
  isOpen,
  onClose,
  onCreado,
}: NuevoHuespedModalProps) {
  const queryClient = useQueryClient();
  const [tipoDoc, setTipoDoc] = useState("DNI");
  const [numDoc, setNumDoc] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTipoDoc("DNI");
    setNumDoc("");
    setNombres("");
    setApellidos("");
    setEmail("");
    setTelefono("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!numDoc.trim() || !nombres.trim() || !apellidos.trim()) {
      toast.error("Documento, nombres y apellidos son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const nuevo = await crearHuesped({
        tipo_doc: tipoDoc,
        num_doc: numDoc.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim() || undefined,
        telefono: telefono.trim() || undefined,
        nacionalidad: "Peruana",
      });

      queryClient.invalidateQueries({ queryKey: ["huespedes"] });
      toast.success(`Huésped ${nuevo.nombre_completo} registrado`);
      onCreado(nuevo);
      handleClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data;
        if (typeof detail === "object" && detail !== null) {
          const firstErr = Object.values(detail)[0];
          toast.error(Array.isArray(firstErr) ? firstErr[0] : String(firstErr));
        } else {
          toast.error("Error al registrar huésped");
        }
      } else {
        toast.error("Error de conexión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Huésped"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo doc.
            </label>
            <select
              value={tipoDoc}
              onChange={(e) => setTipoDoc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            >
              {tiposDoc.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Input
              label="Número"
              value={numDoc}
              onChange={(e) => setNumDoc(e.target.value)}
              icon={<IdCard className="w-4 h-4" />}
              placeholder="12345678"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombres"
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            placeholder="Juan Carlos"
            required
          />
          <Input
            label="Apellidos"
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            placeholder="Pérez López"
            required
          />
        </div>

        <Input
          label="Email (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          placeholder="correo@ejemplo.com"
        />

        <Input
          label="Teléfono (opcional)"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          icon={<Phone className="w-4 h-4" />}
          placeholder="987654321"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            loading={loading}
          >
            Registrar huésped
          </Button>
        </div>
      </form>
    </Modal>
  );
}