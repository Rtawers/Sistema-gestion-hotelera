/**
 * Hooks para gestionar el perfil del usuario logueado.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  obtenerPerfil,
  actualizarPerfil,
  type ActualizarPerfilData,
} from "../api/auth.api";

export function usePerfil() {
  return useQuery({
    queryKey: ["perfil"],
    queryFn: obtenerPerfil,
    staleTime: 60_000,
  });
}

export function useActualizarPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ActualizarPerfilData) => actualizarPerfil(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
  });
}