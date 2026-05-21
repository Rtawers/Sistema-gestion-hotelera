#  Sistema de Gestión Hotelera — Hotel USS

> **Proyecto académico** — Universidad Señor de Sipán (USS)
> **Curso:** Taller de Lenguajes de Programación
> **Ciclo:** IX — 2026-II

Sistema web full-stack que digitaliza el ciclo completo de operación hotelera: desde la reserva online del cliente hasta el check-out con facturación detallada, gestión de housekeeping, incidentes y auditoría.

##  Stack tecnológico

### Backend
- **Python 3.13** + **Django 5.1** + **Django REST Framework**
- **PostgreSQL 16** (containerizado con Docker)
- **JWT** (Simple JWT) para autenticación
- **drf-spectacular** para documentación OpenAPI/Swagger
- **pytest + pytest-django + factory-boy** para testing

### Frontend
- **React 19** + **TypeScript 5** + **Vite 7**
- **TailwindCSS 3** para estilos
- **React Query (TanStack)** para data fetching
- **Zustand** para estado global
- **React Router 7** para enrutamiento
- **Recharts** para gráficos de reportes
- **jsPDF + jspdf-autotable** para generación de PDF
- **Lucide React** para iconografía
- **React Hot Toast** para notificaciones

### Infraestructura
- **Docker Compose** para PostgreSQL
- **Git + GitHub** para control de versiones

---

##  Roles del sistema

| Rol | Acceso | Funciones principales |
|---|---|---|
|  **Cliente externo** | Portal público (sin login) | Buscar disponibilidad y reservar |
|  **Recepcionista** | `/reservas`, `/estancias`, `/incidentes` | Gestionar reservas, check-in/out, folios, pagos |
|  **Housekeeping** | `/tareas`, `/incidentes` | Marcar habitaciones limpias, reportar incidentes |
|  **Administrador** | Todo el sistema | Reportes, auditoría, gestión de usuarios |


###  Patrón de diseño aplicado: **Clean Architecture**
- Models      → Estructura de datos en la BD
- Selectors   → Queries optimizadas (LECTURAS)
- Services    → Lógica de negocio (ESCRITURAS, transacciones)
- Validators  → Validaciones reutilizables
- Serializers → Conversión JSON ↔ Python
- Views       → Solo manejo HTTP (request/response)

---

##  Instalación

### Pre-requisitos
- **Python 3.13+**
- **Node.js 20+**
- **Docker Desktop**
- **Git**

### 1. Clonar el repositorio

```bash
git clone https://github.com/Rtawers/sistema-gestion-hotelera.git
cd sistema-gestion-hotelera
```

### 2. Levantar la base de datos (PostgreSQL en Docker)

```bash
docker compose up -d db
```

Verifica:

```bash
docker compose ps
```

### 3. Configurar el backend

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

pip install -r requirements/development.txt

python manage.py migrate
python manage.py createsuperuser    # Crear usuario admin
python manage.py runserver
```

 **Backend disponible en:** `http://localhost:8000`
 **Documentación Swagger:** `http://localhost:8000/api/docs/`

### 4. Configurar el frontend (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```

 **Frontend disponible en:** `http://localhost:5173`

---

##  Uso del sistema

### Credenciales de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
|  Administrador | `admin` | `Admin2026!` |
|  Recepcionista | `recepcion1` | `recep2026` |
|  Housekeeping | `limpieza1` | `limp2026` |
|  Cliente | _(no requiere login)_ | _Portal público_ |

### Rutas principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/reservar` | Público | Portal del cliente |
| `/reserva-confirmada/:codigo` | Público | Confirmación de reserva |
| `/login` | Público | Login del personal |
| `/dashboard` | Admin | KPIs en tiempo real |
| `/recepcion` | Admin + Recepción | Plano del hotel |
| `/reservas` | Admin + Recepción | Gestión de reservas |
| `/estancias` | Admin + Recepción | Folios y check-out |
| `/tareas` | Admin + Housekeeping | Tareas priorizadas |
| `/incidentes` | Admin + Recepción + Housekeeping | Reporte de averías |
| `/reportes` | Admin | 3 gráficos analíticos |
| `/auditoria` | Admin | Bitácora completa (HU15) |
| `/usuarios` | Admin | Gestión CRUD (HU16) |
| `/tipos-habitacion` | Admin | Catálogo de tipos |
| `/perfil` | Todos | Datos personales |

