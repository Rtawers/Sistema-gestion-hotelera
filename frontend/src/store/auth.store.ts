/**
 * Store global de autenticacion con Zustand.
 *
 * Maneja:
 * - El usuario actual (User)
 * - Si esta autenticado (boolean)
 * - Acciones: setUser, clearUser
 *
 * Se hidrata desde localStorage al cargar la app.
 */
import { create } from "zustand";
import type { User } from "../types/api.types";
import { getStoredUser, logout as apiLogout } from "../api/auth.api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Estado inicial: leer del localStorage
  user: getStoredUser(),
  isAuthenticated: getStoredUser() !== null,

  // Acciones
  setUser: (user: User) =>
    set({
      user,
      isAuthenticated: true,
    }),

  logout: () => {
    apiLogout();
    set({
      user: null,
      isAuthenticated: false,
    });
  },
}));