"""
ViewSets del dominio hotelero.

Patron Service Layer:
- Los ViewSets son DELGADOS: validan input con serializers,
  delegan la logica a services, devuelven respuesta.
- La logica de negocio NUNCA esta en los viewsets.

Endpoints organizados por recurso:
- HotelViewSet
- TipoHabitacionViewSet
- HabitacionViewSet
- HuespedViewSet
- TarifaViewSet
- ReservaViewSet
- EstanciaViewSet
- ReporteOcupacionView
"""

from datetime import datetime

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.core.permissions import (
    IsAdminOrReadOnly,
    IsHousekeepingOrAdmin,
    IsRecepcionistaOrAdmin,
)

from . import selectors, services
from .models import (
    Estancia,
    Folio,
    Habitacion,
    Hotel,
    Huesped,
    Incidente,
    LogAuditoria,
    Reserva,
    Tarifa,
    TipoHabitacion,
)
from .serializers import (
    CargoCreateSerializer,
    CargoEstanciaSerializer,
    DisponibilidadQuerySerializer,
    EstanciaSerializer,
    FolioSerializer,
    HabitacionSerializer,
    HotelSerializer,
    HousekeepingSerializer,
    HuespedSerializer,
    IncidenteSerializer,
    LogAuditoriaSerializer,
    OcupacionSerializer,
    ReservaCancelarSerializer,
    ReservaCreateSerializer,
    ReservaPublicaSerializer,
    ReservaSerializer,
    TarifaSerializer,
    TipoHabitacionSerializer,
)

from .services import (
    confirmar_reserva,
    crear_reserva_publica,
    pagar_cargos_pendientes,
    registrar_log,
)


# ═══════════════════════════════════════════════════════════════
# HOTEL
# ═══════════════════════════════════════════════════════════════
class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.filter(activo=True)
    serializer_class = HotelSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=["get"], url_path="revenue-por-tipo")
    def revenue_por_tipo(self, request):
        from datetime import date
        from .models import Folio, TipoHabitacion

        desde_str = request.query_params.get("desde")
        hasta_str = request.query_params.get("hasta")

        hoy = date.today()

        try:
            desde = (
                datetime.strptime(desde_str, "%Y-%m-%d").date()
                if desde_str
                else date(hoy.year, 1, 1)
            )

            hasta = (
                datetime.strptime(hasta_str, "%Y-%m-%d").date()
                if hasta_str
                else hoy
            )

        except ValueError:
            return Response(
                {"detail": "Formato de fecha invalido (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        folios = Folio.objects.filter(
            estado__in=["PAGADO", "CERRADO"],
            updated_at__date__gte=desde,
            updated_at__date__lte=hasta,
        ).select_related("estancia__reserva__habitacion__tipo")

        revenue_map = {}

        for folio in folios:
            try:
                tipo_nombre = folio.estancia.reserva.habitacion.tipo.nombre
                revenue_map[tipo_nombre] = (
                    revenue_map.get(tipo_nombre, 0) + float(folio.total)
                )
            except AttributeError:
                continue

        tipos = TipoHabitacion.objects.all()

        for t in tipos:
            if t.nombre not in revenue_map:
                revenue_map[t.nombre] = 0

        data = sorted(
            [
                {
                    "tipo": nombre,
                    "revenue": round(monto, 2),
                }
                for nombre, monto in revenue_map.items()
            ],
            key=lambda x: x["revenue"],
            reverse=True,
        )

        total = sum(item["revenue"] for item in data)

        return Response(
            {
                "rango": {
                    "desde": desde.isoformat(),
                    "hasta": hasta.isoformat(),
                },
                "total": round(total, 2),
                "data": data,
            }
        )


# ═══════════════════════════════════════════════════════════════
# TIPO HABITACION
# ═══════════════════════════════════════════════════════════════
class TipoHabitacionViewSet(viewsets.ModelViewSet):
    queryset = TipoHabitacion.objects.select_related("hotel")
    serializer_class = TipoHabitacionSerializer
    permission_classes = [IsAdminOrReadOnly]


# ═══════════════════════════════════════════════════════════════
# HABITACION
# ═══════════════════════════════════════════════════════════════
class HabitacionViewSet(viewsets.ModelViewSet):
    queryset = Habitacion.objects.select_related("hotel", "tipo")
    serializer_class = HabitacionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()

        hotel_id = self.request.query_params.get("hotel_id")
        estado = self.request.query_params.get("estado")

        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)

        if estado:
            qs = qs.filter(estado=estado)

        return qs.order_by("piso", "numero")

    @action(
        detail=False,
        methods=["get"],
        url_path="disponibles",
        permission_classes=[IsAuthenticated],
    )
    def disponibles(self, request):
        params = DisponibilidadQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)

        habitaciones = selectors.habitaciones_disponibles_en_rango(
            fecha_entrada=params.validated_data["fecha_entrada"],
            fecha_salida=params.validated_data["fecha_salida"],
            hotel_id=params.validated_data.get("hotel_id"),
            tipo_id=params.validated_data.get("tipo_id"),
        )

        serializer = HabitacionSerializer(habitaciones, many=True)

        return Response(serializer.data)

    @action(
        detail=True,
        methods=["patch"],
        url_path="cambiar-estado",
        permission_classes=[IsHousekeepingOrAdmin],
    )
    def cambiar_estado(self, request, pk=None):
        habitacion = self.get_object()

        serializer = HousekeepingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            habitacion = services.actualizar_estado_habitacion(
                habitacion=habitacion,
                nuevo_estado=serializer.validated_data["nuevo_estado"],
                usuario=request.user,
            )

        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(HabitacionSerializer(habitacion).data)

    @action(detail=False, methods=["get"], url_path="housekeeping")
    def housekeeping(self, request):
        from datetime import date, timedelta

        hotel_id = request.query_params.get("hotel_id")

        qs = self.get_queryset().filter(
            estado__in=["LIMPIEZA", "MANTENIMIENTO"]
        )

        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)

        hoy = date.today()
        manana = hoy + timedelta(days=1)

        check_in_hoy_ids = set(
            Reserva.objects.filter(
                fecha_entrada=hoy,
                estado__in=["PENDIENTE", "CONFIRMADA"],
            ).values_list("habitacion_id", flat=True)
        )

        check_in_manana_ids = set(
            Reserva.objects.filter(
                fecha_entrada=manana,
                estado__in=["PENDIENTE", "CONFIRMADA"],
            ).values_list("habitacion_id", flat=True)
        )

        habitaciones_serializadas = []

        for hab in qs:
            data = HabitacionSerializer(hab).data

            if hab.id in check_in_hoy_ids:
                data["urgencia"] = "ALTA"
                data["motivo_urgencia"] = "Check-in HOY"

            elif hab.id in check_in_manana_ids:
                data["urgencia"] = "MEDIA"
                data["motivo_urgencia"] = "Check-in mañana"

            else:
                data["urgencia"] = "BAJA"
                data["motivo_urgencia"] = ""

            habitaciones_serializadas.append(data)

        orden = {
            "ALTA": 0,
            "MEDIA": 1,
            "BAJA": 2,
        }

        habitaciones_serializadas.sort(
            key=lambda h: orden[h["urgencia"]]
        )

        return Response(habitaciones_serializadas)


