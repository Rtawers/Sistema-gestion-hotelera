"""
Tests del modelo Folio.

Validan el calculo correcto de IGV (18%) y el redondeo contable.
La rubrica AG-C08-C1 evalua estos calculos como aplicacion de
principios matematicos.
"""
from decimal import Decimal

import pytest

from apps.hoteleria.models import (
    CargoEstancia,
    Estancia,
    Folio,
)
from apps.hoteleria.tests.factories import ReservaFactory


@pytest.fixture
def folio_con_estancia(db):
    """Crea reserva -> estancia -> folio listo para usar en tests."""
    reserva = ReservaFactory()
    estancia = Estancia.objects.create(
        reserva=reserva,
        habitacion=reserva.habitacion,
    )
    folio = Folio.objects.create(estancia=estancia)
    return folio


@pytest.mark.django_db
class TestFolioCalculoIGV:
    """Tests del calculo IGV = 18% sobre subtotal."""

    def test_igv_rate_es_18_porciento(self):
        """La constante IGV_RATE debe ser 0.18 (18%)."""
        assert Folio.IGV_RATE == Decimal("0.18")

    def test_calculo_con_un_cargo(self, folio_con_estancia):
        """Cargo de S/ 100 -> IGV S/ 18 -> Total S/ 118."""
        folio = folio_con_estancia
        CargoEstancia.objects.create(
            estancia=folio.estancia,
            concepto="Test",
            monto=Decimal("100.00"),
        )
        folio.recalcular()

        assert folio.subtotal == Decimal("100.00")
        assert folio.igv == Decimal("18.00")
        assert folio.total == Decimal("118.00")

    def test_calculo_con_multiples_cargos(self, folio_con_estancia):
        """Suma: 100 + 50.50 = 150.50, IGV = 27.09, Total = 177.59."""
        folio = folio_con_estancia
        CargoEstancia.objects.create(
            estancia=folio.estancia,
            concepto="Cena",
            monto=Decimal("100.00"),
        )
        CargoEstancia.objects.create(
            estancia=folio.estancia,
            concepto="Lavanderia",
            monto=Decimal("50.50"),
        )
        folio.recalcular()

        assert folio.subtotal == Decimal("150.50")
        assert folio.igv == Decimal("27.09")
        assert folio.total == Decimal("177.59")

    def test_redondeo_a_2_decimales(self, folio_con_estancia):
        """
        100.55 * 0.18 = 18.0990 -> redondea a 18.10
        Valida el quantize(Decimal('0.01')).
        """
        folio = folio_con_estancia
        CargoEstancia.objects.create(
            estancia=folio.estancia,
            concepto="Test",
            monto=Decimal("100.55"),
        )
        folio.recalcular()

        assert folio.igv == Decimal("18.10")
        assert folio.total == Decimal("118.65")

    def test_folio_sin_cargos_da_cero(self, folio_con_estancia):
        """Sin cargos, todo debe ser 0.00."""
        folio = folio_con_estancia
        folio.recalcular()

        assert folio.subtotal == Decimal("0.00")
        assert folio.igv == Decimal("0.00")
        assert folio.total == Decimal("0.00")


@pytest.mark.django_db
class TestFolioDeuda:
    """Tests de la propiedad tiene_deuda."""

    def test_folio_sin_cargos_no_tiene_deuda(self, folio_con_estancia):
        assert folio_con_estancia.tiene_deuda is False

    def test_folio_con_cargo_no_pagado_tiene_deuda(self, folio_con_estancia):
        CargoEstancia.objects.create(
            estancia=folio_con_estancia.estancia,
            concepto="Test",
            monto=Decimal("50.00"),
            pagado=False,
        )
        assert folio_con_estancia.tiene_deuda is True

    def test_folio_con_cargos_todos_pagados_no_tiene_deuda(
        self, folio_con_estancia
    ):
        CargoEstancia.objects.create(
            estancia=folio_con_estancia.estancia,
            concepto="Test",
            monto=Decimal("50.00"),
            pagado=True,
        )
        assert folio_con_estancia.tiene_deuda is False