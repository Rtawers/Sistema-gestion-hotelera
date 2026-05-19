/**
 * API de tipos de habitacion.
 */
import apiClient from "./client";
import type { TipoHabitacionMin } from "../types/api.types";

export async function listarTiposHabitacion(): Promise<TipoHabitacionMin[]> {
  const response = await apiClient.get<TipoHabitacionMin[]>("/tipos-habitacion/");
  return response.data;
}