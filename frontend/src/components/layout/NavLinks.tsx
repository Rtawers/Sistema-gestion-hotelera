/**
 * Enlaces de navegacion filtrados segun el rol del usuario.
 * Cada rol ve SOLO sus rutas permitidas.
 */
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BedDouble,
  Sparkles,
  BarChart3,
  Layers,
  Users,
  ScrollText,
  AlertTriangle,   
} from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "../../store/auth.store";
import type { Rol } from "../../types/api.types";

interface LinkConfig {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Rol[];
  end?: boolean;
}

// Cada link declara qué roles pueden verlo
const allLinks: LinkConfig[] = [
  // Dashboard solo ADMIN
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  // Plano: ADMIN + RECEPCIONISTA
  {
    to: "/recepcion",
    label: "Plano",
    icon: Building2,
    roles: ["ADMIN", "RECEPCIONISTA"],
  },
  // Reservas: ADMIN + RECEPCIONISTA
  {
    to: "/reservas",
    label: "Reservas",
    icon: Calendar,
    roles: ["ADMIN", "RECEPCIONISTA"],
  },
  // Estancias: ADMIN + RECEPCIONISTA
  {
    to: "/estancias",
    label: "Estancias",
    icon: BedDouble,
    roles: ["ADMIN", "RECEPCIONISTA"],
  },
  // Housekeeping: ADMIN + HOUSEKEEPING
  {
    to: "/tareas",
    label: "Housekeeping",
    icon: Sparkles,
    roles: ["ADMIN", "HOUSEKEEPING"],
  },

  // Incidentes: ADMIN + RECEPCIONISTA (HU11)
  {
    to: "/incidentes",
    label: "Incidentes",
    icon: AlertTriangle,
    roles: ["ADMIN", "RECEPCIONISTA"],
  },

  // Reportes: solo ADMIN
  {
    to: "/reportes",
    label: "Reportes",
    icon: BarChart3,
    roles: ["ADMIN"],
  },
  // Tipos Hab: solo ADMIN
  {
    to: "/tipos-habitacion",
    label: "Tipos Hab.",
    icon: Layers,
    roles: ["ADMIN"],
  },
  // Usuarios: solo ADMIN
  {
    to: "/usuarios",
    label: "Usuarios",
    icon: Users,
    roles: ["ADMIN"],
  },
  // Auditoria: solo ADMIN
  {
    to: "/auditoria",
    label: "Auditoría",
    icon: ScrollText,
    roles: ["ADMIN"],
  },
];

export function NavLinks() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const visibleLinks = allLinks.filter((link) => link.roles.includes(user.rol));

  return (
    <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              clsx(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
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