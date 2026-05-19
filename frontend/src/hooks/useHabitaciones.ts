/**
 * Hooks de React Query para habitaciones.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarHabitaciones,
  cambiarEstadoHabitacion,
} from "../api/habitaciones.api";
import type { EstadoHabitacion } from "../types/api.types";

/**
 * Hook que trae las habitaciones de un hotel.
 * Cache de 30 segundos, refetch al volver a la pestana.
 */
export function useHabitaciones(hotel_id?: number) {
  return useQuery({
    queryKey: ["habitaciones", hotel_id],
    queryFn: () => listarHabitaciones({ hotel_id }),
    enabled: hotel_id !== undefined,
    staleTime: 30_000,
  });
}

/**
 * Hook para cambiar el estado de una habitacion (housekeeping).
 * Despues del cambio, invalida la cache para refrescar la lista.
 */
export function useCambiarEstadoHabitacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      nuevo_estado,
    }: {
      id: number;
      nuevo_estado: EstadoHabitacion;
    }) => cambiarEstadoHabitacion(id, nuevo_estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habitaciones"] });
      queryClient.invalidateQueries({ queryKey: ["ocupacion"] });
    },
  });
}

/**
 * Hook que devuelve habitaciones que requieren atencion de housekeeping:
 * - Estado LIMPIEZA (recien checkout)
 * - Estado MANTENIMIENTO (por revisar)
 */
export function useHabitacionesHousekeeping(hotel_id?: number) {
  const query = useHabitaciones(hotel_id);

  return {
    ...query,
    data: query.data?.filter(
      (h) => h.estado === "LIMPIEZA" || h.estado === "MANTENIMIENTO",
    ),
  };
}