# ═══════════════════════════════════════════════════════════════
# HUESPED
# ═══════════════════════════════════════════════════════════════
class HuespedViewSet(viewsets.ModelViewSet):
    queryset = Huesped.objects.all()
    serializer_class = HuespedSerializer
    permission_classes = [IsRecepcionistaOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()

        search = self.request.query_params.get("search")

        if search:
            qs = (
                qs.filter(num_doc__icontains=search)
                | qs.filter(apellidos__icontains=search)
                | qs.filter(nombres__icontains=search)
            )

        return qs.distinct().order_by("apellidos", "nombres")


# ═══════════════════════════════════════════════════════════════
# TARIFA
# ═══════════════════════════════════════════════════════════════
class TarifaViewSet(viewsets.ModelViewSet):
    queryset = Tarifa.objects.select_related("tipo_habitacion")
    serializer_class = TarifaSerializer
    permission_classes = [IsAdminOrReadOnly]


# ═══════════════════════════════════════════════════════════════
# RESERVA
# ═══════════════════════════════════════════════════════════════
class ReservaViewSet(viewsets.ModelViewSet):
    queryset = Reserva.objects.select_related(
        "hotel",
        "huesped",
        "habitacion",
    )

    serializer_class = ReservaSerializer
    permission_classes = [IsRecepcionistaOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()

        hotel_id = self.request.query_params.get("hotel_id")
        estado = self.request.query_params.get("estado")
        fecha = self.request.query_params.get("fecha")

        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)

        if estado:
            qs = qs.filter(estado=estado)

        if fecha:
            qs = qs.filter(
                fecha_entrada__lte=fecha,
                fecha_salida__gt=fecha,
            )

        return qs.order_by("-fecha_entrada")

    def create(self, request, *args, **kwargs):
        input_ser = ReservaCreateSerializer(data=request.data)
        input_ser.is_valid(raise_exception=True)

        try:
            reserva = services.crear_reserva(
                creada_por=request.user,
                **input_ser.validated_data,
            )

        except DjangoValidationError as e:
            return Response(
                {
                    "detail": (
                        e.messages
                        if hasattr(e, "messages")
                        else str(e)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            ReservaSerializer(reserva).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="confirmar",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def confirmar(self, request, pk=None):
        reserva = self.get_object()

        try:
            reserva = confirmar_reserva(
                reserva=reserva,
                usuario=request.user,
            )

        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        registrar_log(
            usuario=request.user,
            accion="RESERVA_CONFIRMADA",
            detalles={
                "reserva_id": reserva.id,
                "habitacion": reserva.habitacion.numero,
            },
            ip=request.META.get("REMOTE_ADDR"),
        )

        return Response(ReservaSerializer(reserva).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="checkin",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def checkin(self, request, pk=None):
        reserva = self.get_object()

        try:
            estancia = services.hacer_checkin(
                reserva=reserva,
                usuario=request.user,
            )

        except DjangoValidationError as e:
            return Response(
                {
                    "detail": (
                        e.messages[0]
                        if hasattr(e, "messages")
                        else str(e)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        registrar_log(
            usuario=request.user,
            accion="CHECKIN",
            detalles={
                "reserva_id": reserva.id,
                "estancia_id": estancia.id,
                "habitacion": reserva.habitacion.numero,
            },
            ip=request.META.get("REMOTE_ADDR"),
        )

        return Response(
            EstanciaSerializer(estancia).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="cancelar",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def cancelar(self, request, pk=None):
        reserva = self.get_object()

        serializer = ReservaCancelarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reserva = services.cancelar_reserva(
                reserva=reserva,
                motivo=serializer.validated_data.get("motivo", ""),
            )

        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        registrar_log(
            usuario=request.user,
            accion="RESERVA_CANCELADA",
            detalles={
                "reserva_id": reserva.id,
                "habitacion": reserva.habitacion.numero,
            },
            ip=request.META.get("REMOTE_ADDR"),
        )

        return Response(ReservaSerializer(reserva).data)


# ═══════════════════════════════════════════════════════════════
# ESTANCIA
# ═══════════════════════════════════════════════════════════════
class EstanciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Estancia.objects.select_related(
            "reserva__huesped",
            "reserva__habitacion__tipo",
            "folio",
        )
    )

    serializer_class = EstanciaSerializer
    permission_classes = [IsRecepcionistaOrAdmin]

    @action(
        detail=True,
        methods=["post"],
        url_path="checkout",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def checkout(self, request, pk=None):
        estancia = self.get_object()

        try:
            folio = services.hacer_checkout(
                estancia=estancia,
                usuario=request.user,
            )

        except DjangoValidationError as e:
            return Response(
                {
                    "detail": (
                        e.messages[0]
                        if hasattr(e, "messages")
                        else str(e)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        registrar_log(
            usuario=request.user,
            accion="CHECKOUT",
            detalles={
                "estancia_id": estancia.id,
                "folio_id": folio.id,
                "total": str(folio.total),
            },
            ip=request.META.get("REMOTE_ADDR"),
        )

        return Response(FolioSerializer(folio).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="cargos",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def agregar_cargo(self, request, pk=None):
        estancia = self.get_object()

        serializer = CargoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cargo = services.agregar_cargo(
                estancia=estancia,
                usuario=request.user,
                **serializer.validated_data,
            )

        except DjangoValidationError as e:
            return Response(
                {
                    "detail": (
                        e.messages[0]
                        if hasattr(e, "messages")
                        else str(e)
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            CargoEstanciaSerializer(cargo).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="folio",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def folio(self, request, pk=None):
        estancia = self.get_object()

        estancia.folio.recalcular()

        return Response(
            FolioSerializer(estancia.folio).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="pagar",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def pagar(self, request, pk=None):
        estancia = self.get_object()

        metodo_pago = request.data.get(
            "metodo_pago",
            "EFECTIVO",
        )

        cant = pagar_cargos_pendientes(
            estancia=estancia,
            metodo_pago=metodo_pago,
        )

        registrar_log(
            usuario=request.user,
            accion="PAGO_REGISTRADO",
            detalles={
                "estancia_id": estancia.id,
                "metodo_pago": metodo_pago,
                "cargos_pagados": cant,
            },
            ip=request.META.get("REMOTE_ADDR"),
        )

        return Response(
            {
                "detail": f"{cant} cargos pagados con {metodo_pago}",
                "cargos_pagados": cant,
                "metodo_pago": metodo_pago,
            }
        )


# ═══════════════════════════════════════════════════════════════
# REPORTES
# ═══════════════════════════════════════════════════════════════
class ReporteOcupacionView(APIView):
    permission_classes = [IsRecepcionistaOrAdmin]

    def get(self, request):
        hotel_id = request.query_params.get("hotel_id")
        fecha_str = request.query_params.get("fecha")

        if not hotel_id or not fecha_str:
            return Response(
                {"detail": "hotel_id y fecha son requeridos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            fecha = datetime.strptime(
                fecha_str,
                "%Y-%m-%d",
            ).date()

        except ValueError:
            return Response(
                {"detail": "Formato de fecha invalido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = selectors.tasa_ocupacion(
            int(hotel_id),
            fecha,
        )

        return Response(
            OcupacionSerializer(result).data
        )


# ═══════════════════════════════════════════════════════════════
# INCIDENTES
# ═══════════════════════════════════════════════════════════════
class IncidenteViewSet(viewsets.ModelViewSet):
    queryset = Incidente.objects.select_related(
        "habitacion",
        "reportado_por",
    )

    serializer_class = IncidenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instancia = serializer.save(
            reportado_por=self.request.user
        )

        registrar_log(
            usuario=self.request.user,
            accion="INCIDENTE_REPORTADO",
            detalles={
                "incidente_id": instancia.id,
                "habitacion": instancia.habitacion.numero,
                "tipo": instancia.tipo,
            },
            ip=self.request.META.get("REMOTE_ADDR"),
        )


# ═══════════════════════════════════════════════════════════════
# AUDITORIA
# ═══════════════════════════════════════════════════════════════
class LogAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogAuditoria.objects.select_related(
        "usuario"
    )

    serializer_class = LogAuditoriaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()

        if self.request.user.rol != "ADMIN":
            return qs.none()

        accion = self.request.query_params.get("accion")

        if accion:
            qs = qs.filter(accion=accion)

        return qs[:200]


# ═══════════════════════════════════════════════════════════════
# PUBLICO
# ═══════════════════════════════════════════════════════════════
@api_view(["GET"])
@permission_classes([AllowAny])
def habitaciones_disponibles_publico(request):
    from .models import Habitacion, Reserva

    check_in_str = request.query_params.get("check_in")
    check_out_str = request.query_params.get("check_out")

    if not check_in_str or not check_out_str:
        return Response(
            {
                "detail": (
                    "Debe enviar check_in y check_out"
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        check_in = datetime.strptime(
            check_in_str,
            "%Y-%m-%d",
        ).date()

        check_out = datetime.strptime(
            check_out_str,
            "%Y-%m-%d",
        ).date()

    except ValueError:
        return Response(
            {"detail": "Formato invalido"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ocupadas_ids = Reserva.objects.filter(
        estado__in=["PENDIENTE", "CONFIRMADA"],
        fecha_entrada__lt=check_out,
        fecha_salida__gt=check_in,
    ).values_list("habitacion_id", flat=True)

    disponibles = (
        Habitacion.objects.exclude(id__in=ocupadas_ids)
        .filter(estado="DISPONIBLE")
        .select_related("tipo", "hotel")
    )

    data = [
        {
            "id": h.id,
            "numero": h.numero,
            "piso": h.piso,
            "tipo": {
                "id": h.tipo.id,
                "nombre": h.tipo.nombre,
                "capacidad": h.tipo.capacidad,
                "precio_base": str(h.tipo.precio_base),
            },
            "hotel_nombre": h.hotel.nombre,
        }
        for h in disponibles
    ]

    return Response(
        {
            "disponibles": data,
            "total": len(data),
        }
    )


@extend_schema(
    request=ReservaPublicaSerializer,
    responses={201: dict},
)
@api_view(["POST"])
@permission_classes([AllowAny])
def crear_reserva_publica_view(request):
    from .models import Habitacion

    serializer = ReservaPublicaSerializer(
        data=request.data
    )

    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data

    try:
        habitacion = Habitacion.objects.get(
            id=data["habitacion_id"]
        )

    except Habitacion.DoesNotExist:
        return Response(
            {"detail": "Habitacion no encontrada"},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        reserva = crear_reserva_publica(
            habitacion=habitacion,
            check_in=data["check_in"],
            check_out=data["check_out"],
            tipo_doc=data["tipo_doc"],
            num_doc=data["num_doc"],
            nombres=data["nombres"],
            apellidos=data["apellidos"],
            email=data["email"],
            telefono=data["telefono"],
            adultos=data["adultos"],
            ninos=data["ninos"],
        )

    except ValueError as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "detail": "Reserva creada exitosamente",
            "codigo": f"R-{reserva.id:06d}",
            "estado": "PENDIENTE",
            "reserva_id": reserva.id,
        },
        status=status.HTTP_201_CREATED,
    )