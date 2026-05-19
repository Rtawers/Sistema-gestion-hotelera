/**
 * Configuracion principal de la app.
 * Rutas organizadas por roles + portal publico para clientes.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Pantallas
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PlanoHotelPage } from "./pages/PlanoHotelPage";
import { ReservasPage } from "./pages/ReservasPage";
import { EstanciasPage } from "./pages/EstanciasPage";
import { PerfilPage } from "./pages/PerfilPage";
import { HousekeepingPage } from "./pages/HousekeepingPage";
import { ReportesPage } from "./pages/ReportesPage";
import { TiposHabitacionPage } from "./pages/TiposHabitacionPage";
import { AccesoDenegadoPage } from "./pages/AccesoDenegadoPage";
import { PortalReservaPage } from "./pages/PortalReservaPage";
import { ReservaConfirmadaPage } from "./pages/ReservaConfirmadaPage";
import { IncidentesPage } from "./pages/IncidentesPage";


// Protectores
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { RequireRole } from "./components/layout/RequireRole";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#fff",
            color: "#111827",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />

      <Routes>
        {/* ─── PUBLICAS ─── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />

        {/* PORTAL PUBLICO DE CLIENTE EXTERNO */}
        <Route path="/reservar" element={<PortalReservaPage />} />
        <Route
          path="/reserva-confirmada/:codigo"
          element={<ReservaConfirmadaPage />}
        />

        {/* TODO: portal publico /reservar lo agregamos en BLOQUE 3 */}

        {/* ─── SOLO ADMIN ─── */}
        <Route
          path="/dashboard"
          element={
            <RequireRole roles={["ADMIN"]}>
              <DashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/reportes"
          element={
            <RequireRole roles={["ADMIN"]}>
              <ReportesPage />
            </RequireRole>
          }
        />
        <Route
          path="/tipos-habitacion"
          element={
            <RequireRole roles={["ADMIN"]}>
              <TiposHabitacionPage />
            </RequireRole>
          }
        />

        <Route
          path="/incidentes"
          element={
            <RequireRole roles={["ADMIN", "RECEPCIONISTA"]}>
              <IncidentesPage />
            </RequireRole>
          }
        />

        {/* ─── ADMIN + RECEPCIONISTA ─── */}
        <Route
          path="/recepcion"
          element={
            <RequireRole roles={["ADMIN", "RECEPCIONISTA"]}>
              <PlanoHotelPage />
            </RequireRole>
          }
        />
        <Route
          path="/reservas"
          element={
            <RequireRole roles={["ADMIN", "RECEPCIONISTA"]}>
              <ReservasPage />
            </RequireRole>
          }
        />
        <Route
          path="/estancias"
          element={
            <RequireRole roles={["ADMIN", "RECEPCIONISTA"]}>
              <EstanciasPage />
            </RequireRole>
          }
        />

        {/* ─── ADMIN + HOUSEKEEPING ─── */}
        <Route
          path="/tareas"
          element={
            <RequireRole roles={["ADMIN", "HOUSEKEEPING"]}>
              <HousekeepingPage />
            </RequireRole>
          }
        />

        {/* ─── TODOS LOS LOGUEADOS ─── */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <PerfilPage />
            </ProtectedRoute>
          }
        />

        {/* ─── RAIZ Y FALLBACK ─── */}
        <Route path="/" element={<Navigate to="/reservar" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;