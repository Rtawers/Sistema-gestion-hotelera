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