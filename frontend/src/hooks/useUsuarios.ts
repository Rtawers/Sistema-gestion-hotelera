/**
 * Hooks de gestion de usuarios.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listarUsuarios,
  crearUsuario,
  cambiarPasswordEmpleado,
  activarUsuario,
  type CrearUsuarioData,
} from "../api/usuarios.api";

export function useUsuarios() {
  return useQuery({
    queryKey: ["usuarios"],
    queryFn: listarUsuarios,
    staleTime: 30_000,
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CrearUsuarioData) => crearUsuario(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}

export function useCambiarPasswordEmpleado() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      cambiarPasswordEmpleado(id, password),
  });
}

export function useActivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activarUsuario(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });
}