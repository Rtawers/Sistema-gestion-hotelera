/**
 * Hooks de React Query para reservas.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarReservas,
  crearReserva,
  cancelarReserva,
  hacerCheckin,
} from "../api/reservas.api";
import type { ReservaCreate, EstadoReserva } from "../types/api.types";

interface UseReservasParams {
  hotel_id?: number;
  estado?: EstadoReserva;
}

export function useReservas(params?: UseReservasParams) {
  return useQuery({
    queryKey: ["reservas", params],
    queryFn: () => listarReservas(params),
    staleTime: 30_000,
  });
}

export function useCrearReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReservaCreate) => crearReserva(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      queryClient.invalidateQueries({ queryKey: ["habitaciones"] });
    },
  });
}

export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo?: string }) =>
      cancelarReserva(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      queryClient.invalidateQueries({ queryKey: ["habitaciones"] });
    },
  });
}

export function useHacerCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hacerCheckin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      queryClient.invalidateQueries({ queryKey: ["habitaciones"] });
      queryClient.invalidateQueries({ queryKey: ["estancias"] });
    },
  });
}