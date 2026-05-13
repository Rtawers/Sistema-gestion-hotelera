"""
Tests de los endpoints HTTP de la API.

Usa los fixtures globales del conftest.py:
- admin_client: APIClient autenticado como ADMIN
- recepcionista_client: APIClient autenticado como RECEPCIONISTA
- housekeeping_client: APIClient autenticado como HOUSEKEEPING
- api_client: APIClient sin autenticar (para probar 401)
"""
from datetime import date
from decimal import Decimal

import pytest
from rest_framework import status

from apps.hoteleria import services
from apps.hoteleria.models import Habitacion, Reserva
from apps.hoteleria.tests.factories import (
    HabitacionFactory,
    HotelFactory,
    HuespedFactory,
    ReservaFactory,
)


# ═══════════════════════════════════════════════════════════════
# TESTS DE AUTENTICACION
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestAutenticacion:
    """Tests de los endpoints protegidos."""

    def test_sin_token_devuelve_401(self, api_client):
        """Sin token JWT, endpoints protegidos devuelven 401."""
        response = api_client.get("/api/v1/hoteles/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_con_token_devuelve_200(self, admin_client):
        """Con token valido, devuelve 200."""
        response = admin_client.get("/api/v1/hoteles/")
        assert response.status_code == status.HTTP_200_OK

    def test_login_devuelve_tokens_y_rol(self, admin_user, api_client):
        """POST /auth/login/ devuelve access + refresh + user con rol."""
        response = api_client.post("/api/v1/auth/login/", {
            "username": "admin_test",
            "password": "testpass123",
        }, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["rol"] == "ADMIN"


# ═══════════════════════════════════════════════════════════════
# TESTS DE PERMISOS POR ROL
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestPermisosPorRol:
    """Verifica que cada rol solo puede acceder a lo que le corresponde."""

    def test_recepcionista_no_puede_crear_hotel(self, recepcionista_client):
        """Solo admin puede crear hoteles."""
        data = {
            "nombre": "Hotel Nuevo",
            "ruc": "20100000001",
            "direccion": "Test 123",
            "estrellas": 4,
        }
        response = recepcionista_client.post("/api/v1/hoteles/", data, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_si_puede_crear_hotel(self, admin_client):
        """Admin tiene permiso de crear hoteles."""
        data = {
            "nombre": "Hotel Admin Test",
            "ruc": "20100000002",
            "direccion": "Test 456",
            "estrellas": 5,
        }
        response = admin_client.post("/api/v1/hoteles/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_housekeeping_no_puede_crear_reservas(self, housekeeping_client):
        """Housekeeping no puede gestionar reservas."""
        response = housekeeping_client.get("/api/v1/reservas/")
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ═══════════════════════════════════════════════════════════════
# TESTS DE HABITACIONES DISPONIBLES
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestHabitacionesDisponibles:
    """Tests del endpoint GET /habitaciones/disponibles/"""

    def test_lista_habitaciones_libres(self, admin_client):
        hotel = HotelFactory()
        HabitacionFactory.create_batch(3, hotel=hotel)

        response = admin_client.get(
            f"/api/v1/habitaciones/disponibles/?fecha_entrada=2027-09-01&fecha_salida=2027-09-05&hotel_id={hotel.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3

    def test_excluye_habitaciones_reservadas(self, admin_client):
        hotel = HotelFactory()
        hab1 = HabitacionFactory(hotel=hotel)
        HabitacionFactory(hotel=hotel)  # libre

        ReservaFactory(
            hotel=hotel,
            habitacion=hab1,
            fecha_entrada=date(2027, 9, 1),
            fecha_salida=date(2027, 9, 5),
        )

        response = admin_client.get(
            f"/api/v1/habitaciones/disponibles/?fecha_entrada=2027-09-02&fecha_salida=2027-09-04&hotel_id={hotel.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_fechas_invalidas_devuelve_400(self, admin_client):
        """fecha_salida <= fecha_entrada debe dar 400."""
        response = admin_client.get(
            "/api/v1/habitaciones/disponibles/?fecha_entrada=2027-09-05&fecha_salida=2027-09-05"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ═══════════════════════════════════════════════════════════════
# TESTS DE CREACION DE RESERVAS
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestCrearReservaAPI:
    """Tests del endpoint POST /reservas/"""

    def test_crear_reserva_valida_devuelve_201(self, recepcionista_client):
        hotel = HotelFactory()
        habitacion = HabitacionFactory(hotel=hotel)
        huesped = HuespedFactory()

        data = {
            "hotel": hotel.id,
            "huesped": huesped.id,
            "habitacion": habitacion.id,
            "fecha_entrada": "2027-10-01",
            "fecha_salida": "2027-10-04",
            "num_adultos": 2,
        }

        response = recepcionista_client.post("/api/v1/reservas/", data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["estado"] == "CONFIRMADA"
        assert Decimal(response.data["precio_total"]) > Decimal("0.00")
        assert response.data["num_noches"] == 3

    def test_crear_reserva_solapada_devuelve_400(self, recepcionista_client):
        hotel = HotelFactory()
        habitacion = HabitacionFactory(hotel=hotel)

        ReservaFactory(
            hotel=hotel,
            habitacion=habitacion,
            fecha_entrada=date(2027, 10, 1),
            fecha_salida=date(2027, 10, 5),
        )

        data = {
            "hotel": hotel.id,
            "huesped": HuespedFactory(num_doc="77777771").id,
            "habitacion": habitacion.id,
            "fecha_entrada": "2027-10-03",
            "fecha_salida": "2027-10-07",
            "num_adultos": 1,
        }
        response = recepcionista_client.post("/api/v1/reservas/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_fechas_invertidas_devuelve_400(self, recepcionista_client):
        hotel = HotelFactory()
        habitacion = HabitacionFactory(hotel=hotel)
        huesped = HuespedFactory()

        data = {
            "hotel": hotel.id,
            "huesped": huesped.id,
            "habitacion": habitacion.id,
            "fecha_entrada": "2027-10-10",
            "fecha_salida": "2027-10-05",
            "num_adultos": 1,
        }
        response = recepcionista_client.post("/api/v1/reservas/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ═══════════════════════════════════════════════════════════════
# TESTS DE CHECK-IN VIA HTTP
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestCheckinAPI:
    """Tests del endpoint POST /reservas/{id}/checkin/"""

    def test_checkin_exitoso_devuelve_201(self, recepcionista_client):
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)

        response = recepcionista_client.post(f"/api/v1/reservas/{reserva.id}/checkin/")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["estado"] == "EN_CURSO"
        assert response.data["folio"] is not None

    def test_checkin_cambia_habitacion_a_ocupada(self, recepcionista_client):
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)

        recepcionista_client.post(f"/api/v1/reservas/{reserva.id}/checkin/")

        reserva.habitacion.refresh_from_db()
        assert reserva.habitacion.estado == Habitacion.Estado.OCUPADA

    def test_checkin_reserva_no_confirmada_falla(self, recepcionista_client):
        reserva = ReservaFactory(estado=Reserva.Estado.PENDIENTE)

        response = recepcionista_client.post(f"/api/v1/reservas/{reserva.id}/checkin/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ═══════════════════════════════════════════════════════════════
# TESTS DEL FLUJO COMPLETO (CHECKOUT + HOUSEKEEPING AUTOMATICO)
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestCheckoutAPI:
    """Tests del checkout via HTTP - LA prueba mas importante."""

    def test_checkout_con_deuda_devuelve_400(self, recepcionista_client):
        """Si hay cargos sin pagar, checkout debe fallar."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)
        estancia = services.hacer_checkin(reserva=reserva)
        # NO pagamos -> tiene deuda

        response = recepcionista_client.post(f"/api/v1/estancias/{estancia.id}/checkout/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_checkout_exitoso_pone_habitacion_en_limpieza(self, recepcionista_client):
        """
        REGLA CRITICA USS pag 20:
        Despues del checkout, la habitacion debe estar en LIMPIEZA.
        """
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)
        estancia = services.hacer_checkin(reserva=reserva)
        services.pagar_cargos_pendientes(estancia=estancia)

        response = recepcionista_client.post(f"/api/v1/estancias/{estancia.id}/checkout/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["estado"] == "CERRADO"

        # Verificar housekeeping automatico
        estancia.habitacion.refresh_from_db()
        assert estancia.habitacion.estado == Habitacion.Estado.LIMPIEZA

    def test_agregar_cargo_via_api(self, recepcionista_client):
        """POST /estancias/{id}/cargos/ debe crear cargo y recalcular folio."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)
        estancia = services.hacer_checkin(reserva=reserva)
        subtotal_inicial = estancia.folio.subtotal

        response = recepcionista_client.post(
            f"/api/v1/estancias/{estancia.id}/cargos/",
            {"concepto": "Cena", "monto": "100.00", "tipo": "RESTAURANTE"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        estancia.folio.refresh_from_db()
        assert estancia.folio.subtotal == subtotal_inicial + Decimal("100.00")


# ═══════════════════════════════════════════════════════════════
# TESTS DE HOUSEKEEPING VIA HTTP
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestHousekeepingAPI:
    """Tests del endpoint PATCH /habitaciones/{id}/housekeeping/"""

    def test_housekeeping_cambia_limpieza_a_disponible(self, housekeeping_client):
        habitacion = HabitacionFactory(estado=Habitacion.Estado.LIMPIEZA)

        response = housekeeping_client.patch(
            f"/api/v1/habitaciones/{habitacion.id}/housekeeping/",
            {"nuevo_estado": "DISPONIBLE"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        habitacion.refresh_from_db()
        assert habitacion.estado == Habitacion.Estado.DISPONIBLE

    def test_recepcionista_no_puede_housekeeping(self, recepcionista_client):
        """Solo housekeeping o admin pueden cambiar estados."""
        habitacion = HabitacionFactory(estado=Habitacion.Estado.LIMPIEZA)

        response = recepcionista_client.patch(
            f"/api/v1/habitaciones/{habitacion.id}/housekeeping/",
            {"nuevo_estado": "DISPONIBLE"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_transicion_invalida_devuelve_400(self, housekeeping_client):
        habitacion = HabitacionFactory(estado=Habitacion.Estado.DISPONIBLE)

        response = housekeeping_client.patch(
            f"/api/v1/habitaciones/{habitacion.id}/housekeeping/",
            {"nuevo_estado": "LIMPIEZA"},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ═══════════════════════════════════════════════════════════════
# TESTS DE REPORTES
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestReportes:
    """Tests del endpoint GET /reportes/ocupacion/"""

    def test_ocupacion_hotel_vacio_da_cero(self, admin_client):
        hotel = HotelFactory()

        response = admin_client.get(
            f"/api/v1/reportes/ocupacion/?hotel_id={hotel.id}&fecha=2027-08-01"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["tasa_pct"] == 0.0

    def test_falta_parametro_devuelve_400(self, admin_client):
        response = admin_client.get("/api/v1/reportes/ocupacion/")
        assert response.status_code == status.HTTP_400_BAD_REQUEST