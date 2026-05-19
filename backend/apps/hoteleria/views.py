"""
ViewSets del dominio hotelero.

Patron Service Layer:
- Los ViewSets son DELGADOS: validan input con serializers,
  delegan la logica a services, devuelven respuesta.
- La logica de negocio NUNCA esta en los viewsets.

Endpoints organizados por recurso:
- HotelViewSet
- TipoHabitacionViewSet
- HabitacionViewSet (con accion @action para disponibles y housekeeping)
- HuespedViewSet
- TarifaViewSet
- ReservaViewSet (con acciones para checkin, cancelar)
- EstanciaViewSet (con acciones para checkout, cargos, pagar, folio)
- ReporteOcupacionView (endpoint custom)
"""
from datetime import datetime

from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import (
    IsAdmin,
    IsAdminOrReadOnly,
    IsHousekeepingOrAdmin,
    IsRecepcionistaOrAdmin,
)

from . import selectors, services
from .services import pagar_cargos_pendientes
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
    OcupacionSerializer,
    ReservaCancelarSerializer,
    ReservaCreateSerializer,
    ReservaSerializer,
    TarifaSerializer,
    TipoHabitacionSerializer,
)


# ═══════════════════════════════════════════════════════════════
# HOTEL
# ═══════════════════════════════════════════════════════════════
class HotelViewSet(viewsets.ModelViewSet):
    """
    CRUD de hoteles.

    - Lectura: cualquier usuario autenticado.
    - Escritura: solo admin.
    """
    queryset = Hotel.objects.filter(activo=True)
    serializer_class = HotelSerializer
    permission_classes = [IsAdminOrReadOnly]


# ═══════════════════════════════════════════════════════════════
# TIPO DE HABITACION
# ═══════════════════════════════════════════════════════════════
class TipoHabitacionViewSet(viewsets.ModelViewSet):
    """CRUD de tipos de habitacion. Lectura libre, escritura admin."""
    queryset = TipoHabitacion.objects.select_related("hotel")
    serializer_class = TipoHabitacionSerializer
    permission_classes = [IsAdminOrReadOnly]


# ═══════════════════════════════════════════════════════════════
# HABITACION
# ═══════════════════════════════════════════════════════════════
class HabitacionViewSet(viewsets.ModelViewSet):
    """
    CRUD de habitaciones + acciones especiales:
    - GET /habitaciones/disponibles/        Buscar habitaciones libres
    - PATCH /habitaciones/{id}/housekeeping/ Cambiar estado (housekeeping)
    """
    queryset = Habitacion.objects.select_related("hotel", "tipo")
    serializer_class = HabitacionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        """Permite filtrar por hotel y estado via query params."""
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
        """
        GET /api/v1/habitaciones/disponibles/?fecha_entrada=&fecha_salida=&hotel_id=&tipo_id=

        Devuelve las habitaciones disponibles para reservar en el rango.
        Aplica la formula matematica de solapamiento (e1<s2 AND e2<s1).
        """
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
        url_path="housekeeping",
        permission_classes=[IsHousekeepingOrAdmin],
    )
    def housekeeping(self, request, pk=None):
        """
        PATCH /api/v1/habitaciones/{id}/housekeeping/

        Body: {"nuevo_estado": "DISPONIBLE"}

        Permite cambiar el estado de la habitacion siguiendo las
        transiciones permitidas (validadas por el service).
        """
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


# ═══════════════════════════════════════════════════════════════
# HUESPED
# ═══════════════════════════════════════════════════════════════
class HuespedViewSet(viewsets.ModelViewSet):
    """CRUD de huespedes. Recepcionista y admin pueden crear/editar."""
    queryset = Huesped.objects.all()
    serializer_class = HuespedSerializer
    permission_classes = [IsRecepcionistaOrAdmin]

    def get_queryset(self):
        """Busqueda por num_doc o apellidos via ?search="""
        qs = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                num_doc__icontains=search,
            ) | qs.filter(
                apellidos__icontains=search,
            ) | qs.filter(
                nombres__icontains=search,
            )
        return qs.distinct().order_by("apellidos", "nombres")


# ═══════════════════════════════════════════════════════════════
# TARIFA
# ═══════════════════════════════════════════════════════════════
class TarifaViewSet(viewsets.ModelViewSet):
    """CRUD de tarifas por temporada. Solo admin gestiona."""
    queryset = Tarifa.objects.select_related("tipo_habitacion")
    serializer_class = TarifaSerializer
    permission_classes = [IsAdminOrReadOnly]


