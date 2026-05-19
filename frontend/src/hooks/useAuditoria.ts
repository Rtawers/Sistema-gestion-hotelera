/**
 * Hook para listar logs de auditoria.
 */
import { useQuery } from "@tanstack/react-query";
import { listarLogs, type AccionLog } from "../api/auditoria.api";

export function useAuditoria(accion?: AccionLog) {
  return useQuery({
    queryKey: ["auditoria", accion],
    queryFn: () => listarLogs(accion),
    staleTime: 10_000,
  });
}