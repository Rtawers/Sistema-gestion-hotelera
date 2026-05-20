from django.contrib import admin

from .models import (
    Hotel,
    TipoHabitacion,
    Habitacion,
    Huesped,
    Tarifa,
    Reserva,
    Estancia,
    CargoEstancia,
    Folio,
)


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ("nombre", "ruc", "estrellas", "activo")
    list_filter = ("estrellas", "activo")
    search_fields = ("nombre", "ruc")


@admin.register(TipoHabitacion)
class TipoHabitacionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "hotel", "capacidad", "precio_base")
    list_filter = ("hotel",)
    search_fields = ("nombre",)


@admin.register(Habitacion)
class HabitacionAdmin(admin.ModelAdmin):
    list_display = ("numero", "hotel", "tipo", "piso", "estado", "activa")
    list_filter = ("hotel", "estado", "piso", "activa")
    search_fields = ("numero",)
    list_editable = ("estado",)  


@admin.register(Huesped)
class HuespedAdmin(admin.ModelAdmin):
    list_display = ("nombre_completo", "tipo_doc", "num_doc", "nacionalidad")
    list_filter = ("tipo_doc", "nacionalidad")
    search_fields = ("nombres", "apellidos", "num_doc")


@admin.register(Tarifa)
class TarifaAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "tipo_habitacion",
        "precio_noche",
        "fecha_inicio",
        "fecha_fin",
        "activa",
    )
    list_filter = ("tipo_habitacion__hotel", "activa")
    date_hierarchy = "fecha_inicio"


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "huesped",
        "habitacion",
        "fecha_entrada",
        "fecha_salida",
        "num_noches",
        "estado",
        "precio_total",
    )
    list_filter = ("estado", "origen", "hotel")
    search_fields = ("huesped__apellidos", "huesped__num_doc")
    date_hierarchy = "fecha_entrada"
    readonly_fields = ("precio_total", "created_at", "updated_at")


@admin.register(Estancia)
class EstanciaAdmin(admin.ModelAdmin):
    list_display = ("id", "reserva", "fecha_checkin", "fecha_checkout", "estado")
    list_filter = ("estado",)


@admin.register(CargoEstancia)
class CargoEstanciaAdmin(admin.ModelAdmin):
    list_display = ("estancia", "concepto", "tipo", "monto", "fecha", "pagado")
    list_filter = ("tipo", "pagado")


@admin.register(Folio)
class FolioAdmin(admin.ModelAdmin):
    list_display = ("id", "estancia", "subtotal", "igv", "total", "estado")
    list_filter = ("estado",)
    readonly_fields = ("subtotal", "igv", "total")