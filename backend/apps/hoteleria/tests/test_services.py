"""
Tests de los services del dominio hotelero.

Estos tests prueban directamente las funciones de logica de negocio
(crear_reserva, hacer_checkin, hacer_checkout, etc.) sin pasar por HTTP.

Diferencia con test_api_endpoints.py:
- Aqui: probamos services.crear_reserva(...) directamente.
- Alli: probamos POST /api/v1/reservas/ con APIClient.
"""
from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.hoteleria import services
from apps.hoteleria.models import (
    CargoEstancia,
    Estancia,
    Folio,
    Habitacion,
    Reserva,
)
from apps.hoteleria.tests.factories import (
    HabitacionFactory,
    HotelFactory,
    HuespedFactory,
    ReservaFactory,
    TipoHabitacionFactory,
)


# ═══════════════════════════════════════════════════════════════
# SERVICE: crear_reserva
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestCrearReserva:
    """Tests del service crear_reserva()."""

    def test_crear_reserva_calcula_precio_automaticamente(self):
        """El service debe calcular precio_total via selector."""
        hotel = HotelFactory()
        tipo = TipoHabitacionFactory(hotel=hotel, precio_base=Decimal("150.00"))
        habitacion = HabitacionFactory(hotel=hotel, tipo=tipo)
        huesped = HuespedFactory()

        reserva = services.crear_reserva(
            hotel=hotel,
            huesped=huesped,
            habitacion=habitacion,
            fecha_entrada=date(2027, 6, 1),
            fecha_salida=date(2027, 6, 4),  # 3 noches
            num_adultos=2,
        )

        assert reserva.precio_total == Decimal("450.00")  # 150 * 3
        assert reserva.estado == Reserva.Estado.CONFIRMADA
        assert reserva.num_noches == 3

    def test_crear_reserva_solapada_falla(self):
        """No debe permitir crear reserva solapada."""
        hotel = HotelFactory()
        habitacion = HabitacionFactory(hotel=hotel)
        huesped1 = HuespedFactory()
        huesped2 = HuespedFactory(num_doc="88888881")

        services.crear_reserva(
            hotel=hotel,
            huesped=huesped1,
            habitacion=habitacion,
            fecha_entrada=date(2027, 7, 1),
            fecha_salida=date(2027, 7, 5),
        )

        with pytest.raises(ValidationError):
            services.crear_reserva(
                hotel=hotel,
                huesped=huesped2,
                habitacion=habitacion,
                fecha_entrada=date(2027, 7, 3),
                fecha_salida=date(2027, 7, 7),
            )


