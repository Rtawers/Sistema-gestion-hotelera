/**
 * API de habitaciones.
 */
import apiClient from "./client";
import type { Habitacion, EstadoHabitacion } from "../types/api.types";

interface ListarHabitacionesParams {
  hotel_id?: number;
  estado?: EstadoHabitacion;
}

export async function listarHabitaciones(
  params?: ListarHabitacionesParams,
): Promise<Habitacion[]> {
  const response = await apiClient.get<Habitacion[]>("/habitaciones/", {
    params,
  });
  return response.data;
}

export async function obtenerHabitacion(id: number): Promise<Habitacion> {
  const response = await apiClient.get<Habitacion>(`/habitaciones/${id}/`);
  return response.data;
}

/**
 * PATCH /habitaciones/{id}/housekeeping/
 * Permite a housekeeping/admin cambiar el estado de la habitacion.
 */
export async function cambiarEstadoHabitacion(
  id: number,
  nuevo_estado: EstadoHabitacion,
): Promise<Habitacion> {
  const response = await apiClient.patch<Habitacion>(
    `/habitaciones/${id}/cambiar-estado/`,
    { nuevo_estado },
  );
  return response.data;
}

interface DisponibilidadParams {
  fecha_entrada: string;
  fecha_salida: string;
  hotel_id?: number;
  tipo_id?: number;
}

export async function habitacionesDisponibles(
  params: DisponibilidadParams,
): Promise<Habitacion[]> {
  const response = await apiClient.get<Habitacion[]>(
    "/habitaciones/disponibles/",
    { params },
  );
  return response.data;
}