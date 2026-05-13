"""
URLs del dominio hotelero.

Usa DefaultRouter de DRF para generar automaticamente las rutas CRUD
de cada ViewSet, mas las @action custom como /checkin/, /checkout/, etc.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EstanciaViewSet,
    HabitacionViewSet,
    HotelViewSet,
    HuespedViewSet,
    ReporteOcupacionView,
    ReservaViewSet,
    TarifaViewSet,
    TipoHabitacionViewSet,
)

app_name = "hoteleria"

# El router genera las URLs CRUD automaticamente para cada ViewSet
router = DefaultRouter()
router.register(r"hoteles", HotelViewSet, basename="hotel")
router.register(r"tipos-habitacion", TipoHabitacionViewSet, basename="tipo-habitacion")
router.register(r"habitaciones", HabitacionViewSet, basename="habitacion")
router.register(r"huespedes", HuespedViewSet, basename="huesped")
router.register(r"tarifas", TarifaViewSet, basename="tarifa")
router.register(r"reservas", ReservaViewSet, basename="reserva")
router.register(r"estancias", EstanciaViewSet, basename="estancia")

urlpatterns = [
    # Endpoints generados por el router
    path("", include(router.urls)),

    # Endpoints custom (no son CRUD)
    path("reportes/ocupacion/", ReporteOcupacionView.as_view(), name="reporte-ocupacion"),
]