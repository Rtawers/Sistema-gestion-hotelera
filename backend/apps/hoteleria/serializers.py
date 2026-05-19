"""
Serializers DRF del dominio hotelero.

Estos serializers son el "traductor" entre los modelos Python
y el JSON que consume/devuelve la API REST.

ORGANIZACION:
- LECTURA: serializers para mostrar datos al cliente (frontend).
- ESCRITURA: serializers que validan inputs (POST, PATCH).
- NESTED: serializers anidados para mostrar relaciones sin queries extra.
"""
from decimal import Decimal

from rest_framework import serializers

from .models import (
    CargoEstancia,
    Estancia,
    Folio,
    Habitacion,
    Hotel,
    Huesped,
    Reserva,
    Tarifa,
    TipoHabitacion,
)


# ═══════════════════════════════════════════════════════════════
# HOTEL
# ═══════════════════════════════════════════════════════════════
class HotelSerializer(serializers.ModelSerializer):
    """Serializer completo del hotel."""

    class Meta:
        model = Hotel
        fields = [
            "id",
            "nombre",
            "ruc",
            "direccion",
            "estrellas",
            "telefono",
            "email",
            "activo",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class HotelMinSerializer(serializers.ModelSerializer):
    """Serializer minimo del hotel (para anidar en otros)."""

    class Meta:
        model = Hotel
        fields = ["id", "nombre", "estrellas"]


# ═══════════════════════════════════════════════════════════════
# TIPO DE HABITACION
# ═══════════════════════════════════════════════════════════════
class TipoHabitacionSerializer(serializers.ModelSerializer):
    """Serializer completo del tipo de habitacion."""

    hotel_nombre = serializers.CharField(source="hotel.nombre", read_only=True)

    class Meta:
        model = TipoHabitacion
        fields = [
            "id",
            "hotel",
            "hotel_nombre",
            "nombre",
            "capacidad",
            "precio_base",
            "amenidades",
            "descripcion",
        ]


class TipoHabitacionMinSerializer(serializers.ModelSerializer):
    """Tipo de habitacion resumido (para anidar)."""

    class Meta:
        model = TipoHabitacion
        fields = ["id", "nombre", "capacidad", "precio_base"]


# ═══════════════════════════════════════════════════════════════
# HABITACION
# ═══════════════════════════════════════════════════════════════
class HabitacionSerializer(serializers.ModelSerializer):
    """Serializer completo con tipo anidado (read-only)."""

    tipo = TipoHabitacionMinSerializer(read_only=True)
    tipo_id = serializers.PrimaryKeyRelatedField(
        queryset=TipoHabitacion.objects.all(),
        source="tipo",
        write_only=True,
    )
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    hotel_nombre = serializers.CharField(source="hotel.nombre", read_only=True)

    class Meta:
        model = Habitacion
        fields = [
            "id",
            "hotel",
            "hotel_nombre",
            "tipo",
            "tipo_id",
            "numero",
            "piso",
            "estado",
            "estado_display",
            "activa",
        ]


class HabitacionMinSerializer(serializers.ModelSerializer):
    """Habitacion resumida (para anidar en reservas/estancias)."""

    tipo_nombre = serializers.CharField(source="tipo.nombre", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = Habitacion
        fields = ["id", "numero", "piso", "tipo_nombre", "estado", "estado_display"]


# ═══════════════════════════════════════════════════════════════
# HUESPED
# ═══════════════════════════════════════════════════════════════
class HuespedSerializer(serializers.ModelSerializer):
    """Serializer completo del huesped."""

    nombre_completo = serializers.CharField(read_only=True)
    tipo_doc_display = serializers.CharField(source="get_tipo_doc_display", read_only=True)

    class Meta:
        model = Huesped
        fields = [
            "id",
            "tipo_doc",
            "tipo_doc_display",
            "num_doc",
            "nombres",
            "apellidos",
            "nombre_completo",
            "email",
            "telefono",
            "nacionalidad",
            "fecha_nacimiento",
        ]


class HuespedMinSerializer(serializers.ModelSerializer):
    """Huesped resumido (para anidar en reservas)."""

    nombre_completo = serializers.CharField(read_only=True)

    class Meta:
        model = Huesped
        fields = ["id", "nombre_completo", "tipo_doc", "num_doc", "email"]


# ═══════════════════════════════════════════════════════════════
# TARIFA
# ═══════════════════════════════════════════════════════════════
class TarifaSerializer(serializers.ModelSerializer):
    """Serializer de tarifas por temporada."""

    tipo_nombre = serializers.CharField(source="tipo_habitacion.nombre", read_only=True)

    class Meta:
        model = Tarifa
        fields = [
            "id",
            "tipo_habitacion",
            "tipo_nombre",
            "nombre",
            "precio_noche",
            "fecha_inicio",
            "fecha_fin",
            "activa",
        ]


# ═══════════════════════════════════════════════════════════════
# RESERVA  *** NUCLEO DEL SISTEMA ***
# ═══════════════════════════════════════════════════════════════
class ReservaSerializer(serializers.ModelSerializer):
    """
    Serializer de LECTURA de reserva.
    Incluye huesped y habitacion anidados para evitar queries extra
    desde el frontend (resuelve el problema N+1).
    """

    huesped = HuespedMinSerializer(read_only=True)
    habitacion = HabitacionMinSerializer(read_only=True)
    hotel_nombre = serializers.CharField(source="hotel.nombre", read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    origen_display = serializers.CharField(source="get_origen_display", read_only=True)
    num_noches = serializers.IntegerField(read_only=True)
    total_huespedes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Reserva
        fields = [
            "id",
            "hotel",
            "hotel_nombre",
            "huesped",
            "habitacion",
            "fecha_entrada",
            "fecha_salida",
            "num_noches",
            "num_adultos",
            "num_ninos",
            "total_huespedes",
            "estado",
            "estado_display",
            "origen",
            "origen_display",
            "precio_total",
            "observaciones",
            "created_at",
        ]
        read_only_fields = ["id", "precio_total", "created_at"]


class ReservaCreateSerializer(serializers.Serializer):
    """
    Serializer de ESCRITURA: solo recibe lo necesario para crear una reserva.

    No usa ModelSerializer porque queremos control total sobre la validacion
    y porque el service crear_reserva() calcula el precio_total
    automaticamente.
    """

    hotel = serializers.PrimaryKeyRelatedField(queryset=Hotel.objects.all())
    huesped = serializers.PrimaryKeyRelatedField(queryset=Huesped.objects.all())
    habitacion = serializers.PrimaryKeyRelatedField(queryset=Habitacion.objects.all())
    fecha_entrada = serializers.DateField()
    fecha_salida = serializers.DateField()
    num_adultos = serializers.IntegerField(min_value=1, default=1)
    num_ninos = serializers.IntegerField(min_value=0, default=0)
    origen = serializers.ChoiceField(
        choices=Reserva.Origen.choices,
        default=Reserva.Origen.WEB,
    )
    observaciones = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        """Validacion temporal antes de pasar al service."""
        if attrs["fecha_salida"] <= attrs["fecha_entrada"]:
            raise serializers.ValidationError({
                "fecha_salida": "Debe ser posterior a fecha_entrada.",
            })
        return attrs


class ReservaCancelarSerializer(serializers.Serializer):
    """Serializer para el endpoint de cancelacion."""

    motivo = serializers.CharField(required=False, allow_blank=True, max_length=500)


# ═══════════════════════════════════════════════════════════════
# CARGO DE ESTANCIA
# ═══════════════════════════════════════════════════════════════
class CargoEstanciaSerializer(serializers.ModelSerializer):
    """Serializer de lectura de cargos."""
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    metodo_pago_display = serializers.CharField(
        source="get_metodo_pago_display",
        read_only=True,
        default="",
    )
    registrado_por_username = serializers.CharField(
        source="registrado_por.username",
        read_only=True,
        default="",
    )

    class Meta:
        model = CargoEstancia
        fields = [
            "id",
            "estancia",
            "concepto",
            "monto",
            "tipo",
            "tipo_display",
            "fecha",
            "pagado",
            "metodo_pago",
            "metodo_pago_display",
            "fecha_pago",
            "registrado_por_username",
        ]
        read_only_fields = ["id", "estancia", "fecha"]


class CargoCreateSerializer(serializers.Serializer):
    """Serializer para crear cargos via POST /estancias/{id}/cargos/."""

    concepto = serializers.CharField(max_length=200)
    monto = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    tipo = serializers.ChoiceField(
        choices=CargoEstancia.Tipo.choices,
        default=CargoEstancia.Tipo.OTRO,
    )


# ═══════════════════════════════════════════════════════════════
# FOLIO
# ═══════════════════════════════════════════════════════════════
class FolioSerializer(serializers.ModelSerializer):
    """
    Serializer del folio con los cargos anidados.
    Util para mostrar la cuenta consolidada al huesped.
    """

    cargos = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)
    tiene_deuda = serializers.BooleanField(read_only=True)

    class Meta:
        model = Folio
        fields = [
            "id",
            "estancia",
            "subtotal",
            "igv",
            "total",
            "estado",
            "estado_display",
            "tiene_deuda",
            "fecha_cierre",
            "cargos",
        ]
        read_only_fields = [
            "id",
            "subtotal",
            "igv",
            "total",
            "fecha_cierre",
        ]

    def get_cargos(self, obj):
        """Cargos asociados a la estancia del folio."""
        cargos = obj.estancia.cargos.all().order_by("-fecha")
        return CargoEstanciaSerializer(cargos, many=True).data


# ═══════════════════════════════════════════════════════════════
# ESTANCIA
# ═══════════════════════════════════════════════════════════════
class EstanciaSerializer(serializers.ModelSerializer):
    """Serializer de estancia con folio anidado."""

    folio = FolioSerializer(read_only=True)
    huesped = serializers.SerializerMethodField()
    habitacion = HabitacionMinSerializer(read_only=True)
    estado_display = serializers.CharField(source="get_estado_display", read_only=True)

    class Meta:
        model = Estancia
        fields = [
            "id",
            "reserva",
            "huesped",
            "habitacion",
            "fecha_checkin",
            "fecha_checkout",
            "estado",
            "estado_display",
            "observaciones",
            "folio",
        ]

    def get_huesped(self, obj):
        """Trae el huesped desde la reserva."""
        return HuespedMinSerializer(obj.reserva.huesped).data


# ═══════════════════════════════════════════════════════════════
# HOUSEKEEPING (cambio de estado de habitacion)
# ═══════════════════════════════════════════════════════════════
class HousekeepingSerializer(serializers.Serializer):
    """
    Serializer para el endpoint PATCH /habitaciones/{id}/housekeeping/.
    Permite a housekeeping cambiar el estado de la habitacion.
    """

    nuevo_estado = serializers.ChoiceField(choices=Habitacion.Estado.choices)


# ═══════════════════════════════════════════════════════════════
# DISPONIBILIDAD (consulta especial)
# ═══════════════════════════════════════════════════════════════
class DisponibilidadQuerySerializer(serializers.Serializer):
    """
    Valida los query params del endpoint:
        GET /habitaciones/disponibles/?fecha_entrada=&fecha_salida=&tipo_id=
    """

    fecha_entrada = serializers.DateField()
    fecha_salida = serializers.DateField()
    hotel_id = serializers.IntegerField(required=False)
    tipo_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        if attrs["fecha_salida"] <= attrs["fecha_entrada"]:
            raise serializers.ValidationError({
                "fecha_salida": "Debe ser posterior a fecha_entrada.",
            })
        return attrs


# ═══════════════════════════════════════════════════════════════
# OCUPACION (KPI de reporte)
# ═══════════════════════════════════════════════════════════════
class OcupacionSerializer(serializers.Serializer):
    """Respuesta del endpoint GET /reportes/ocupacion/?fecha="""

    total = serializers.IntegerField()
    ocupadas = serializers.IntegerField()
    tasa_pct = serializers.FloatField()