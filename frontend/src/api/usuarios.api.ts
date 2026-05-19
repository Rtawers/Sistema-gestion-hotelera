/**
 * API de gestion de usuarios (HU16).
 */
import apiClient from "./client";
import type { Rol } from "../types/api.types";

export interface UsuarioEmpleado {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  rol: Rol;
  rol_display: string;
  telefono: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface CrearUsuarioData {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  rol: Rol;
  telefono?: string;
}

export async function listarUsuarios(): Promise<UsuarioEmpleado[]> {
  const response = await apiClient.get<UsuarioEmpleado[]>("/auth/usuarios/");
  return response.data;
}

export async function crearUsuario(data: CrearUsuarioData): Promise<UsuarioEmpleado> {
  const response = await apiClient.post<UsuarioEmpleado>("/auth/usuarios/", data);
  return response.data;
}

export async function cambiarPasswordEmpleado(
  id: number,
  nuevaPassword: string,
): Promise<{ detail: string }> {
  const response = await apiClient.post(`/auth/usuarios/${id}/cambiar-password/`, {
    nueva_password: nuevaPassword,
  });
  return response.data;
}

export async function activarUsuario(id: number): Promise<{ detail: string; is_active: boolean }> {
  const response = await apiClient.post(`/auth/usuarios/${id}/activar/`);
  return response.data;
}