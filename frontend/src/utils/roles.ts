/**
 * Helpers para gestion de roles del sistema.
 * Define a donde redirigir cada rol despues del login.
 */
import type { Rol } from "../types/api.types";

/**
 * URL a la que redirigir despues del login segun el rol.
 */
export function getRutaInicial(rol: Rol): string {
  switch (rol) {
    case "ADMIN":
      return "/dashboard";
    case "RECEPCIONISTA":
      return "/recepcion";
    case "HOUSEKEEPING":
      return "/tareas";
    default:
      return "/dashboard";
  }
}

/**
 * Etiqueta legible del rol.
 */
export function getNombreRol(rol: Rol): string {
  const nombres: { [key in Rol]: string } = {
    ADMIN: "Administrador",
    RECEPCIONISTA: "Recepcionista",
    HOUSEKEEPING: "Housekeeping",
  };
  return nombres[rol] || rol;
}

/**
 * Color del badge por rol (para UI).
 */
export function getColorRol(rol: Rol): "purple" | "blue" | "amber" {
  const colores: { [key in Rol]: "purple" | "blue" | "amber" } = {
    ADMIN: "purple",
    RECEPCIONISTA: "blue",
    HOUSEKEEPING: "amber",
  };
  return colores[rol] || "blue";
}