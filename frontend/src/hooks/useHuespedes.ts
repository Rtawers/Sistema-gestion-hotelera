/**
 * Hooks de React Query para huespedes.
 */
import { useQuery } from "@tanstack/react-query";
import { listarHuespedes } from "../api/huespedes.api";

export function useHuespedes(search?: string) {
  return useQuery({
    queryKey: ["huespedes", search],
    queryFn: () => listarHuespedes({ search }),
    staleTime: 60_000,
  });
}