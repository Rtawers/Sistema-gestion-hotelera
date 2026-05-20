/**
 * API de reportes y KPIs.
 */
import apiClient from "./client";
import type { OcupacionResponse } from "../types/api.types";

export async function obtenerOcupacion(
  hotel_id: number,
  fecha: string,
): Promise<OcupacionResponse> {
  const response = await apiClient.get<OcupacionResponse>(
    "/reportes/ocupacion/",
    { params: { hotel_id, fecha } },
  );
  return response.data;
}

export interface RevenuePorTipo {
  rango: { desde: string; hasta: string };
  total: number;
  data: { tipo: string; revenue: number }[];
}

export async function obtenerRevenuePorTipo(
  desde?: string,
  hasta?: string,
): Promise<RevenuePorTipo> {
  const params: Record<string, string> = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;

  const response = await apiClient.get<RevenuePorTipo>(
    "/hoteles/revenue-por-tipo/",
    { params },
  );
  return response.data;
}
