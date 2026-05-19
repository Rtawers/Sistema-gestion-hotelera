/**
 * API client de auditoria (HU15).
 */
import apiClient from "./client";

export type AccionLog =
  | "LOGIN"
  | "LOGOUT"
  | "RESERVA_CREADA"
  | "RESERVA_CANCELADA"
  | "CHECKIN"
  | "CHECKOUT"
  | "CARGO_AGREGADO"
  | "PAGO_REGISTRADO"
  | "DESCUENTO_APLICADO"
  | "USUARIO_CREADO"
  | "INCIDENTE_REPORTADO";

export interface LogAuditoria {
  id: number;
  usuario: number | null;
  usuario_username: string;
  accion: AccionLog;
  accion_display: string;
  detalles: Record<string, unknown>;
  ip: string | null;
  created_at: string;
}

export async function listarLogs(accion?: AccionLog): Promise<LogAuditoria[]> {
  const params = accion ? { accion } : {};
  const response = await apiClient.get<LogAuditoria[]>("/auditoria/", { params });
  return response.data;
}