# ═══════════════════════════════════════════════════════════════
# SERVICE: hacer_checkin
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestHacerCheckin:
    """Tests del service hacer_checkin()."""

    def test_checkin_crea_estancia_y_folio(self):
        """Despues del check-in debe existir Estancia + Folio."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)

        estancia = services.hacer_checkin(reserva=reserva)

        assert estancia.pk is not None
        assert estancia.estado == Estancia.Estado.EN_CURSO
        assert Folio.objects.filter(estancia=estancia).exists()

    def test_checkin_cambia_habitacion_a_ocupada(self):
        """La habitacion debe pasar a OCUPADA."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)

        services.hacer_checkin(reserva=reserva)

        reserva.habitacion.refresh_from_db()
        assert reserva.habitacion.estado == Habitacion.Estado.OCUPADA

    def test_checkin_cambia_reserva_a_checkin(self):
        """La reserva debe pasar de CONFIRMADA a CHECKIN."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)

        services.hacer_checkin(reserva=reserva)

        reserva.refresh_from_db()
        assert reserva.estado == Reserva.Estado.CHECKIN

    def test_checkin_solo_si_reserva_confirmada(self):
        """No permite checkin si la reserva esta en otro estado."""
        reserva = ReservaFactory(estado=Reserva.Estado.PENDIENTE)

        with pytest.raises(ValidationError, match="CONFIRMADAS"):
            services.hacer_checkin(reserva=reserva)

    def test_checkin_falla_si_habitacion_en_mantenimiento(self):
        """No se puede hacer checkin en habitacion bajo mantenimiento."""
        habitacion = HabitacionFactory(estado=Habitacion.Estado.MANTENIMIENTO)
        reserva = ReservaFactory(
            habitacion=habitacion,
            estado=Reserva.Estado.CONFIRMADA,
        )

        with pytest.raises(ValidationError):
            services.hacer_checkin(reserva=reserva)


# ═══════════════════════════════════════════════════════════════
# SERVICE: hacer_checkout  *** HOUSEKEEPING AUTOMATICO ***
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestHacerCheckout:
    """Tests del service hacer_checkout() - incluye housekeeping automatico."""

    @pytest.fixture
    def estancia_lista(self, db):
        """Crea una estancia con check-in hecho, cargo pagado, lista para checkout."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)
        estancia = services.hacer_checkin(reserva=reserva)
        services.pagar_cargos_pendientes(estancia=estancia)
        return estancia

    def test_checkout_cierra_folio(self, estancia_lista):
        """El folio debe quedar CERRADO."""
        folio_cerrado = services.hacer_checkout(estancia=estancia_lista)

        assert folio_cerrado.estado == Folio.Estado.CERRADO
        assert folio_cerrado.fecha_cierre is not None

    def test_checkout_pone_habitacion_en_limpieza(self, estancia_lista):
        """
        REGLA CRITICA USS pag 20:
        Al checkout, la habitacion pasa AUTOMATICAMENTE a LIMPIEZA.
        """
        services.hacer_checkout(estancia=estancia_lista)

        estancia_lista.habitacion.refresh_from_db()
        assert estancia_lista.habitacion.estado == Habitacion.Estado.LIMPIEZA

    def test_checkout_cambia_reserva_a_checkout(self, estancia_lista):
        """La reserva debe pasar a CHECKOUT."""
        services.hacer_checkout(estancia=estancia_lista)

        estancia_lista.reserva.refresh_from_db()
        assert estancia_lista.reserva.estado == Reserva.Estado.CHECKOUT

    def test_checkout_bloqueado_con_deuda(self):
        """No permite checkout si hay cargos sin pagar."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)
        estancia = services.hacer_checkin(reserva=reserva)
        # NO pagamos los cargos -> tiene deuda

        with pytest.raises(ValidationError, match="cargos sin pagar"):
            services.hacer_checkout(estancia=estancia)


# ═══════════════════════════════════════════════════════════════
# SERVICE: agregar_cargo
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestAgregarCargo:
    """Tests del service agregar_cargo()."""

    def test_cargo_recalcula_folio(self):
        """Agregar un cargo debe recalcular el folio (subtotal + IGV + total)."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)
        estancia = services.hacer_checkin(reserva=reserva)
        subtotal_inicial = estancia.folio.subtotal

        services.agregar_cargo(
            estancia=estancia,
            concepto="Cena",
            monto=Decimal("100.00"),
            tipo=CargoEstancia.Tipo.RESTAURANTE,
        )

        estancia.folio.refresh_from_db()
        assert estancia.folio.subtotal == subtotal_inicial + Decimal("100.00")
        assert estancia.folio.igv > Decimal("0.00")

    def test_cargo_monto_negativo_falla(self):
        """Monto negativo o cero debe fallar."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)
        estancia = services.hacer_checkin(reserva=reserva)

        with pytest.raises(ValidationError):
            services.agregar_cargo(
                estancia=estancia,
                concepto="Invalido",
                monto=Decimal("-10.00"),
            )


# ═══════════════════════════════════════════════════════════════
# SERVICE: actualizar_estado_habitacion (housekeeping flow)
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestHousekeeping:
    """Tests de las transiciones de estado de habitacion."""

    def test_limpieza_a_disponible_ok(self):
        """LIMPIEZA -> DISPONIBLE es una transicion valida."""
        habitacion = HabitacionFactory(estado=Habitacion.Estado.LIMPIEZA)

        habitacion = services.actualizar_estado_habitacion(
            habitacion=habitacion,
            nuevo_estado=Habitacion.Estado.DISPONIBLE,
        )

        assert habitacion.estado == Habitacion.Estado.DISPONIBLE

    def test_disponible_a_mantenimiento_ok(self):
        """DISPONIBLE -> MANTENIMIENTO es valida."""
        habitacion = HabitacionFactory(estado=Habitacion.Estado.DISPONIBLE)

        habitacion = services.actualizar_estado_habitacion(
            habitacion=habitacion,
            nuevo_estado=Habitacion.Estado.MANTENIMIENTO,
        )

        assert habitacion.estado == Habitacion.Estado.MANTENIMIENTO

    def test_ocupada_a_disponible_falla(self):
        """OCUPADA -> DISPONIBLE NO es valida (debe pasar por LIMPIEZA)."""
        habitacion = HabitacionFactory(estado=Habitacion.Estado.OCUPADA)

        with pytest.raises(ValidationError, match="Transicion invalida"):
            services.actualizar_estado_habitacion(
                habitacion=habitacion,
                nuevo_estado=Habitacion.Estado.DISPONIBLE,
            )

    def test_disponible_a_limpieza_falla(self):
        """DISPONIBLE -> LIMPIEZA NO es valida (no hay nada que limpiar)."""
        habitacion = HabitacionFactory(estado=Habitacion.Estado.DISPONIBLE)

        with pytest.raises(ValidationError, match="Transicion invalida"):
            services.actualizar_estado_habitacion(
                habitacion=habitacion,
                nuevo_estado=Habitacion.Estado.LIMPIEZA,
            )


# ═══════════════════════════════════════════════════════════════
# SERVICE: cancelar_reserva
# ═══════════════════════════════════════════════════════════════
@pytest.mark.django_db
class TestCancelarReserva:
    """Tests del service cancelar_reserva()."""

    def test_cancelar_reserva_confirmada(self):
        """Una reserva CONFIRMADA puede ser cancelada."""
        reserva = ReservaFactory(estado=Reserva.Estado.CONFIRMADA)

        reserva = services.cancelar_reserva(reserva=reserva, motivo="Test")

        assert reserva.estado == Reserva.Estado.CANCELADA
        assert "CANCELADA" in reserva.observaciones

    def test_no_cancelar_reserva_en_checkin(self):
        """No se cancela una reserva que ya tiene check-in hecho."""
        reserva = ReservaFactory(estado=Reserva.Estado.CHECKIN)

        with pytest.raises(ValidationError):
            services.cancelar_reserva(reserva=reserva)