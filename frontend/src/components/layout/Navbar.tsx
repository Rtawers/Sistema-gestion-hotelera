/**
 * Navbar superior con info del usuario, links de navegacion y logout.
 */
import { useNavigate } from "react-router-dom";
import { Hotel, LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { Button } from "../ui/Button";
import { NavLinks } from "./NavLinks";

const rolColors: { [key: string]: string } = {
  ADMIN: "bg-purple-100 text-purple-800",
  RECEPCIONISTA: "bg-blue-100 text-blue-800",
  HOUSEKEEPING: "bg-amber-100 text-amber-800",
};

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Links */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 bg-primary-600 rounded-lg">
                <Hotel className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">Hotel USS</span>
            </div>

            <NavLinks />
          </div>

          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 bg-gray-100 rounded-full">
                <UserIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user.username}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    rolColors[user.rol] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.rol_display}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
            >
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}