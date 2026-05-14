/**
 * Hooks de React Query para estancias, folios y check-out.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarEstancias,
  obtenerEstancia,
  obtenerFolio,
  agregarCargo,
  pagarCargosPendientes,
  hacerCheckout,
} from "../api/estancias.api";
import type { TipoCargo } from "../types/api.types";

export function useEstancias() {
  return useQuery({
    queryKey: ["estancias"],
    queryFn: listarEstancias,
    staleTime: 30_000,
  });
}

export function useEstancia(id?: number) {
  return useQuery({
    queryKey: ["estancia", id],
    queryFn: () => obtenerEstancia(id!),
    enabled: id !== undefined,
  });
}

export function useFolio(estanciaId?: number) {
  return useQuery({
    queryKey: ["folio", estanciaId],
    queryFn: () => obtenerFolio(estanciaId!),
    enabled: estanciaId !== undefined,
    staleTime: 10_000,
  });
}

export function useAgregarCargo(estanciaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { concepto: string; monto: string; tipo: TipoCargo }) =>
      agregarCargo(estanciaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folio", estanciaId] });
      queryClient.invalidateQueries({ queryKey: ["estancias"] });
    },
  });
}

export function usePagarCargosPendientes(estanciaId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pagarCargosPendientes(estanciaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folio", estanciaId] });
      queryClient.invalidateQueries({ queryKey: ["estancias"] });
    },
  });
}

export function useHacerCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (estanciaId: number) => hacerCheckout(estanciaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estancias"] });
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      queryClient.invalidateQueries({ queryKey: ["habitaciones"] });
      queryClient.invalidateQueries({ queryKey: ["ocupacion"] });
    },
  });
}