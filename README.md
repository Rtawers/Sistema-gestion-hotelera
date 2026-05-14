# Sistema de Gestión Hotelera

Proyecto académico — Universidad Señor de Sipán (USS)
Taller de Lenguajes de Programación — Ciclo IX — 2026-II

## Descripción

Sistema web full-stack para la gestión de un hotel: reservas, check-in, folio con IGV peruano, check-out con housekeeping automático y plano visual de habitaciones.

## Stack

**Backend:** Django 5 + DRF + PostgreSQL 16 (Docker) + JWT
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 3
**Testing:** pytest (74 tests, 92% cobertura)

## Requisitos

- Python 3.13+
- Node.js 20+
- Docker Desktop
- Git

## Instalación

### 1. Clonar el proyecto

```bash
git clone https://github.com/Rtawers/sistema-gestion-hotelera.git
cd sistema-gestion-hotelera
```

### 2. Levantar la base de datos

```bash
docker compose up -d db
```

### 3. Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
pip install -r requirements/development.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend corre en http://localhost:8000
Docs API: http://localhost:8000/api/docs/

### 4. Frontend (otra terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend corre en http://localhost:5173

## Tests

```bash
cd backend
pytest
```

Resultado: 74 passed, 92% cobertura

## Funcionalidades

- Login con JWT (3 roles: Admin, Recepcionista, Housekeeping)
- Plano del hotel con habitaciones por piso y colores por estado
- Crear reservas con validación de solapamiento y cálculo de precio
- Check-in que crea estancia y folio automáticamente
- Folio con IGV 18% calculado automáticamente
- Agregar cargos (restaurante, lavandería, minibar, spa)
- Check-out que bloquea si hay deuda y pasa la habitación a LIMPIEZA

## Autor

Daniel Rodriguez Torres (Rtawers)
Universidad Señor de Sipán — Ciclo IX — 2026-II
