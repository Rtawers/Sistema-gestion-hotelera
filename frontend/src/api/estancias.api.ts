/**
 * API de estancias, cargos, folios y check-out.
 */
import apiClient from "./client";
import type {
  Estancia,
  CargoEstancia,
  Folio,
  TipoCargo,
} from "../types/api.types";

export async function listarEstancias(): Promise<Estancia[]> {
  const response = await apiClient.get<Estancia[]>("/estancias/");
  return response.data;
}

export async function obtenerEstancia(id: number): Promise<Estancia> {
  const response = await apiClient.get<Estancia>(`/estancias/${id}/`);
  return response.data;
}

/**
 * GET /estancias/{id}/folio/
 * Devuelve el folio actualizado con todos los cargos.
 */
export async function obtenerFolio(estanciaId: number): Promise<Folio> {
  const response = await apiClient.get<Folio>(
    `/estancias/${estanciaId}/folio/`,
  );
  return response.data;
}

interface CrearCargoData {
  concepto: string;
  monto: string;
  tipo: TipoCargo;
}

/**
 * POST /estancias/{id}/cargos/
 */
export async function agregarCargo(
  estanciaId: number,
  data: CrearCargoData,
): Promise<CargoEstancia> {
  const response = await apiClient.post<CargoEstancia>(
    `/estancias/${estanciaId}/cargos/`,
    data,
  );
  return response.data;
}

/**
 * POST /estancias/{id}/pagar/
 * Marca todos los cargos pendientes como pagados.
 */
export async function pagarCargosPendientes(
  estanciaId: number,
): Promise<{ detail: string; cargos_pagados: number }> {
  const response = await apiClient.post(`/estancias/${estanciaId}/pagar/`);
  return response.data;
}

/**
 * POST /estancias/{id}/checkout/
 * Cierra el folio y libera la habitacion a LIMPIEZA.
 */
export async function hacerCheckout(estanciaId: number): Promise<Folio> {
  const response = await apiClient.post<Folio>(
    `/estancias/${estanciaId}/checkout/`,
  );
  return response.data;
}