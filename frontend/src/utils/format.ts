/**
 * Funciones helper para formatear fechas, moneda y otros valores.
 */
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a "dd/MM/yyyy".
 * Ejemplo: "2027-08-15" -> "15/08/2027"
 */
export function formatearFecha(fechaISO: string): string {
  try {
    return format(parseISO(fechaISO), "dd/MM/yyyy");
  } catch {
    return fechaISO;
  }
}

/**
 * Formatea una fecha ISO con formato corto.
 * Ejemplo: "2027-08-15" -> "15 ago"
 */
export function formatearFechaCorta(fechaISO: string): string {
  try {
    return format(parseISO(fechaISO), "dd MMM", { locale: es });
  } catch {
    return fechaISO;
  }
}

/**
 * Formatea un monto decimal (string desde API) a moneda peruana.
 * Ejemplo: "540.00" -> "S/ 540.00"
 */
export function formatearMoneda(monto: string | number): string {
  const num = typeof monto === "string" ? parseFloat(monto) : monto;
  if (isNaN(num)) return "S/ 0.00";
  return `S/ ${num.toFixed(2)}`;
}

/**
 * Calcula la cantidad de noches entre 2 fechas YYYY-MM-DD.
 */
export function calcularNoches(
  fechaEntrada: string,
  fechaSalida: string,
): number {
  if (!fechaEntrada || !fechaSalida) return 0;
  const inicio = new Date(fechaEntrada);
  const fin = new Date(fechaSalida);
  const ms = fin.getTime() - inicio.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD (para inputs date).
 */
export function fechaHoyISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Suma N dias a una fecha YYYY-MM-DD.
 */
export function sumarDias(fechaISO: string, dias: number): string {
  const date = new Date(fechaISO);
  date.setDate(date.getDate() + dias);
  return date.toISOString().split("T")[0];
}