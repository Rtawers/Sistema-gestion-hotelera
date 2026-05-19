/**
 * Hooks de React Query para incidentes.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarIncidentes,
  crearIncidente,
  actualizarIncidente,
  type CrearIncidenteData,
  type ActualizarIncidenteData,
} from "../api/incidentes.api";

export function useIncidentes() {
  return useQuery({
    queryKey: ["incidentes"],
    queryFn: listarIncidentes,
    staleTime: 30_000,
  });
}

export function useCrearIncidente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CrearIncidenteData) => crearIncidente(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
    },
  });
}

export function useActualizarIncidente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarIncidenteData }) =>
      actualizarIncidente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
    },
  });
}