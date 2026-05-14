/**
 * API de huespedes.
 */
import apiClient from "./client";
import type { Huesped } from "../types/api.types";

interface ListarHuespedesParams {
  search?: string;
}

export async function listarHuespedes(
  params?: ListarHuespedesParams,
): Promise<Huesped[]> {
  const response = await apiClient.get<Huesped[]>("/huespedes/", { params });
  return response.data;
}

export async function obtenerHuesped(id: number): Promise<Huesped> {
  const response = await apiClient.get<Huesped>(`/huespedes/${id}/`);
  return response.data;
}

interface CrearHuespedData {
  tipo_doc: string;
  num_doc: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  nacionalidad?: string;
}

export async function crearHuesped(data: CrearHuespedData): Promise<Huesped> {
  const response = await apiClient.post<Huesped>("/huespedes/", data);
  return response.data;
}