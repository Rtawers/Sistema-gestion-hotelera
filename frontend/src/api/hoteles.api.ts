/**
 * API de hoteles.
 */
import apiClient from "./client";
import type { Hotel } from "../types/api.types";

export async function listarHoteles(): Promise<Hotel[]> {
  const response = await apiClient.get<Hotel[]>("/hoteles/");
  return response.data;
}

export async function obtenerHotel(id: number): Promise<Hotel> {
  const response = await apiClient.get<Hotel>(`/hoteles/${id}/`);
  return response.data;
}