
# Muchachos este archivo llamado Factories es creado para generar data de prueba con factory_boy.

from datetime import date, timedelta
from decimal import Decimal

import factory
from factory.django import DjangoModelFactory
from faker import Faker

from apps.hoteleria.models import (
    Hotel,
    TipoHabitacion,
    Habitacion,
    Huesped,
    Tarifa,
    Reserva,
)

fake = Faker("es")


class HotelFactory(DjangoModelFactory):
    class Meta:
        model = Hotel
        django_get_or_create = ("ruc",)

    nombre = factory.Sequence(lambda n: f"Hotel Test {n}")
    ruc = factory.Sequence(lambda n: f"2010007{str(n).zfill(4)}")
    direccion = factory.Faker("address", locale="es")
    estrellas = 4
    activo = True


class TipoHabitacionFactory(DjangoModelFactory):
    class Meta:
        model = TipoHabitacion

    hotel = factory.SubFactory(HotelFactory)
    nombre = factory.Sequence(lambda n: f"Tipo {n}")
    capacidad = 2
    precio_base = Decimal("180.00")
    amenidades = factory.LazyFunction(
        lambda: {"wifi": True, "tv": True, "minibar": False}
    )


class HabitacionFactory(DjangoModelFactory):
    class Meta:
        model = Habitacion

    hotel = factory.SubFactory(HotelFactory)
    tipo = factory.SubFactory(
        TipoHabitacionFactory,
        hotel=factory.SelfAttribute("..hotel"),
    )
    numero = factory.Sequence(lambda n: f"{100 + n}")
    piso = 1
    estado = Habitacion.Estado.DISPONIBLE
    activa = True


class HuespedFactory(DjangoModelFactory):
    class Meta:
        model = Huesped
        django_get_or_create = ("tipo_doc", "num_doc")

    tipo_doc = "DNI"
    num_doc = factory.Sequence(lambda n: f"7{str(n).zfill(7)}")
    nombres = factory.Faker("first_name", locale="es")
    apellidos = factory.Faker("last_name", locale="es")
    email = factory.Faker("email")
    nacionalidad = "Peruana"


class TarifaFactory(DjangoModelFactory):
    class Meta:
        model = Tarifa

    tipo_habitacion = factory.SubFactory(TipoHabitacionFactory)
    nombre = factory.Sequence(lambda n: f"Tarifa {n}")
    precio_noche = Decimal("200.00")
    fecha_inicio = factory.LazyFunction(lambda: date.today())
    fecha_fin = factory.LazyAttribute(
        lambda obj: obj.fecha_inicio + timedelta(days=30)
    )
    activa = True


class ReservaFactory(DjangoModelFactory):
    class Meta:
        model = Reserva

    hotel = factory.SubFactory(HotelFactory)
    huesped = factory.SubFactory(HuespedFactory)
    habitacion = factory.SubFactory(
        HabitacionFactory,
        hotel=factory.SelfAttribute("..hotel"),
    )
    fecha_entrada = factory.LazyFunction(
        lambda: date.today() + timedelta(days=10)
    )
    fecha_salida = factory.LazyAttribute(
        lambda obj: obj.fecha_entrada + timedelta(days=2)
    )
    num_adultos = 1
    estado = Reserva.Estado.CONFIRMADA
    precio_total = Decimal("400.00")