"""
Tests de los selectors (capa de lectura del dominio hotelero).
"""
from datetime import date
from decimal import Decimal

import pytest

from apps.hoteleria.models import Habitacion, Reserva
from apps.hoteleria.selectors import (
    calcular_precio_estadia,
    habitaciones_disponibles_en_rango,
    tasa_ocupacion,
)
from apps.hoteleria.tests.factories import (
    HabitacionFactory,
    HotelFactory,
    HuespedFactory,
    ReservaFactory,
    TarifaFactory,
    TipoHabitacionFactory,
)


@pytest.mark.django_db
class TestHabitacionesDisponibles:
    """Tests del selector habitaciones_disponibles_en_rango."""

    def test_devuelve_habitaciones_libres(self):
        """Sin reservas, todas las habitaciones disponibles aparecen."""
        hotel = HotelFactory()
        HabitacionFactory.create_batch(3, hotel=hotel)

        result = habitaciones_disponibles_en_rango(
            fecha_entrada=date(2026, 8, 1),
            fecha_salida=date(2026, 8, 5),
            hotel_id=hotel.id,
        )
        assert result.count() == 3

    def test_excluye_habitaciones_con_reserva_solapada(self):
        """Una habitacion con reserva activa NO debe aparecer."""
        hotel = HotelFactory()
        hab1 = HabitacionFactory(hotel=hotel)
        hab2 = HabitacionFactory(hotel=hotel)

        ReservaFactory(
            hotel=hotel,
            habitacion=hab1,
            fecha_entrada=date(2026, 8, 1),
            fecha_salida=date(2026, 8, 5),
        )

        result = habitaciones_disponibles_en_rango(
            fecha_entrada=date(2026, 8, 2),
            fecha_salida=date(2026, 8, 4),
            hotel_id=hotel.id,
        )
        assert result.count() == 1
        assert result.first().pk == hab2.pk

    def test_excluye_habitaciones_en_mantenimiento(self):
        """Habitacion en MANTENIMIENTO no debe aparecer."""
        hotel = HotelFactory()
        HabitacionFactory(hotel=hotel)
        HabitacionFactory(hotel=hotel, estado=Habitacion.Estado.MANTENIMIENTO)

        result = habitaciones_disponibles_en_rango(
            fecha_entrada=date(2026, 8, 1),
            fecha_salida=date(2026, 8, 5),
            hotel_id=hotel.id,
        )
        assert result.count() == 1


@pytest.mark.django_db
class TestCalcularPrecioEstadia:
    """Tests del selector calcular_precio_estadia."""

    def test_sin_tarifa_usa_precio_base(self):
        """Si no hay tarifa configurada, usa precio_base del tipo."""
        tipo = TipoHabitacionFactory(precio_base=Decimal("150.00"))

        calc = calcular_precio_estadia(
            tipo_habitacion=tipo,
            fecha_entrada=date(2027, 6, 1),
            fecha_salida=date(2027, 6, 4),
        )
        assert calc["total"] == Decimal("450.00")
        assert calc["num_noches"] == 3

    def test_con_tarifa_usa_precio_de_tarifa(self):
        """Si hay tarifa vigente, usa el precio de la tarifa."""
        tipo = TipoHabitacionFactory(precio_base=Decimal("150.00"))
        TarifaFactory(
            tipo_habitacion=tipo,
            precio_noche=Decimal("250.00"),
            fecha_inicio=date(2026, 12, 1),
            fecha_fin=date(2026, 12, 31),
        )

        calc = calcular_precio_estadia(
            tipo_habitacion=tipo,
            fecha_entrada=date(2026, 12, 10),
            fecha_salida=date(2026, 12, 13),
        )
        assert calc["total"] == Decimal("750.00")

    def test_combina_tarifas_dia_a_dia(self):
        """
        Si la estadia atraviesa 2 tarifas, suma cada dia con su tarifa.
        Esta es la prueba de la formula sumatoria del HITO 2.
        """
        tipo = TipoHabitacionFactory(precio_base=Decimal("100.00"))
        TarifaFactory(
            tipo_habitacion=tipo,
            nombre="Fin de ano",
            precio_noche=Decimal("200.00"),
            fecha_inicio=date(2026, 12, 28),
            fecha_fin=date(2026, 12, 31),
        )
        TarifaFactory(
            tipo_habitacion=tipo,
            nombre="Ano nuevo",
            precio_noche=Decimal("300.00"),
            fecha_inicio=date(2027, 1, 1),
            fecha_fin=date(2027, 1, 5),
        )

        calc = calcular_precio_estadia(
            tipo_habitacion=tipo,
            fecha_entrada=date(2026, 12, 30),
            fecha_salida=date(2027, 1, 3),
        )
        # 200 (30 dic) + 200 (31 dic) + 300 (1 ene) + 300 (2 ene)
        assert calc["total"] == Decimal("1000.00")
        assert calc["num_noches"] == 4

    def test_lanza_error_con_fechas_invalidas(self):
        """fecha_salida <= fecha_entrada debe lanzar ValueError."""
        tipo = TipoHabitacionFactory()
        with pytest.raises(ValueError):
            calcular_precio_estadia(
                tipo_habitacion=tipo,
                fecha_entrada=date(2026, 7, 5),
                fecha_salida=date(2026, 7, 5),
            )


@pytest.mark.django_db
class TestTasaOcupacion:
    """Tests del calculo de tasa de ocupacion del hotel."""

    def test_hotel_sin_habitaciones_da_cero(self):
        hotel = HotelFactory()
        result = tasa_ocupacion(hotel.id, date(2026, 8, 1))
        assert result["tasa_pct"] == 0.0

    def test_calculo_tasa_correctamente(self):
        """3 habitaciones, 1 con CHECKIN -> tasa = 33.33%."""
        hotel = HotelFactory()
        habs = HabitacionFactory.create_batch(3, hotel=hotel)

        ReservaFactory(
            hotel=hotel,
            habitacion=habs[0],
            fecha_entrada=date(2026, 8, 1),
            fecha_salida=date(2026, 8, 5),
            estado=Reserva.Estado.CHECKIN,
        )

        result = tasa_ocupacion(hotel.id, date(2026, 8, 2))
        assert result["total"] == 3
        assert result["ocupadas"] == 1
        assert result["tasa_pct"] == 33.33