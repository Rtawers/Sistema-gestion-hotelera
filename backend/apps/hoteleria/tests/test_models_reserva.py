"""
Tests del modelo Reserva.

Validan la regla de negocio mas critica del sistema:
deteccion de solapamiento usando la formula matematica formal:
    solapan(R1, R2)  <=>  e1 < s2  AND  e2 < s1
"""
from datetime import date

import pytest
from django.core.exceptions import ValidationError

from apps.hoteleria.models import Reserva
from apps.hoteleria.tests.factories import (
    HabitacionFactory,
    HuespedFactory,
    ReservaFactory,
)


# ============================================================
# TESTS BASICOS DEL MODELO
# ============================================================
@pytest.mark.django_db
class TestReservaBasico:
    """Tests del comportamiento basico del modelo."""

    def test_crear_reserva_valida(self):
        """Una reserva con datos correctos debe crearse sin problemas."""
        reserva = ReservaFactory()
        assert reserva.pk is not None
        assert reserva.estado == Reserva.Estado.CONFIRMADA

    def test_num_noches_se_calcula_correctamente(self):
        reserva = ReservaFactory(
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 1),
        )
        assert reserva.num_noches == 3

    def test_total_huespedes(self):
        habitacion = HabitacionFactory(tipo__capacidad=4)
        reserva = ReservaFactory(
            habitacion=habitacion,
            num_adultos=2,
            num_ninos=2,
        )
        assert reserva.total_huespedes == 4


# ============================================================
# TESTS DE VALIDACION TEMPORAL
# ============================================================
@pytest.mark.django_db
class TestReservaValidacionTemporal:
    """Tests que validan reglas sobre fechas."""

    def test_fecha_salida_debe_ser_mayor_a_entrada(self):
        """No se permite reserva con salida = entrada."""
        with pytest.raises(ValidationError):
            ReservaFactory(
                fecha_entrada=date(2026, 7, 1),
                fecha_salida=date(2026, 7, 1),
            )

    def test_fecha_salida_no_puede_ser_anterior_a_entrada(self):
        """No se permite reserva con fechas invertidas."""
        with pytest.raises(ValidationError):
            ReservaFactory(
                fecha_entrada=date(2026, 7, 10),
                fecha_salida=date(2026, 7, 5),
            )


