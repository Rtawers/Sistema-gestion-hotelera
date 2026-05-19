/**
 * API client para endpoints PUBLICOS (sin autenticacion).
 * Usado por el portal de reservas de cliente externo.
 */
import axios from "axios";

const BASE_URL = "http://localhost:8000/api/v1/publico";

// Cliente axios SIN interceptors de JWT (es publico)
const publicoClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── TIPOS ──────────────────────────────────────────
export interface HabitacionPublica {
  id: number;
  numero: string;
  piso: number;
  tipo: {
    id: number;
    nombre: string;
    capacidad: number;
    precio_base: string;
  };
  hotel_nombre: string;
}

export interface DisponibilidadResponse {
  disponibles: HabitacionPublica[];
  total: number;
}

export interface BuscarDisponibilidadParams {
  check_in: string;  // formato YYYY-MM-DD
  check_out: string;
}

export interface ReservaPublicaData {
  habitacion_id: number;
  check_in: string;
  check_out: string;
  tipo_doc: "DNI" | "CE" | "PAS";
  num_doc: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  adultos: number;
  ninos: number;
}

export interface ReservaCreadaResponse {
  detail: string;
  codigo: string;     // "R-000123"
  estado: "PENDIENTE";
  mensaje: string;
  reserva_id: number;
}

// ─── FUNCIONES ──────────────────────────────────────
export async function buscarDisponibilidad(
  params: BuscarDisponibilidadParams,
): Promise<DisponibilidadResponse> {
  const response = await publicoClient.get<DisponibilidadResponse>(
    "/habitaciones-disponibles/",
    { params },
  );
  return response.data;
}

export async function crearReservaPublica(
  data: ReservaPublicaData,
): Promise<ReservaCreadaResponse> {
  const response = await publicoClient.post<ReservaCreadaResponse>(
    "/reservar/",
    data,
  );
  return response.data;
}