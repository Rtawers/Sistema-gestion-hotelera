/**
 * Modal para que ADMIN cree empleados nuevos.
 */
import { useState, type FormEvent } from "react";
import { UserPlus, X, Lock, Mail, Phone, IdCard, Shield } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useCrearUsuario } from "../../hooks/useUsuarios";
import type { Rol } from "../../types/api.types";

interface CrearUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roles: { value: Rol; label: string; description: string }[] = [
  { value: "ADMIN", label: "Administrador", description: "Acceso total al sistema" },
  { value: "RECEPCIONISTA", label: "Recepcionista", description: "Reservas, estancias y folios" },
  { value: "HOUSEKEEPING", label: "Housekeeping", description: "Tareas de limpieza" },
];

export function CrearUsuarioModal({ isOpen, onClose }: CrearUsuarioModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState<Rol>("RECEPCIONISTA");

  const crear = useCrearUsuario();

  const reset = () => {
    setUsername("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setTelefono("");
    setRol("RECEPCIONISTA");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("La password debe tener al menos 8 caracteres");
      return;
    }

    if (!username.trim() || !firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }

    crear.mutate(
      {
        username: username.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        rol,
        telefono: telefono.trim() || undefined,
      },
      {
        onSuccess: (u) => {
          toast.success(`Usuario ${u.username} creado exitosamente`);
          handleClose();
        },
        onError: (e: unknown) => {
          if (axios.isAxiosError(e)) {
            const data = e.response?.data;
            if (typeof data === "object" && data !== null) {
              const firstErr = Object.values(data)[0];
              toast.error(Array.isArray(firstErr) ? String(firstErr[0]) : String(firstErr));
            } else {
              toast.error("Error al crear usuario");
            }
          }
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Nuevo empleado</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombres"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Juan Carlos"
              required
            />
            <Input
              label="Apellidos"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Pérez López"
              required
            />
          </div>

          <Input
            label="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<IdCard className="w-4 h-4" />}
            placeholder="jperez"
            required
            autoComplete="off"
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            placeholder="Mínimo 8 caracteres"
            required
            autoComplete="new-password"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            placeholder="empleado@hotel.com"
            required
          />

          <Input
            label="Teléfono (opcional)"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            icon={<Phone className="w-4 h-4" />}
            placeholder="987654321"
          />

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary-600" />
              Rol
            </label>
            <div className="space-y-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRol(r.value)}
                  className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all ${
                    rol === r.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`font-semibold ${rol === r.value ? "text-primary-700" : "text-gray-900"}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              loading={crear.isPending}
            >
              Crear empleado
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}