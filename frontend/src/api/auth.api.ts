/**
 * API de autenticacion.
 * Wrappers de los endpoints /api/v1/auth/*.
 */
import apiClient, { tokenStorage } from "./client";
import type { LoginResponse, User } from "../types/api.types";

/**
 * POST /api/v1/auth/login/
 * Hace login, guarda tokens en localStorage y devuelve la respuesta.
 */
export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login/", {
    username,
    password,
  });

  // Guardar tokens en localStorage
  tokenStorage.setTokens(response.data.access, response.data.refresh);
  localStorage.setItem("user", JSON.stringify(response.data.user));

  return response.data;
}

/**
 * Cierra sesion limpiando los tokens.
 */
export function logout(): void {
  tokenStorage.clear();
}

/**
 * GET /api/v1/auth/me/
 * Obtiene los datos del usuario autenticado.
 */
export async function getMe(): Promise<User> {
  const response = await apiClient.get<User>("/auth/me/");
  return response.data;
}

/**
 * Lee el usuario guardado en localStorage (sin pegarle al backend).
 */
export function getStoredUser(): User | null {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}