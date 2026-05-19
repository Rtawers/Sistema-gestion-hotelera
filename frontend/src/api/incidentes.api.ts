/**
 * API client para incidentes (HU11).
 */
import apiClient from "./client";

export type TipoIncidente = "DESPERFECTO" | "CONSUMO_MINIBAR" | "ITEM_FALTANTE" | "OTRO";
export type EstadoIncidente = "REPORTADO" | "EN_PROCESO" | "RESUELTO";

export interface Incidente {
  id: number;
  habitacion: number;
  habitacion_numero: string;
  tipo: TipoIncidente;
  tipo_display: string;
  descripcion: string;
  estado: EstadoIncidente;
  estado_display: string;
  reportado_por: number | null;
  reportado_por_username: string;
  created_at: string;
}

export interface CrearIncidenteData {
  habitacion: number;
  tipo: TipoIncidente;
  descripcion: string;
}

export interface ActualizarIncidenteData {
  estado: EstadoIncidente;
}

export async function listarIncidentes(): Promise<Incidente[]> {
  const response = await apiClient.get<Incidente[]>("/incidentes/");
  return response.data;
}

export async function crearIncidente(data: CrearIncidenteData): Promise<Incidente> {
  const response = await apiClient.post<Incidente>("/incidentes/", data);
  return response.data;
}

export async function actualizarIncidente(
  id: number,
  data: ActualizarIncidenteData,
): Promise<Incidente> {
  const response = await apiClient.patch<Incidente>(`/incidentes/${id}/`, data);
  return response.data;
}