# ═══════════════════════════════════════════════════════════════
# RESERVA  *** NUCLEO DEL SISTEMA ***
# ═══════════════════════════════════════════════════════════════
class ReservaViewSet(viewsets.ModelViewSet):
    """
    CRUD de reservas + acciones criticas:
    - POST /reservas/                   Crear (con calculo de tarifa)
    - POST /reservas/{id}/checkin/      Check-in
    - POST /reservas/{id}/cancelar/     Cancelar
    """
    queryset = Reserva.objects.select_related("hotel", "huesped", "habitacion")
    serializer_class = ReservaSerializer
    permission_classes = [IsRecepcionistaOrAdmin]

    def get_queryset(self):
        """Permite filtrar reservas por hotel, estado, fecha."""
        qs = super().get_queryset()
        hotel_id = self.request.query_params.get("hotel_id")
        estado = self.request.query_params.get("estado")
        fecha = self.request.query_params.get("fecha")

        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        if estado:
            qs = qs.filter(estado=estado)
        if fecha:
            qs = qs.filter(fecha_entrada__lte=fecha, fecha_salida__gt=fecha)

        return qs.order_by("-fecha_entrada")

    def create(self, request, *args, **kwargs):
        """
        POST /api/v1/reservas/

        Crea una reserva con calculo automatico del precio (tarifa por temporada).
        Valida solapamiento de fechas y capacidad de la habitacion.
        """
        # 1. Validar input con serializer
        input_ser = ReservaCreateSerializer(data=request.data)
        input_ser.is_valid(raise_exception=True)

        # 2. Delegar al service
        try:
            reserva = services.crear_reserva(
                creada_por=request.user,
                **input_ser.validated_data,
            )
        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Devolver con el serializer de lectura (mas rico)
        return Response(
            ReservaSerializer(reserva).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="checkin",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def checkin(self, request, pk=None):
        """
        POST /api/v1/reservas/{id}/checkin/

        Realiza el check-in: crea Estancia, Folio, cambia estado de habitacion
        a OCUPADA y reserva a CHECKIN.
        """
        reserva = self.get_object()

        try:
            estancia = services.hacer_checkin(
                reserva=reserva,
                usuario=request.user,
            )
        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages[0] if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
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
        """
        POST /api/v1/reservas/{id}/cancelar/
        Body: {"motivo": "opcional"}
        """
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

        return Response(ReservaSerializer(reserva).data)


# ═══════════════════════════════════════════════════════════════
# ESTANCIA
# ═══════════════════════════════════════════════════════════════
class EstanciaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Solo lectura + acciones de negocio:
    - POST /estancias/{id}/checkout/    Hacer check-out
    - POST /estancias/{id}/cargos/      Agregar cargo
    - GET  /estancias/{id}/folio/       Ver folio
    - POST /estancias/{id}/pagar/       Pagar cargos pendientes
    """
    queryset = (
        Estancia.objects
        .select_related("reserva__huesped", "habitacion__tipo", "folio")
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
        """
        POST /api/v1/estancias/{id}/checkout/

        Hace el check-out: cierra folio, libera habitacion a LIMPIEZA
        (housekeeping automatico). Bloquea si hay deuda.
        """
        estancia = self.get_object()

        try:
            folio = services.hacer_checkout(
                estancia=estancia,
                usuario=request.user,
            )
        except DjangoValidationError as e:
            return Response(
                {"detail": e.messages[0] if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(FolioSerializer(folio).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="cargos",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def agregar_cargo(self, request, pk=None):
        """
        POST /api/v1/estancias/{id}/cargos/
        Body: {"concepto": "Cena", "monto": "80.00", "tipo": "RESTAURANTE"}
        """
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
                {"detail": e.messages[0] if hasattr(e, "messages") else str(e)},
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
        """GET /api/v1/estancias/{id}/folio/  - Folio consolidado."""
        estancia = self.get_object()
        # Refrescar el folio para asegurar montos actualizados
        estancia.folio.recalcular()
        return Response(FolioSerializer(estancia.folio).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="pagar",
        permission_classes=[IsRecepcionistaOrAdmin],
    )
    def pagar(self, request, pk=None):
        """
        Marca todos los cargos pendientes como pagados.
        
        Body opcional:
            metodo_pago: EFECTIVO (default), TARJETA, TRANSFERENCIA, YAPE, PLIN
        """
        estancia = self.get_object()
        metodo_pago = request.data.get("metodo_pago", "EFECTIVO")
        cant = pagar_cargos_pendientes(estancia=estancia, metodo_pago=metodo_pago)
        return Response({
            "detail": f"{cant} cargos pagados con {metodo_pago}",
            "cargos_pagados": cant,
            "metodo_pago": metodo_pago,
        })


# ═══════════════════════════════════════════════════════════════
# REPORTES (KPIs)
# ═══════════════════════════════════════════════════════════════
class ReporteOcupacionView(APIView):
    """
    GET /api/v1/reportes/ocupacion/?hotel_id=1&fecha=2026-08-15

    Devuelve la tasa de ocupacion del hotel en una fecha dada.
    """
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
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Formato de fecha invalido. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = selectors.tasa_ocupacion(int(hotel_id), fecha)
        return Response(OcupacionSerializer(result).data)