---

##  Pruebas

### Correr tests

```bash
cd backend
pytest                          # Todos los tests
pytest --cov                    # Con cobertura
pytest --cov --cov-report=html  # Reporte HTML
pytest -k "reserva"             # Solo tests que contengan "reserva"
```

---

##  API REST

API REST versionada en `/api/v1/`. Documentación interactiva en `/api/docs/`.

### Endpoints principales

| Recurso | Endpoint base | Operaciones |
|---|---|---|
| **Auth** | `/api/v1/auth/` | login, logout, refresh, perfil |
| **Usuarios** | `/api/v1/auth/usuarios/` | CRUD (admin), cambiar-password, activar |
| **Hoteles** | `/api/v1/hoteles/` | listar, revenue-por-tipo |
| **Habitaciones** | `/api/v1/habitaciones/` | CRUD, disponibles, housekeeping, cambiar-estado |
| **Tipos de habitación** | `/api/v1/tipos-habitacion/` | CRUD |
| **Reservas** | `/api/v1/reservas/` | CRUD, checkin, cancelar |
| **Estancias** | `/api/v1/estancias/` | listar, folio, cargos, pagar, checkout |
| **Incidentes** | `/api/v1/incidentes/` | CRUD |
| **Auditoría** | `/api/v1/auditoria/` | listar (solo admin) |
| **Reportes** | `/api/v1/reportes/` | ocupacion |
| **Portal público** | `/api/v1/publico/` | habitaciones-disponibles, reservar |

---

##  Seguridad

El sistema implementa **3 capas de seguridad**:

1. **JWT (JSON Web Tokens)** para autenticación
   - Access token con expiración corta
   - Refresh token rotativo
2. **Permission classes por endpoint** en `apps/core/permissions.py`
   - `IsAdmin`, `IsRecepcionistaOrAdmin`, `IsHousekeepingOrAdmin`
3. **`RequireRole` en el frontend** que protege rutas privadas antes de mostrar la pantalla

Las contraseñas se **hashean con PBKDF2** (default Django). Nunca se guardan en texto plano.

### Bitácora de auditoría

El modelo `LogAuditoria` registra **toda acción crítica** con:
- Usuario que ejecutó
- Acción (CHECK_IN, CHECK_OUT, PAGAR, CANCELAR, etc.)
- Detalles en JSON
- IP del cliente
- Timestamp

Visible solo a administradores en `/auditoria`.

---

##  Configuración por entorno

Los settings están **separados por entorno**:
config/settings/
- ├── base.py         # Compartido (apps, middleware, JWT, DRF)
- ├── development.py  # DEBUG=True, CORS abierto, BD local
- └── production.py   # DEBUG=False, HTTPS, dominios restringidos

Selección por variable de entorno:

```bash
# Desarrollo (default)
export DJANGO_SETTINGS_MODULE=config.settings.development

# Producción
export DJANGO_SETTINGS_MODULE=config.settings.production
```


##  Equipo

  Integrante 

- | **Daniel Rodriguez Torres** |
- | Yoky Yabe Villanueva | 
- | Lennart Fustamante Sosa | 
- | Maicol Rafael Rojas | 
- | Pamela Chavez Lopez | 
- | Lucrecia Montes Pozo | 

**Metodología:** Scrum con sprints semanales.
**Repositorio:** [github.com/Rtawers/sistema-gestion-hotelera](https://github.com/Rtawers/sistema-gestion-hotelera)

---

##  Información académica

- **Universidad:** Señor de Sipán (USS)
- **Facultad:** Ingeniería
- **Curso:** Taller de Lenguajes de Programación
- **Ciclo:** IX
- **Período:** 2026-II
- **Proyecto:** N°7 — Sistema de Gestión Hotelera

---

Generado y mantenido con ❤️ por **Rtawers** y equipo.
