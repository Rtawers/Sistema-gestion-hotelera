/**
 * Modal con el formulario que el cliente externo llena para reservar.
 * Usa el endpoint publico (sin auth).
 */
import { useState, type FormEvent } from "react";
import {
  IdCard,
  Mail,
  Phone,
  User as UserIcon,
  Calendar,
  BedDouble,
  Send,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  crearReservaPublica,
  type HabitacionPublica,
} from "../../api/publico.api";
import { formatearMoneda, formatearFecha } from "../../utils/format";

interface FormularioReservaPublicaProps {
  habitacion: HabitacionPublica;
  checkIn: string;
  checkOut: string;
  adultos: number;
  ninos: number;
  onClose: () => void;
  onSuccess: (codigo: string) => void;
}

const tiposDoc = [
  { value: "DNI", label: "DNI" },
  { value: "CE", label: "Carnet de Extranjería" },
  { value: "PAS", label: "Pasaporte" },
];

export function FormularioReservaPublica({
  habitacion,
  checkIn,
  checkOut,
  adultos,
  ninos,
  onClose,
  onSuccess,
}: FormularioReservaPublicaProps) {
  const [tipoDoc, setTipoDoc] = useState<"DNI" | "CE" | "PAS">("DNI");
  const [numDoc, setNumDoc] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  // Calcular noches
  const fechaIn = new Date(checkIn);
  const fechaOut = new Date(checkOut);
  const noches = Math.ceil(
    (fechaOut.getTime() - fechaIn.getTime()) / (1000 * 60 * 60 * 24),
  );

  const precioBase = parseFloat(habitacion.tipo.precio_base);
  const subtotal = precioBase * noches;
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!numDoc.trim() || !nombres.trim() || !apellidos.trim() || !email.trim() || !telefono.trim()) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const response = await crearReservaPublica({
        habitacion_id: habitacion.id,
        check_in: checkIn,
        check_out: checkOut,
        tipo_doc: tipoDoc,
        num_doc: numDoc.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        adultos,
        ninos,
      });

      toast.success("¡Reserva creada exitosamente!");
      onSuccess(response.codigo);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (typeof data === "object" && data !== null) {
          const firstErr = Object.values(data)[0];
          toast.error(Array.isArray(firstErr) ? firstErr[0] : String(firstErr));
        } else {
          toast.error("Error al crear la reserva");
        }
      } else {
        toast.error("Error de conexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Confirma tu reserva
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Resumen de reserva */}
        <div className="bg-primary-50 p-5 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <BedDouble className="w-4 h-4 text-primary-700 mt-0.5" />
              <div>
                <p className="text-xs text-primary-700 font-medium">Habitación</p>
                <p className="font-bold text-gray-900">
                  {habitacion.numero} - {habitacion.tipo.nombre}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-primary-700 mt-0.5" />
              <div>
                <p className="text-xs text-primary-700 font-medium">Estadía</p>
                <p className="font-bold text-gray-900">
                  {formatearFecha(checkIn)} → {formatearFecha(checkOut)}
                </p>
                <p className="text-xs text-gray-600">
                  {noches} {noches === 1 ? "noche" : "noches"} - {adultos} adulto(s){ninos > 0 && `, ${ninos} niño(s)`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-primary-200 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({noches} noches × {formatearMoneda(precioBase)})</span>
              <span>{formatearMoneda(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>IGV (18%)</span>
              <span>{formatearMoneda(igv)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-primary-700 pt-1">
              <span>TOTAL</span>
              <span>{formatearMoneda(total)}</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <h3 className="font-bold text-gray-900">Tus datos</h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo doc.
              </label>
              <select
                value={tipoDoc}
                onChange={(e) => setTipoDoc(e.target.value as "DNI" | "CE" | "PAS")}
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
                label="Número de documento"
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
              icon={<UserIcon className="w-4 h-4" />}
              placeholder="Juan Carlos"
              required
            />
            <Input
              label="Apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              icon={<UserIcon className="w-4 h-4" />}
              placeholder="Pérez López"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            placeholder="tu@correo.com"
            required
          />

          <Input
            label="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            icon={<Phone className="w-4 h-4" />}
            placeholder="987654321"
            required
          />

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <strong>Importante:</strong> Tu reserva quedará en estado <strong>PENDIENTE</strong>.
            Nuestro equipo te contactará para confirmarla. El pago se realizará al check-in.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Send className="w-4 h-4" />}
              loading={loading}
            >
              Enviar reserva
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}