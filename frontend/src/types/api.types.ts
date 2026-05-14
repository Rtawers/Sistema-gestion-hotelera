/**
 * Tipos TypeScript del dominio hotelero.
 * Reflejan los serializers DRF del backend.
 */

// ═══════════════════════════════════════════════════════
// USUARIO Y AUTH
// ═══════════════════════════════════════════════════════
export type Rol = "ADMIN" | "RECEPCIONISTA" | "HOUSEKEEPING";

export interface User {
  id: number;
  username: string;
  email: string;
  rol: Rol;
  rol_display: string;
  es_admin: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// ═══════════════════════════════════════════════════════
// HOTEL Y HABITACION
// ═══════════════════════════════════════════════════════
export interface Hotel {
  id: number;
  nombre: string;
  ruc: string;
  direccion: string;
  estrellas: number;
  telefono: string;
  email: string;
  activo: boolean;
}

export type EstadoHabitacion =
  | "DISPONIBLE"
  | "OCUPADA"
  | "LIMPIEZA"
  | "MANTENIMIENTO";

export interface TipoHabitacionMin {
  id: number;
  nombre: string;
  capacidad: number;
  precio_base: string;
}

export interface Habitacion {
  id: number;
  hotel: number;
  hotel_nombre?: string;
  tipo: TipoHabitacionMin;
  numero: string;
  piso: number;
  estado: EstadoHabitacion;
  estado_display: string;
  activa: boolean;
}

// ═══════════════════════════════════════════════════════
// HUESPED
// ═══════════════════════════════════════════════════════
export type TipoDoc = "DNI" | "CE" | "PAS";

export interface Huesped {
  id: number;
  tipo_doc: TipoDoc;
  tipo_doc_display: string;
  num_doc: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  nacionalidad: string;
}

// ═══════════════════════════════════════════════════════
// RESERVA
// ═══════════════════════════════════════════════════════
export type EstadoReserva =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "CHECKIN"
  | "CHECKOUT"
  | "CANCELADA"
  | "NO_SHOW";

export interface HuespedMin {
  id: number;
  nombre_completo: string;
  tipo_doc: string;
  num_doc: string;
  email: string;
}

export interface HabitacionMin {
  id: number;
  numero: string;
  piso: number;
  tipo_nombre: string;
  estado: EstadoHabitacion;
  estado_display: string;
}

export interface Reserva {
  id: number;
  hotel: number;
  hotel_nombre: string;
  huesped: HuespedMin;
  habitacion: HabitacionMin;
  fecha_entrada: string;
  fecha_salida: string;
  num_noches: number;
  num_adultos: number;
  num_ninos: number;
  total_huespedes: number;
  estado: EstadoReserva;
  estado_display: string;
  origen: string;
  origen_display: string;
  precio_total: string;
  observaciones: string;
  created_at: string;
}

export interface ReservaCreate {
  hotel: number;
  huesped: number;
  habitacion: number;
  fecha_entrada: string;
  fecha_salida: string;
  num_adultos: number;
  num_ninos?: number;
  origen?: string;
  observaciones?: string;
}

// ═══════════════════════════════════════════════════════
// ESTANCIA, CARGOS Y FOLIO
// ═══════════════════════════════════════════════════════
export type EstadoEstancia = "EN_CURSO" | "FINALIZADA";
export type EstadoFolio = "ABIERTO" | "CERRADO";
export type TipoCargo =
  | "HABITACION"
  | "RESTAURANTE"
  | "LAVANDERIA"
  | "MINIBAR"
  | "SPA"
  | "OTRO";

export interface CargoEstancia {
  id: number;
  estancia: number;
  concepto: string;
  monto: string;
  tipo: TipoCargo;
  tipo_display: string;
  fecha: string;
  pagado: boolean;
}

export interface Folio {
  id: number;
  estancia: number;
  subtotal: string;
  igv: string;
  total: string;
  estado: EstadoFolio;
  estado_display: string;
  tiene_deuda: boolean;
  fecha_cierre: string | null;
  cargos: CargoEstancia[];
}

export interface Estancia {
  id: number;
  reserva: number;
  huesped: HuespedMin;
  habitacion: HabitacionMin;
  fecha_checkin: string;
  fecha_checkout: string | null;
  estado: EstadoEstancia;
  estado_display: string;
  observaciones: string;
  folio: Folio;
}

// ═══════════════════════════════════════════════════════
// REPORTES
// ═══════════════════════════════════════════════════════
export interface OcupacionResponse {
  total: number;
  ocupadas: number;
  tasa_pct: number;
}