/**
 * Pantalla de Login.
 *
 * Flujo:
 * 1. Usuario ingresa username + password.
 * 2. Llama a la API de login.
 * 3. Si OK: guarda tokens, actualiza el store, navega al dashboard.
 * 4. Si error: muestra mensaje.
 */
import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { Hotel, Lock, User as UserIcon, LogIn } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { login } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import axios from "axios";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useAuthStore((s) => s.setUser);

  // Redirect al destino original o al dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error("Ingrese usuario y contrasena");
      return;
    }

    setLoading(true);
    try {
      const response = await login(username, password);
      setUser(response.user);
      toast.success(`Bienvenido ${response.user.username}!`);
      navigate(from, { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error("Usuario o contrasena incorrectos");
        } else {
          toast.error("Error al iniciar sesion. Intente de nuevo.");
        }
      } else {
        toast.error("Error de conexion con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <Hotel className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel USS</h1>
          <p className="text-gray-600 mt-1">Sistema de Gestion Hotelera</p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Iniciar Sesion</h2>
          <p className="text-sm text-gray-600 mb-6">
            Ingrese sus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              placeholder="Su nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<UserIcon className="w-4 h-4" />}
              autoComplete="username"
              required
              autoFocus
            />

            <Input
              label="Contrasena"
              type="password"
              placeholder="Su contrasena"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={!loading ? <LogIn className="w-5 h-5" /> : undefined}
            >
              {loading ? "Iniciando sesion..." : "Iniciar Sesion"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Proyecto academico USS - Ciclo IX
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}