# ============================================================
# TESTS DE SOLAPAMIENTO  *** LOS MAS IMPORTANTES ***
# ============================================================
@pytest.mark.django_db
class TestReservaSolapamiento:
    """
    Tests que validan la formula matematica de solapamiento:
        solapan(R1, R2)  <=>  e1 < s2  AND  e2 < s1
    """

    def test_solapamiento_total_se_bloquea(self):
        """
        R2 contenida totalmente en R1.
            R1: |--------|       (28-jun a 5-jul)
            R2:    |--|          (30-jun a 2-jul)  <- solapa
        """
        habitacion = HabitacionFactory()
        ReservaFactory(
            habitacion=habitacion,
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
        )
        with pytest.raises(ValidationError, match="Conflicto de fechas"):
            ReservaFactory(
                habitacion=habitacion,
                huesped=HuespedFactory(num_doc="99999991"),
                fecha_entrada=date(2026, 6, 30),
                fecha_salida=date(2026, 7, 2),
            )

    def test_solapamiento_parcial_inicio_se_bloquea(self):
        """
        R2 empieza antes y termina dentro de R1.
            R1:    |--------|    (28-jun a 5-jul)
            R2: |-----|          (25-jun a 30-jun)  <- solapa
        """
        habitacion = HabitacionFactory()
        ReservaFactory(
            habitacion=habitacion,
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
        )
        with pytest.raises(ValidationError, match="Conflicto de fechas"):
            ReservaFactory(
                habitacion=habitacion,
                huesped=HuespedFactory(num_doc="99999992"),
                fecha_entrada=date(2026, 6, 25),
                fecha_salida=date(2026, 6, 30),
            )

    def test_solapamiento_parcial_final_se_bloquea(self):
        """
        R2 empieza dentro de R1 y termina despues.
            R1: |--------|       (28-jun a 5-jul)
            R2:      |-----|     (3-jul a 8-jul)  <- solapa
        """
        habitacion = HabitacionFactory()
        ReservaFactory(
            habitacion=habitacion,
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
        )
        with pytest.raises(ValidationError, match="Conflicto de fechas"):
            ReservaFactory(
                habitacion=habitacion,
                huesped=HuespedFactory(num_doc="99999993"),
                fecha_entrada=date(2026, 7, 3),
                fecha_salida=date(2026, 7, 8),
            )

    def test_reserva_contigua_si_se_permite(self):
        """
        R2 empieza el mismo dia que termina R1 (intervalos semi-abiertos).
            R1: |--------|       (28-jun a 5-jul)
            R2:          |---|   (5-jul a 8-jul)  <- NO solapa
        """
        habitacion = HabitacionFactory()
        ReservaFactory(
            habitacion=habitacion,
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
        )
        r2 = ReservaFactory(
            habitacion=habitacion,
            huesped=HuespedFactory(num_doc="99999994"),
            fecha_entrada=date(2026, 7, 5),
            fecha_salida=date(2026, 7, 8),
        )
        assert r2.pk is not None

    def test_reserva_completamente_separada_si_se_permite(self):
        """
        R1 y R2 sin contacto.
            R1: |---|            (28-jun a 30-jun)
            R2:           |---|  (10-jul a 13-jul)
        """
        habitacion = HabitacionFactory()
        ReservaFactory(
            habitacion=habitacion,
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 6, 30),
        )
        r2 = ReservaFactory(
            habitacion=habitacion,
            huesped=HuespedFactory(num_doc="99999995"),
            fecha_entrada=date(2026, 7, 10),
            fecha_salida=date(2026, 7, 13),
        )
        assert r2.pk is not None

    def test_distinta_habitacion_no_aplica_solapamiento(self):
        """Misma fecha pero distinta habitacion -> permitido."""
        hab1 = HabitacionFactory(numero="101")
        hab2 = HabitacionFactory(numero="102")

        ReservaFactory(
            habitacion=hab1,
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
        )
        r2 = ReservaFactory(
            habitacion=hab2,
            huesped=HuespedFactory(num_doc="99999996"),
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
        )
        assert r2.pk is not None

    def test_reserva_cancelada_no_bloquea(self):
        """Una reserva CANCELADA no debe bloquear la habitacion."""
        habitacion = HabitacionFactory()
        ReservaFactory(
            habitacion=habitacion,
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
            estado=Reserva.Estado.CANCELADA,
        )
        r2 = ReservaFactory(
            habitacion=habitacion,
            huesped=HuespedFactory(num_doc="99999997"),
            fecha_entrada=date(2026, 6, 28),
            fecha_salida=date(2026, 7, 5),
        )
        assert r2.pk is not None


# ============================================================
# TESTS DE CAPACIDAD
# ============================================================
@pytest.mark.django_db
class TestReservaCapacidad:
    """Tests que validan que no se exceda la capacidad de la habitacion."""

    def test_no_se_puede_exceder_capacidad(self):
        """Habitacion capacidad 2 no permite 3 personas."""
        habitacion = HabitacionFactory(tipo__capacidad=2)
        with pytest.raises(ValidationError, match="soporta"):
            ReservaFactory(
                habitacion=habitacion,
                num_adultos=3,

            )

    def test_capacidad_exacta_si_se_permite(self):
        """Habitacion capacidad 2 permite exactamente 2 personas."""
        habitacion = HabitacionFactory(tipo__capacidad=2)
        reserva = ReservaFactory(
            habitacion=habitacion,
            num_adultos=2,
        )
        assert reserva.pk is not None

    def test_adultos_mas_ninos_no_excede(self):
        """1 adulto + 1 nino = 2 personas, en capacidad 2 si se permite."""
        habitacion = HabitacionFactory(tipo__capacidad=2)
        reserva = ReservaFactory(
            habitacion=habitacion,
            num_adultos=1,
            num_ninos=1,
        )
        assert reserva.pk is not None