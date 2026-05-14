/**
 * Hook para obtener la tasa de ocupacion de un hotel.
 */
import { useQuery } from "@tanstack/react-query";
import { obtenerOcupacion } from "../api/reportes.api";
import { listarHoteles } from "../api/hoteles.api";

export function useOcupacion(hotel_id?: number, fecha?: string) {
  return useQuery({
    queryKey: ["ocupacion", hotel_id, fecha],
    queryFn: () => obtenerOcupacion(hotel_id!, fecha!),
    enabled: !!hotel_id && !!fecha,
    staleTime: 30_000,
  });
}

/**
 * Hook simple para listar hoteles.
 */
export function useHoteles() {
  return useQuery({
    queryKey: ["hoteles"],
    queryFn: listarHoteles,
    staleTime: 5 * 60_000, // 5 minutos
  });
}