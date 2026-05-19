/**
 * Enlaces de navegacion principales, filtrados segun el rol del usuario.
 */
import { NavLink } from "react-router-dom";
import {
  Building2,
  Calendar,
  BedDouble,
  Sparkles,
  BarChart3,
  Layers,
} from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "../../store/auth.store";
import type { Rol } from "../../types/api.types";

interface LinkConfig {
  to: string;
  label: string;
  icon: typeof Building2;
  roles: Rol[];
}

// Cada link declara qué roles pueden verlo
const allLinks: LinkConfig[] = [
  { to: "/", label: "Plano", icon: Building2, roles: ["ADMIN", "RECEPCIONISTA"] },
  { to: "/reservas", label: "Reservas", icon: Calendar, roles: ["ADMIN", "RECEPCIONISTA"] },
  { to: "/estancias", label: "Estancias", icon: BedDouble, roles: ["ADMIN", "RECEPCIONISTA"] },
  { to: "/housekeeping", label: "Housekeeping", icon: Sparkles, roles: ["ADMIN", "HOUSEKEEPING"] },
  { to: "/reportes", label: "Reportes", icon: BarChart3, roles: ["ADMIN"] },
  { to: "/tipos-habitacion", label: "Tipos Hab.", icon: Layers, roles: ["ADMIN"] },
];

export function NavLinks() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const visibleLinks = allLinks.filter((link) => link.roles.includes(user.rol));

  return (
    <div className="hidden md:flex items-center gap-1">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              clsx(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-100 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100",
              )
            }
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </NavLink>
        );
      })}
    </div>
  );
}