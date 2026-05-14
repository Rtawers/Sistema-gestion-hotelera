/**
 * Enlaces de navegacion principales.
 */
import { NavLink } from "react-router-dom";
import { Building2, Calendar, BedDouble } from "lucide-react";
import clsx from "clsx";

const links = [
  { to: "/", label: "Plano", icon: Building2 },
  { to: "/reservas", label: "Reservas", icon: Calendar },
  { to: "/estancias", label: "Estancias", icon: BedDouble },
];

export function NavLinks() {
  return (
    <div className="hidden md:flex items-center gap-1">
      {links.map((link) => {
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