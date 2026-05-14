/**
 * API de reservas.
 */
import apiClient from "./client";
import type { Reserva, ReservaCreate, EstadoReserva, Estancia } from "../types/api.types";

interface ListarReservasParams {
  hotel_id?: number;
  estado?: EstadoReserva;
  fecha?: string;
}

export async function listarReservas(
  params?: ListarReservasParams,
): Promise<Reserva[]> {
  const response = await apiClient.get<Reserva[]>("/reservas/", { params });
  return response.data;
}

export async function obtenerReserva(id: number): Promise<Reserva> {
  const response = await apiClient.get<Reserva>(`/reservas/${id}/`);
  return response.data;
}

export async function crearReserva(data: ReservaCreate): Promise<Reserva> {
  const response = await apiClient.post<Reserva>("/reservas/", data);
  return response.data;
}

export async function cancelarReserva(
  id: number,
  motivo?: string,
): Promise<Reserva> {
  const response = await apiClient.post<Reserva>(
    `/reservas/${id}/cancelar/`,
    { motivo: motivo || "" },
  );
  return response.data;
}

export async function hacerCheckin(id: number): Promise<Estancia> {
  const response = await apiClient.post<Estancia>(`/reservas/${id}/checkin/`);
  return response.data;
}